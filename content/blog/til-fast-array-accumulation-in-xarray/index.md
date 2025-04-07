+++
title = "TIL: Fast Array Accumulation in Xarray"
tags = ["python", "til", "benchmarking"]
description = "Benchmarking different methods to accumulate a large array from chunks using Xarray."
date = "2025-04-06"
+++

I'm working on a project[^viewshed] that requires splitting a large raster into a few thousand overlapping chunks and iteratively processing and accumulating each result into an output raster. After finding my naive Xarray implementation for accumulating results was painfully slow, I decided to spend some time benchmarking different approaches. Below, I go through three different strategies that ultimately reduced processing time from a couple hours to a few minutes.

## Using an Outer Arithmetic Join

By default, adding together two `DataArray` objects with different coordinates computes the sum of their *intersection* rather than their union; the output will have the extent of the smaller raster.

{{<figure src="inner_join.png">}}

You can configure Xarray to perform *outer* arithmetic joins, but that reveals another snag. For some [complicated reasons](https://github.com/pydata/xarray/issues/3910), Xarray doesn't support automatic alignment with in-place operations, meaning that you need to create a full copy of the large output raster every iteration.

{{<figure src="outer_join.png">}}

Benchmarking this with some small test arrays proved that the copy operation is pretty slow:

```python
%%timeit

with xr.set_options(arithmetic_join="outer"):
  A = A + B
```

Time: **102 ms ± 2.16 ms**

## Reindexing the Small Array

If we can't do fast in-place addition with automatic alignment, let's instead try to *manually* align the small array to match the large array with `reindex_like`. By padding the small array with zeros, this approach enables in-place addition, but with the cost of a lot of unnecessary allocation. 

{{<figure src="reindex.png">}}

The result is faster, but it's not fast:

```python
%%timeit

A += B.reindex_like(A)
```

Time: **63.3 ms ± 284 µs**

## Indexing the Big Array

Instead of growing the small array to match the big array, what if we just grabbed the overlapping chunk of data from the big array and modified *that* in-place? 

{{<figure src="index.png">}}

This avoids expensive copying or reindexing, providing the fastest solution by far:

```python
%%timeit

A.loc[dict(x=B.x, y=B.y)].data += B.data
```

Time: **14.5 ms ± 212 µs**

There's just one problem...

## Copies and Views

After updating my original code to use the optimized indexing approach, I reran my processing and was psyched to see it complete about 40x faster[^scaling]. Unfortunately, the accumulated result was empty.

After a little head-scratching, I found the culprit in the [Xarray docs](https://docs.xarray.dev/en/latest/user-guide/indexing.html#copies-vs-views) (emphasis added):

> - Label-based indexing with only slices returns a view.
> - Label-based **indexing with arrays returns a copy**.

By indexing the large raster with the coordinate arrays of the small raster, I ended up mutating *copies* of the large raster instead of views. Switching to slices is a little more verbose, but fixes the bug while keeping the speedup.

```python
# Create slices describing the extent (inclusive) of the small raster
x_slice = slice(B.x.min().item(), B.x.max().item() + 1)
y_slice = slice(B.y.max().item() + 1, B.y.min().item())

A.loc[dict(x=x_slice, y=y_slice)].data += B.data
```

Lesson learned.

[^viewshed]: I'm processing viewsheds around a collection of points by extracting chunks from a huge 30m DEM. Each chunk gets moved to the GPU where the viewshed can be calculated with [xarray-spatial](https://github.com/makepath/xarray-spatial), then gets moved back to the CPU and added to an output raster that tracks how many points are visible from any given location. I'll probably do a more detailed write-up of the project later.

[^scaling]: The speed improvement scaled with the dataset size, so the small-scale benchmark actually underestimated the eventual speedup.
