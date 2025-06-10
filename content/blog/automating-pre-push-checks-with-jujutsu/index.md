+++
title = "Automating Pre-Push Checks with Jujutsu"
date = "2025-06-08T11:44:20.110741"
description = "Fake Git hooks in jj using pre-commit and aliases."
tags = ["jj"]
+++

I spent a few hours this weekend trying out the [Jujutsu](https://github.com/jj-vcs/jj) version-control system and I never want to use `git` again. `jj` manages to strip out the sharp edges of version control -- progress-killing merge conflicts, manual rebases, and mazes of subcommands -- without sacrificing capability, and the focus on flexible, iterative commits just **makes sense** to me. I'm a big fan.

Because it works alongside `git` in existing repos, I can switch to `jj` in most of my projects without impacting other contributors -- perfect. Most of the features that are [currently missing](https://jj-vcs.github.io/jj/latest/git-compatibility/#supported-features), like LFS and submodules, are ones that I rarely touch. Except for one: **Git hooks**.

I use hooks via [`pre-commit`](https://pre-commit.com/) in most of my Python projects to lint, format, and type-check changes locally before the code hits CI. Using a project-level config with an isolated environment keeps everyone running the same tools with the same settings, without having to wait for and debug remote workflows. Support for hooks in `jj` is [being discussed](https://github.com/jj-vcs/jj/issues/405), but looks like it's still a ways off, and my Rust is too shaky to consider contributing such a big feature.

So instead, I decided to try hacking together a usable version of hooks around the existing functionality of `jj`. I'm not looking for anything elegant or scalable; I just need a bandaid so I can keep using `jj` while I wait for official hook support. Below is a (polished) version of my exploration into triggering pre-commit and pre-push hooks with `jj` in a Python project.


## Project setup

To start off, I set up a Python project using [uv](https://github.com/astral-sh/uv). `pre-commit` requires a Git repository, so I let `uv init` create that and used the `--colocate` option to put `jj` in control of it.

```bash
uv init
jj git init --colocate
uv add --dev pre-commit
uv run pre-commit install
```

Next, I added a `.pre-commit-config.yaml` file in the project root with a single hook to run linting:

```yaml
repos:
- repo: https://github.com/astral-sh/ruff-pre-commit
  rev: v0.11.13
  hooks:
    - id: ruff-check
      args: [ --fix ]
```

After making an quick initial commit, here's the repository state:

```
$ jj commit -m "init"
$ jj log
@  lwwnsoxy user@email.com 2025-06-08 21:48:43 58033c27
│  (empty) (no description set)
○  qmkvvywt user@email.com 2025-06-08 21:46:57 git_head() ac956bae
│  init
◆  zzzzzzzz root() 00000000
```

To test that everything's working as expected, I updated the boilerplate `hello.py` file by changing the message, while "accidentally" leaving behind an unused import that should be caught by the lint check.

```diff
+ import os
+ 
+ 
def main()
-    print("Hello from jj-precommit!")
+    print("Hello world!")
```

And just as expected, manually running `pre-commit` finds and fixes my error, preserving the valid change.

```bash
$ uv run pre-commit run --all-files
ruff check...............................................................Failed
- hook id: ruff-check
- files were modified by this hook

Found 1 error (1 fixed, 0 remaining).
```

That's great *if* I remember to run the check. If I don't, `jj` happily commits the un-linted file without triggering any checks, setting up a CI failure when I eventually push to the remote.

```bash
$ echo "import os" >> hello.py
$ jj commit -m "hello world"
Working copy  (@) now at: yotumzzs 0763dbbe (empty) (no description set)
Parent commit (@-)      : lwwnsoxy 3338774d hello world
```

I undid the bad commit (have I mentioned how much I like `jj`?) and starting poking around the docs for a solution.

```bash
jj undo
```

## Creating an `commit` alias

The simplest way to avoid making a commit without running checks is to just use a command that does both, so that's what I decided to do. You could alias `jj commit` at the shell-level to prevent commits without checks (sort of -- more on that later), but for now I opted for a more targeted approach taking advantage of Jujutsu's built-in [alias system](https://jj-vcs.github.io/jj/latest/config/#aliases).

With aliases, you can define your own `jj` subcommands at the user or repo level, including arbitrary code execution via `jj util exec`. Running `jj config edit --repo` opens the configuration file, where I added a new `commit-with-checks` command that simply runs `pre-commit` followed by the commit itself, if the checks pass:

```toml
[aliases]
commit-with-checks = ["util", "exec", "--", "bash", "-c", """
set -euo pipefail
uv run pre-commit run
jj commit "$@"
""", ""]
```

Unfortunately, this will never actually check anything.

### Finding "staged" files

By default, `pre-commit run` checks your staged files, but **`jj` doesn't stage files**. Jujutsu avoids the complexity of managing an index and staging files by automatically throwing changes into a commit known as the working copy. With nothing staged, `pre-commit` doesn't know what to check unless you tell it what to check. So let's do that.

The heavy-handed approach would be to throw `--all-files` at this, running checks against the entire repo every commit, but that's obviously not ideal. Instead, I opted for a *medium*-handed approach, passing a list of changed files to `pre-commit` via the `--files` argument. This is still a little imprecise since we might only commit *part* of a changed file, but I'll revisit that later.

To get the file list dynamically, I ran `diff` on the working copy (`@`) with the `--name-only` flag:

```bash
>>> jj diff --name-only -r @
hello.py
```

I passed that list through to `pre-commit run --files` using `xargs`, giving the final pre-commit + commit command:

```toml
[aliases]
commit-with-checks = ["util", "exec", "--", "bash", "-c", """
set -euo pipefail
jj diff --name-only -r @ | xargs uv run pre-commit run --files
jj commit "$@"
""", ""]
```

Running the custom commit alias triggers the check, fails to lint, and aborts the commit, just like it should.

```bash
$ jj commit-with-checks -m "hello world"
ruff check...............................................................Failed
- hook id: ruff-check
- files were modified by this hook

Found 1 error (1 fixed, 0 remaining).
```

The check also fixes the unused import in the working copy, so re-running the commit passes the check and succeeds!

```bash
$ jj commit-with-checks -m "hello world"
ruff check...............................................................Passed
Working copy  (@) now at: yotumzzs 0763dbbe (empty) (no description set)
Parent commit (@-)      : lwwnsoxy 3338774d hello world
```

Getting pre-commits working with `jj` seems like the perfect time to start thinking about whether pre-commits are a good idea in `jj`. And I'm not convinced they are.

### The problem with pre-*commits*

Using pre-commit checks makes sense in Git where the typical workflow is to make changes, commit those changes, make more changes, and finally push them all in a branch. In `jj`, commits feel much more fluid -- they're created dynamically as files are changed, and automatic rebasing means I'm much more likely to reorganize and edit old commits until there's a revision set that's ready to push. In that context, running checks on each commit feels a little like *fighting* the VCS, rather than working with it. I also started to worry about missing checks as commits are created and modified with other commands like `jj describe` and `jj squash`.

For my workflow where I want to catch lint errors before hitting CI checks, it makes more sense to run checks pre-*push*. That means there's just one place to run checks, and it re-enables the flexibility of `jj` to freely modify commits as you work.

Luckily, I should be able to repurpose most of the `commit-with-checks` command for a `push-with-checks` command.

## Creating a `push` alias

### Setting up a remote

Before implementing anything, I set up everything I'd need to test a pre-push hook: I made a Github repo, pointed `jj` to it, created a `main` bookmark at the last commit, and pushed the pre-linted code.

```bash
jj git remote add origin git@github.com:aazuspan/jj-precommit.git
jj bookmark create main -r @-
jj git push --allow-new
```

Now that the local and remote are synced, I made another set of changes with some lint included, this time in the form of an unneeded f-string.

```diff
+ def hello()
+    print(f"Hello world")
+ 
+
def main()
-    print("Hello world!")
+    hello()
```

Next, I committed the change (without checks) and moved the bookmark forward to get ready to push. Here's the current repository state, including the un-linted commit.

```bash
$ jj commit -m "hello function"
$ jj bookmark set main -r @-
$ jj log -r ..
@  rmkunksp user@email.com 2025-06-09 10:36:43 bbaf4fde
│  (empty) (no description set)
○  twpxovmz user@email.com 2025-06-09 10:36:43 main* git_head() dbb39f24
│  hello function
◆  lwwnsoxy user@email.com 2025-06-09 00:11:59 main@origin 20342c36
│  hello world
◆  qmkvvywt user@email.com 2025-06-08 23:46:57 ac956bae
│  init
~
```

All that's left is to set up the pre-push hook to prevent committing the dirty code to the remote.


### Refining the "staged" refs

The push command should look a lot like the commit command with one exception: the file list. First of all, we can't just look at the changes in the working copy, since we might push multiple commits at once. But rather than just expanding the revset to include *all* the changed files, I decided to try tackling the limitation that I mentioned earlier: having to check entire files. To allow pushing partially committed files, checks should really be run on revisions rather than files, which should be doable with the `--from-ref` and `--to-ref` arguments in `pre-commit`. 

To get the relevant refs from `jj`, I came up with the following `log` command that shows all revisions between the remote and local bookmarks (branches), using a [custom template](https://jj-vcs.github.io/jj/latest/templates/) to report just the commit IDs:

```bash
$ jj log --no-graph -r "remote_bookmarks(remote=origin)-..bookmarks()" -T 'commit_id ++ "\n"'
dbb39f241ed4e40a63127f67c6c34a16c84e2cfe
20342c364b220ff4a9b9c7eb2f7000458908657a
```

With some Bash magic, I extracted the first and last commits from the output, where they can be passed as arguments to `pre-commit`:

```bash
read to_ref from_ref < <(
  jj log -r "remote_bookmarks(remote=origin)-..bookmarks()" --no-graph -T "commit_id ++ '\n'" | 
  awk "NR==1 {first=$0} {last=$0} END {print first, last}"
)
```

Swapping that into the commit alias gives the following push alias:

```toml
[aliases]
push-with-checks = ["util", "exec", "--", "bash", "-c", """
set -euo pipefail
read to_ref from_ref < <(
  jj log -r 'remote_bookmarks(remote=origin)-..bookmarks()' --no-graph -T 'commit_id ++ "\n"' | 
  awk 'NR==1 {first=$0} {last=$0} END {print first, last}'
)
uv run pre-commit run --from-ref "$from_ref" --to-ref "$to_ref"
jj git push "$@"
""", ""]
```

Attempting to run `jj push-with-checks` triggers linting, which fails as expected:

```
Running pre-commit checks...
ruff check...............................................................Failed
- hook id: ruff-check
- files were modified by this hook

Found 1 error (1 fixed, 0 remaining).
```

Running a `diff` command shows that the lint fix was applied to the working copy. This is equivalent to the Git workflow where fixes applied to staged files need to be staged, and I resolved it by squashing the fix into the previous commit:

```bash
$ jj diff --stat -r "bookmarks(main)..@"
hello.py | 2 +-
1 file changed, 1 insertion(+), 1 deletion(-)
$ jj squash
```

Running the push command again succeeds, updating the remote with our linted commit:

```
$ jj squash
$ jj push-with-checks
Running pre-commit checks...
ruff check...............................................................Passed
Pre-commit passed. Running jj git push "$@"...
Changes to push to origin:
  Move forward bookmark main from 20342c364b22 to dbb39f241ed4
remote: Resolving deltas: 100% (1/1), completed with 1 local object.
```

## We're done (?)

It works! Mostly. I expect to find more limitations and edge cases once I start using `push-with-checks` in real projects, but here are the ones I'm aware of so far:

1. It always assumes you're pushing to `origin` (if you use a different remote, it'll check the wrong refs).
1. It's only designed to push a single bookmark (if you push more than one, it'll check the wrong refs).
1. You still have to remember to use it.

The first two could be fixed with some more code, but I'm already pushing my knowledge of (and patience with) Bash, so I'll save that improvement for later - maybe I'll eventually turn this into a Python script that wraps around `jj` and `pre-commit`. The third limitation could be solved by making an alias for `jj git push` in my shell, but for now I want to leave that command untouched in case I need to work around limitations 1 and 2.

Despite the rough edges, I think this should be a usable bridge between `jj` and `pre-commit` that gets me through to official hook support, whenever that comes. 
