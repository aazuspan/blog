+++
title = "Dithering in Earth Engine"
tags = ["earth-engine", "javascript", "algorithms"]
date = "2022-03-19"
description = "Dithering is an image processing technique used in retro video games to simulate shading with a single color. Let's apply it to Landsat imagery in Earth Engine."
+++

Ever wanted to use the power of distributed Earth Engine processing to make 16-bit multispectral imagery from a $130 million satellite platform look like it was taken by a 1989 GameBoy camera? Now you can.

## What is Dithering?

[Dithering](https://en.wikipedia.org/wiki/Dither) is an image processing technique that allows you to simulate shading using patterns of a single color. If you've ever played [Return of the Obra Din](https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn) or used an old Game Boy, you're probably familiar with the effect.

{{<figure src="https://upload.wikimedia.org/wikipedia/en/d/d6/Return_of_the_Obra_Dinn_logo-title.jpg" alt="Return of the Obra Dinn">}}

There are a range of algorithms to apply dithering, all of which boil down to replacing grey values in an input image with patterns of black and white values in an output image. Most of these techniques, like [Floyd-Steinberg dithering](https://en.wikipedia.org/wiki/Floyd%E2%80%93Steinberg_dithering) and [ordered dithering](https://en.wikipedia.org/wiki/Ordered_dithering), involve manipulating specific pixel values, which isn't hard in synchronous programming environments, but poses some unique challenges in Google Earth Engine. Because we lack the ability to address and modify individual pixels in Earth Engine, we'll have to settle for a simplified version of ordered dithering.

The technique we'll use, described [here](https://www.r-bloggers.com/2019/01/image-dithering-in-r/), can create a 3-tone dithering effect by comparing the values of an image against an overlapping checkerboard.


## Creating a Checkerboard

How can you create a checkerboard image in a platform that doesn't allow you to modify specific pixels? It's going to take a little creativity.

`ee.Image.pixelCoordinates` creates an image where each pixel contains X and Y coordinates in a given projection. If you visualize those coordinates, you get a smooth gradient in the horizontal (longitude) and vertical (latitude) axes. 

```javascript
var proj = ee.Projection("EPSG:3857").atScale(600);
var gradient = ee.Image.pixelCoordinates(proj);
```

But we don't want a smooth gradient--we want a checkerboard of 1s and 0s. What if you cast each coordinate to an integer and set the odd-numbered coordinates to 0 and the even-numbered coordinates to 1? We can do that in the X and Y axes separately using the powerful `expression` method, giving us horizontal and vertical grid lines.

```javascript
gradient = gradient.int();
var x = gradient.expression("b('x') % 2 == 0");
var y = gradient.expression("b('y') % 2 == 0");
```

All that's left is to run a simple bitwise XOR on our gridlines. If you're rusty on your logic gates, an XOR returns 0 if its inputs are equal and 1 if they're unequal, so any location where the two grids (or spaces between grids) overlap will be set to 0, creating a perfect checkerboard!

```javascript
var checker = x.bitwiseXor(y).reproject(proj);
```

{{<figure src="/images/posts/dithering/dither_checkerboard.gif" alt="A checkerboard pattern">}}

## Applying Dithering

With the hard part done, all we need to do is load an image and compare its values to the checkerboard to create a new image. We'll start by pulling in the least cloudy Landsat 9 image we can find in our area of interest.

```javascript
var aoi = ee.Geometry.Point([-122.42779651670399, 37.73640143278707]);
var l9 = ee.ImageCollection("LANDSAT/LC09/C02/T1_L2");
var img = l9.filterBounds(geometry).sort("CLOUD_COVER_LAND", true).first();
```

We probably want our distribution of image values to be roughly evenly divided into dark, moderate, and light areas. Remembering that our checkerboard has values of 0 and 1, we want about 1/3 of our image to be less than 0, 1/3 to be greater than 1, and 1/3 to be between 0 and 1. We'll accomplish this by rescaling the pixel values of our image such that the 33rd and 66th percentile values are compressed to values of 0 and 1, respectively. This is a good place to start, but we can fine tune these later to perfect the dithering, increasing the lower percentile to create more dark areas or decreasing the upper percentile to create more light areas.

```javascript
function rescaleImage(img) {
  var minMax = img.reduceRegion({
    reducer: ee.Reducer.percentile([33, 66]),
    geometry: Map.getBounds(true),
    scale: Map.getScale(),
    bestEffort: true
  });

  // Rescale each band indiviudally
  var bands = img.bandNames().map(function(band) {
    band = ee.String(band);
    var min = ee.Number(minMax.get(band.cat('_p33')));
    var max = ee.Number(minMax.get(band.cat('_p66')));
    
    return img.select(band).subtract(min).divide(max.subtract(min));
  });
  
  return ee.ImageCollection(bands).toBands().rename(img.bandNames());
}

// Rescale our image values to get an even distribution of light and dark areas.
img = rescaleImage(img);
```

Finally, we'll compare our rescaled image to our checkerboard. Areas that are "brighter" than the checkerboard will turn white while areas "darker" than the checkerboard will turn black. Reprojecting will ensure we have a clean pattern that doesn't change as we zoom in and out.

```javascript
var dithered =  img.reproject(proj).gt(checker);
```

To understand how that comparison creates a dithered output, it's helpful (for me at least) to break the process down into three categories.

* Bright areas of the image, which have higher values than the the white and black checkerboard pixels, will be replaced with white.
* Dark areas of the image, which have lower values than the white and black of the checkerboard pixels, will be replaced with black.
* Moderate areaes of the image, which have lower values than the white but *higher* values than the black, will be replaced 50/50 with white and black, recreating the checkerboard pattern.

And the result, in all its 1-bit dithered glory:

{{<figure src="/images/posts/dithering/dither_sf.gif" alt="A checkerboard pattern">}}

You can load [the script here](https://code.earthengine.google.com/b812a571c249f7830a15d2e889558159) to run it yourself.
