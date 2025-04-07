+++
title = "Building Arpeggio Pt. 4: The Parser & Interpreter"
tags = ["python", "audio", "arpeggio", "programming-languages"]
description = "Turning code into notes."
date = "2025-01-26"
+++

I'm building a domain-specific language called [Arpeggio](/tag/arpeggio) that compiles code into songs. I outlined a tentative syntax for the language in [Part 1]({{% relref "/blog/building-arpeggio-pt-1-language-design" %}}), explored the musical theory behind it in [Part 2]({{% relref "/blog/building-arpeggio-pt-2-music-theory-for-programmers" %}}), and implemented a Python music engine to power it in [Part 3]({{% relref "/blog/building-arpeggio-pt-3-the-engine" %}}). Now it's time to finally connect those components together by writing a parser and interpreter that turns our custom language into playable music.

## Syntax and Semantics

The language design was detailed in [Part 1]({{% relref "/blog/building-arpeggio-pt-1-language-design" %}}), but here's a quick recap of the core concepts:

- **Songs** are the top-level construct, defined by an `arp` file, and contain configuration and tracks.
- **Tracks** define and configure notes and chords that compose songs, arranged into lines.
- **Lines** organize notes into patterns that define timing.
- **Notes** define interval pitches in the song's diatonic scale. Their octave can be adjusted with `-` and `+` modifiers and their timing can be extended with `.` marks. 
- **Configurations** are song- and track-level modifiers marked by `@key value` pairs.

Putting that together, here's the Arpeggio code for a simple melody:

```text
@bpm 90
@key F_major

track
    @instrument triangle

    | 5 . 5 . 6 . . . 5 . . . 1+. . . 7 . . . . . . .
    | 5 . 5 . 6 . . . 5 . . . 2+. . . 1+. . . . . . .
    | 5 . 5 . 5+. . . 3+. . . 1+. . . 7 . . . 6 . . .
    | 4+. 4+. 3+. . . 1+. . . 2+. . . 1+. . . . . . .
end
```

Now, it's time to turn that theoretical syntax into an interpretable program by parsing.

## Parsing with Lark

There are a lot of ways to parse text; I'm using a Python package called [Lark](https://github.com/lark-parser/lark), which allows you to build a parser by specifying the formal grammar of your language using a modified version of [EBNF](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form). Grammars are composed hierarchically, starting with complex concepts and moving to the atomic elements that define a language.

### The Grammar

