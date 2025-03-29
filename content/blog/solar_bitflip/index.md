+++
title = "TIL: How Fast is Solar Bitflip Sort?"
date = "2025-03-29"
description = "Using simulations to estimate the sorting speed of cosmic radiation."
tags = ["til", "algorithms", "rust"]
+++

Solar Bitflip Sort is a joke sorting algorithm that relies on cosmic particles colliding with transistors in a memory node to randomly flip an array of bits into a miraculously sorted arrangement. But how long would it actually take to sort an array?

A [1996 study by IBM](https://ieeexplore.ieee.org/document/556861) found that their machines experienced about 1 bit flip per 256 MB of RAM per month, or $5.5 * 10^{-9}$ flips per bit per year. To calculate sorting time, we just need to figure out how many random flips it should take to sort a given array of bits.

## The Theory

If we consider two arrays of $n$ bits $A$ and $B$, the difference between the current and sorted states is just the number of mismatched bits $d$, i.e. the bitwise XOR or [Hamming distance](https://en.wikipedia.org/wiki/Hamming_distance). Each random flip can increase or decrease $d$ by 1, with the probability determined by the number of currently sorted bits. Since each bit theoretically has the same chance of being flipped, the probability of reducing distance by 1 is just the proportion of unsorted bits $d/n$, while the probability of *increasing* distance is the inverse $(n - d)/n$. 

We can think of this as estimating the hitting time of a [random walk](https://en.wikipedia.org/wiki/Heterogeneous_random_walk_in_one_dimension) in Hamming space, which should be solvable with Markov chains. Let's just look up [some equations](https://stats.stackexchange.com/questions/637986/deriving-the-distribution-of-markov-chain-times) and...

{{<figure src="markov.png">}}

Let's do a simulation instead!

## The Simulation

To come up with an empirical estimate of required flips, we just need a function that iteratively flips the bits of a random initial state until it reaches a sorted target state. To keep things fast, I wrote this up in Rust.

```rust
use rand::{rngs::ThreadRng, Rng};

/// Flip a random bit in a vector in-place
fn flip_random_bit(state: &mut[u8], rng: &mut ThreadRng) {
    let idx = rng.random_range(0..state.len());
    state[idx] ^= 1;
}

/// Simulate the number of random flips needed to sort `n` bits once from a random state
fn count_flips_until_sorted(n_bits: usize) -> usize {
    let rng = &mut rand::rng();

    // Initialize random start and target states
    let mut state: Vec<u8> = (0..n_bits).map(|_| rng.random_range(0..=1)).collect();
    let target: Vec<u8> = (0..n_bits).map(|_| rng.random_range(0..=1)).collect();

    // Avoid starting with a sorted state
    if state == target {
        flip_random_bit(&mut state, rng);
    }

    // Flip bits until the state matches the target
    let mut flips = 0;
    while state != target {
        flip_random_bit(&mut state, rng);
        flips += 1;
    }

    flips
}
```

Running that function 10 million times with an array of 8 bits gives us a sorted byte after an average of **302 flips**[^initial]. How long will it take to flip those 302 bits? Based on the IBM numbers with 8 bits of data, we can expect $4.4 * 10^{-8}$ flips per year, giving us an average sorting time of **6.8 billion years**. With the current [age of the universe](https://en.wikipedia.org/wiki/Age_of_the_universe) estimated at 13.8 billion years, that's doable!

[^initial]: While the simulation includes some lucky runs where we started with a nearly-sorted state, the initial state doesn't actually matter that much -- a worst-case scenario shuffle where the initial state is the inverse of the target only increases the average required flips to 312. 