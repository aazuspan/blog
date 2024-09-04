+++
title = "Optimizing Module Structure in Earth Engine"
date = "2022-06-09"
tags = ["earth-engine", "javascript"]
description = "Nested file structures are great for organization and terrible for import speed in Earth Engine modules. Let's figure out why and what we can do about it."
aliases = ["/blog/nested-modules"]
+++

In a [recent blog post]({{% relref "/blog/minifying_modules" %}}), I found that shrinking an Earth Engine module's size by 75% had almost no effect on import speed in the Code Editor because most of the time was spent waiting for Earth Engine to find it, not downloading its contents. If that's the case, then is a module that's split up across multiple files much slower to import than a module contained in a single file?

To answer that question, I set up three test modules using different file structures and compared import times. What I found is that **module structure matters**. A lot. Using what I learned, I was able to cut import times for one of my old modules by **72%**.

## Module Design

When building an Earth Engine module, I usually make one root file that imports from submodules. That allows for organization of code while only requiring users to make a single import. For example, I might have a file called `tools` with the following contents:

```js
exports.ui = require("users/aazuspan/repo:src/ui.js")
exports.image = require("users/aazuspan/repo:src/image.js")
```

The `ui` and `image` submodules would contain their own exported functions. A user could import `tools` and access both submodules, like so:

```js
var tools = require("users/aazuspan/repo:tools");

tools.image.maskClouds(...)
tools.ui.legend(...)
```

If you count the `require` calls above, you can see that Earth Engine is going to have to request three separate files in order to load `tools`. If each of those requests is made synchronously and has a minimum overhead time, imports might get painfully slow in complex projects. Would I be better off just including all my source code in a single file?

## The Test

I set up three different modules, each organized with a different layout, to compare the effect of different module structures on import times. To eliminate download time as a confounding variable, each module contained exactly 395 bytes of code. I imported each module 10 times, measuring the network time between requesting and receiving the code.

### 1. Chained Structure

The first module I tested contained one root module with five submodules, arranged depthwise. The root module required the first submodule, which required the second submodule, which required the third, etc. Starting at the root module, imports would work their way down each link in the chain until the last submodule was finally returned. 


{{<figure src="/images/posts/nested_modules/nested_deep.svg" alt="A diagram with 6 modules connected in series.">}}

Because each submodule would need to be retrieved before the next module could be requested, I suspected this chained design would be the slowest to import.

### 2. Branched Structure

The second module also contained one root module with five submodules. However, unlike the chained module, the imports for each submodule in the branched structure were declared in the root module (the design I described at the beginning of this post). 

{{<figure src="/images/posts/nested_modules/nested_wide.svg" alt="A diagram showing one module branching out to 5 submodules">}}

Because all of the required submodule paths could be known as soon as the root module was received and parsed, this is where I suspected Earth Engine might optimize import times by requesting multiple submodules asynchronously. At least, that was my hope.

### 3. Monolithic Structure

If each instance of `require` adds some overhead to import time, the fastest import should be achieved with only a single file. I used this monolithic structure, with one root module containing the contents of all the submodules, for the third experimental structure.

{{<figure src="/images/posts/nested_modules/nested_allinone.svg" alt="A diagram with one large root module.">}}

## The Results

### Chained is Slow

Watching network traffic when importing the root file of the chained module revealed that six synchronous requests were made. Because each submodule contained the path to the next, the final submodule could only be imported after all the previous submodules were resolved.

{{<figure src="/images/posts/nested_modules/nested_test_deep.png" alt="Browser developer tools showing 6 requests occurring one after the other" caption="Network requests being made for each module, one at a time.">}}

Averaged over 10 runs, it took **3.24 seconds** to fully import the chained module.

### Branched is Faster

In comparison, the network traffic below shows how the branched module structure allowed for asynchronous requests. As soon as the submodule paths were retrieved from the root module, the remaining requests were made simultaneously.

