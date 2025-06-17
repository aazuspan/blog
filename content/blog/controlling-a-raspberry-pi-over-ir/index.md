+++
title = "Controlling a Raspberry Pi over IR"
date = "2025-06-16T17:47:33.020172"
description = "Using a TV remote to control a browser using LIRC, irexec, and xdotool, automated with Ansible."
tags = ["hardware", "ansible"]
+++

I have a digital photo frame running on a Raspberry Pi hooked up to a small TV, and want an easy way to control playback. I already need a remote for the TV, so why not use that? Below I'll go through the setup process I used to turn IR commands into key presses on a Pi running Bookworm, including an Ansible playbook for automating setup.

## Manual Setup

### The Hardware

The first thing we need is an IR receiver to physically sense the infrared signals broadcast by the remote. I scavenged one from a broken DVD player, but if you had to buy one, they're [pretty cheap](https://www.adafruit.com/product/157).

Next, I wired that up to 5V and a GPIO pin from the Pi header, and we're all set to move to software land.

### Configuration

I set up a Raspberry Pi running the full Pi OS and installed a couple necessary packages. [LIRC](https://www.lirc.org/) parses IR commands from the receiver and exposes them to user space, while [xdotool](https://github.com/jordansissel/xdotool)[^xdotool] simulates key presses, which is how I'll be controlling the browser-based slideshow.

```bash
sudo apt install lirc xdotool
```

Adding the following line[^dtoverlay] to the boot configuration at `/boot/firmware/config.txt` enables kernel support for the IR receiver on the connected GPIO pin:

```bash
dtoverlay=gpio-ir.gpio_pin=18
```

Remote IR codes vary between manufacturers and models, so LIRC needs a configuration file to know which codes correspond to which buttons for a given remote. I found a close match to my remote in the [LIRC database](https://lirc-remotes.sourceforge.net/remotes-table.html) and moved it to `/etc/lirc/lircd.conf.d`, where LIRC can automatically find it.

After a reboot, running `irw` and pressing some buttons while pointed at the receiver should result in correctly parsed commands:

```bash
$ irw

```

Next, we need a [config file](https://www.lirc.org/html/configure.html#lircrc_format) for [irexec](https://www.lirc.org/html/irexec.html). This is where the magic of turning parsed commands into key presses happens, and it's as simple as registering input commands like `KEY_LEFT` to output commands like `xdotool key Left`.

```text
begin
    prog   = irexec
    button = KEY_LEFT
    config = xdotool key Left
end
```

The last step is to start running `irexec` in the background on startup, which I did by putting the following line in `/etc/xdg/lxsession/LXDE-pi/autostart`:

```text
@irexec
```

With that, we've got IR command of the keyboard. For my setup, the left and right arrows navigate backward and forward, the up arrow brings up file metadata, and the play and pause buttons toggle playback.

## Automating with Ansible

To avoid having to manually run that configuration again in the future, I automated the setup with Ansible.

Here's my inventory that defines the target and some basic configuration:

```yaml
---
clients:
  hosts:
    pi:
      ansible_host: 192.168.0.0
      ansible_user: pi
      remote_file: AKB74475403.lircd.conf
      gpio:
        ir: 18
```

And the playbook that duplicates the manual configuration steps from above:

```yaml
---
- name: Setup Raspberry Pi for IR Remote Control
  hosts: clients
  gather_facts: false
  tasks:
    - name: Install packages
      become: true
      ansible.builtin.apt:
        update_cache: true
        pkg:
          - lirc
          - xdotool

    - name: Enable GPIO in boot config
      become: true
      ansible.builtin.lineinfile:
        path: /boot/firmware/config.txt
        line: dtoverlay=gpio-ir.gpio_pin={{ gpio.ir }}

    - name: Copy remote file
      become: true
      ansible.builtin.copy:
        src: {{ remote_file }}
        dest: /etc/lirc/lircd.conf.d
        owner: root
        group: root
        mode: "0644"

    - name: Configure irexec
      ansible.builtin.copy:
        src: lircrc
        dest: /home/{{ ansible_user }}/.config/lircrc
        owner: "{{ ansible_user }}"
        group: "{{ ansible_user }}"
        mode: "0644"

    - name: Autostart irexec
      become: true
      ansible.builtin.lineinfile:
        path: /etc/xdg/lxsession/LXDE-pi/autostart
        line: "@irexec"

    - name: Reboot to apply config
      become: true
      ansible.builtin.reboot:
```

[^xdotool]: `xdotool` doesn't support Wayland. There are alternatives like `dotool` and `ydotool` if you need Wayland, but you have to build them yourself. 

[^dtoverlay]: You can have multiple `dtoverlay=*` lines in your configuration, so if it already exists just add another.
