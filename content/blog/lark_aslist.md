+++
title = "TIL: Handling Rule Lists in Lark"
tags = ["python", "til", "programming-languages"]
description = "Handle ambiguity in the grammar, not the parser."
date = "2024-09-07"
+++

I encountered an interesting challenge while building a Lark parser for my [domain-specific language](/tag/arpeggio), which I thought was worth a quick write-up. Details are below, but the TLDR is that making your grammar a little more complex by wrapping lists of rules into a new rule can simplify parsing.

## The Issue

My language supports variable-length lists of notes that are optionally followed by a repeat symbol. In code, that looks like:

```text
1 2 3 4 [x2]
```

The original (simplified) grammar I wrote looked like this:

```text
line: note* repeat?
note: NUMBER
repeat: "[x" NUMBER "]"

%import common.NUMBER
%import common.WS
%ignore WS
```

And the AST parser, created following the [Lark example](https://lark-parser.readthedocs.io/en/stable/examples/advanced/create_ast.html):

```python
@dataclass
class Note(ast_utils.Ast):
    value: int


@dataclass
class Repeat(ast_utils.Ast):
    times: int


@dataclass
class Line(ast_utils.Ast):
    notes: list[Note]
    repeat: Repeat = Repeat(0)


class ToAst(Transformer):
    NUMBER = int


transformer = ast_utils.create_transformer(sys.modules[__name__], ToAst())
parser = Lark(grammar, start="line", transformer=transformer, parser="lalr")
```

This immediately throws a `TypeError` because Lark tries to instantiate `Line` with each note as a separate argument, while `Line` expects a list of notes. As pointed out in the example parser, this is easily fixed by subclassing `ast_utils.AsList`, which tells `Line` to pack its arguments into a list:

```python
@dataclass
class Line(ast_utils.Ast, ast_utils.AsList):
    notes: list[Note]
    repeat: Repeat = Repeat(0)
```

This solves the error, but introduces a subtle bug that's revealed when we look at the parsed output.

```python
Line(notes=[Note(value=1), Note(value=2), Note(value=3), Note(value=4), Repeat(times=3)], repeat=Repeat(times=0))
```

Inheriting from `AsList` caused `Line` to interpret *all* of it's arguments as a single list, so our `Repeat` got thrown in as another note while the attribute defaulted to zero.

After considering a few options[^post-init], I settled on a small modification to the grammar.

## The Solution

The underlying problem is that the output of our grammar is ambiguous - the `line` rule gets passed an unknown number of notes and an optional `repeat`, and doesn't know when the notes stop and the repeat begins without some manual type checking. To simplify the parser's job, we can make the grammar slightly more complex by adding a new rule called `note_list`:

```diff
- line: note* repeat?
+ line: note_list repeat?
+ note_list: note*
note: NUMBER
repeat: "[x" NUMBER "]"

%import common.NUMBER
%import common.WS
%ignore WS
```

With one small change to the parser[^remove-aslist], our program now parses correctly.

```python
class ToAst(Transformer):
    NUMBER = int
    note_list = list

parser.parse(example)
```

```python
Line(notes=[Note(value=1), Note(value=2), Note(value=3), Note(value=4)], repeat=Repeat(times=3))
```

## Scaling Up

As I continued to write the grammar, I found myself repeating the same pattern: combining `line*` into `line_list`, `track*` into `track_list`, etc., each of which needed to be parsed as lists:

```python
class ToAst(Transformer):
    NUMBER = int
    note_list = line_list = track_list = list
```

This was fine, but a little repetitive, and forced me to manually add each new compound rule. While poking through the [Preql parser](https://github.com/erezsh/Preql/blob/master/preql/core/preql.lark) written by the author of Lark, I found an elegant solution. If each of these rules is ultimately just a list, let's make that clear in the grammar using a rule alias:

```text
note_list: note*    -> as_list
line_list: line*    -> as_list
track_list: track*  -> as_list
```

Now we can parse any list-like rule under the umbrella `as_list` rule:

```python
class ToAst(Transformer):
    NUMBER = int
    as_list = list
```

Lesson learned: a little extra complexity in the grammar can save time and effort in the parser.

[^post-init]: You could handle this with a [`__post_init__`](https://docs.python.org/3/library/dataclasses.html#dataclasses.__post_init__) callback in the `Line` dataclass that checks for a `Repeat` in the note list and pops it off, but this felt hacky and meant that our type annotations would be inaccurate, at least for a moment.

[^remove-aslist]: Also, remember to remove the `ast_utils.AsList` subclass since that's no longer needed.