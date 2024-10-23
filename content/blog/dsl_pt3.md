+++
title = "Building Arpeggio Pt. 3: The Engine"
tags = ["python", "audio", "arpeggio", "programming-languages"]
description = "Building a Python backend for music generation."
date = "2024-09-21"
+++

I'm building a domain-specific language called [Arpeggio](/tag/arpeggio) that compiles[^compiled] code into songs. When an Arpeggio program is run, the compiler will need a way to turn parsed instructions (e.g. play a C major chord for 1/4 of a measure) into playable audio. This post goes over the process of designing and building that backend API.

## Building a Song in Code

In [Part 2]({{% relref "/blog/dsl_pt2" %}}), I outlined how we can represent musical concepts like keys, modes, notes, and chords in Python. For a quick recap, here's the basic structure of those classes:

```python
Interval = int
Mode = list[Interval]
Duration = Fraction

class Key:
    """A musical key representing a set of semitone intervals around a tonic."""
    tonic: Note
    mode: Mode

@dataclass
class Note:
    """A note representing a frequency played for a duration."""
    frequency: float
    duration: Duration

@dataclass
class Chord:
    """A collection of notes played for a duration."""
    notes: list[Note]

@dataclass
class Rest:
    """A pause where no note is played."""
    duration: Duration
```

The next step is organizing these into songs that can be converted into audio.

Each Arpeggio program will represent a song. A song, in turn, will be composed of one or more tracks, allowing you to layer different instruments together. Each track will represent a timeline of notes, chords, and rests, describing what frequencies will be played when.

The basic implementation of those classes will look something like this:

```python
@dataclass
class Song:
    """A song made of one or more tracks."""
    key: Key
    bpm: int = 120
    tracks: list[Track] = field(default_factory=list)

@dataclass
class Track:
    """"A track containing a timeline of notes, chords, and rests."""
    volume: float = 0.0
    pan: float = 0.0
    mute: bool = False
    solo: bool = False
    timeline: list[Note | Chord | Rest] = field(default_factory=list)
```

These components are enough to start arranging and composings songs in Python, but we still need a way to turn code into audio...

## Make Some Noise

You could write your own audio engine from scratch using Numpy -- all you really need is a way to generate and combine different waves at specified frequencies and durations -- but to keep things simple I opted for an existing package called [Pydub](https://github.com/jiaaro/pydub) that handles that complexity and offers a handful of signal generators like sine, square, triangle, and sawtooth waves. 

Each note can be converted into a playable `pydub.AudioSegment` based on its frequency and duration in milliseconds using a signal generator. By overlaying[^overlaying] and concatenating[^concatenating] audio segments, we can form chords from notes, tracks from notes and chords, and songs from lists of tracks.

Plumbing the existing music classes into Pydub was a pretty simple task, and results in a Python API that can both compose and synthesize songs. I wrote a quick demo song to test things out, and...

```python
from arpeggio import instrument, note
from arpeggio.key import Key
from arpeggio.song import Song

if __name__ == "__main__":
    # Create an empty song
    song = Song(key=Key.from_name("F#", "major"), bpm=120)

    # Create the melody track
    melody = song.add_track(instrument=instrument.Sine)

    # Add notes to the melody track
    for _ in range(3):
        melody.play(3, octave=1, duration=note.SixteenthNote)
        melody.play(2, octave=1, duration=note.SixteenthNote)
        melody.play(1, octave=1, duration=note.EighthNote)
        melody.play(6, duration=note.SixteenthNote)
        melody.rest(duration=note.SixteenthNote)
        melody.play(5, duration=note.EighthNote)
    melody.play(3, duration=note.EighthNote)
    melody.play(2, duration=note.QuarterNote)
    melody.play(1, duration=note.EighthNote)
    
    song.play()
```

<audio controls> 
    <source src="/audio/posts/dsl_pt3/knuckle_song.wav" type="audio/wav">
    Your browser does not support the audio element.
</audio>

We have music! 

Being able to write a playable song in Python is exciting, but the code is pretty verbose. If only we could rewrite it in a simpler language that was designed just for writing songs... In Part 4, I'll focus on parsing Arpeggio code into instructions and interpreting them to build songs with our new music engine.

[^compiled]: I refer to both compiling and interpreting Arpeggio, based on the idea that programs can be compiled into WAV files or interpreted directly into audio. This is probably stretching the definitions of those terms since there's no machine code involved, but it seems faithful to the core idea that compilers generate "executable" output files.
[^overlaying]: In Pydub, overlaying two audio segments simply sums their signals. Because audio segments are stored in signed 16 bit arrays, adding two together tends to overflow the data type and clip, creating distortion. Pydub doesn't offer any workarounds for this, so I ended up adding a `normalized_overlay` function that just sums arrays using a larger datatype, and rescales as needed to avoid clipping.
[^concatenating]: Converting note durations from fractional notes, to milliseconds, to samples in an array inevitably leads to rounding errors. Those errors compound, meaning that a track with 1,600 sixteenth notes will be a slightly different number of samples than a track with 100 whole notes, depending on the tempo and sampling rate. I experimented with using absolute positions to overlay notes instead of concatenating relative to the previous note, but found that the 10x slowdown wasn't worth the increased precision, which only amounted to about 20 milliseconds over a 4 minute song.