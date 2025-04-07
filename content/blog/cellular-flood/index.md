+++
title = "Cellular Flood"
tags = ["earth-engine", "cellular-automata", "javascript"]
description = "Let's simulate sea level rise with cellular automata in Earth Engine."
date = "2022-08-07"
aliases = ["/blog/cellular_flood"]
+++

I recently built [Conway's Game of Life in Earth Engine]({{% relref "/blog/cellular-automata-in-earth-engine" %}}). It was a fun experiment, but I felt like it ignored one of the coolest aspects of cellular automata in Earth Engine—easy access to petabytes of geospatial data. So I decided to build a cellular automaton that would use elevation data to roughly simulate changes in sea level.


{{<figure src="olympic.gif" alt="Simulated sea level rise in the Pacific Northwest">}}

If you want to run it yourself, check out the [Earth Engine app](https://aazuspan.users.earthengine.app/view/cellular-flood). Below, I'll go through the code to show how it works.

## Cellular Automata

As I outlined in the [Game of Life post]({{% relref "/blog/cellular-automata-in-earth-engine" %}}), cellular automata operate in three steps:

1. Set each cell to an initial state, usually randomly.
2. Determine the next state for each cell based on its current state, the states of the cells around it, and a fixed set of rules.
3. Set each cell to its new state. Repeat steps 2 and 3.

## The Initial State

To simulate sea level change, each cell was assigned as above or below water, represented by pixel values of 0 or 1. I wanted to use current oceans as the starting point, so I decided to start with global land cover data from the [Copernicus Global Land Cover](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_Landcover_100m_Proba-V-C3_Global) dataset.

Below, I loaded the LULC data, reprojected to a coarse scale to speed up processing, and created a binary mask from pixels classified as oceans and seas (value 200).

```javascript
var proj = ee.Projection("EPSG:3857").atScale(1800);
var cgls = ee.ImageCollection("COPERNICUS/Landcover/100m/Proba-V-C3/Global");

var ocean = cgls
    .first()
    .select("discrete_classification")
    .eq(200)
    .unmask(1).updateMask(1)
    .reproject(proj);
```

{{<figure src="cellular_flood_oceans.png" alt="A binary mask of global oceans">}}

At this point, I also initialized the starting sea level and loaded the elevation data that would be used to update cell states. I decided to use the [ETOPO1 global elevation](https://developers.google.com/earth-engine/datasets/catalog/NOAA_NGDC_ETOPO1) dataset because it included bathymetry data that allowed me to both raise *and* lower sea level, exposing underwater terrain. 

```javascript
var seaLevel = 0;

var elevation = ee.Image("NOAA/NGDC/ETOPO1")
    .select("bedrock")
    .resample("bilinear")
    .reproject(proj);
```

## The Next State

After establishing the initial state, the next step was to figure out how to update that state with a new sea level. There's a lot of research on using cellular automata to accurately simulate flooding and inundation with complex rules that take fluid dynamics and physics into account, but my goal was just to create a fun tech demo, so I came up with the simplest ruleset I could think of.

Each time step, sea level is changed by a fixed amount and cells adjacent to water become water *if* their elevation is below the current sea level. 

I found pixels adjacent to water by running a max reducer over neighborhoods of pixels. Because water cells have a value of 1 and land cells have a value of 0, the max reducer would locate any land cells near to water. I settled on a circular kernel with a radius of 3 after some experimentation, as smaller kernels produced less realistic flooding behavior and larger kernels took too long to process.

```javascript
var adjacent = ocean.reduceNeighborhood({
    reducer: ee.Reducer.max(),
    kernel: ee.Kernel.circle(3),
});
```

Finally, I incremented the sea level by an adjustable rate of change and compared the elevation of the adjacent pixels to the updated sea level, generating the next binary ocean mask.

```javascript
var rate = 5;

seaLevel += rate;
ocean = adjacent.eq(1).and(elevation.lt(seaLevel));
```

{{<figure src="cellular_flood_step.gif" alt="A binary ocean mask in the U.S. Gulf Coast before and after updating sea level.">}}


## Rinse and Repeat

With the logic for changing sea level and expanding water into new areas written, the next step was simply to repeat that process, storing each state in an array to show how water extent would change over time.

```javascript
var states = [ocean];

for (var i=0; i<10; i++) {
  var adjacent = ocean.reduceNeighborhood({
    reducer: ee.Reducer.max(),
    kernel: ee.Kernel.circle(3),
  });
  
  seaLevel += 5;
  
  ocean = adjacent.eq(1).and(elevation.lt(seaLevel));
  states.push(ocean);
}
```

While you could simply add each state to the map to see the changes, I decided to combine then into an image collection for animation.

```javascript
var params = {
  region: geometry,
  crs: "EPSG:3857",
  dimensions: 350,
  format: "gif",
  framesPerSecond: 8,
};

var anim = ui.Thumbnail({
  image: ee.ImageCollection(states),
  params: params,
});

print(anim);
```

Here's the result, showing 50 time steps with +1m of sea level change per step over the Gulf Coast.

{{<figure src="cellular_flood_gulf_coast.gif" alt="An animation of a binary ocean mask in the U.S. Gulf Coast spreading over land.">}}

## Polishing and Packaging

With the core cellular automaton built, I spent a while tweaking the visualization to make it more visually impressive. I won't go into all the details, but I used the ocean mask and elevation data to color water based on depth, blended that over a hillshade, and overlaid a settlement layer on top to give some spatial context. You can check out the [final code here](https://code.earthengine.google.com/cefc8aa7e2c4afc4f7d3cfb85103466d), which also includes the UI elements for the app.

{{<figure src="gibraltar.gif" alt="Simulated sea level rise in the Strait of Gibraltar">}}

