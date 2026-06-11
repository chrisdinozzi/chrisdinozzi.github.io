---
layout: post
title: "OT Homelab Design"
subtitle: "The what and the why"
date: 2026-06-25
description: "The design of my OT Security homelab including hardware, networking, and software."
---
## Goals
In building my OT lab, I had a few goals in mind:
1. Learn more about industrial equipment and wiring
2. Create a playground for learning and testing
3. Build a platform to demonstrate OT attacks and risks

## The Hardware
### PLC
I picked up a second hand **S7-1200 DC/DC/DC CPU** for my build. I wanted to go with real industrial gear, rather than something like a ClickPLC, to make the build more realistic. It also gave me an opportunity to get hands on with one of the most popular PLCs on the market.

Of course, the S7-1200 isn't cheap if you're buying brand new, but with a bit of patience, I ended up getting a pretty good deal on eBay, picking mine up in near mint condition. If you want to do the same, check out my [buyers guide here](https://cdino.net/blog/2026/s7-1200-plc-cpu-buyers-guide/).

### PSU
The PSU was another second hand pick up. I found a **SITOP PSU100L** going cheap and snagged it at a good price. It is overkill for this build but a deal's a deal, and it matches the PLC nicely.

All you really need is a way of supplying 24VDC - for most people, a couple amps should be fine.

### Switch
The **Weidmuller IE SW BL05 STX** was another eBay find. Truthfully, I thought I was getting a managed switch (shame on me for not doing my research!) but I'm still glad I picked it up, as having a din rail mounted switch looks quite smart.

It provides a convenient way of connecting other computers and devices into my factory network.

### Server
I used a **Thinkcentre M710Q MiniPC** I had laying around. It does the job of running a handful of VMs just fine, it's quiet, and doesn't draw too much power.

### BOM
This table encompasses nearly all of the parts of my build. All the links are for UK sites.

| **Item** | **Link** | **Notes** |
|----------|----------|-----------|
| Siemens S7-1200 CPU | | I got the DC/DC/DC variant with 4.x firmware - IMO the best option for hobbyists. The DC/DC/DC model runs entirely on 24VDC which keeps the wiring simpler and safer. |
| 24VDC PSU | | I picked up a Siemens SITOP PSU100L on eBay - massively overspecced for this project, but I got it cheap and it's built like a tank. Any PSU that can supply 24VDC at a couple of amps will do the job. You'll also need a way to power it from mains - I stripped a kettle lead and wired it straight in. |
| DIN Rail | [RS Components (500mm)](https://uk.rs-online.com/web/p/din-rails/0467406) | I used a 250mm rail on the top for power components and a 500mm rail on the bottom for everything else. |
| Piece of wood | | A 12×500×500mm sheet of ply that I had cut at my local B&Q for a fiver. Does the job. |
| Green LED Push Button | [eBay](https://www.ebay.co.uk/itm/297362516760?var=594872514861) | Works as both input and output - the LED is wired to a PLC output, the button to an input. I wired it as NC (normally closed). |
| Red LED Push Button | [eBay](https://www.ebay.co.uk/itm/297362516760?var=594872514866) | Same as above. Wired as NO (normally open). |
| 24VDC Fan | [Amazon](https://www.amazon.co.uk/dp/B0DPQKPLF9?ref=ppx_yo2ov_dt_b_fed_asin_title) | Simple on/off fan as a physical output to demonstrate control. Could be swapped for a PWM fan if your PLC supports it. |
| Terminal Blocks | [RS Components](https://uk.rs-online.com/web/p/din-rail-terminal-blocks/2624161) | Used for distributing power and routing signals around the panel. I bought 20 and used most of them. |
| Jumper Bars | [RS Components](https://uk.rs-online.com/web/p/din-rail-terminal-accessories/0102374) | For bridging power across adjacent terminals. Cut them down to the length you need. |
| MCB | [RS Components](https://uk.rs-online.com/web/p/mcbs/2650204) | Adds overcurrent protection and doubles as a clean on/off switch for the whole panel. Worth having. |
| Earth Terminal Blocks | [RS Components](https://uk.rs-online.com/web/p/din-rail-terminal-blocks/8725628) | For earthing the PLC, PSU, and DIN rails. Don't skip this. |
| Red Wire | [Amazon](https://www.amazon.co.uk/dp/B0FQP5QHZ7?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1) | +24VDC. I bought 10m. |
| Black Wire | [Amazon](https://www.amazon.co.uk/dp/B0FQP6H7Z7?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1) | 0VDC. I bought 10m. |
| Ground Wire | [Amazon](https://www.amazon.co.uk/dp/B01MYBMAQ5?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1) | Earth/ground connections. |
| Bootlace Ferrules* | | Highly recommended - they make a much cleaner and more reliable connection in spring terminals than bare wire ends. Get a crimper to go with them. |
| Button Box* | [Amazon](https://www.amazon.co.uk/dp/B07WH9VJZ5?ref=ppx_yo2ov_dt_b_fed_asin_title) | Plastic enclosure for mounting the buttons neatly on the panel. |
| Wire Duct* | [CEF](https://www.cef.co.uk/catalogue/products/4349444-25mm-x-25mm-open-slotted-trunking-grey-2m-length) | Slotted trunking to keep wiring tidy and routed cleanly. Makes the build look the part. |
| Mini PC / Server* | | For running the SCADA, gateway, MQTT broker, and firewall. I used a Proxmox server with VMs, but any Linux machine will do. |
| Network Switch* | | To connect the PLC, server, and laptop on the factory network. I grabbed a Weidmüller IE SW BL05 STX unmanaged switch - it was a random eBay find. A managed switch would give you a lot more to play with from a security perspective, but costs accordingly. |
| Stand* | [Amazon](https://www.amazon.co.uk/dp/B0B6VKS7DJ?ref=ppx_yo2ov_dt_b_fed_asin_title) | A monitor stand to prop the board up at a sensible angle. |

### Diagram
Below is a simple drawing of my hardware set up with wiring. It's not the prettiest thing but it should give you a rough idea of how everything is wired up.

![A simple diagram of the hardware and wiring](/blog/res/ot-lab-hardware-wiring.png)

This diagram is just for the buttons, since it isn't clear from the pictures or diagrams as to how they're wired. It's a very standard set up.

![A simple diagram of the button wiring](/blog/res/ot-lab-button-wiring.png)


## The Network
### Segments
I split my network into three segments - Factory/OT, DMZ, and IT.

The Factory network is where the PLC and switch live.

The DMZ network hosts the SCADA, UNS, and any other industrial systems.

The IT network hosts read-only systems like dashboards.

This is to mirror what is commonly found in industrial networks, where the OT network is separated from the IT network via a DMZ, and any traffic wanting to travel from IT<->OT has to first go through the DMZ.

|Network|IP/Subnet|Purpose|
|-------|---------|-------|
|OT/Factory|10.0.0.0/24|Host industrial devices|
|DMZ|172.16.1.0/24|Host systems that need to speak to IT and OT|
|IT|192.168.0.0/22|Host IT Systems|


> *Why don't you put the SCADA system in the OT network?*

Good question, and you totally could. I might even do that in the future. In reality, it depends on your company, past network design decisions, and business requirements. There's never a 'one-size-fits-all' for network design - it will *always* be at the behest of the business, even if it's unwise.

### Diagram
![Network Diagram](/blog/res/ot-lab-network-diagram.png)

## The Systems
### Factory/OT
There aren't many systems to speak of in the factory portion of the network, but there are a few services worth mentioning.

The PLC exposes a few different services, including:
- **OPC-UA Server** - this can be used to read, write, and subscribe to tags on the PLC.
- **Modbus Server** - configured via a `MB_SERVER` block in the PLC code. Allows coils and registers to be read from and written to by a modbus client
- **HTTP Server** - exposes information about the PLC, and can also be used to administrate it
- **S7comm** - Siemens' own, proprietary protocol

All these services can pose their own risks to the system (depending on how well configured/hardened they are) and will be explored further in the "Attack" portion of this series.


### DMZ
The DMZ is where the data actually starts moving around. Everything here runs in Docker on a single Ubuntu Server VM (project name `factory-homelab`), which keeps it tidy and easy to tear down and rebuild when I inevitably break something.

- **HiveMQ CE** - the community edition of the HiveMQ broker. 
- **NeuronEX** - a gateway that can read OPC-UA from the PLC and send it to HiveMQ as Sparkplug B.
- **Ignition** - the SCADA system. I used the [Maker Edition](https://inductiveautomation.com/ignition/maker-edition) which is free!
- **Caddy** - reverse proxy for serving applications over pretty subdomains, and providing HTTPS.

I wanted Ignition to be able to subscribe directly to the gateway via MQTT, but the plugin required to do that does not support maker edition. Therefore, I had to compromise and have the SCADA system connect directly to the PLC over OPC-UA, breaking the UNS best practice.


So how does a value actually get from a button on my panel up to a dashboard? Roughly like this:

> A tag changes on the **PLC** (say the fan kicks on). NeuronEX is polling that tag over **OPC-UA**, sees the change, and publishes it to **HiveMQ** as a **Sparkplug B** message. From there anything subscribed to the broker can pick it up.

That last part - "anything subscribed can pick it up" - is the whole point of a UNS, and it's what the IT segment takes advantage of.


### IT
The IT network is the cheap seats. These are the read-only consumers - they're allowed to watch the plant, but they've no business touching it. That's the entire reason this stack lives up in IT rather than down in the DMZ or OT: it only ever pulls data, never pushes it.

It's another Ubuntu Server VM running four things in Docker:

- **Telegraf** - subscribes to the broker and scrapes the values it cares about back off the UNS.
- **InfluxDB** - stores them as time-series data, so I've got history rather than just a live snapshot.
- **Grafana** - draws the pretty pictures - fan state, the LEDs, operating mode, that sort of thing.
- **Caddy** - reverse proxy for serving applications over pretty subdomains, and providing HTTPS.

This part of the network is for the enterprise folk who need to see the data, but should never be able to write anything back down the network.