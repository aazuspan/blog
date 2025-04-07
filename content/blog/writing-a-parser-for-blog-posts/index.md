+++
title = "Writing a Parser for Blog Posts"
date = "2024-08-30"
description = "Using grammar to reformat my blog posts."
tags = ["python", "algorithms"]
+++

In an effort to simplify and speed up my blog, I'm migrating from my custom-made [NextJS SPA](https://github.com/aazuspan/blog) to [Hugo](https://gohugo.io/), which means reformatting the frontmatter header of every blog post from this:

```bash
---
title: My Blog Post
category: Blog
tags: blog, post, blog-post
date: "2023-03-18"
summary: Summary goes here
---
```

to this:

```bash
+++
title: "My Blog Post"
tags: ["blog", "post", "blog-post"]
date: "2023-03-18"
summary: "Summary goes here"
+++
```

Not a big deal to go through and change manually, but I recently dipped my toes into the world of lexing and parsing while writing an [LSP server](https://github.com/aazuspan/spinasm-lsp), and ever since I've been looking for a good excuse to play around with [Lark](https://github.com/lark-parser/lark).

Lark takes text - could be a line of code, a paragraph, or metadata for a blog - and turns it into structured data using a **grammar** that describes the syntax rules of the text. With a little more work, it can process that tree of parsed nodes to build things like abstract syntax trees, interpreters, and reformatters.

So let's start by writing a grammar to parse our frontmatter.

## Writing a Grammar

Lark uses a modified version of [EBNF](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form) grammar, which is pleasingly elegant in its simplicity. Grammars are built hierarchically, with complex rules broken down into combinations of simpler rules until you ultimately reach terminals that define the core building blocks of the grammar using regex patterns. 

For example, you might define the grammar of an essay as:

```bash
# An essay is made of 1 or more paragraphs
essay: paragraph+

# A paragraph is made of 1 or more sentences
paragraph: sentence+

# A sentence is made of 1 or more words separated by whitespace, followed by punctuation
sentence: WORD (" " WORD)* PUNCTUATION

# Punctuation matches the characters .!?
PUNCTUATION: /[.!?]/

# Import premade terminals from Lark
%import common.WORD
%import common.WS
%ignore WS
```

The grammar for frontmatter isn't much more complicated. A frontmatter is a collection of lines; a line is either a title, category, tag list, date, or summary[^properties]; a tag list is group of comma-separated tags; a tag is a hyphen-separated list of words; etc. Written out for Lark, my grammar looks like this[^grammar]:

```bash
start: _line+
_line: title | category | tag_list | date | summary
title: "title:" TEXT
category: "category:" WORD 
tag_list: "tags:" tag ("," tag)*
tag: WORD ("-" WORD)*
date: "date:" TEXT 
summary: "summary:" TEXT 

TEXT: /.+/

%import common.WORD
%import common.WS
%ignore WS
```

Parsing the frontmatter of a blog post returns the following tree of nodes:

```text
frontmatter
  title         Writing a Parser for Blog Posts
  category      Blog
  date          "2024-08-30"
  summary       Using grammar to reformat my blog post metadata.
  tags
    tag python
    tag algorithms
```

Now we just need to write a [transformer](https://lark-parser.readthedocs.io/en/latest/visitors.html) to correctly format our parsed nodes.

## Writing a Transformer

A transformer walks the nodes of a tree, converting each node using a function named after the node type in a `lark.Transformer` subclass. Converting each node type to its new format is mostly just string formatting:

```python
from lark import Transformer, Discard

class FrontmatterTransformer(Transformer):
    def title(self, items):
        return f'title: "{items[0].value.strip()}"'
    
    def category(self, _):
        # We don't need a category in the new frontmatter format.
        return Discard
    
    def tags(self, items):
        return f'tags: [{", ".join(items)}]'

    def tag(self, items):
        full_tag = "-".join(items)
        return f'"{full_tag}"'

    def date(self, items):
        return f'date: {items[0].value.strip()}'

    def summary(self, items):
        return f'description: "{items[0].value.strip()}"'

    def frontmatter(self, items):
        meta = '\n'.join(items)
        return f"+++\n{meta}\n+++"
```

## Reformatting

All that's left is to load, parse, transform, write out the reformatted blog posts, and we're done. Just like that, we've saved ourself 10 minutes of labor with 30 minutes of coding!

[^properties]: You *could* simplify the grammar by using a single `property` rule to define every key, value pair, but that would require more post-processing. 

[^grammar]: I'm new to writing grammars, so I'm sure there are more concise ways to define this syntax.