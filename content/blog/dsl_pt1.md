+++
title = "Building Arpeggio Pt. 1: Language Design"
tags = ["python", "audio", "arpeggio"]
description = "Planning a domain-specific language that compiles to music."
date = "2024-09-03"
+++

I've tinkered with parsers for a few small side projects like building [a language server](https://github.com/aazuspan/spinasm-lsp) and [parsing blog post metadata]({{% relref "/blog/parsing_frontmatter" %}}), but I wanted to tackle a bigger parsing project. I've also been trying to learn some music theory in my spare time, so why not combine the two ideas by building a domain-specific language (DSL) for notating and generating music?

I'm (tentatively) calling it **Arpeggio**.

## The Concept

This is going to take a few blog posts to get through, so let's just start at the beginning with what our language is going to look like and how we're going to use it, so we can build our parser around that.

### What's a Domain Specific Language?

If high-level languages like C and Python are a layer of abstraction on top of Assembly to make programs easier to write, DSLs are another step up the ladder of abstraction, built on top of a general-purpose programming language to make one specific *type* of program easier to write. Think SQL for querying databases or HTML for laying out web pages.

Arpeggio will be built on top of Python to make it easier to programmatically write music.

### The Goal

I want to be careful to keep the scope reasonable, so here are the main features I want out of Arpeggio:

1. Lay out musical notation in an intuitive, simple way. I'll go into more detail in a future blog post, but the point is that there will be some musical constraints to both limit implementation complexity *and* make it easier to write simple songs.
1. Compose songs by layering tracks using different "instruments". Specifically I'm thinking something like retro video game [chiptunes](https://en.wikipedia.org/wiki/Chiptune) that were generated by dedicated sound chips that could synthesize different sounds with sine, square, sawtooth, and triangle waves. 
1. Use loops and patterns to quickly build up audio tracks. Other programming language standards like conditionals, functions, and classes shouldn't be needed.

## The Design

This is all likely to change once I actually start writing the parser, but I figured it was a good idea to at least come up with an initial plan that I can iterate from.

### Syntax

I'm leaning towards a syntax inspired by [Lua](https://www.lua.org/). Statements will be enclosed with keywords (e.g. `track` and `end`) instead of braces. Whitespace will be used for readability, but ignored by the parser. Comments will be started with `~`, because that's kind of fun and I won't need the operator. Configuration like song tempo or track gain will be accomplished with special block-scoped keywords enclosed in square brackets[^config].

Here's a quick example program with the tentative syntax:

```text
~ This is the song configuration
[bpm 120]
[key c]
[mode major]

~ This is the first track of the song
track
    [instrument sine]
    [gain -10]

    ~ Music goes here
end
```

### Program Layout

An Arpeggio program will be composed of tracks[^tracks]. Tracks will be composed of notes, chords, and/or loops of notes and chords. Patterns will be loops that are assigned to names for reusability.

### Musical Notation

Each program in Arpeggio will be constrained to one musical key[^music], defined at the top of the program. The notes and chords in that key will be referenced by interval (decimal for notes, Roman numerals[^numerals] for chords), which will make it easy to transpose a song between keys and modes without changing any notes. 

For example, the C major scale could be played with:

```text
track
    1
    2
    3
    4
    5
    6
    7
end
```

While a C F G C chord progression could be played with:

```text
track
    I
    IV
    V
    I
end
```

Modifiers after notes and chords can change their octave (`+` and `-`):

```text
track
    1 ---   ~ C1
    1 --    ~ C2
    1 -     ~ C3
    1       ~ C4
    1 +     ~ C5
    1 ++    ~ C6
    1 +++   ~ C7
end
```

...or their duration (`:` and `.`):

```text
track
    1 ..    ~ 1/16 note
    1 .     ~ 1/8 note
    1       ~ 1/4 note
    1 :     ~ 1/2 Note
    1 ::    ~ 1/1 note
end
```

With that system, we can notate a simple melody as:

```text
~ Happy Birthday

[bpm 90]
[scale f]
[mode major]

track
    [instrument triangle]

    5 . 
    5 .
    6
    5
    1   +
    7 :

    5 .
    5 .
    6
    5
    2   +
    1 : +
end
```

## Next Steps

With a tentative language design in mind, here's my loose roadmap:

1. Build the Python backend for generating music.
1. Write the parser and finalize the language design.
1. Put everything together to compile Arpeggio programs into songs.
1. Maybe a language server?

[^config]: Or maybe prefixed with `#`, or assigned as reserved variables, or enclosed in parentheses. I've changed it three times while writing this, and I'll probably change it again before it's done.
[^tracks]: There will probably be a relatively low limit on the number of tracks to keep things fast. This isn't going to replace your [DAW](https://en.wikipedia.org/wiki/Digital_audio_workstation).
[^music]: I plan to write a quick "programmer's guide to basic music theory" as a reference and to solidify my own understanding, but for now the important takeaway is that Arpeggio will use a limited subset of musical notes that generally sound good together.
[^numerals]: Usually lowercase Roman numerals are used for minor chords and vice versa, but in Arpeggio they'll be case insensitive since we can infer the exact chord from the key and interval.