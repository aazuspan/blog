+++
title = "Building Autoencoders with Scikit-Learn"
date = "2025-04-26T14:33:28.364727"
description = "How to hack a multi-layer perceptron into a fully-featured autoencoder."
tags = ["python", "deep-learning"]
+++

[scikit-learn's](https://scikit-learn.org/stable/) support for deep learning is [pretty limited](https://scikit-learn.org/stable/modules/neural_networks_supervised.html), but it does offer just enough functionality to build a usable [autoencoder](https://en.wikipedia.org/wiki/Autoencoder). It won't give you the flexibility or performance of a GPU-backed implementation in Pytorch or Tensorflow, but if you're working with small datasets and need a lightweight dependency, it'll do the job.

*This post was inspired by [a Gist](https://gist.github.com/golamSaroar/16b22c2c3d56509edd8f9fc6160b6b3e) by [@golamSaroar](https://github.com/golamSaroar) that demonstrated the basic functionality of an MLP autoencoder.*

## What's an Autoencoder?

An autoencoder is an unsupervised network -- rather than predicting labels from features, its goal is to reconstruct features by transforming to and from a latent space. To minimize reconstruction loss, the network needs to learn an encoding that preserves salient features and discards redundant information, making the latent space an effective dimensionality reduction (or lossy compression) of the input data. 

An autoencoder has two components: an encoder that transforms data into that reduced latent space, and a decoder that inverts the transformation from latent space back to the original dimensionality. In the simplest implementation of a shallow autoencoder, those transformations are just single linear layers, making the network a special case of a multi-layer perceptron.

`scikit-learn` can make a [multi-layer perceptron](https://scikit-learn.org/dev/modules/generated/sklearn.neural_network.MLPRegressor.html).

## Building an MLP Autoencoder

By training an `MLPRegressor` with one hidden layer (the latent space) to reproduce its training features, we have an autoencoder out-of-the-box. It lacks some functionality, but we'll work on that later.

```python
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPRegressor

# Load raveled MNIST digits without their labels
X, _ = load_digits(return_X_y=True)
X_train, X_test = train_test_split(X, test_size=0.2)

# Create an autoencoder by training an MLP to reproduce its training features
ae = MLPRegressor(hidden_layer_sizes=(8,), max_iter=2000)
ae.fit(X_train, X_train)
```

Training the model with 64 features -- the flattened pixels of 8x8 mini MNIST digits -- and a latent space of just 8 features produces a shallow autoencoder that can reconstruct unseen data with reasonable accuracy. Similar digits start to blend together, but they're still largely recognizable despite a ~90% dimensionality reduction in the latent space.

{{<figure src="mnist.png">}}

It's a working autoencoder, but it's missing a few features.

## Improving the API

By building our autoencoder with an `MLPRegressor`, we have access to `scikit-learn's` **estimator** API. The `predict` method passes new samples through the network, but we don't have independent access to the encoder and decoder components, making it hard to utilize the latent space for dimensionality reduction or compression. To expose that functionality, we can wrap the MLP autoencoder into a **transformer** that transforms (encodes) features into latent space and inverse-transforms (decodes) from the latent space.

A fit `MLPRegressor` exposes the weights and biases of its neurons with `coefs_` and `intercepts_` attributes. With a single hidden layer, the model has two sets of each, representing the encoder and decoder parameters. Applying some simple vector math and an activation function is all that's needed to manually move data through the network.

```python
from sklearn.neural_network._base import inplace_relu
import numpy as np

encoded = X_test @ ae.coefs_[0] + ae.intercepts_[0]
inplace_relu(encoded)

decoded = encoded @ ae.coefs_[1] + ae.intercepts_[1]

# ((360, 64), (360, 8), (360, 64))
print(X_test.shape, encoded.shape, decoded.shape)
```

With that proof of concept, we can package this all together to create a custom autoencoder transformer:

```python
from sklearn.base import BaseEstimator, TransformerMixin


class ShallowAutoencoder(BaseEstimator, TransformerMixin):
    """
    An autoencoder that transforms to and from a latent space.

    Adapted from https://gist.github.com/golamSaroar/16b22c2c3d56509edd8f9fc6160b6b3e
    """
    def __init__(self, latent_dim=8, **mlp_kwargs):
        self.latent_dim = latent_dim
        self.mlp_kwargs = mlp_kwargs

    def fit(self, X, y=None):
        """Fit the autoencoder to reconstruct X."""
        mlp = MLPRegressor(
            hidden_layer_sizes=(self.latent_dim,),
            **self.mlp_kwargs,
        ).fit(X, X)

        # Split the weights and biases into the encoder and decoder layers
        self.encoder_weights_, self.decoder_weights_ = mlp.coefs_
        self.encoder_biases_, self.decoder_biases_ = mlp.intercepts_
        self.reconstruction_loss_ = mlp.loss_

        return self

    def transform(self, X):
        """Encode data into the latent space."""
        latent = X @ self.encoder_weights_ + self.encoder_biases_
        inplace_relu(latent)
        return latent
    
    def inverse_transform(self, X):
        """Decode data from the latent space."""
        return X @ self.decoder_weights_ + self.decoder_biases_
```

## Experiments in Latent Space

The ability to move back and forth between feature and latent space opens up a lot of possibilities, like visualizing the clustering of MNIST digits in 2D space...

```python
ae = ShallowAutoencoder(latent_dim=2, max_iter=2000).fit(X_train)

latent = ae.transform(X_test)
```

{{<figure src="mnist_2d.png">}}

...or generating new digits by decoding randomly sampled coordinates in latent space[^variational]...

```python
ae.inverse_transform(np.random.normal(latent.mean(), latent.std(), size=(2)))
```

{{<figure src="rand.png">}}

...or predicting unseen digits by finding nearest neighbors in latent space:

```python
knn = KNeighborsClassifier().fit(ae.transform(X_train), y_train)
knn.predict(ae.transform(X_test))
```

## Closing Thoughts

Can you build a fully-featured autoencoder in `sklearn`? Yeah, definitely. The CPU-bound matrix math may be a performance bottleneck with large datasets, and you might miss the convenience and flexibility of dedicated deep-learning frameworks, but if your priority is a lightweight install, it's a valid alternative.

[^variational]: An autoencoder's latent space isn't normally distributed, so sampling coordinates is problematic without using a modification like the [variational autoencoder](https://en.wikipedia.org/wiki/Variational_autoencoder). Unfortunately, that's probably outside the scope of a practical `sklearn` implementation.