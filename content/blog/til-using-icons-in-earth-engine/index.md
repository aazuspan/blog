+++
title = "TIL: Using Icons in Earth Engine"
tags = ["javascript", "earth-engine", "til"]
description = "Load icons from GStatic or data URLs."
date = "2024-10-08"
+++

Some UI elements in Earth Engine (labels and buttons) support image icons, but the feature has some quirks that aren't well-documented. Here's a quick look at four ways you can implement icons in an Earth Engine app.

*This post was inspired by a [tweet](https://twitter.com/jstnbraaten/status/1515109490734997505) from [@jstnbraaten](https://twitter.com/jstnbraaten) that I have to dig up every time I want to use this feature.*

## Loading From GStatic

As described in the [docs](https://developers.google.com/earth-engine/apidocs/ui-button), external image icons can only be loaded from Google's CDN, gstatic.com. This site hosts all kinds of Google content including the [Material Icons library](https://fonts.google.com/icons), but it doesn't provide any public frontend. The best way I've found to locate icon links is to search [Material Icons](https://fonts.google.com/icons) and plug the icon name, style, and size into the gstatic URL template below:

```text
https://fonts.gstatic.com/s/i/short-term/release/materialsymbols<style>/<name>/default/<size>px.svg
```

For example, here's the [Travel Explore](https://fonts.google.com/icons?selected=Material+Symbols+Outlined:travel_explore) icon with a rounded style at 48px:


{{<figure src="https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/travel_explore/default/48px.svg">}}

```js
var button = ui.Button({
    imageUrl: "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/travel_explore/default/48px.svg"
})
```

The style can be `outlined`, `rounded`, or `sharp`, and most icons support sizes of `20px`, `24px`, `40px`, and `48px`.

## Encoding a Data URL

If gstatic doesn't have what you need, icons also support [data URLs](https://developer.mozilla.org/en-US/docs/Web/URI/Schemes/data), which allow you to include arbitrary image data encoded into a URL. For example, here's [a 16x16 PNG](https://www.iconarchive.com/show/mini-icons-by-famfamfam/icon-world-icon.html) encoded into base64 using [this site](https://elmah.io/tools/base64-image-encoder/):


<center><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAMFBMVEVHcEz///8gmRAQbNJFoulVs0us2qeXu+bS7rGK0mxyx1fJ7Prx+ecKXsXS7cPs+NY2F84eAAAAAXRSTlMAQObYZgAAABt0RVh0U29mdHdhcmUAZ2lmMnBuZyAwLjYgKGJldGEpqt1pkgAAAGRJREFUCNdjYEACgoJQWskYzGJU+nPaSADIEDr/w6VCEcgQPtHquQLIYLR+McV1VpIAkOHm4rkUzChxcQ0FMfRmuTgbJQO1Cb0Mtb1uCNKeEWRbbgg2MK3cWABshbKxIKqlEAAA1rgXNRhmqucAAAAASUVORK5CYII=" width=48/></center>

```js
var button = ui.Button({
    imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAMFBMVEVHcEz///8gmRAQbNJFoulVs0us2qeXu+bS7rGK0mxyx1fJ7Prx+ecKXsXS7cPs+NY2F84eAAAAAXRSTlMAQObYZgAAABt0RVh0U29mdHdhcmUAZ2lmMnBuZyAwLjYgKGJldGEpqt1pkgAAAGRJREFUCNdjYEACgoJQWskYzGJU+nPaSADIEDr/w6VCEcgQPtHquQLIYLR+McV1VpIAkOHm4rkUzChxcQ0FMfRmuTgbJQO1Cb0Mtb1uCNKeEWRbbgg2MK3cWABshbKxIKqlEAAA1rgXNRhmqucAAAAASUVORK5CYII"
})
```

The trick is that encoding images into URLs can create huge strings that lock up the Code Editor, so to keep things stable you'll be limited to smaller images (somewhere around 512x512 seems safe).

## Reading From Cloud Storage

To avoid issues with entering large data URLs in the Code Editor, they can be read from a blob in a GCS bucket. For example, here's a [256x256 PNG](https://www.iconarchive.com/show/cristal-intense-icons-by-tatice/Globe-terrestre-2-icon.html) that I'm loading from a base64-encoded URL stored in plain-text in a public bucket:

<center><img src="https://icons.iconarchive.com/icons/tatice/cristal-intense/256/Globe-terrestre-2-icon.png" width=48/></center>

```js
var url = ee.Blob("gs://ee-icon-url/image.txt").string();
url.evaluate(function(evaluated_url) {
    var button = ui.Button({
        imageUrl: evaluated_url
    });
});
```

Note that for this we need to create the UI asynchronously here since we're waiting on a server-side `ee.Blob`.

## Reading From a Feature Collection

Another way to encode long data URLs for asynchronous reading is by storing them as features in a collection asset. I encoded [this GIF](https://upload.wikimedia.org/wikipedia/commons/a/a9/Rotating_earth_%28large%29_transparent.gif) into base64, saved it locally in a CSV, and uploaded that to a Feature Collection. Just like a GCS blob, this can then be evaluated asynchronously into a UI element:

<center><img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Rotating_earth_%28large%29_transparent.gif" width=48/></center>

```js
var url = ee.FeatureCollection("projects/ee-aazuspan/assets/icon_test").first().get("url");
  
url.evaluate(function(evaluated_url) {
    var button = ui.Button({
        imageUrl: evaluated_url
    });
});
```

If someone was ambitious, they could encode an entire icon library into data URLs and store them as features that could be accessed by ID. With some quick code to wrap searching and loading icon URLs, you could make a pretty slick package for handling icons in Earth Engine...

*Update: I did this. You can now add any of the ~2k free Font Awesome icons to your Earth Engine widgets using the [snazzy](https://github.com/aazuspan/snazzy?tab=readme-ov-file#font-awesome-icons) package.*