{{<figure src="/images/posts/nested_modules/nested_test_wide.png" alt="Browser developer tools showing 6 requests, with 5 occurring simultaneously after the first finishes" caption="One network request followed by 5 parallel requests for submodules.">}}

On average, the branched module imported fully in **1.30 seconds**, almost 3 times faster than the chained module. 

### One is the Fastest Number

Unsurprisingly, the single-file monolithic module made only one request, which was resolved just as fast as any of the multiple requests made by the other structures.

{{<figure src="/images/posts/nested_modules/nested_test_allinone.png" alt="Browser developer tools showing a single request" caption="A single network request.">}}

The monolithic module took only **0.573 seconds** to import on average, about 6x faster than the chained module and 2x faster than the branched module.

### Scaling Up

The results above painted a pretty clear picture, but I was curious whether things might change as the number of submodules changed. I reran the experiment, including between 1 and 10 submodules in each of the structures.

<iframe src="/images/posts/nested_modules/nested_module_scale.html" width=800 height=400 frameBorder="0"></iframe>

Import times for the chained module scaled linearly as more submodules were added, as expected. The branched module showed a smaller, but noticeable increase in import times as submodules increased. Apparently there was still *some* penalty for the additional imports, even when made asynchronously. The number of submodules had no effect on import speed of the monolithic module, as download times for the additional data were negligible compared to the overhead request time.

## Lessons Learned

Using what I learned above, I decided to take a closer look at the structure of my Earth Engine modules called [snazzy](https://github.com/aazuspan/snazzy). Here's the module layout:

{{<figure src="/images/posts/nested_modules/snazzy_structure.svg" alt="A diagram showing three modules connected in a row" caption="">}}

In the interest of organization, I accidentally created a chained set of imports. The root `styles` must be imported first, which imports `styles.js`, which imports `tags.js`. A few tests revealed that the module takes **2.03 seconds** to import, which matches the expected import time for a chained module with 2 submodules that I measured earlier. 

I decided to simplify the structure to a single, monolithic module, moving all of the code into `styles.` The result was a **72% reduction** in import time, down to an average of only **0.551 seconds**.

{{<figure src="/images/posts/nested_modules/nested_modules_brain.jpg" alt="A meme of a brain expanding. Alongside, the caption goes from 'Putting all your code in one file because its easy', to 'Splitting your code up into submodules', to 'Building a complex network of nested sub-modules', to 'Realizing that's slow and putting all your code back in one file.'">}}

So, will I build all of my Earth Engine modules in a single file from now on? Probably not. Being able to organize complex projects across multiple files dramatically improves maintainability, and that may be worth the cost in performance. However, I will pay closer attention to module structure, and avoid chained imports like I had in `snazzy` whenever possible. 

Of course, compromising performance for organization (or vice-versa) isn't great, so maybe there's a third option. Specifically, I'm thinking that there's a need for a tool that could be set up to automatically merge nested submodules into a single root module. This step could be run through an automated Github workflow whenever new code is pushed, essentially compiling the project and pushing it to Earth Engine. That would allow for performant imports *and* clean, well-organized code. [Minification]({{% relref "/blog/minifying_modules" %}}) could even be run at the same time to speed up imports just a little bit more. 

~~But for the time being, I plan to just pay a little more attention to my module design.~~

**Update**: Check out [minee](https://github.com/aazuspan/minee), a bundler for Earth Engine modules I built to solve this problem. `minee` lets you write modules with any structure you want, and combines them into a single minified file automatically to speed up imports!

## TLDR
- Each file import in Earth Engine takes times, regardless of file size
- Chained imports (`A` requires `B` requires `C`) occur synchronously. Each import linearly increases the total import time.
- Branched imports (`A` requires `B` *and* `C`) occur asynchronously. There isn't much difference between one and ten branched imports.
- Single file imports are the fastest possible, but they can make organization difficult.