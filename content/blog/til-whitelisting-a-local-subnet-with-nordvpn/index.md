+++
title = "TIL: Whitelisting a Local Subnet with NordVPN"
tags = ["til"]
description = "A hacky fix for NordVPN disconnecting shared drives on a local network in Windows."
date = "2024-11-17"
+++

<div style='background-color: darkred; border-radius: 10px; color: white; padding: 10px; font-weight: bold'>
UPDATE:

It looks like the bug that prevented connecting to mapped network drives is fixed as of NordVPN 7.39.1.0, and this workaround now causes issues with VPN connections. 

If you're still having issues with mapped drives, I suggest updating software first and only using this workaround as a last resort.
</div>

After a software update on my Windows machine, I noticed that connecting NordVPN disconnected some mapped network drives on my local network. I came across [an undocumented command](https://www.reddit.com/r/nordvpn/comments/x2d3t5/comment/imjlk0b/) that allows you to whitelist a subnet:

```bat
nordvpn-service.exe whitelist add subnet 192.168.1.0/24
```

Running this in the Nord directory (probably `C:\Program Files\NordVPN`) allows for local connections to any address between `192.168.1.0` and `192.168.1.255`. However, that doesn't persist through restarts[^registry].

To avoid having to manually rerun the command, I saved the script below into a `nord_whitelist.bat` file and set it up to run with a [scheduled task](https://learn.microsoft.com/en-us/windows/win32/taskschd/task-scheduler-start-page) on login, with admin privilege and a 3 minute delay to allow NordVPN to initialize first.


```bat
@echo off

start "" "C:\Program Files\NordVPN\nordvpn-service.exe" whitelist add subnet 192.168.1.0/24
```

The `@echo off` and `start ""` are just for cleanliness so that the command runs silently in a new window.

[^registry]: The suggestion in the linked Reddit comment to modify a registry path with the whitelist argument didn't work for me.