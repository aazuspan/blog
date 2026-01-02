+++
title = "TIL: Configuring jj fix with Ruff"
date = "2025-07-13T09:08:10.020791"
description = "My configuration for linting and formatting Python projects with Jujutsu."
tags = ["jj", "python", "til"]
+++

I wrote a recent [blog post]({{% relref "/blog/automating-pre-push-checks-with-jujutsu" %}}) about hacking together a crude version of Git hooks in the [Jujutsu VCS](https://github.com/jj-vcs/jj). While this is a helpful last resort to avoid pushing unlinted, unformatted code to a remote, Jujutsu has a much more elegant built-in tool to solve the problem of messy local commits: [`jj fix`](https://jj-vcs.github.io/jj/latest/config/#code-formatting-and-other-file-content-transformations). 

Once it's configured, the `fix` command runs your formatter/linter over all of your writable[^read-only] commits, applying fixes retroactively and automatically rebasing without introducing merge conflicts. For example, say you accidentally committed some unformatted code in `oytprvlu` and then made changes on top of that in `zpztzrwl`:

```bash
$ jj log

...
○  zpztzrwl user@email.com 2025-07-13 09:37:06 git_head() eb19b744
│  a good commit
○  oytprvlu user@email.com 2025-07-13 09:36:04 51eaee3d
│  unformatted commit
...
```

Running `jj fix` automatically formats the bad commit and applies that fix through to the working copy.

```bash
$ jj fix

Fixed 3 commits of 4 checked.
Working copy  (@) now at: klmvywln e738b3ac (no description set)
Parent commit (@-)      : zpztzrwl 38335008 a good commit
Added 0 files, modified 1 files, removed 0 files
```

Of course, `jj` doesn't know how to fix things unless you tell it how, which is where tool configuration comes in.

## Configuring Ruff

At the project level, tools are configured in `.jj/repo/config.toml`, which you can open automatically with `jj config edit --repo`. Each tool registers a `command`, which `jj fix` will pass changed files (matched by `pattern`) into via `stdin`. On a zero exit status, the file contents are replaced with the tool output emitted on `stdout`.

Here's how I configure linting and formatting with [Ruff](https://docs.astral.sh/ruff/) in Python projects: 

```toml
[fix.tools.1-ruff-lint]
command = ["uv", "run", "ruff", "check", "--fix", "--preview", "--quiet", "--stdin-filename=$path", "-"]
patterns = ["glob:'**/*.py'"]

[fix.tools.2-ruff-format]
command = ["uv", "run", "ruff", "format", "--stdin-filename=$path", "-"]
patterns = ["glob:'**/*.py'"]
```

This sets up two separate tools for linting and formatting `.py` files, prefixed with a number to indicate their [execution order](https://jj-vcs.github.io/jj/latest/config/#execution-order-of-tools)[^order]. Both are invoked using `uv run`, but match that to your virtual environment. Here's a breakdown of the other arguments that I pass to `ruff check` and `ruff format`: 

- `--fix`: Apply lint fixes. Without this option, `jj fix` would still run linting but abort on errors.
- `--preview`: Enables some additional rules and fixes.
- `--quiet`: Suppresses linter summary diagnostics that are mostly redundant with those reported by `jj`. If there are unfixable errors, `ruff` will still report those.
- `--stdin-filename=$path`: Passes the name of the file being checked to Ruff so that it can accurately report unfixable errors.
- `-`: This is the **critical option** that tells Ruff to check `stdin` rather than a file.

## Other tools

### Python type checking

Ty [doesn't currently support `stdin`](https://github.com/astral-sh/ty/issues/774) and [Mypy doesn't plan to](https://github.com/python/mypy/issues/12235). While including type checking as a validation step would be nice, it's complicated by the fact that full analysis requires access to the entire project, not just individual files.

### OCaml

This seems to work with `ocamlformat`:

```toml
[fix.tools.ocamlformat]
command = ["ocamlformat", "--name=$path", "-"]
patterns = ["glob:'**/*.ml'", "glob:'**/*.mli'"]
```

Passing `--name` is critical here so that `ocamlformat` knows whether it's working on an implementation or interface file.

### Others

The [`jj` docs](https://jj-vcs.github.io/jj/latest/config/#code-formatting-and-other-file-content-transformations) provide a few more example configurations for `clang-format` and `rustfmt`.

In general, the key to configuring a tool is finding the parameters that 1) accept `stdin`, 2) identify filenames on `stdin`, and 3) emit to `stdout` if that's non-default. 

[^read-only]: Once commits are pushed remotely, `jj` treats them as read-only by default to avoid rewriting shared history. Running `jj fix --ignore-immutable` will allow you to format those commits, if you don't mind force-pushing changes. 

[^order]: Per the [`ruff-pre-commit` README](https://github.com/astral-sh/ruff-pre-commit/blob/3d44372123ca5e8617fdb65d9f11facd159b9e95/README.md?plain=1#L63-L65), linting with `--fix` should be run before formatting.