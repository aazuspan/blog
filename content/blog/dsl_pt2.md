+++
title = "Building Arpeggio Pt. 2: Music Theory for Programmers"
tags = ["python", "audio", "arpeggio"]
description = "Turning notes into code."
date = "2024-09-04"
+++


I'm building a domain-specific language called [Arpeggio](/tag/arpeggio) that compiles code into music. In [Part 1](({{% relref "/blog/dsl_pt1" %}})), I outlined the basic language design and syntax. Here, I'm going to do a very shallow dive into music theory from a programmer's perspective, focusing on the terms and concepts needed to build the music backend that powers Arpeggio.

*Disclaimer: Music theory is a huge field of study that's filled with complexity and ambiguity, which I'm going to vastly oversimplify down to the basic math and patterns that I can understand. Apologies to any real musicians who stumble onto this.*

### The Terminology

Songs are fundamentally composed of **notes**, which are just names assigned to **frequencies**: A4 is a signal oscillating at 440Hz[^standard-pitch]. There are 12 other distinct notes[^tonal-music], each separated by one **semitone**. Move 12 semitones up from a note and you double its frequency[^temperament], getting the same note in the next **octave** (A5 is 880Hz).

Not all notes sound good together[^free-jazz], which is why **modes** exist. A mode describes a set of semitone intervals between notes that are frequently played together. The most common modes in western music are Ionian and Aeolian, better know as the **major** and **minor**[^natural-minor] scales, which are called diatonic and contain 7 distinct notes each. The intervals of a mode can be played from any starting note, or tonic. Combining a tonic with a mode, like A major, defines a **key**. 

### Calculating Frequency

Putting all that together, we can get a very simple representation of musical keys in Python with:

```python
Note = float
Interval = int
Mode = list[Interval]

class Key:
    tonic: Note
    mode: Mode

class AMajor(Key):
    tonic = 440.0
    mode = [2, 2, 1, 2, 2, 2, 1]
```

We can calculate the frequency of any other note in that key by counting how many semitones are needed to reach the desired interval. The 4th interval in the key of A major is 5 semitones (2 + 2 + 1) above the 440 Hz tonic. Each semitone is 1/12th of an octave, so our new note is: 

$$
440 \text{ Hz} \cdot 2^{\frac{5}{12}} = 587.33 \text{ Hz}
$$

In Python:

```python
class Note:
    def __init__(self, frequency: float):
        self.frequency = frequency

    def __add__(self, semitones: int) -> Note:
        """Return the note n semitones above this note."""
        return Note(self.frequency * 2 ** (semitones / 12))
```

### Calculating Chords

A **chord** is a collection of notes played together. The most common chord in western music is a **triad**, which is three notes at the root, third, and fifth interval. Triads can be played at any interval in the mode by calculating intervals relative to the new root, usually written in Roman numerals. For example, a IV chord in the key of A major has a root at the 4th interval and other notes at the 7th and (wrapping around to the next octave) 2nd intervals.

### Rhythm

In addition to the frequency, we also need to know how long to play each note for. This depends on the note length, measured in fractions of a whole note, and the **tempo** and **time signature** of the song. In a song with 60 beats-per-minute (BPM) in 4/4 time[^4-4], a single quarter note lasts for 1 second.

```python
class NoteDuration:
    fraction: Fraction

    @classmethod
    def to_millis(cls, bpm: int, beats_per_measure: int = 4) -> float:
        """Return the number of milliseconds this note duration lasts."""
        return float((60_000 * cls.fraction / bpm) * beats_per_measure)

class QuarterNote(NoteDuration):
    fraction = Fraction(1, 4)

assert QuarterNote.to_millis(bpm=60) == 1000
```

## Wrapping Up

And that's it! We can define a song with a key, use modes and intervals to find semitones, and use semitones and beats to calculate notes and chords. All that's left is turning frequencies and durations into audio that we can hear. Coming up in Part 3!

[^standard-pitch]: Not everyone agrees on [this](https://en.wikipedia.org/wiki/A440_(pitch_standard)).
[^tonal-music]: Not everyone agrees on [this](https://en.wikipedia.org/wiki/Microtone_(music)).
[^temperament]: Not everyone agrees on [this](https://en.wikipedia.org/wiki/Musical_temperament).
[^free-jazz]: Not everyone agrees on [this](https://en.wikipedia.org/wiki/Free_jazz).
[^natural-minor]: Technically natural minor, since there are other minor scales.
[^4-4]: In a time signature like 4/4, the numerator indicates the number of beats per measure and the denominator indicates the length of each beat, in fractions of a whole note. Measures are apparently helpful for musicians, but we can ignore them since they don't actually affect note duration.