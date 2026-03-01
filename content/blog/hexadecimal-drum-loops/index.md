+++
title = "Hexadecimal Drum Loops"
date = "2026-06-05T09:49:07.385705"
description = "An interactive experiment in using hex strings to encode drum sequencer state."
tags = ["music"]
+++

When you program a drum machine, you're encoding a binary state (play or don't play) for each drum (kick, snare, hi-hat, etc) at each time step. The obvious, intuitive interface -- the one used by pretty much every sequencer and DAW -- is a 2D grid of cells, with sounds on the Y-axis and time on the X-axis.

{{<figure src="daw.png" caption="A drum loop displayed on a classic 'piano roll' MIDI interface.">}}

What if you wanted to efficiently encode that drum loop using text? In hexadecimal, the characters **0-F** represent base 16 values, with 4 bits per character. Let's assign each bit to one of four drum sounds: kick, snare, closed hi-hat, and open hi-hat. Now character **8** (or `1000`) becomes a kick drum, **2** (`0010`) becomes a closed hi-hat, **A** (`1010`) becomes kick *and* closed hi-hat, and so on. 

Mapping out the whole hex alphabet, we get:

```
Hex character     0 1 2 3 4 5 6 7 8 9 A B C D E F
-------------------------------------------------
bit 0 (kick)    | 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1
bit 1 (snare)   | 0 0 0 0 1 1 1 1 0 0 0 0 1 1 1 1
bit 2 (cl hh)   | 0 0 1 1 0 0 1 1 0 0 1 1 0 0 1 1 
bit 3 (op hh)   | 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1
```

Assigning each character to one 1/16th note, the drum loop above becomes **8020C022**.

While you could imagine this being used as a serialization strategy to save drum loop state (as long as you're satisfied with only four quantized tracks[^tracks]), let's go a step further and turn it into a user interface where you program drum loops *using* their hex encoding.

{{<figure src="bitloop.png">}}

The result, which you can [check out here](../../tool/bitloop?seq=8020C022), is a drum machine that's deeply unintuitive, but (in my opinion) surprisingly fun[^fun].

[^tracks]: Of course, you could add more resolution by making each character represent smaller fractions of a note, and increase the number of tracks by switching to a base-32 or base-64 encoding.

[^fun]: I highly recommend ignoring the hex table and leaning into the confusion.