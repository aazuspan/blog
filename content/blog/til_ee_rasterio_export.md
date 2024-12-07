+++
title = "TIL: Exporting a GEE Image Using Rasterio Transforms"
tags = ["til", "earth-engine", "python"]
date = "2024-12-07"
description = "Translating affine transforms to Earth Engine export parameters."
+++

I recently needed to export an image from Earth Engine to overlay with a local GeoTIFF. Translating the CRS and transforms between the local `rasterio` metadata and the format expected by GEE to get identical grids turned out to be surprisingly frustrating, so I thought I'd do a quick write up to hopefully save myself a future headache.

## Reference Metadata

Assuming we have a local GeoTIFF `reference.tif`, we can grab the relevant metadata with:

```python
import rasterio

with rasterio.open("reference.tif") as ref:
    ref_profile = ref.profile

print(ref_profile)
```

which gives us something similar to:

```python
{
'driver': 'GTiff', 
'dtype': 'float32', 
'nodata': -3.3999999521443642e+38, 
'width': 2160, 
'height': 1080, 
'count': 19, 
'crs': CRS.from_wkt('GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AXIS["Latitude",NORTH],AXIS["Longitude",EAST],AUTHORITY["EPSG","4326"]]'), 
'transform': Affine(0.16666666666666666, 0.0, -180.0, 0.0, -0.16666666666666666, 90.0), 
'blockxsize': 2160, 
'blockysize': 1, 
'tiled': False, 
'compress': 'lzw', 
'interleave': 'band'
}
```

## Translating for Earth Engine

The `ref_profile` from `rasterio` includes all the information that Earth Engine needs to recreate the grid, but not in the format that it expects.

When you export an image from GEE, you can provide any combination of `region`, `scale`, `dimensions`, `crs`, and `crsTransform`, but some of those provide redundant information and override each other. To fully define a grid, you just need the last three[^dimensions]: `dimensions`, `crs`, and `crsTransform`.


`dimensions` is easy. Just format the width and height into a `"WIDTHxHEIGHT"` string.

```python
dimensions = f"{ref_profile['width']}X{ref_profile['height']}"
```

`crs` is similarly easy. You could just use `ref_profile["crs"].to_string()` to get the EPSG code, but `ref_profile["crs"].to_wkt()` provides the full coordinate reference system specification, so it'll be more reliable for less common projections.

```python
crs = ref_profile["crs"].to_wkt()
```

`crsTransform` is the tricky one. `rasterio` offers two output styles (GDAL and Shapely) for its affine transformation, neither of which match the mystery[^mystery] format expected by Earth Engine. After some trial and error, the expected format seems to be (following the naming format of [affine](https://github.com/rasterio/affine/blob/main/affine/__init__.py)):

```
a b c d e f
```

which differs from the GDAL format of

```
c a b f d e
```

or the Shapely format of

```
a b d e c f
```

## The Converter

Putting all that together, you export an Earth Engine image to match a local GeoTIFF's grid with:

```python
def get_export_args(ref_tif):
    with rasterio.open(ref_tif) as src:
        ref_profile = src.profile

    transform = ref_profile["transform"]

    return dict(
        dimensions=f"{ref_profile['width']}X{ref_profile['height']}",
        crs=ref_profile["crs"].to_wkt(),
        crsTransform=[
            transform.a, transform.b, transform.c,
            transform.d, transform.e, transform.f
        ]
    )

ee.batch.Export.image.toDrive(
    image=my_image,
    description="overlay_image",
    **get_export_args("reference.tif")
)
```


[^dimensions]: If your image is bounded, you should only need `crs` and `crsTransform` as the dimensions can be inferred from the image and the pixel size.

[^mystery]: The documentation for `Export.image.toDrive` gives zero details on how to format the transform. Another function, [`ee.Image.reproject`](https://developers.google.com/earth-engine/apidocs/ee-image-reproject) takes the same parameter and describes it as a "row-major ordering of the 3x2 transform matrix", which is better than nothing but still vague, since there's no standard format for a transform matrix.
