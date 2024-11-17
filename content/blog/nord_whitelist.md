+++
title = "TIL: Whitelisting a Local Subnet with NordVPN"
tags = ["til"]
description = "A hacky fix for NordVPN disconnecting shared drives on a local network in Windows."
date = "2024-11-17"
+++

After a software update on my Windows machine, I noticed that connecting NordVPN disconnected some mapped network drives on my local network. I came across [an undocumented command](https://www.reddit.com/r/nordvpn/comments/x2d3t5/comment/imjlk0b/) that allows you to whitelist a subnet:

```bat
nordvpn-service.exe whitelist add subnet 192.168.1.0/24
```

Running this in the Nord directory (probably `C:\Program Files\NordVPN`) allows for local connections to any address between `192.168.1.0` and `192.168.1.255`. However, that doesn't persist through restarts[^registry].

To avoid having to manually rerun the command, I saved the script below into a `nord_whitelist.bat` file and set it up to run with a [scheduled task](https://learn.microsoft.com/en-us/windows/win32/taskschd/task-scheduler-start-page) on login, with a 3 minute delay to allow NordVPN to initialize first.


```bat
@echo off

start "" "C:\Program Files\NordVPN\nordvpn-service.exe" whitelist add subnet 192.168.1.0/24
```

The `@echo off` and `start ""` are just for cleanliness so that the command runs silently in a new window.

[^registry]: The suggestion in the linked Reddit comment to modify a registry path with the whitelist argument didn't work for me.