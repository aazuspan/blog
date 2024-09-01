+++
title = "Terrain Algorithms from Scratch"
tags = ["python", "algorithms"]
date = "2022-08-05"
description = "Slope, aspect, and hillshading are ubiquitous in spatial analysis, but how are they made? Let's implement them from scratch in Python to figure out."
aliases = ["/blog/terrain_from_scratch"]
+++

There are plenty of tools to calculate slope, aspect, and hillshading from elevation data, but if you've ever been curious about *how* they're calculated, this post goes through the process of implementing those algorithms from scratch in Python using just Numpy.

{{<figure src="/images/posts/terrain_from_scratch/terrain_from_scratch_5_1.png" alt="An hypsometric elevation map of a mountain." caption="A DEM height map of Mount St. Helens that we'll use for calculating topography.">}}

## Slope

The concept of slope is simple: How much does elevation change within an area? Steep areas have lots of elevation change over a short distance while flat areas have very little. However, applying that concept to a 2D array raises the question, how do we define change within an area?

There have been *many* different slope algorithms created to answer that question, and each produces slightly different results. We're going to use the [Horn 1981](https://people.csail.mit.edu/bkph/papers/Hill-Shading.pdf) algorithm since it is widely used (supported by GDAL, GRASS, Whitebox Tools, ESRI, etc.) but if you want to dive into the rabbit hole of slope algorithm comparisons, check out [this site](https://www.usna.edu/Users/oceano/pguth/md_help/html/demb1f3n.htm) or [this paper](https://www.researchgate.net/publication/209803713_The_Effect_of_Slope_Algorithms_on_Slope_Estimates_within_a_GIS).

Horn's algorithm calculates slope for each pixel using the following equation, where $\frac{dz}{dx}$ is the east-west gradient of neighboring pixels and $\frac{dz}{dy}$ is the north-south gradient.

$$
slope _{percent} = \sqrt {\frac{dz}{dx}^2 + \frac{dz}{dy}^2}
$$

Let's break that equation down by calculating the slope of a single pixel.

### One Pixel at a Time

Imagine we want to calculate slope for the center pixel of a 3x3 pixel neighborhood $w$ with the following elevations:

{{<figure src="/images/posts/terrain_from_scratch/terrain_from_scratch_8_0.png" alt="A 3x3 array of grid cells.">}}

#### East-West Gradient

The first term in the Horn algorithm, the east-west gradient $\frac{dz}{dx}$, describes how elevation changes between the east and west side of the pixel neighborhood. To solve it, we'll break it down into the change in elevation $dz$ over the horizontal distance $dx$.

The vertical distance between pixels, $dz$, is calculated with the following equation, where the northwest pixel in the neighborhood is labeled $z_{nw}$, the southwest pixel is labeled $z_{sw}$, and so on.

$$
dz = \frac{(z_{nw} + z_{sw} + 2z_{w}) - (z_{ne} + z_{se} + 2z_{e})}{8}
$$

There are a few things to notice in the equation above.
1. We're calculating the difference between the sum of the western and eastern pixels.
2. The directly west and east pixels, $z_{w}$ and $z_{e}$, are multiplied by 2 to increase their weight over the diagonal pixels.
3. The result is divided by 8 to normalize the value based on the input weights.

Here's $dz$ in code:


```python
dz = ((w[0][0] + w[1][0] * 2 + w[2][0]) - (w[0][2] + w[1][2] * 2 + w[2][2])) / 8
```

The horizontal distance between pixels, $dx$, is simply the raster resolution (for this example, 30).


```python
dx = 30
```

Now we can calculate $\frac {dz}{dx}$, the change in elevation over the $x$ dimension, by simply dividing the two terms.


```python
dz_dx = dz / dx
```

#### North-South Gradient

The second term in the Horn algorithm, the north-south gradient $\frac{dz}{dy}$, describes how elevation changes between the north and south side of the pixel neighborhood. It's solution is nearly identical to the east-west gradient, after swapping in the appropriate pixels.

$$
dz = \frac{(z_{sw} + z_{se} + 2z_{s}) + (z_{nw} + z_{ne} + 2z_{n})}{8}
$$

And in code:


```python
dz = ((w[2][0] + w[2][1] * 2 + w[2][2]) - (w[0][0] + w[0][1] * 2 + w[0][2])) / 8
```

Assuming our image has square pixels, the distance between pixels in the north-south dimension $dy$ will be the same as $dx$.


```python
dy = 30
```

The last step in calculating the north-south gradient is to divide the change in elevation over the $y$ dimension by the horizontal distance between cells.


```python
dz_dy = dz / dy
```

#### Putting It Together

With the east-west and north-south gradients calculated, $\frac{dz}{dx}$ and $\frac{dz}{dy}$ respectiely, solving the Horn algorithm is straightforward. Just plug the two solved terms into the original equation.

$$
slope _{percent} = \sqrt {\frac{dz}{dx}^2 + \frac{dz}{dy}^2}
$$


```python
slope_pct = np.sqrt(dz_dx ** 2 + dz_dy ** 2)
```

With a little more work, we can convert the percent slope into more familiar degrees of slope.

$$
slope _{degrees} = \arctan \left(slope _{percent}\right) * \left(\frac {180}{\pi}\right)
$$


```python
slope = np.arctan(slope_pct) * (180 / np.pi)
slope
```

For convenience, let's simplify the code above and package it into a function that will calculate the slope of a single pixel given it's 3x3 neighborhood of pixels.


