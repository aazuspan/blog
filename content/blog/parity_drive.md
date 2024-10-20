+++
title = "What's a Parity Drive?"
date = "2024-10-19"
description = "Exploring fault tolerant storage algorithms with with code."
tags = ["python", "algorithms"]
+++

I was recently introduced to the idea of a [parity drive](https://en.wikipedia.org/wiki/Parity_drive), a specially reserved hard drive in a data server array that can be used to recover data when another drive fails. The clever thing about a parity drive is that no matter how many hard drives are in your array, you only ever need *one* parity drive to provide fault tolerance for all of them[^redundancy]. How is it possible for one hard drive to recreate data from 10 or even 100 other hard drives?

To figure that out, I did a [little reading](https://www.computerweekly.com/answer/What-does-the-parity-bit-do-in-RAID), then decided to implement a simple in-memory version of a parity drive in Python to check my understanding.

## Bits and Booleans

Let's forget about hard drives for a second and just imagine that we have 10 random bits:

```python
bits = [0, 1, 1, 0, 1, 0, 0, 0, 1, 1]
```

To make a parity bit, we'll sum those bits and store whether the answer is even (0) or odd (1). In boolean logic, this is an [XOR](https://en.wikipedia.org/wiki/Exclusive_or) operation, which in this case returns a 1 (odd). 

```python
def xor(bits: list[int]) -> int:
    return sum(bits) % 2

parity = xor(bits)
```

Now what happens if we forget one of our original 10 bits? If we XOR the remaining nine bits and get an odd number, we'll know we lost a zero - if we get an even number, we lost a one. To calculate the missing bit directly, we can just XOR the remaining bits and the parity bit.

```python
missing_bit = bits.pop()
recovered_bit = xor([*bits, parity])

assert missing_bit == recovered_bit
```

That's parity. By storing 1 bit, the XOR result, we're able to recover any one missing bit from our original array, regardless of how many bits it contained.

## Scaling Up

In the example above, we effectively made a 1-bit parity drive for an array of ten 1-bit hard drives. To make this marginally more practical, let's try implementing parity with some slightly more complex data -- a list of strings.

```python
words = [
    "parity",
    "demo",
    "with",
    "strings",
]
```

First, we'll encode the list of strings into a list of bytes:

```python
encoded: list[bytes] = [word.encode() for word in words]
```

Next, we need to XOR the byte arrays to get our parity "drive". 

Our previous `xor` implementation worked with lists of ints representing individual bits, but now we're working with `bytes`. Instead of summing everything, we can use `functools.reduce` to iterate through each byte array in pairs, zipping the bytes in order and using the bitwise operator `^` to XOR them. To avoid truncating bytes, each byte array first needs to be padded to the width of the longest element[^longest-element].

Here's the new `xor` in code:

```python
def xor(l: list[bytes]) -> bytes:
    width = max(len(b) for b in l)
    padded = [b.ljust(width) for b in l]

    return reduce(lambda x, y: bytes(a ^ b for a, b in zip(x, y)), padded)

parity = xor(encoded)
```

Finally, we can XOR our parity bytes with a word list that's missing one word, and watch the data recovery in action[^strip]:

```python
incomplete_words = [
    "demo",
    "with",
    "strings",
]

encoded = [word.encode() for word in incomplete_words]
recovered = xor([parity, *encoded]).strip().decode()

assert recovered == "parity"
```

It works! We needed one set of parity bytes to recover any word from our list of four words, but it could just as easily recover a word from a list of ten thousand. Or more practically, use the same principle to encode a parity drive from an array of 100 hard drives and you could provide fault tolerance for 1 PiB of data with a single 10 TiB parity drive.

[^redundancy]: One parity drive can recover data from one failed drive in an array. There are other techniques that can protect against multiple drive failures, but I don't understand them.

[^longest-element]: This is the same reason that a parity drive needs to be at least as large as the largest drive in the array.

[^strip]: Remember to `strip` off the padding characters that we added during encoding.