+++
title = "Type Safety and Non-Empty Tuples in Python"
date = "2024-08-28"
description = "Taking inspiration from Haskell to write better code with fewer bugs in Python."
tags = ["python", "typing"]
+++

Say you're writing a typed Python package with a function `head` that takes a generic tuple and returns the first element. How do you implement it for type safety? Below, we'll take inspiration from Alexis King's [*Parse, Don't Validate*](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/) blog post[^read-it] and statically typed languages like Haskell and OCaml to help us avoid potential runtime errors in Python.

## The Naive Solution

Let's just return the first element[^type-vars]:

```python
def head(t: tuple[T, ...]) -> T:
    return t[0]
```

Of course, the first time we accidentally pass an empty tuple, we get a runtime error.

```python
t = tuple()
h = head(t)

"""
IndexError: tuple index out of range
"""
```

What about...

## Relaxing the Return Type

Not every tuple *has* a first element, so let's just return `None` if they don't.

```python
def head(t: tuple[T, ...]) -> T | None:
    return t[0] if t else None
```

That solves our immediate issue, but now we're forced to check for `None` everywhere that `head` is used to avoid runtime errors and satisfy our type checker[^mypy].

```python
t = tuple()
h = head(t)

if h is not None:
    ...
```

Definitely not ideal.

## The Non-Empty Tuple

Instead of making our return type more ambiguous, let's make our parameter `t` more specific. Python doesn't have any kind of built-in type for non-empty sequences, but we can create our own using [`typing.Unpack`](https://docs.python.org/3/library/typing.html#typing.Unpack)[^unpack]:

```python
NonEmptyTuple = tuple[T, Unpack[tuple[T, ...]]]
```

`NonEmptyTuple` is an alias for a tuple with one element *plus* zero or more other elements[^haskell]. Now trying to pass an empty tuple to `head` will be caught during static analysis:

```python
def head(t: NonEmptyTuple[T]) -> T:
    return t[0]

t = tuple()
h = head(t)

"""
error: Incompatible types in assignment...
"""
```

We're also protected against *possibly* empty tuples created by slicing a non-empty tuple:

```python
t: NonEmptyTuple[int] = (1, 2, 3)
h = head(t[5:])

"""
error: Ambiguous slice of a variadic tuple
"""
```

Even lying about our type won't fool the static checks:

```python
t: NonEmptyTuple[int] = tuple()
h = head(t)

"""
error: Incompatible types in assignment...
"""
```

With that, we've created a type system where our static type checker prevents any runtime errors from empty tuples that are known at analysis time, but there's still one flaw...

## Validating the Non-Empty Tuple

We rarely have access at analysis time to all of the data our program will encounter at run time. Whether we're loading data from disk, accepting user input, or parsing network responses, we need to be prepared for incompatible data at runtime, and fail gracefully.

To demonstrate, let's say we write a function that globs a directory for Python files and returns a tuple of paths:

```python
def get_python_files(dir: Path) -> NonEmptyTuple[Path]:
    return tuple(dir.glob("*.py"))

t = get_python_files()
h = head(t)
```

If we were still annotating everything with `tuple`, this would pass static checking and set us up for an unexpected error when we encounter an empty directory. Now, we can't continue without validating that we are, in fact, returning a non-empty tuple. Validation can come in the form of a [`typing.TypeGuard`](https://docs.python.org/3/library/typing.html#typing.TypeGuard) check, which forces us to explicitly handle an empty tuple:

```python
def is_non_empty(t: tuple[T, ...]) -> TypeGuard[NonEmptyTuple[T]]:
    return len(t) != 0

def get_python_files() -> NonEmptyTuple[Path]:
    t = tuple(dir.glob("*.py"))
    if not is_non_empty(t):
        raise ValueError("No scripts found!")
    
    return t

t = get_python_files()
h = head(t)
```

With a few lines of extra code, we've effectively made it impossible to write an entire class of runtime bug. 

## Final Thoughts

### Type Safety

Building type safety into Python code may take a little more work than in Haskell or OCaml with their built-in type checking and inference, but it is possible to get a lot of the same guarantees by using type checkers and modern typing features.

### Non-Empty Lists

Mutable data structures like `list` throw a wrench into our type safety guarantees. What happens if we validate a non-empty list and then `pop` the first element off? The mutation happens in-place, so we now have a list that *looks* non-empty but might not be. Better to convert a list to an immutable tuple if you need to guarantee its size.

### Parse, Don't Validate?

I didn't want to rehash Alexis King's blog post[^read-it], but if you've already read it, you might recognize that `get_python_files` effectively includes a parser by converting the unknown-length output of `glob` to a `NonEmptyTuple`. If we were expanding this, we would probably want to separate out the parsing into a reusable function.

[^read-it]: Highly recommended reading if you want to [dive deeper](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/) into the ideas of type safety!

[^mypy]: I'm using [Mypy](https://mypy-lang.org/) throughout, but I think [Pyright](https://github.com/microsoft/pyright) should give similar results.

[^type-vars]: If you're not familiar with the `tuple[T]` syntax, `T` is a [`typing.TypeVar`](https://docs.python.org/3/library/typing.html#typing.TypeVar) that represents a generic type that's shared between the parameter and the return. In other words, `head` could be called on a tuple of strings to return a string, a tuple of ints to return an int, etc. The annotation `tuple[T, ...]` indicates a tuple with zero-or-more elements of the same type.

[^unpack]: `typing.Unpack` was introduced in 3.11, but is available retroactively from [typing-extensions](https://typing-extensions.readthedocs.io/en/latest/).

[^haskell]: This definition of non-empty is the same as what's [built into Haskell](https://hackage.haskell.org/package/base-4.20.0.1/docs/Data-List-NonEmpty.html) 