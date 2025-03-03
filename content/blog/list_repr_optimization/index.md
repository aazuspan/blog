+++
title = "Optimizing Long List Labeling in eerepr"
tags = ["til", "earth-engine", "python"]
date = "2025-02-23"
description = "Generating reprs 20% faster by predicting stringified list lengths."
+++


[eerepr](https://github.com/aazuspan/eerepr) is a Python package I wrote that generates HTML reprs for Earth Engine objects, converting JSON data to trees that can be navigated in a Jupyter notebook. 


Large objects representing tens of MBs of JSON with thousands of nested elements aren't uncommon, so the last few months I've been focusing on performance optimizations within the HTML conversion process to speed up repr generation. This post details some successful and some unsuccessful experiments with optimizing the conversion of long JSON lists to HTML.

## Optimizing List Labels

### The Naive Approach

`eerepr` displays list objects in HTML as a collapsible `detail` tag with the node label as the `summary`. The node label (which I'm focusing on here) displays the list contents inline *unless* that would exceed 50 characters, in which case it's truncated to `List (n elements)`.

<link rel="stylesheet" href="style.css">
<div style="display: flex;">
    <div class="eerepr" style="flex: 50%; margin: 10px;">
<li><details><summary>[1, 2, 3, 4, 5, 6, 7]</summary><ul><li><span class='ee-k'>0:</span><span class='ee-v'>1</span></li><li><span class='ee-k'>1:</span><span class='ee-v'>2</span></li><li><span class='ee-k'>2:</span><span class='ee-v'>3</span></li><li><span class='ee-k'>3:</span><span class='ee-v'>4</span></li><li><span class='ee-k'>4:</span><span class='ee-v'>5</span></li><li><span class='ee-k'>5:</span><span class='ee-v'>6</span></li><li><span class='ee-k'>6:</span><span class='ee-v'>7</span></li></ul></details></li>
    </div>
    <div class="eerepr" style="flex: 50%; margin: 10px;">
<li><details><summary>List (7 elements)</summary><ul><li><span class='ee-k'>0:</span><span class='ee-v'>one</span></li><li><span class='ee-k'>1:</span><span class='ee-v'>two</span></li><li><span class='ee-k'>2:</span><span class='ee-v'>three</span></li><li><span class='ee-k'>3:</span><span class='ee-v'>four</span></li><li><span class='ee-k'>4:</span><span class='ee-v'>five</span></li><li><span class='ee-k'>5:</span><span class='ee-v'>six</span></li><li><span class='ee-k'>6:</span><span class='ee-v'>seven</span></li></ul></details></li>
    </div>
</div>


My original, naive implementation of the rule simply stringified the list, checked its string length, and set the label accordingly.

```python
MAX_INLINE_LENGTH = 50

def list_to_html(l: list) -> str:
    n = len(l)
    serialized = str(l)
    node_label = serialized if len(serialized) < MAX_INLINE_LENGTH else f"List ({n} elements)"
    ...
```

This works, but it's pretty inefficient in some cases -- an object may contain lists with thousands of elements representing millions of characters, and converting to string isn't free. Ideally, we would only stringify lists when they're short enough to display inline. But how can we predict if a stringified list will be too long *without* stringifying it?

### Maximum List Length

Counting the elements in a list is a lot faster than converting it to a string, so let's start there. Obviously a list with more than 50 elements will be more than 50 characters, but there are also brackets, comma delimiters, and whitespace between elements to consider. It works out that the minimum string length of a non-empty list with $n$ elements is just $3n$: for each element there will be *at least* three characters in the stringified form.

```python
"[1]"
 ... # 3 chars
"[1, 2]"
 ...... # 6 chars
"[1, 2, 3]"
 ......... # 9 chars
```

With that, we can compare the minimum possible string length of each list against the 50 character limit and skip stringifying if we're guaranteed to exceed it.

We'll save a few CPU cycles by flipping that equation around, pre-calculating the maximum number of elements in a list as `50 // 3` and just comparing the length of each list to that threshold. If a list has more than 16 elements, we *know* that it should be truncated without needing to cast any strings.

```python
MAX_INLINE_LENGTH = 50
MAX_LIST_LENGTH = MAX_INLINE_LENGTH // 3

def list_to_html(l: list) -> str:
    n = len(l)

    node_label = (
        f"List ({n} elements)"
        if n > MAX_LIST_LENGTH or len(serialized := str(l)) > MAX_INLINE_LENGTH
        else serialized
    )
    ...
```

Most lists aren't going to contain only single-digit integers, so this is a conservative estimate of string length. A list with a small number of very large elements would still need to be stringified before it could be truncated, unless...

### Stringifying Iteratively

Instead of stringifying the entire list at once, we could stringify each element one-by-one and keep track of the total length. If the character limit is exceeded after stringifying the third element, there's no need to stringify the remaining 13 elements -- we can immediately fall back to the truncated list label.

I experimented with a few different implementations using string concatenation and a `StringIO` buffer, but found the fastest solution for iteratively stringifying was to build and join a list of string elements.

```python
MAX_INLINE_LENGTH = 50

def list_to_html(l: list) -> str:
    n = len(l)
    # Pre-count start and end brackets
    str_len = 2 
    str_elements = []
    truncate = False
    for i, element in enumerate(l):
        # Count separators between elements
        if i != 0:
            str_len += 2
        
        # Stringify each element iteratively
        str_elements.append(str_element := str(element))
        str_len += len(str_element)

        if str_len > MAX_INLINE_LENGTH:
            truncate = True
            break

    node_label = f"List ({n} elements)" if truncate else "[" + ", ".join(str_elements) + "]"
    ...
```

Compared to a simple `str(l)` call that's [internally implemented in C](https://github.com/python/cpython/blob/7afa476874b9a432ad6dbe9fb3e65d62f2999f88/Objects/listobject.c#L547), there's a lot of overhead here building lists and looping, but hopefully that should be outweighed by skipping stringification for some large objects.

Only one way to find out for sure.

## Results

### Benchmarking

Using a real-world image collection with 250 images comprising 2.3 MB of JSON and lots of nested lists, I measured the full HTML conversion time for each of the optimization strategies against the naive approach.

{{<figure src="results.png" caption="Time to generate an HTML repr for a 250-image collection, relative to the naive list label implementation.">}}

Iterative stringification alone yielded a respectable 11% speedup, but list length optimization is the clear winner, generating HTML **20% faster** than the naive implementation. Interestingly, both optimizations together were slower than list length alone. That's not a complete surprise given the expected overhead of the iterative approach, but I decided to dive into the dataset to figure out exactly what's going on.

### A Closer Look at the Data

Looking at the string-length distribution for the ~17k lists included in the benchmark collection, only about 3% exceed the 50 character limit and get truncated. The remaining 97% still need to be stringified. So how are we cutting 20% off our processing time? Outliers.

The largest of those truncated lists is the full image list with 250 elements, which stringifies to over **2 million characters**. Both optimizations avoid most or all of the ~40ms stringification time for that monster list, which explains the majority of the time savings.

Why didn't iterative stringification do better than list length? We know that list length is a conservative estimate of string length that will end up stringifying some lists that are ultimately too long to include, but how often does that really happen?

Of the 503 truncated lists, 501 could be truncated based on just list length. In other words, iterative stringification only avoided *two* more lists than just checking list length, and added overhead for the remaining ~17k cases.

## Final Thoughts

For me, this exercise was a good reminder to make sure you understand the data you're optimizing for. Iterative stringification might be the best choice if you're always working with small lists of *huge* elements, but that turns out to be an uncommon case for `eerepr`. List length optimization does as well or better with a typical dataset, and is practically free even in the worst case[^worst-case].

You can `pip install eerepr>=0.1.1` for a 20% speed improvement with large collections.

[^worst-case]: I tested each approach with 10k short lists that didn't require truncation. Iterative stringification was 26% slower than the naive implementation, while the list length check added zero measurable overhead.