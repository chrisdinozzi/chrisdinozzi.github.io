---
layout: post
title: "SIEMENS S7-1200 PLC CPU Buyers Guide"
subtitle: "For hobbyists!"
date: 2026-05-07
description: "A guide to help people new to automation, OT, ICS, IACS, etc purchase an S7-1200 PLC CPU for a home lab."
---

I spent longer than I'd like to admit scrolling through eBay listings trying to work out which Siemens S7-1200 to buy. There are numerous variants and trip hazards that, as someone who’s not an automation engineer, caught me out a lot.

Now that I’ve picked up my own 1212C DC/DC/DC from eBay, this guide is what I wish I'd had when I began my search.

## The Part Number System

Every S7-1200 has a part number that tells you everything you need to know - if you know how to read it. Here's how to decode it.

Take `6ES7214-1AG40-0XB0` as an example:

| Segment | What it means |
| --- | --- |
| `6ES7` | Siemens SIMATIC S7 family |
| `214` | CPU model - 1211, 1212, 1214, or 1215 |
| `1` | S7-1200 subfamily indicator |
| `A` / `B` / `H` | Power input - A = DC, B = AC, H = DC (relay DO) |
| `G` / `E` | Hardware revision |
| `40` | Firmware generation - 40 = V4.x (current), 31 = V3.x (older) |
| `0XB0` | Hardware revision suffix |

For example, my PLC had the model number ‘6ES7 212-1AE40-0XB0’, which means it’s an S7 1212 with a DC power input and version 4 firmware.

As well as the model name, you might also see DC/DC/DC or AC/DC/RLY. The first part of this notation indicates the power input type, the third part indicates the digital output type. Read on to learn more!

Full model table from [Siemens](https://support.industry.siemens.com/cs/mdm/109797241?c=79924272651&lc=en-US).

## CPU Variants

There are four common CPU models of S7-1200 PLCs you’ll see online. For a hobby or learning rig, the differences come down to onboard I/O count. The main difference is the I/O - the number of Digital Inputs (DI), Digital Outputs (DO, or DQ as Siemens call it), Analogue Inputs (AI), and PROFINET (or Ethernet) ports.

| CPU | DI | DO | AI | Ethernet Ports | Notes |
| --- | --- | --- | --- | --- | --- |
| `1211C` | 6 | 4 | 2 | 1 | Enough for basic automation and learning. |
| `1212C` | 8 | 6 | 2 | 1 | Enough for a home lab, plus some head room. |
| `1214C` | 14 | 10 | 2 | 1 | Nice to have extra I/O, but comes at a higher price point. |
| `1215C` | 14 | 10 | 2 | 2 | Same I/O as 1214C but adds a second Ethernet port. |

For most, the 1211C or 1212C should be enough I/O if you’re just using it as a demo or research rig. It could be worth upgrading to the 1215C for the second Ethernet port but you’ll pay a premium to do so.

## Power Input

The PLC come in two different power input types - DC and AC. 

A DC unit can be powered by a 24VDC Power Supply Unit (PSU) - likely what you’d want if you're planning on using a 24VDC DIN rail mounted PSU. 

The AC unit requires mains, 100-240VAC. Be careful when scouring eBay, the AC units are often cheaper but may not be what you want.

## Output Type

The third part of the DC/DC/DC notation is the output type. This matters if you want to do anything interesting with the outputs beyond simple on/off switching.

### Transistor outputs (DC/DC/**DC**)

- Solid state, no moving parts
- Switches fast - capable of **PWM (Pulse Width Modulation)** at up to 100kHz
- Required for high-speed counter outputs and pulse train outputs
- The preferred choice for a learning rig

### Relay outputs (DC/DC/**RLY**)

- Relay outputs
- **Cannot generate PWM**
- Perfectly fine for simple on/off control
- Usually cheaper on the used market

## What to Avoid

- **AC input variants (B)** - unless you specifically need AC input, these complicate a DC panel build unnecessarily
- **Very old firmware (30/31 suffix)** - compatibility issues with newer versions of TIA Portal
- **Listings with no photos of the unit** - buy from sellers who show the actual hardware, ideally with LEDs visible
- **Deals that seem too good to be true** - they usually are!

## What to Look For

- **DC/DC/DC, 40 suffix** - ideal spec, works with the latest TIA portal, more modern DIs
- **Seller feedback 98%+** - look for sellers who clearly deal in automation equipment regularly with solid feedback
- **Photos showing the unit** - ideally the front face with RUN/STOP LED area visible
- **"Tested and working"** in the description - not a guarantee but better than nothing

## Final Thoughts
The S7-1200 is an excellent platform for hands-on learning - Modbus TCP, OPC-UA, S7comm, and PROFINET all in one box, programmable with TIA Portal software. The used market is active enough that a good unit comes up regularly - and if you’re willing to wait, you can snag a good deal.

The key is knowing what you're looking at before you bid. Decode the part number, check the seller feedback, and don't pay 1214C prices for a 1212C just because the listing title says "S7-1200."