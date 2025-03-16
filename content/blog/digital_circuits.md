+++
title = "Simulating Digital Circuits in Rust"
tags = ["algorithms", "rust"]
description = "Assembling a 4-bit 'computer' from scratch by simulating bits, relays, logic gates, latches, registers, and adders."
date = "2025-02-27"
+++

I've been dabbling with Rust lately and looking for a good learning project to help ground some theory in practice. Skimming through [Crash Course Computer Science](https://www.youtube.com/playlist?list=PL8dPuuaLjXtNlUrzyH5r6jN9ulIgZBpdo) gave me an idea: starting from the ground up, with bits and switches, let's try to simulate some very basic digital circuits in Rust -- latches, registers, and adders. By the end, we'll hopefully have enough components to assemble a virtual "computer" capable of some rudimentary 4-bit arithmetic.

## Building Blocks

### The Bit

If we're starting from the ground up with digital circuits, the first stop is definitely the bit. Eventually we'll start thinking of bits as pieces of binary data, but at the lowest level they're just voltages that are on or off, high or low. We can represent that as an enum with variants for the two possible states:

```rust
pub enum Bit {
    On,
    Off,
}
```

`Bit::On` gives us an electrical signal, but there's not much we can do with it yet. We need something to switch with that electricity.

### The Relay