```python
def pixel_slope(w, resolution):
    dz_dx = ((w[0][0] + w[1][0] * 2 + w[2][0]) - (w[0][2] + w[1][2] * 2 + w[2][2])) / (8 * resolution)
    dz_dy = ((w[2][0] + w[2][1] * 2 + w[2][2]) - (w[0][0] + w[0][1] * 2 + w[0][2])) / (8 * resolution)
    
    return np.arctan(np.sqrt(dz_dx ** 2 + dz_dy ** 2)) * (180 / np.pi)
```

With the fundamentals of Horn's algorithm down, the challenge now is simply to calculate it for each pixel.

### Scaling Up

To calculate slope from our elevation data, we'll iterate over each row and column in the DEM[^efficiency], grab the 3x3 window of neighboring pixels, use the `pixel_slope` function to calculate the slope of the center pixel, and store the result in an empty `slope` array.

First, we'll create the empty array to store slope values. We'll make it two pixels smaller than the DEM in the x and y dimensions to account for the fact that edge pixels don't have the eight required neighbors.


```python
slope = np.empty((dem.shape[0] - 2, dem.shape[1] - 2))
```

Now we'll iterate over rows and columns (dropping one pixel from each side to account for edges) and calculate slope for each neighborhood of pixels.


```python
for row in range(1, dem.shape[0] - 1):
    for col in range(1, dem.shape[1] - 1):        
        w = dem[row-1:row+2, col-1:col+2]
        slope[row-1][col-1] = pixel_slope(w, 30)
```

Finally, let's see what our slope map looks like, with flat areas in blue and steep areas in red.

{{<figure src="/images/posts/terrain_from_scratch/terrain_from_scratch_33_1.png" alt="A slope map of mountain">}}

## Aspect

Aspect is closely related to slope, describing orientation rather than steepness. Since we've already implemented the Horn slope algorithm, we'll use that for calculating aspect as well, with the following equation.

$$
aspect = \arctan2 \left( \frac{dz}{dx} , \frac{dz}{dy} \right)
$$

The east-west and north-south gradients, $\frac{dz}{dx}$ and $\frac{dz}{dy}$ respectiely, are calculated identically to slope. The only difference is that instead of taking the square root of their sum to get the overall slope, we use the arctangent to calculate the angle between them.

Here's that equation in code, plus conversion to degrees and rescaling to compass bearings:


```python
def pixel_aspect(w, resolution):
    """Calculate the aspect of a pixel in degrees given its 3x3 neighborhood `w` and cell resolution."""
    dz_dx = ((w[0][0] + w[1][0] * 2 + w[2][0]) - (w[0][2] + w[1][2] * 2 + w[2][2])) / (8 * resolution)
    dz_dy = ((w[2][0] + w[2][1] * 2 + w[2][2]) - (w[0][0] + w[0][1] * 2 + w[0][2])) / (8 * resolution)
    
    aspect = np.arctan2(dz_dy, dz_dx) * (180 / np.pi)
    # Convert to compass bearings 0 - 360
    aspect = 450 - aspect if aspect > 90 else 90 - aspect

    return aspect
```

We calculate aspect for each pixel the same way we did slope, by iteratively filling an empty 2D array with aspects calculated from each pixel's 3x3 neighborhood.


```python
aspect = np.empty((dem.shape[0] - 2, dem.shape[1] - 2))

for row in range(1, dem.shape[0] - 1):
    for col in range(1, dem.shape[1] - 1):        
        w = dem[row-1:row+2, col-1:col+2]
        aspect[row-1][col-1] = pixel_aspect(w, 30)
```

{{<figure src="/images/posts/terrain_from_scratch/terrain_from_scratch_37_1.png" alt="An aspect map of a mountain">}}

## Hillshading

With slope and aspect calculated, generating hillshading to visualize the terrain is simple.

The formula to calculate hillshading is below, with all units in radians. The zenith and azimuth parameters describe the position of the simulated light source, and can be tuned to adjust the hillshading effect. 

$$
hillshade = \cos(zenith) * \cos(slope) + \sin(zenith) * \sin(slope) * \cos(azimuth - aspect)
$$

Here's that equation in code, using the slope and aspect arrays we calculated earlier.


```python
azimuth = 315
altitude = 45

# Convert solar altitude to zenith and convert everything to radians
zenith_rad = 90 - altitude * np.pi / 180
azimuth_rad = azimuth * np.pi / 180
slope_rad = slope * np.pi / 180
aspect_rad = aspect * np.pi / 180

# Calculate hillshade and scale to 8-bit
hs = 255 * (np.cos(zenith_rad) * np.cos(slope_rad) + np.sin(zenith_rad) * np.sin(slope_rad) * np.cos(azimuth_rad - aspect_rad))
# Clip out-of-bounds values
hs = np.clip(hs, 0, 255)
```
{{<figure src="/images/posts/terrain_from_scratch/terrain_from_scratch_40_1.png" alt="A hillshade map of a mountain.">}}    


## Wrapping Up

Now that we know how to implement terrain algorithms from scratch, the next step is to uninstall QGIS, WhiteboxTools, GDAL, and any other geospatial tools we no longer need!

Okay, probably not. There are faster and more convenient ways to generate terrain data than rolling your own implementations, but getting a glimpse at the underlying algorithms does provide some interesting insights into how they work.

{{<figure src="/images/posts/terrain_from_scratch/terrain_from_scratch_42_1.png" alt="Four panels with the original height map and each of the derived topographic variables.">}}

[^efficiency]: Using Python loops to apply our calculations to each pixel window is good for demonstration, but *very* slow in practice. If performance was a factor, you'd want to vectorize this to do as much work in C as possible.