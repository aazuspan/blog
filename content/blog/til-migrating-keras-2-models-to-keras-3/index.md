+++
title = "TIL: Migrating Keras 2 Models to Keras 3"
date = "2026-01-02T17:22:05.501499"
description = "Automating the migration of ~80 .keras models from Tensorflow 2.13.0 to 2.16.2."
tags = ["til", "deep-learning", "tensorflow"]
+++

I've been working on upgrading the tech stack for a deep-learning research project that I'm involved in, moving the Docker devcontainer from Python 3.8 (which reached end-of-life over a year ago) and Tensorflow 2.13.0 (similarly dated) to Python 3.11 and Tensorflow 2.16.2[^still-old]. Internally, that also means upgrading from Keras 2 to 3 and navigating a number of related breaking changes to the `.keras` model format. We've got about 80 model runs logged in the old `2.13.0` format that we'd like the option to keep running in `2.16.2`, which now fail to deserialize after the upgrade.

Unsatisfied with the online advice for running old models in newer Tensorflow versions, which is either 1) don't upgrade[^old-versions] or 2) retrain everything, I spent some time coming up with a migration process that preserves [nearly all](#limitations) of the capabilities of a `2.13.0` model in a `2.16.2`-compatible format. This isn't necessarily the *right* way to migrate models[^model-formats], but I figured I'd write it up anyways, since it worked for me.

## The Approach

### Step 0: The Model Registry and Helper Functions

This process produces a lot of model files as they're shuffled between formats, so I set up a JSON file that maps each model's unique ID to a filepath for each model format. Each step will read the old model paths from the registry, load and save models into the new format, and write the registry back out with the new paths.

Speaking of which, I wrote a helper function to do just that, with a couple options for including custom objects in the serialized model, and recompiling metrics (which was needed in one of the [later steps](#step-3-back-to-keras)).

```python
# utils.py

def migrate_models(
        *, 
        from_spec: str, 
        to_spec: str, 
        ext: str, 
        custom_objects: dict | None=None, 
        recompile_metrics: tuple | None=None) -> None:
    """
    Migrate models from one format to another, updating the model registry accordingly.
    """
    custom_objects = custom_objects or {}
    with open("models/model_registry.json", "r") as f:
        model_registry = json.load(f)

    for model, meta in model_registry["models"].items():
        load_path = meta["paths"][from_spec]
        save_path = Path(load_path.replace(from_spec, to_spec)).with_suffix(ext)
        save_path.parent.mkdir(parents=True, exist_ok=True)
        model_registry["models"][model]["paths"][to_spec] = save_path.as_posix()

        loaded_model = tf.keras.models.load_model(
            load_path,
            custom_objects=custom_objects,
        )

        if recompile_metrics:
            loaded_model.compile(
                optimizer=loaded_model.optimizer,
                loss=loaded_model.loss,
                metrics=recompile_metrics,
            )
        
        loaded_model.save(save_path)

    with open("models/model_registry.json", "w") as f:
        json.dump(model_registry, f, indent=4)
```

### Step 1: Switch to `.h5`

The `.keras` model format breaks between Tensorflow `2.13.0` and `2.15.0`, but the `.h5` format doesn't. That means the first step was to use the `migrate_models` helper to convert the existing `.keras` models to `.h5` models within `2.13.0`. [uv support for inline dependencies](https://docs.astral.sh/uv/guides/scripts/#declaring-script-dependencies) was a huge help here, as I could specify the required Python and Tensorflow versions within each script for reproducibility.

```python
# /// script
# requires-python = "==3.8.10"
# dependencies = [
#     "tensorflow==2.13.0",
# ]
# ///

from utils import migrate_models

if __name__ == "__main__":
    migrate_models(
        from_spec="2.13.keras",
        to_spec="2.13.h5",
        ext=".h5",
    )
```

### Step 2: Upgrade `.h5` 

The `.h5` model format used by `2.13.0` isn't compatible with `2.16.2`, but it *is* compatible with `2.15.0`, so the next step was to load the model outputs from the previous step into `2.15.0` and re-save them in the same (upgraded) format.


```python
# /// script
# requires-python = "==3.9.12"
# dependencies = [
#     "tensorflow==2.15.0",
# ]
# ///

from utils import migrate_models

if __name__ == "__main__":
    migrate_models(
        from_spec="2.13.h5",
        to_spec="2.15.h5",
        ext=".h5",
    )
```

### Step 3: Back to `.keras`

The `.h5` model format from `2.15.0` can be loaded into `2.16.2`, but it's now considered a legacy format. To keep this migration "future-proof", the final step was to load the `.h5` models into `2.16.2` and re-save them in the updated `.keras` format.

The major Keras version jump broke metric serialization, so here I took advantage of the `recompile_metrics` option to recompile the models so that they can continue to be evaluated.

```python
# /// script
# requires-python = "==3.9.12"
# dependencies = [
#     "tensorflow==2.16.2",
# ]
# ///

import keras
from utils import migrate_models

if __name__ == "__main__":
    migrate_models(
        from_spec="2.15.h5",
        to_spec="2.16.keras",
        ext=".keras",
        # The storage format for metrics changed between Keras 2 and 3, so we need to
        # recompile them so that they can be successfully loaded for evaluation.
        recompile_metrics=(
            keras.metrics.MeanAbsoluteError(name="mae"),
            keras.metrics.MeanSquaredError(name="mse"),
        ),
    )
```

## Results and Limitations

After migration, a few test runs confirmed that the models successfully predict and evaluate in `2.16.2`, generating identical results to the original `2.13.0` runs -- mission accomplished. The only thing that was lost in the migration seems to be the learned weights for the Adam optimizer, meaning that warm-start training might take a few epochs to stabilize. There may be a way to preserve those weights across the major version change, but it wasn't a priority for our use case, so I didn't put much effort into it.

The final piece of the puzzle, since we track and retrieve models with [Weights and Biases](https://wandb.ai), was to identify and upload the new runs using [artifact aliases](https://docs.wandb.ai/models/registry/aliases), allowing us to match the devcontainer version to the model version.

[^still-old]: This is the current upper bounds for our project because we depend on the [seemingly-abandoned](https://github.com/tensorflow/io/issues/2160) [tensorflow-io](https://github.com/tensorflow/io) for HDF5 dataset support.
[^old-versions]: We rely on a number of cloud services within our software stack, so continuing to run an end-of-life Python is risky if there's a breaking change in the network API.
[^model-formats]: I never dug deep enough into the model formats to understand *why* the steps above were needed. Maybe that would reveal a simpler approach.