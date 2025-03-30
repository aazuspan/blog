+++
title = "TIL: Promises in Earth Engine"
tags = ["javascript", "earth-engine", "til"]
description = "You can handle async callbacks using promises (but you probably shouldn't)."
date = "2024-10-14"
+++

Using `evaluate` with a callback function is the standard way to handle potential server-side errors in the Earth Engine JS API, e.g. parsing a date:

```js
ee.Date("2012").evaluate(function(result, err) {
  err ? print(err) : print(result);
});
```

But what if we want to use [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) instead? Let's write a `get_promise` function that wraps any evaluatable object in a promise:

```js
/**
 * Return a promise that resolves when an object is evaluated.
 */
function get_promise(object) {
  return new Promise(function(resolve, reject) {
    object.evaluate(function(result, err) {
      err ? reject(err) : resolve(result);
    })
  })
}
```

Now we can evaluate an object to a promise and handle it like any other promise:


```js
get_promise(ee.Date("2012"))
  .then(print)
  .catch(print);
```

Cool, but the truth is that you're probably better off sticking with `evaluate` callbacks, since the Code Editor seems to only *partially* support promises[^bugs].

[^bugs]: The sandbox doesn't implement any of the static methods like `Promise.all`, and there's a bug where errors within the `then` handler aren't reported to the console. It's surprising that the Code Editor includes promises at all, since it's mostly locked to ES5 features and promises were added in ES6.