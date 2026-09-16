---
layout: post
title: "Modbus MitM Attacks"
subtitle: "'Trust me bro, I'm totally the real server bro, trust me bro.'"
date: 2099-09-30
description: "TODO"
--- 

- [Goals](#goals)
- [What even is a MitM attack??](#what-even-is-a-mitm-attack)
- [Performing an ARP Spoof (or ARP Poison)](#performing-an-arp-spoof-or-arp-poison)
- [Sniffing Traffic](#sniffing-traffic)
- [Modifying Traffic](#modifying-traffic)

## Goals
1. Understand how Modbus is vulnerable to MitM attacks
2. Successfully perform ARP spoofing to sniff Modbus traffic
3. Modify traffic on the wire to cause chaos in the factory

As part of this, I developed a Modbus MITM tool called [MoPI](https://github.com/chrisdinozzi/modbus-mitm) (Modbus Packet Injector). It isn't overly robust but does the job of demonstrating these attacks.

## What even is a MitM attack??
A Man-in-the-Middle (MiTM) attack is exactly what it sounds like. Instead of talking to a device directly, you wedge yourself in between two systems that are having a conversation, so all their traffic flows through you first. Once you're sat in the middle, you can read what's going past, and - if you fancy it - quietly change it before passing it along. Neither side is any the wiser; as far as they're concerned, they're still talking to each other like normal.

Of course, there are ways of detecting these attacks, but lets not dwell too much on that! ;)

On a technical level, this is done by sending [ARP](https://www.geeksforgeeks.org/ethical-hacking/how-address-resolution-protocol-arp-works/) requests out into the network that are full of lies. You tell device A that you are device B, and you tell device B that you are device A. You keep doing it, over and over, so they never forget. 

![https://www.expressvpn.com/blog/address-resolution-protocol/](/blog/res/modbus_mitm_arp_spoof.png)

So how do you actually perform ARP spoofing?

## Performing an ARP Spoof (or ARP Poison)
Tools like [ettercap](https://www.ettercap-project.org/) make ARP spoofing super easy.

But, if we want to start scripting things, [scapy](https://scapy.net/) if our friend. I used the python library to write a tool that let's us perform arp spoofing, watch the traffic go by, and even modify it on the fly.

To begin, this is the code block that spoofs arp.

``` python
def arp_spoof_loop(iface, client_ip, client_mac, server_ip, server_mac, own_mac, stop_event, interval=2):
    while not stop_event.is_set():
        # Tell client that we are the server
        pkt1 = Ether(dst=client_mac, src=own_mac) / ARP(
            op=2, pdst=client_ip, hwdst=client_mac, psrc=server_ip, hwsrc=own_mac
        )
        # Tell server that we are the client
        pkt2 = Ether(dst=server_mac, src=own_mac) / ARP(
            op=2, pdst=server_ip, hwdst=server_mac, psrc=client_ip, hwsrc=own_mac
        )
        sendp(pkt1, iface=iface, verbose=0)
        sendp(pkt2, iface=iface, verbose=0)
        stop_event.wait(interval)
```

It sends a packet to the client telling it, "Hey, it's me, server, here's my MAC address,". Notice that the source MAC address is ours (attacker) but the source IP is the servers. This causes the client is associate our MAC address with the servers IP. Therefore, when they go to send a packet to the server, they look up the MAC address in the ARP table using the IP and get back our MAC address, thus sending the packet to us.

The same thing happens the other way. We send another packet to the server, and associate our MAC address with the clients IP.

Now the server thinks we're the client and the client thinks we're the server. Perfect.

## Sniffing Traffic
To do this with MoPI, we'll run the below command:

`sudo python3 mopi.py -i eth0 -c 10.0.0.5 -s 10.0.0.10 --mode passive`

This runs the tool is sniffing (passive) mode and lets us inspect the modbus traffic between `10.0.0.5` and `10.0.0.10` (PLC).

Now that we've poisined the victims, it's as easy as opening up Wireshark and listening on the network interface.

TODO: get gif of looking at traffic in wireshark

We can also watch it in the tool.

TODO: get gif of traffic in MOPI

## Modifying Traffic
It's all well and good looking at data, but this type of data really isn't that interesting. What's much more fun is modifying the data.

To do that, we'll need to grab the packet, modify it, redo the checksum and send it along on its way.

