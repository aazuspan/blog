---
title: Guitars, Microchips, and Assembly
category: Blog
tags: audio
date: "2023-03-18"
summary: Witness the descent of a high-level geospatial programmer into the depths of low-level digital signal processing and embedded assembly.
---

Long before I knew anything about Earth Engine, geospatial analysis, or high-level languages, my first foray into programming was writing hacky embedded C++ programs to run on Arduino microcontrollers. LEDs, stepper motors, servos--you name it, I copy-pasted and brute-forced my way through compiler errors until they reluctantly blinked, stuttered, and spun to life. Far from love at first sight, code was a hurdle between me and burning out more transistors.

Eventually I discovered Python and the fun of coding for the sake of code, but there's still something alluring about that intersection of code and hardware. So, leaving behind the comfort of high-level abstractions and garbage-collected memory management, let's try diving back into the world of low-level embedded code by building a guitar effects pedal around the [FV-1](http://www.spinsemi.com/products.html) chip. Because what's lower level than Assembly?

## A Quick Intro to Guitar Effects

Guitars make sounds<sup>[citation needed]</sup>. Sometimes you want those sounds to be different. Throw the sound at a transistor until the transistor stops working right and you get [distortion](https://www.eeeguide.com/transistor-clipper-circuit-and-waveforms/). Use the sound to shake a spring and listen to the other side of the spring and you get [reverb](https://producerhive.com/ask-the-hive/how-does-spring-reverb-work/). Pass the sound through a conductive liquid that's rocking back and forth to modulate resistance and you get [tremolo](https://www.premierguitar.com/late-1940s-dearmond-601-tremolo). These are analog effects. No code, just physics.

We're programmers, not electrical engineers, so what about digital effects? Pass a sound through a special type of computer called a digital signal processor (DSP) that's designed to run at a fast, consistent speed, and you can get all kinds of effects using software instead of hardware.

## The Hardware

I lied. We need a chip that can run our software, and I decided to go with the FV-1. You can read more about the FV-1 [here](http://spinsemi.com/knowledge_base/arch.html), but the quick version is that it's a chip designed for guitar effects like reverb, delay, and compression that's found its way into [a bunch of high-end pedals](https://reverb.com/news/fv-1-chip-history-5-pedals) because it's cheap and flexible. That popularity has led to [open source tools](https://github.com/HolyCityAudio/SpinCAD-Designer), [premade programs](https://mstratman.github.io/fv1-programs/), and [development boards](https://www.pedalpcb.com/product/fv1dev/) that make it much easier to get started for a DSP beginner like me.

I picked up a [development board](https://www.pedalpcb.com/product/fv1dev/) (chip included), some EEPROM chips to store programs, and a handful of resistors, capacitors, ICs, and switches, and spent a morning soldering the kit together into a working[^1] pedal.

|                                                  |                                                        |
| ------------------------------------------------ | ------------------------------------------------------ |
| <img src="/images/fv1/pcb.jpg" width=300></img>  | <img src="/images/fv1/components.jpg" width=300></img> |
| <img src="/images/fv1/guts.jpg" width=300></img> | <img src="/images/fv1/pedal.jpg" width=300></img>      |

Now let's make it make noises.

## The Software

Actually, embedded programs are called firmware.

## The Firmware

Have you ever struggled with managing Python environments and thought, man, getting my code to run on different computers is a hassle? Me too! Assembly programmers have no sympathy for us.

Assembly languages provide sets of instructions that directly interface with machine instructions in a processor, meaning that _every chip_ has its own assembly language.

To program the FV-1, we'll need to get familiar with the [instructions and syntax](http://www.spinsemi.com/knowledge_base/inst_syntax.html) for that chip (called SpinASM), and some of the basic principles of assembly programming.

### Registers, Accumulators, and Opcodes

A full tutorial on assembly is way beyond the scope of this post or my skill level, but let's go over the basic terms so we can at least stumble through on the same page.

- **Instructions** tell the processor what to do. An instruction is made up of an **opcode** and **arguments**.
  - **Opcodes** describe the basic operations that the processor can perform, like storing a value in memory or adding two numbers together.
  - **Arguments** are the values that the opcode operates on. What value to store, what **register** to store it in, etc.
- **Registers** are memory locations that store values. The FV-1 has 64 registers, including some special registers where we can access things like input and output signals and general purpose registers where we can store values we need (REG0 - REG31).
  - The **accumulator** is a special register that we will frequently use to store intermediate calculation results. As far as I can tell, 90% of Assembly programming is trying to track what you put in the accumulator. 

### Hello World

With those definitions in mind, let's write the simplest FV-1 program possible. It takes the input signal and outputs it unchanged:

```SpinASM
;---Hello world!---
LDAX ADCL
WRAX DACL, 0.0
```

In the first line (after our comment), we use the `LDAX` opcode to read a value from the `ADCL` register (left channel pedal input) and store it in the accumulator. On the second line, the `WRAX` opcode writes the value that we just stored in the accumulator to the `DACL` register (left channel pedal output) and multiplies it by 0.0 to reset it.

If we ran this program, the FV-1 would read the guitar signal and send it unchanged to the output, once every clock cycle (about 32k times per second).

If you're more comfortable with Python, that code might look something like...

```python
# Hello world!
accumulator = pedal.read_input()
pedal.write_output(accumulator)
accumulator = 0
```



### A Boost Pedal

With a few small changes, we can make this program _slightly_ useful. Instead of outputting the input signal unchanged, let's boost the gain and then multiply it by a potentiometer value, creating a basic adjustable clean boost pedal.

```SpinASM
;---Boost pedal---
RDAX ADCL, 1.9
MULX POT0
WRAX DACL, 0.0
```

Like `LDAX`, the `RDAX` opcode reads a value into the accumulator, but it takes a second argument which the accumulator is multiplied with. Multiplying by `1.9` will give us a nice volume boost. Next, the `MULX` opcode multiplies the accumulator by a specified value--in this case, the value read from the special `POT0` register that stores the output of the first potentiometer on the development board.

The result is that we can adjust the volume of our input signal between 0 and 1.9x the original volume.

Again, using our imaginary Python API:

```python
# Boost pedal
accumulator = pedal.read_input() * 1.9
accumulator *= potentiometer.read()
pedal.write_output(accumulator)
accumulator = 0
```

### A Tremolo Pedal

For our final example, let's build a basic tremolo. A tremolo is effectively a volume pedal controlled by an oscillator instead of a potentiometer, so this will build off of the previous example while introducing us to the low-frequency oscillators (LFOs) built-in to the FV-1. This program is a little more complicated, so I broke it into 3 sections.

#### 1. Setup

The LFO will provide an oscillating sine-wave that we'll use to modulate guitar volume, but it needs to be initialized before we can use it. We can accomplish that with the `WLDS` opcode. We'll pass it the name of the LFO we want to initialize, a placeholder frequency value of 0 (we'll set this later using a potentiometer), and the LFO amplitude that will define the tremolo depth. We'll use the maximum amplitude of `32767` and control the strength of the effect using the wet/dry mix potentiometer built into the development board.

We only want to run this initialization once at the start of the program, so we'll put a `SKP` instruction before it that tells the FV-1 to only execute the next instruction once.

```SpinASM
; Setup
SKP RUN, 1
WLDS SIN0, 0, 32767
```

#### 2. Controls

The LFO is running now, but we'd like to be able to adjust the rate with a potentiometer. We'll do that by reading `POT0` into the accumulator and storing it in the special `SIN0_RATE` register. To keep the rate in a reasonable range, we'll use the `SOF` opcode to multiply the accumulator by `0.5` and add `0.1`.

```SpinASM
; Controls
LDAX POT0
SOF 0.5, 0.1
WRAX SIN0_RATE, 0
```

#### 3. Modulation

Finally, we'll use the LFO to modulate the volume of our input signal. The `CHO RDAL` opcode reads the LFO into the accumulator. The LFO value is in the range [-1, 1], so the `SOF` opcode will rescale the accumulator to the [0, 1] range we need. Finally, we can use the familiar `MULX` and `WRAX` opcodes to multiply the iwrite_outputnput signal by the re-scaled LFO value and write it to the output.

```SpinASM
; Main loop
CHO RDAL, SIN0
SOF 0.5, 0.5
MULX ADCL
WRAX DACL, 0.0
```

## Putting It All Together

Here is our finished tremolo program:

```SpinASM
;---Tremolo---
SKP RUN, 1
WLDS SIN0, 0, 32767

LDAX POT0
SOF 0.5, 0.1
WRAX SIN0_RATE, 0

CHO RDAL, SIN0
SOF 0.5, 0.5
MULX ADCL
WRAX DACL, 0.0
```

Or if we could write it in Python:

```python
# Tremolo
if not program.initialized():
    sin0.initialize(freq=0, amplitude=32767)

accumulator = potentiometer.read()
accumulator = accumulator * 0.5 + 0.1
sin0.set_rate(accumulator)
accumulator = 0

accumulator += sin0.read()
accumulator = accumulator * 0.5 + 0.5
accumulator *= pedal.read_input()
pedal.write_output(accumulator)
```

Now we just need to get it onto our pedal. The dev board I used has a built-in USB programmer that lets you flash programs to the onboard EEPROM memory, so the process is as simple as 1) assemble the program to binary[^2], 2) install the necessary software and drivers[^3], 3) plug the pedal in to USB and power, and 4) flash the program.

How does it sound?

<center>
    <audio controls>
        <source src="/audio/fv1_tremolo.mp3" type="audio/mp3">
    </audio>
</center>

Like a tremolo! Not bad for a day of hacking.

## Useful Resources for Learning FV-1

Want to learn more about the FV-1? These were some useful resources I came across.

- The [manual](http://www.spinsemi.com/Products/datasheets/spn1001-dev/SPINAsmUserManual.pdf) and [datasheet](http://www.spinsemi.com/Products/datasheets/spn1001/FV-1.pdf). Nitty and gritty, but good reference material.
- [SpinCAD Designer](https://github.com/HolyCityAudio/SpinCAD-Designer), an open-source Java GUI for building programs with drag-and-drop blocks. Seeing how block diagrams translate to assembly is very helpful, but the outputs aren't always optimized.
- The official [FV-1 forums](http://www.spinsemi.com/forum/viewforum.php?f=3&sid=09c5e42db9d9c61470e3c7d445324dcc). Not very active, but some good threads to read through.
- The [Patreon blog](https://www.patreon.com/holycityaudio/posts) of SpinCAD's designer. Some materials are patron-only and new patrons aren't being accepted, but there are a lot of good free articles about both SpinCAD and FV-1 programming.
- A great guide for [getting started](https://electric-canary.com/fv1start.html). Basically like what I wrote, but better.
- A high-level guide to [designing and building](https://medium.com/@hipsters_unite/designing-the-atom-smasher-spin-fv1-pedal-1c63ad3b3f8e) an FV-1 pedal. 

[^1]: After sorting out an LED that I installed backwards, a power jack that needed to be isolated from chassis ground, some 0.1 uF capacitors that were supposed to be 1 uF, and ordering the right potentiometers instead of trying to improvise with ones I had lying around ([these](https://www.taydaelectronics.com/tayda-b100k-ohm-linear-taper-potentiometer-round-shaft-pc-mount-l.html) fit well if you're curious).
[^2]: I used [asfv1](https://github.com/ndf-zz/asfv1), which is a handy command-line assembler written in Python.
[^3]: This will depend on operating system. On Windows, I installed the drivers from [here](https://github.com/KrisKasprzak/CH341) and used [AsProgrammer](https://wiki.pedalpcb.com/wiki/Using_the_FV1Dev_on_Microsoft_Windows#Write_EEPROM) for flashing.