Following the syntax I outlined above, I defined the Arpeggio grammar with a top-level song composed of configuration and tracks, configurations as lists of keys and values prefixed by `@`, tracks as configuration and lines between `track` and `end` keywords, lines as lists of notes prefixed by `|`[^line delimiters], etc. You can see the full Lark grammar [here](https://github.com/aazuspan/arpeggio/blob/main/src/arpeggio/arpeggio.lark).

### The Parser-Transformer

With the grammar defined, Lark can now parse source files into abstract syntax trees that contain the tokens that define a song. Next, I [wrote a transformer](https://github.com/aazuspan/arpeggio/blob/main/src/arpeggio/arp_ast.py) that converts raw AST nodes into usable data structures that can be more easily interpreted.

Using the note interval `3+` as an example, here's the full process of how it's parsed and transformed from Arpeggio source code into an interpretable Python data structure:

1. An `interval` rule is defined in the grammar as an integer `INT` with an optional `OCTAVE`. `INT` is a terminal rule imported from Lark, while an `OCTAVE` matches one of four string literal symbols:

    ```text
    interval: (INT OCTAVE?)
    %import common.INT
    OCTAVE: "+" | "-" | "*" | "_"
    ```

1. Using that grammar, Lark parses `3+` into an AST node that stores the string values that matched each rule:

    ```python
    [Tree(Token('RULE', 'interval'), [Token('INT', '3'), Token('OCTAVE', '+')])]
    ```

1. Transformers convert the `INT` and `OCTAVE` tokens into integer literals. The `INT` value is simply cast from a string while `OCTAVE` is compared against a lookup table that converts symbols to octave modifiers:

    ```python
    class _ToAst(Transformer):
        ...

        INT = int

        def OCTAVE(self, v):
            modifiers = {
                "_": -2,
                "-": -1,
                "+": 1,
                "*": 2,
            }
            return modifiers[v]
    ```

1. Using the transformed interval and octave values, the transformer builds an `Interval` dataclass which can used by the interpreter to create a playable note:

    ```python
    @dataclass
    class Interval(ast_utils.Ast):
        """A musical note or chord."""

        value: int
        octave: int = 0
    ```

A similar process of parsing text into tokens and transforming tokens into literals and data structures is repeated for the rest of the Arpeggio grammar, creating a series of Python objects that can be fed into the interpreter. 

## Interpreting 

With an Arpeggio program parsed and transformed into meaningful data structures like `Interval`, `Track`, and `Song`, the final step is to connect those abstract representations to the Python music engine I built in [Part 3]({{% relref "/blog/building-arpeggio-pt-3-the-engine" %}}).

The final interpreter is just [30 lines of Python](https://github.com/aazuspan/arpeggio/blob/main/src/arpeggio/interpreter.py), instantiating `Song` and `Track` objects from the music engine with their corresponding configuration options from the AST and using Pydantic to [validate](https://github.com/aazuspan/arpeggio/blob/main/src/arpeggio/validation.py) options and raise errors. Tracks are populated with transformed notes and chords, creating an audio representation of an Arpeggio program that can be played back or compiled to a WAV file.

Here's the audio for a rendered demo song, with the Arpeggio source code below:


<center>
<audio controls> 
    <source src="demo_song.wav" type="audio/wav">
    Your browser does not support the audio element.
</audio>
</center>


```text
@key d_dorian
@bpm 160

~ Chords
track
    @chords
    @octave -1

    | 1 . . . . . . . 6 . . . . . . . 4 . . . . . . . 5 . . . . . . . [x4]
    | 1 . . . . . . .
end

~ Bass
track
    @instrument triangle
    @octave -2

    | 1 . . . 1 . . . 6 . . . . . . . 4 . . . . . . . 5 . . . 3 . 2 . [x4]
    | 1 . . . . . . .
end

~ Snare
track
    @instrument noise
    @staccato
    @volume -16

    | 1 & 1 & . . 1 & 1 & 1 1 1 1 & . 1 & 1 & 1 & 1 & 1 . . . 1 1 1 1 [x2]
    | 1 & 1 & 1 1 1 & 1 & 1 1 1 1 & . 1 & 1 & 1 & 1 & 1 1 1 1 1 1 1 1 [x2]
    | 1 . . .
end


~ Snare accent
track
    @instrument noise
    @staccato
    @volume -8

    | 1 & . . . . . .  1 & . . . . . .  [x8]
end


~ Melody 1
track
    @instrument sine
    @pan 1

    | 1 . . . . . . . 1 . 2 . 3 . . . . . 5 . 4 . 3 . 4 . 3 . 7-. 2 .
    | 1 . . . . . . . 1 . 2 . 3 . . . . . 7-. 1 . 2 . 5 . 6 . 3 . 2 .
    | 1 . . . . . . . 1 . 2 . 3 . . . . . 5 . 4 . 3 . 4 . 3 . 7-. 2 .
    | 1 . . . . . . . 1 . 2 . 3 . . . . . 7-. 1 . 2 . 5 . 6 . 3 . 2 .
end


~ Melody 2
track
    @instrument sine
    @volume -8
    @pan -1
    @offset 64

    | 1 . . . 7 . . . . . . . 1+. 7 . 5 . 6 . . . 4 . 5 . 4 . 3 . 2 .
    | 1 . . . 7 . . . . . . . 1+. 5 . 4 . 3 . . . 4 . 3 . 2 . 5-. 7-.
    | 3 . . . . . . .
end
```

[^line delimiters]: Line delimiters were something I went back and forth on. I considered using linebreaks to separate lines, but found that mixing significant and insignificant whitespace was difficult to convey in Lark with a LALR lexer -- probably a hint that it's a bad design choice. Mostly for aesthetic reasons, I ultimately decided to start lines with `|` rather than end them with the standard `;`.