The [first electrical computers](https://en.wikipedia.org/wiki/Z3_(computer)) were built with relays, so we'll do the same. Modern computers use transistors of course, but fundamentally they do pretty much the same thing -- allow one signal to control a switch that connects other signals together -- and it turns out relays are a little easier to simulate since you don't have to worry about things like Ohm's law[^ohm].

A real relay uses voltage on the control pin to energize a coil that closes a physical switch, connecting the input pin to the output pin. In code, we can simulate that as a simple function that takes two bits and returns a bit. If the control bit is on, the "switch" is activated and the input signal is returned. Otherwise, it's off.

```rust
pub fn relay(input: Bit, control: Bit) -> Bit {
    match control {
        Bit::On => input,
        Bit::Off => Bit::Off,
    }
}
```

It turns out that's a little *too* simple. Relays can be **normally-closed** or **normally-open** based on whether their switch is connected or disconnected by default, and we'll need both. To accomplish that, we can just rename `relay` to the more specific `normally_open` and then invert the logic for its `normally_closed` counterpart.

```rust
/// A relay that is open by default and closed by a control signal
pub fn normally_open(input: Bit, control: Bit) -> Bit {
    match control {
        Bit::On => input,
        Bit::Off => Bit::Off,
    }
}

/// A relay that is closed by default and opened by a control signal
pub fn normally_closed(input: Bit, control: Bit) -> Bit {
    match control {
        Bit::Off => input,
        Bit::On => Bit::Off,
    }
}
```

Now that we have a way to turn bits on and off using control bits, we can move up one level of abstraction and start building logic gates.

### The Logic Gate

By arranging relays in the right order, we can make special circuits called logic gates that compare input signals and generate new output signals. 

Let's start with an **AND gate**, which takes two bits and passes them to the output only if they're both on. We can do that with two relays in series, feeding the output of the first into the second, and returning the output. Turning either relay off will interrupt the signal, so we'll only get an output that's high if both are inputs are high.

```rust
pub fn and(a: Bit, b: Bit) -> Bit {
    let x = relay::normally_open(Bit::On, a);
    relay::normally_open(x, b)
}
```

An **OR gate** takes two bits and outputs 1 if *either* is high. To do that, we'll need to expand our simulation slightly to allow connecting two bits together as electrical signals, which we'll do with a new method that returns a high bit if either or both inputs are high.

```rust
impl Bit {
    /// Simulate an electrical connection between signal bits
    pub fn connect(self, rhs: Self) -> Self {
        match (self, rhs) {
            (Bit::Off, Bit::Off) => Bit::Off,
            _ => Bit::On,
        } 
    }
}
```

That looks a lot like a logical OR itself[^or], but it's really just a principle of connecting together two signal voltages from the same source -- if either voltage is high, it will pull them both high.

Now we can place two relays in parallel and electrically connect their outputs together so that a high signal on either input gets passed to the output, completing the OR gate.

```rust
pub fn or(a: Bit, b: Bit) -> Bit {
    let x = relay::normally_open(Bit::On, a);
    let y = relay::normally_open(Bit::On, b);
    x.connect(y)
}
```

Next, we can make a **NOT gate**, which just takes one bit and inverts it. This is where the normally-closed relay comes in handy, outputting a high signal until we pass a 1, which triggers the relay and turns off the output.

```rust
pub fn not(a: Bit) -> Bit {
    relay::normally_closed(Bit::On, a)
}
```

The next couple gates, **NOR** and **NAND**, just invert the output of OR and AND gates. We could build them from scratch with three relays each, but this is a good opportunity to start combining some of the components we've already made by passing the corresponding gate outputs into NOT gates.

```rust
pub fn nor(a: Bit, b: Bit) -> Bit {
    not(or(a, b))
}

pub fn nand(a: Bit, b: Bit) -> Bit {
    not(and(a, b))
}
```

The last gate we'll need is an **XOR gate**, which acts like an OR unless both inputs are on, in which case it's off. There are a few ways to make these;  I'm using a design with two NOR and one AND gate called a [2-1 AOI gate](https://en.wikipedia.org/wiki/AND-OR-invert#2-1_AOI_gate).

```rust
pub fn xor(a: Bit, b: Bit) -> Bit {
    nor(nor(a, b), and(a, b))
}
```

So we've got bits to represent signals, relays to switch signals, and logic gates to combine them into new signals. What can we build with those? It turns out, pretty much anything in a digital computer, but let's start with something simple: memory.

## Latches and Registers

A **gated SR latch** is a component made from logic gates that has two possible states -- on and off -- controlled by a data signal and an enable signal. When the enable pin is high, the data bit is stored in the latch, providing one bit of volatile[^volatile] memory.

We'll represent the latch with a struct that stores the last output state and simulates the next state by comparing the input pins with some AND, OR, and NOT gates[^sr].

```rust
/// A gated set-reset latch that stores a single bit
pub struct GatedSRLatch {
    output: Bit,
}

impl GatedSRLatch {
    pub fn new() -> Self {
        Self { output: Bit::Off }
    }

    pub fn update(&mut self, data: Bit, enable: Bit) {
        self.output = and(
            or(and(data, enable), self.output),
            not(and(not(data), enable)),
        );
    }

    pub fn read(&self) -> Bit {
        self.output
    }
}
```

Remembering 1 bit is a little underwhelming, but if we arrange four latches together we can treat them as a 4-bit word in a **memory register**. We can write new words into the register by passing four bits into the corresponding latches with the enable pin high, and read the word back out by checking the latch states.

```rust
/// A word with a width of 4 bits
type Word = [Bit; 4];

/// A 4-bit register built with gated latches
pub struct Register {
    latches: [GatedSRLatch; 4],
}

impl Register {
    pub fn new() -> Self {
        Self {latches: [GatedSRLatch::new(); 4]}
    }

    /// Write a new word to the register
    pub fn write(&mut self, data: Word) {
        self.latches.iter_mut().enumerate().for_each(|(i, latch)| {
            latch.update(data[i], Bit::On);
        });
    }

    /// Read the word stored in the register
    pub fn read(&self) -> Word {
        array::from_fn(|i| self.latches[i].read())
    }
}
```

To make sure this is working like it should, let's write a quick unit test that writes the word `1001` into the register and reads it back out.

```rust
#[test]
fn test_register() {
    let mut register = Register::new();
    let word: Word = [Bit::On, Bit::Off, Bit::Off, Bit::On];
    register.write(word);
    assert_eq!(register.read(), word);
}
```

And it passes!

It takes a little imagination to be impressed by a computer program that remembers a few bits, but keep in mind that we're accomplishing this with just a handful of simulated relays, and we've now got the start of some rudimentary computer memory.

## Bit Arithmetic

### Adding Bits

Let's shift gears from remembering bits to calculating them by building an arithmetic logic unit (ALU) out of some simple binary adders.

When you add two bits together, you'll need two bits to store the answer. In the world of adders, these are called the **sum bit**, which stores the first output bit of the result, and the **carry bit**, which indicates whether the sum overflowed.

```rust
struct BitSum {
    sum: Bit,
    carry: Bit,
}
```

With that, we can implement a simple **half adder** function that takes two bits, calculates a sum and carry bit using logic gates, and returns a `BitSum`. The sum bit is the XOR of the inputs, since it will be 0 with inputs 1+1 or 0+0. The carry bit is the AND of the inputs, since it will only overflow with inputs 1+1.

```rust
fn half_adder(a: Bit, b: Bit) -> BitSum {
    let sum = xor(a, b);
    let carry = and(a, b);
    BitSum { sum, carry }
}
```

With two half-adders, we can build a **full adder**, which takes *three* bits: two bits to add together and a carry bit from a previous calculation, and returns another two bits. 

```rust
fn full_adder(a: Bit, b: Bit, c: Bit) -> BitSum {
    let h1 = half_adder(a, b);
    let h2 = half_adder(h1.sum, c);

    let sum = h2.sum;
    let carry = or(h1.carry, h2.carry);
    BitSum { sum, carry }
}
```

That extra input bit allows us to stack full adders together in series, passing the carry bit of each adder into the next to create a **ripple carry adder** (or RCA) that adds multi-bit words together. To match our memory register, we'll make a 4-bit RCA that takes two 4-bit words and adds them together to return the 4-bit sum, as well a bit flag to indicate overflow. 

```rust
#[derive(Debug, PartialEq)]
struct WordSum {
    sum: Word,
    overflow: Bit,
}

/// An adder for 4-bit words
pub fn ripple_carry_adder(a: Word, b: Word) -> WordSum {
    // Start at the least significant bit
    let s1 = half_adder(a[3], b[3]);
    let s2 = full_adder(a[2], b[2], s1.carry);
    let s3 = full_adder(a[1], b[1], s2.carry);
    let s4 = full_adder(a[0], b[0], s3.carry);

    let sum: Word = [s4.sum, s3.sum, s2.sum, s1.sum];
    let overflow = s4.carry;

    WordSum {sum, overflow}
}
```

Let's write another unit test here to make sure things are working as expected. Adding `1010` (10) + `1000` (8) should give us 18, which overflows the 4-bit output to return `0010` (2) with an overflow bit.

```rust
#[test]
fn test_rca() {
    let result = ripple_carry_adder(
        [Bit::On, Bit::Off, Bit::On, Bit::Off],
        [Bit::On, Bit::Off, Bit::Off, Bit::Off], 
    );

    assert_eq!(result, WordSum {
        sum: [Bit::Off, Bit::Off, Bit::On, Bit::Off],
        overflow: Bit::On,
    });
}
```

Another pass!

### Subtracting Bits

With a few extra logic gates and a bit flag `d` to change the operation mode, we can turn the ripple-carry adder into a full blown **adder-subtractor**. When `d=1`, the result will be `a - b` instead of `a + b`, which is accomplished by XORing each bit in `b` with the mode flag, which is also passed as the carry bit into the first (now *full*) adder. XORing the last two carry bits will determine if an overflow occurred.

```rust
/// Add a+b (when d=0) or subtract a-b (when d=1) with 4-bit words
pub fn adder_subtractor(a: Word, b: Word, d: Bit) -> WordSum {
    // Start at the least significant bit
    let s1 = full_adder(a[3], xor(b[3], d), d);
    let s2 = full_adder(a[2], xor(b[2], d), s1.carry);
    let s3 = full_adder(a[1], xor(b[1], d), s2.carry);
    let s4 = full_adder(a[0], xor(b[0], d), s3.carry);

    let sum: Word = [s4.sum, s3.sum, s2.sum, s1.sum];
    let overflow = xor(s3.carry, s4.carry);

    WordResult { sum, overflow }
}
```

This also converts the output from an *unsigned* 4-bit word in the range [0, 15] to a *signed* 4-bit word in the range [-8, 7], using [two's complement notation](https://en.wikipedia.org/wiki/Two%27s_complement). We can still store the result in a 4-bit array, but we'll need to keep the notation in mind when we convert back to decimal numbers.

## Assembling a 4-Bit Computer

With a 4-bit register and a 4-bit adder-subtractor, we have everything we need to build most of a *very simple* 4-bit computer. A real digital computer would need additional circuitry to store and decode instructions and a clock to know when to execute them, but we'll offload that onto our Rust program to keep things simple.

The "computer" will have just three registers for a total of 12-bits of memory -- two addressable registers (A and B) and one accumulator for storing intermediate results -- and a bit flag to indicate if an operation overflowed the accumulator.

```rust
pub struct Computer {
    pub registers: [Register; 2],
    pub accumulator: Register,
    pub overflow: Bit,
}

pub enum Address {
    A,
    B,
}
```

Our computer will implement a total of five operations:

1. `load`: Load a word into a register.
1. `copy`: Copy the contents of the accumulator to a register.
1. `add`: Add the contents of a register to the accumulator.
1. `sub`: Subtract the contents of a register from the accumulator.
1. `clear`: Clear the accumulator.

```rust
impl Computer {
    pub fn new() -> Self {
        Computer {
            registers: [Register::new(), Register::new()],
            accumulator: Register::new(),
            overflow: Bit::Off,
        }
    }

    /// Retrieve the addressed register
    fn get_register(&mut self, address: Address) -> &mut Register {
        match address {
            Address::A => &mut self.registers[0],
            Address::B => &mut self.registers[1],
        }
    }

    /// Load a value into the selected register
    pub fn load(&mut self, data: Word, address: Address) {
        self.get_register(address).write(data);
    }

    /// Copy the value from the accumulator to the selected register address
    pub fn copy(&mut self, address: Address) {
        let value = self.accumulator.read();
        self.get_register(address).write(value);
    }

    /// Add the value from the selected register address to the accumulator
    pub fn add(&mut self, address: Address) {
        let result = adder_subtractor(self.get_register(address).read(), self.accumulator.read(), Bit::Off);
        self.accumulator.write(result.sum);
        self.overflow = result.overflow;
    }

    /// Subtract the value from the selected register address from the accumulator
    pub fn sub(&mut self, address: Address) {
        let result = adder_subtractor(self.accumulator.read(), self.get_register(address).read(), Bit::On);
        self.accumulator.write(result.sum);
        self.overflow = result.overflow;
    }

    /// Clear the accumulator
    pub fn clear(&mut self) {
        self.accumulator.write([Bit::Off, Bit::Off, Bit::Off, Bit::Off]);
    }
}
```

Finally, let's write another unit test to run some 4-bit calculations.

```rust
#[test]
fn test_computer() {
    let mut cpu = Computer::new();

    // Load 4 and 2 into the registers and add to the accumulator
    cpu.load([Bit::Off, Bit::On, Bit::Off, Bit::Off], Address::A);
    cpu.load([Bit::Off, Bit::Off, Bit::On, Bit::Off], Address::B);
    cpu.add(Address::A);
    cpu.add(Address::B);

    // 4 + 2 == 6
    assert_eq!(cpu.accumulator.read(), [Bit::Off, Bit::On, Bit::On, Bit::Off]);

    // Load 7 into register A and subtract it from the accumulator
    cpu.load([Bit::Off, Bit::On, Bit::On, Bit::On], Address::A);
    cpu.sub(Address::A);

    // 6 - 7 = -1
    assert_eq!(cpu.accumulator.read(), [Bit::On, Bit::On, Bit::On, Bit::On]);
}
```

It works! 

With three registers and an adder-subtractor, we have a simulated machine that can perform some simple binary arithmetic on 4-bit words, built from the ground up with simulated relays. How many relays did it take? Let's break it down.

Our "computer" is composed of a memory module and an ALU. The memory module with three 4-bit registers required 12 gated SR latches, each of which is built from three AND, two NOT, and one OR gate. That's 10 relays per latch, for **120 relays of memory**.

The ALU is composed of four full-adders, plus five XOR gates. One full adder requires two half adders (one XOR and one AND) and an OR, or 22 total relays. That adds up to **128 relays of computation**. 

Altogether, assuming I counted my gates correctly, our "computer" uses **248 simulated relays**.

When you compare that to the 2,600 relays that comprised the [first programmable digital computer](https://en.wikipedia.org/wiki/Z3_(computer)), it's pretty clear that our approximation of a computer is a long way from even the simplest version of the real thing, which would need RAM to store instruction sets, a control unit to decode instructions and move data between registers and the ALU, and a clock to synchronize operations, but it does give a glimpse of how simple fundamental components can be combined to perform increasingly complex operations. Even modern CPUs with billions of transistors still operate under the same principles: signals switching signals using gates and latches.

[^ohm]: I originally planned to simulate transistors, but reconsidered when I realized that a NOT gate with transistors depends on voltage drop across a resistor, which is a lot less intuitive than just using a normally-closed relay.

[^or]: Technically we could have implemented the OR gate with just the `match` statement used in `connect`, but I wanted to stick to a relay-based simulation. If the goal was performance or brevity, we obviously wouldn't be implementing our own bitwise operations. 

[^volatile]: The memory in an SR latch is volatile because it relies on electricity to maintain its state, compared to persistent memory like a magnetic hard drive.

[^sr]: This design is called an SR AND-OR latch, which is less common than an SR NOR latch but much easier to model since it doesn't require feeding two gates into each other simultaneously.