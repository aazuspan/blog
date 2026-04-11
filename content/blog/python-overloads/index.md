+++
title = "A Deep-ish Dive Into Python Overloads"
date = "2026-04-10T17:09:31.037396"
description = "Figuring out best practices for writing well-typed function overloads through trial-and-error."
tags = ["python", "typing"]
+++

[Overloads](https://docs.python.org/3/library/typing.html#typing.overload) are a powerful tool for defining precise types in a Python package with [polymorphic](https://en.wikipedia.org/wiki/Polymorphism_(computer_science)) functions. Unfortunately, every time I write overloads outside the trivial examples in the [official docs](https://typing.python.org/en/latest/spec/overload.html), it eventually devolves into trial-and-error, tweaking signatures and manually checking calls until things finally look right. The challenge is that there are a lot of ways to define overloads that *mostly* work, but fail or produce unexpected results with the right parameter combination.

I've tried and failed to find a good writeup of overloading best practices in non-trivial cases, so I decided to finally bite the bullet and figure it out for myself. There are definitely people more qualified to write this guide than me -- everything below is extrapolated from the official docs or discovered through experimentation, rather than from a deep understanding of type theory or type checker implementations -- but it was helpful for me, so maybe it will be for someone else.

*If you're in a hurry, you can skip the exploration and jump straight to my [best practices](#my-best-practices).*

## Overloads: the trivial case

Let's start simple and build from there. Imagine we're writing a function `open_file` that takes a path and returns an object for reading or writing to that file, depending on the parameter `mode`.

```python
def open_file(file: str, mode: Literal["r", "w"]) -> Reader | Writer:
    if mode == "w":
        return Writer(file)
    return Reader(file)
```

If you're reading a blog post about overloads, you probably already know the limitation: the function works at runtime, but language servers and type checkers[^pyrefly] will treat the return value as a union of the two types, offering ambiguous completions and complaining if we use methods that don't intersect both types.


```python
reader = open_file("my_file.txt", mode="r")
reveal_type(reader) # Reader | Writer
reader.read()
```

```
ERROR Object of class `Writer` has no attribute `read`
```

To solve that, we write overloads that define the relationship between the input parameter `mode` and the return type: `mode="r"` always returns a `Reader`, and vice-versa. 

```python
from typing import overload 

@overload
def open_file(file: str, mode: Literal["r"]) -> Reader: ...
@overload
def open_file(file: str, mode: Literal["w"]) -> Writer: ...

...
```

Our call matches the first overload, the return type narrows from `Reader | Writer` to just `Reader`, and type checks turn green. Problem solved, blog post over!

```python
reader = open_file("my_file.txt", mode="r")
reveal_type(reader) # Reader
reader.read()
```

```
INFO 0 errors
```

## Overloading optional parameters

Okay, let's try one more thing. Say you decide to make `mode` optional and return a `Reader` by default.

```python
def open_file(file: str, mode: Literal["r", "w"] = "r") -> Reader | Writer:
    ...
```

We already defined an overload for `mode="r" -> Reader`, so the type checker will read the default from the implementation and match accordingly, right?

```python
reader = open_file("file")
reveal_type(reader) # Any
```

```
ERROR No matching overload found for function `open_file` called with arguments: (Literal['file']) [no-matching-overload]

  Possible overloads:
  (file: str, mode: Literal['r']) -> Reader [closest match]
  (file: str, mode: Literal['w']) -> Writer
```

Nope. Once overloads are defined, the implementation becomes invisible to type checkers. 

> Only the overloads ... should be considered for matching purposes. The implementation, if provided, should be ignored for purposes of overload matching.  
> -- [typing.python.org](https://typing.python.org/en/latest/spec/overload.html#overload-call-evaluation)

Our existing overloads only cover the explicit cases of `mode`. To match a call without a `mode` argument, we either need to add a new overload or modify the existing overloads. 

Let's try adding a new overload.

### Defining partial overloads

If you look at [the type stubs for the Python standard library](https://github.com/python/typeshed), you'll see a lot of overloads that omit an optional parameter, allowing a call like `getattr(foo, "bar")` to provide a different signature than `getattr(foo, "bar", "baz")`.

```python
@overload
def getattr(o: object, name: str, /) -> Any: ...
@overload
def getattr(o: object, name: str, default: None, /) -> Any | None: ...
```

It's tempting to do the same for `open_file` by adding a third overload that omits `mode`, like so.

```python
@overload
def open_file(file: str) -> Reader: ...
@overload
def open_file(file: str, mode: Literal["r"]) -> Reader: ...
@overload
def open_file(file: str, mode: Literal["w"]) -> Writer: ...
```

However, while type checks now pass, this probably isn't the best choice for this function for a couple reasons.

The first and most obvious is that it requires an extra overload. With a single overloaded parameter that's not a big deal, but with multiple parameters you can end up with a combinatorial explosion[^how-many-overloads] of boilerplate.

The other issue, I would argue, is that it's suggesting a change in behavior that doesn't exist. When you omit the `default` parameter to `getattr`, missing attributes turn into runtime errors; there's a meaningful difference between the two overloads. That's not the case for `open_file`, which returns the same `Reader` whether or not you specify `mode="r"`.

There *are* valid reasons to use this strategy, but it's just not a great fit for this use case.

### Adding explicit defaults

If we don't want to add a new overload, we'll have to modify our existing overloads. We can do that by including the explicit default value for `mode` in the matching overload.

```python
@overload
def open_file(file: str, mode: Literal["r"] = "r") -> Reader: ...
@overload
def open_file(file: str, mode: Literal["w"]) -> Writer: ...
```

This also satisfies type checking, and actually matches [the overloads for the built-in `open`](https://github.com/python/typeshed/blob/f510e6cf4eff6faa3f6f2aa5a4ff944c522c8fad/stdlib/builtins.pyi#L1715-L1725) in the Python type stubs.

The downside of this approach appears when you start adding more optional parameters to the function. For example, imagine `open_file` took another parameter `lazy` immediately before `mode`. Python syntax doesn't allow required parameters to follow optional parameters, so our second overload with no default `mode` becomes a syntax error.

```python
@overload
def open_file(file: str, lazy: bool = False, mode: Literal["r"] = "r") -> Reader: ...
@overload
def open_file(file: str, lazy: bool = False, mode: Literal["w"]) -> Writer: ...
```
```
SyntaxError: parameter without a default follows parameter with a default
```

You could solve that by making your parameters [keyword-only](https://peps.python.org/pep-3102/), since order then becomes irrelevant, but if this is an existing codebase, that's a substantial breaking change.

What about using the same explicit default of `mode = "r"` for both overloads? That solves the syntax error and matches the runtime behavior, but it introduces another type checking error, since `Literal["w"] = "r"` is clearly nonsense.

```python
@overload
def open_file(file: str, lazy: bool = False, mode: Literal["r"] = "r") -> Reader: ...
@overload
def open_file(file: str, lazy: bool = False, mode: Literal["w"] = "r") -> Writer: ...
```
```
ERROR Default `Literal['r']` is not assignable to parameter `mode` with type `Literal['w']`
```

Okay, if we need to specify a default value and it *must* be compatible with `Literal["w"]`, why not just use `"w"` as the default value in that overload? Let's try that.

```python
@overload
def open_file(file: str, lazy: bool = False, mode: Literal["r"] = "r") -> Reader: ...
@overload
def open_file(file: str, lazy: bool = False, mode: Literal["w"] = "w") -> Writer: ...
```

No syntax error and no type checking errors, but we've set up a subtle typing bug that will only appear with a future refactor, when we decide that we'd rather define the `Writer` overload first. Let's swap those two definitions around and see what happens.

```python
@overload
def open_file(file: str, lazy: bool = False, mode: Literal["w"] = "w") -> Writer: ...
@overload
def open_file(file: str, lazy: bool = False, mode: Literal["r"] = "r") -> Reader: ...

reader = open_file("file")
reveal_type(reader) # Writer
reader.read()
```
```
ERROR Object of class `Writer` has no attribute `read`
```

It works at runtime, but static analysis is failing again. Since both overloads treat `mode` as optional, they both match the call, and the [overload evaluation rules](https://typing.python.org/en/latest/spec/overload.html#step-6) break ties based on the order of overload definitions. `open_file` with no `mode` argument now appears to return a `Writer`, contradicting the actual runtime behavior. If you're lucky, you'll see a type error in your test code. If not, your API now lies about its types.

### Using placeholders for non-default overloads

Let's take a step back, swap the overload order, and replace the contradictory default value for `Literal["w"]` with a placeholder value `...`.

```python
@overload
def open_file(file: str, lazy: bool = False, mode: Literal["r"] = "r") -> Reader: ...
@overload
def open_file(file: str, lazy: bool = False, mode: Literal["w"] = ...) -> Writer: ...
```

This has a few clear advantages.

1. We avoid contradicting the actual function signature with `Literal["w"] = "w"`, which creates a misleading suggestion about runtime behavior.
1. By providing an explicit value in the first overload and a placeholder in the non-default case, there's a visible clue to maintainers about the correct overload order.

While swapping the order of overloads still breaks the default return type, [pyrefly](https://pyrefly.org/) will now recognize this for the error it is before we ever call the function, making it much harder to accidentally ship broken types.

```python
@overload
def open_file(file: str, lazy: bool = False, mode: Literal["w"] = ...) -> Writer: ...
@overload
def open_file(file: str, lazy: bool = False, mode: Literal["r"] = "r") -> Reader: ...
```
```
ERROR Default `Literal['r']` from implementation is not assignable to overload parameter `mode` with type `Literal['w']`
```

Interestingly, [mypy](https://mypy.readthedocs.io/) and [ty](https://docs.astral.sh/ty/) follow the official guidance to ignore implementations more closely, and won't recognize that as an error, so that advantage will depend on your tooling.

## Overloading multiple parameters

So far, we've only looked at overloads where the return type depends on a single parameter. Luckily, extending this to multiple overloaded parameters is mostly just a question of adding more overloads[^how-many-overloads] in the correct order.

Ignoring the question of whether polymorphism is actually the right choice, let's imagine that `open_file` now returns a different type of reader or writer depending on the `lazy` parameter.

```python
def open_file(
    file: str, lazy: bool = False, mode: Literal["r", "w"] = "r"
) -> EagerReader | LazyReader | EagerWriter | LazyWriter:
    if mode == "w":
        return LazyWriter(file) if lazy else EagerWriter(file)
    return LazyReader(file) if lazy else EagerReader(file)
```

Just like with a single parameter, the first overload mirrors the  runtime behavior, with explicit default values for clarity. The subsequent overloads match the other three possible parameter combinations, defined in the order that they should be matched (default overloads first), and using placeholder values for safety.

```python
@overload
def open_file(
    file: str, lazy: Literal[False] = False, mode: Literal["r"] = "r"
) -> EagerReader: ...
@overload
def open_file(
    file: str, lazy: Literal[False] = ..., mode: Literal["w"] = ...
) -> EagerWriter: ...
@overload
def open_file(
    file: str, lazy: Literal[True] = ..., mode: Literal["r"] = ...
) -> LazyReader: ...
@overload
def open_file(
    file: str, lazy: Literal[True] = ..., mode: Literal["w"] = ...
) -> LazyWriter: ...
```
```python
reader = open_file("file")
reveal_type(reader) # EagerReader
reader.read()
```
```
INFO 0 errors
```

## Testing your types

It's easy to write overloads, forget about them, and discover later that they've mysteriously broken during some refactor or parameter shuffle. Even with good test coverage and type checking, there are a lot of ways that types can break without showing up in ordinary static analysis[^static-analysis].

To avoid those type regressions, the [Python typing docs](https://typing.python.org/en/latest/reference/quality.html#testing-using-assert-type-and-warn-unused-ignores) suggest writing explicit type checking cases that use [`assert_type`](https://docs.python.org/3/library/typing.html#typing.assert_type) to confirm expected return types. Some projects place the checks in a [separate `type_checking` directory](https://github.com/stereobutter/reddish/blob/cb7324750a2e0fe5316722cd0c8241b0bbc1f4ef/type_checking/check_async_redis.py), or within the [existing test directory](https://github.com/RedHatQE/Sentaku/blob/main/testing/check_types.py), or [alongside the package source](https://github.com/python/typeshed/blob/6180fa03bd46ea01527199d2013ccd9fd9a4f61e/stdlib/%40tests/test_cases/builtins/check_round.py) (`assert_type` is ignored at runtime, so it can even be placed inline)[^standards]. The only important thing is that the checks are visible to the type checker.

For `open_file`, we can write a type assertion for each distinct parameter combination (implicit and explicit), and feel confident that our carefully crafted return types won't change unexpectedly in the future.

```python
from typing import assert_type

# Default case -> EagerReader
assert_type(open_file("file"), EagerReader)
assert_type(open_file("file", mode="r"), EagerReader)
assert_type(open_file("file", lazy=False), EagerReader)
assert_type(open_file("file", lazy=False, mode="r"), EagerReader)

# mode="w" -> EagerWriter
assert_type(open_file("file", mode="w"), EagerWriter)
assert_type(open_file("file", mode="w", lazy=False), EagerWriter)

# lazy=True -> LazyReader
assert_type(open_file("file", lazy=True), LazyReader)
assert_type(open_file("file", lazy=True, mode="r"), LazyReader)

# lazy=True, mode="w" -> LazyWriter
assert_type(open_file("file", lazy=True, mode="w"), LazyWriter)
```
```
INFO 0 errors
```

## My "best practices"

There are a lot of ways to write overloads, and I won't pretend that this is the definitive guide. If there are better ways I didn't explore, or limitations I didn't recognize, I'm happy to update the post.

But in the interest of having a short, easy reference when writing overloads, here are my somewhat-opinionated "best practices":

1. Don't write multiple overloads for the same behavior. If `foo()` and `foo(bar=False)` behave identically, use one overload with a default value for `bar`, rather than a separate overload without `bar`.
1. Don't write overloads that contradict runtime default behavior. If `bar=False` in the implementation, use a placeholder `bar: Literal[True] = ...` instead of `bar: Literal[True] = True` or `bar: Literal[True]`. This avoids a confusing signature and allows new default parameters to be added later.
1. Define overloads in the order that they should match. Optional parameters should be overloaded with their default value first so that a function call that omits that parameter matches the runtime behavior.
1. Use typing tests to catch regressions in your types.


[^pyrefly]: I'm using [pyrefly](https://pyrefly.org/) throughout, but you'll get similar results with [mypy](https://mypy.readthedocs.io/) and [ty](https://docs.astral.sh/ty/) in *almost* every case.

[^how-many-overloads]: The number of overloads required by a function is the product of the number of unique overloaded values for each overloaded parameter. For example, a function with two overloaded boolean parameters has 2 X 2 = 4 total overloads. If you define separate overloads for omitting optional parameters, that adds another possible state for each parameter.

[^static-analysis]: For example, the type errors we saw after making `mode` optional only surfaced because we intentionally called without that argument. If we'd modified the parameter without changing any test code, we wouldn't have seen any warning of the broken overload.

[^standards]: `assert_type` was only added in Python 3.11, so we'll probably have to wait to see what becomes the "standard" approach for organizing typing tests. The docs only suggest "a dedicated directory like `typing_tests`".