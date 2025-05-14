+++
title = "Replacing My Guitar Amp with a Neural Net"
tags = ["audio", "hardware", "deep-learning", "neural-amp-modeler"]
description = "Training a WaveNet CNN to simulate a vintage tube amp with Neural Amp Modeler."
date = "2024-10-28"
+++

Vacuum tubes are an expensive, inefficient, and unreliable relic of early 1900s technology. So why are guitarists (and me) still lugging around old tube amps 80 years after the transistor made them obsolete? The short answer is that tube amps sound good when you overload their input signal, and transistor amps don't[^long-answer].

So, I can't just swap my tubes for transistors one-to-one and get the same tone in an amp. But could I replace my tubes with a few *billion* transistors in a GPU running an open-source neural network trained to sound like my amp? 

Let's find out.


## The Model

The neural network I'm using is called [WaveNet](https://arxiv.org/abs/1609.03499), a convolutional neural net (CNN) developed at Google DeepMind for speech synthesis. Conv nets work by applying convolution kernels to signals (typically 2D in an image context, but they can also run in 1D for audio or other time series data), creating deep representations of input signals that can be used to classify or predict new signals. WaveNet works in 1D on a stream of audio samples, and includes some clever modifications on the typical CNN architecture like causal convolutions that integrate only past samples into each prediction, and atrous convolutions that allow it to look at a wider set of samples, and therefore a longer audio time series, by skipping over neighboring samples.

While it was originally designed for speech synthesis, it turns out that WaveNet can also model the unique characteristics of guitar amps, taking a raw guitar input and predicting an amplified output. To train the WaveNet, I'm using [Neural Amp Modeler](https://www.neuralampmodeler.com/) (NAM), an MIT-licensed open source project which includes a [Pytorch implementation](https://github.com/sdatkinson/neural-amp-modeler) of the model along with plugins for running trained models.

## The Training Data

Training a WaveNet to recreate a guitar amp requires two things:

1. A raw audio input signal.
1. A recording of that signal played through an amp.

You could technically use any input signal, but NAM includes an [audio file](https://www.google.com/url?q=https%3A%2F%2Fdrive.google.com%2Ffile%2Fd%2F1KbaS4oXXNEuh2aCPLwKrPdf5KFOjda8G%2Fview%3Fusp%3Ddrive_link) that was designed to capture all the nuances of an amp with about 3 minutes of frequency sweeps, random noise, etc. To record that signal, I loaded it into my DAW, patched an output from my audio interface through a reamp box into my amp, and mic'ed it with an SM57[^mic] to complete the round trip back to my DAW.

{{<figure src="mic.jpg" caption="An SM57 recording my weird, custom amp that I converted from a vintage reel-to-reel tape player.">}}

After about 3 minutes of unpleasant loud chirps and beeps, I've got two WAV files[^wav] that (theoretically) describe all the characteristics of my amp, ready to train a WaveNet.

### Training the WaveNet

NAM offers a [premade Colab notebook](https://colab.research.google.com/github/sdatkinson/NAMTrainerColab/blob/main/notebook.ipynb#scrollTo=5CQleTk7GJV8) that you can use to train a WaveNet model for free in about 10 minutes. You can get more control of model parameters with the Python API, but I found the defaults worked great, and it's hard to argue with convenience.

I loaded the input and output WAV files into the notebook, set the metadata, and clicked go. About 10 minutes and 100 epochs[^epochs] later, it spit out a [`.nam` model file](/misc/AkaiM8-G10-Overdrive.nam) with all the model weights, as well as some validation metrics.

{{<figure src="akai m8 - overdrive.png" caption="I don't know what this means, but I like that the lines are close together.">}}

## How Does it Sound?

With the NAM plugin installed, using the trained model just requires downloading it from Colab and pointing the plugin to it.

For an A-B test comparison, I recorded a guitar track and exported two versions - one reamped through my amp with the same mic setup I used for training, and another modeled by my trained WaveNet. If you want a challenge, you can try to guess which is which below (answer in the footnotes[^ab]).

{{<audio src="akai overdrive nam.wav" title="Sample A:">}}

{{<audio src="akai overdrive amp.wav" title="Sample B:">}}

## WaveNet vs. Vacuum Tubes

So, has the transistor finally killed the tube amp? Maybe, depending on your priorities.

- **Tone**: There's no question that the WaveNet does a *very* good job reproducing my amp's recorded tone, and would be indistinguishable in a mix with other instruments. With that said, most guitarists are used to hearing their amp directly rather than through a microphone, so that change might take some getting used to.
- **Cost**: If you're just modeling one amp that you already own, there's obviously no cost savings to replacing it with a WaveNet, especially if you don't already have the necessary gear like a recording interface. But if you consider the hundreds of [free NAM models](https://tonehunt.org/models?tags%5B0%5D=nam) available that would cost a fortune to physically recreate, it starts to look like a bargain.
- **Reliability**: A WaveNet model won't ever fail due to burned out tubes or dried out capacitors, but an amp won't crash or overload your CPU[^cpu]. For studio recording, I'd go WaveNet. For live performance, you might want to stick with hardware.
- **Convenience**: For some casual strumming, turning on a tube amp and plugging in is definitely easier for me than turning on my computer and interface and starting up the NAM plugin. But for recording, I'd say that WaveNet takes the win. No time spent warming up tubes or setting up microphones -- just record straight into the interface and choose an amp.
- **Flexibility**: At a glance, it's hard to compete with WaveNet's ability to toggle through hundreds of amps within seconds; there's no question that WaveNet wins for the sheer range of options available. But within that range, WaveNet's options are pretty coarse. With a physical amp, you can make thousands of micro-adjustments to tone by tweaking controls, swapping mics, fine-tuning mic placement, etc. All of those choices are permanently baked into a trained WaveNet model. You can always train multiple models to cover your favorite configurations, but experimenting is definitely easier with a physical amp.

## TL;DR

For bedroom studio use, playing with headphones, or just exploring hundreds of different amp tones, WaveNet is pretty incredible, and NAM makes it an easy no-code option. 

For gigging or casual playing, it's still hard to beat the simplicity of a physical tube amp (although efforts like [GuitarML](https://guitarml.com/pedals.html) to port WaveNet and other models into embedded open-source hardware might close that gap).

[^long-answer]: The long answer, which I don't fully understand, involves non-linear response curves and even-order harmonics.

[^mic]: It's important to note that the WaveNet will learn to recreate whatever output you give it, which includes everything from the amp settings to the speaker to the microphone choice and placement. You may want to try reamping some guitar with the same setup to make sure you're getting the sound you're after. 

[^wav]: Note that the output file needs to be mono and identical in length to the input. The volume of the output signal will also be modeled by the WaveNet, so you should probably aim for something close to unity gain.

[^epochs]: I actually trained two models, one with 100 epochs and another with 700 epochs. Despite a slight improvement in validation loss in the 700-epoch model (ESR dropped from 0.005 to 0.003), I couldn't detect any audible difference between the two.

[^ab]: A) modeled with WaveNet, B) recorded from the amp.

[^cpu]: Running NAM requires a decent CPU, but it doesn't need to be top-of-the-line. My old Intel i7-8700 is able to keep up, aside from an occasional stutter. You can also train lighter-weight models in Colab, at the expense of some fidelity.
