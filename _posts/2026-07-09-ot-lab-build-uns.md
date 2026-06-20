---
layout: post
title: "OT Homelab Build - UNS"
subtitle: "The truth, the whole truth, and nothing but the truth!"
date: 2026-06-09
description: "Building the Unified Namespace (UNS) system for the OT Homelab."
---

## Goals
1. a
2. b
3. c
4. d

## What is UNS?
A Unified Namespace (UNS) is more of an *idea* than a system itself but is often used to the MQTT broker that does the heavy lifting (discussed further down below). The idea is to have one, central, real time, structured data store from which every other system can take data from. Rather than connecting up systems indivdually, everything reads from and writes to the UNS. It has a few clear benefits:
1. **A single source of truth** - everyone is singing from the same hymn sheet, making your data more reliable across all your systems.
2. **More modularity** - you can more easily switch out a gateway, or PLC, or broker, without having to do massive reconfiguration.
3. **Much needed structure** - when you're working with different protocols (MQTT, OPC-UA, Modbus), they all present data differently. By unifying everything into a UNS system, everything follows the same naming convention.

### OPC-UA
It's worth delving into OPC-UA a bit more here, in case you haven't come across it before.
OPC-UA (Open Platform Communications - Unified Architecture) is a vendor netural protocol for moving data around in industrial networks. 
TODO: write more here

## Systems
### MQTT Broker (HiveMQ)
This is the brains of the UNS. Systems publish data to topics within it, others subscribe to the topics they care about. The publishers and subscribers never have to talk to each other, they don't need to know a thing about one another. They just need to know where the broker is, and what topics they want to publish or subscribe to.

The broker, however, isn't a database, nor a replacement for a historian. It only holds the last value of data, helping it to be lightweight and fast at its job. Once a value is updated, it doesn't care about what it was before.

### Gateway (NeuronEX)
You can think of the gateway as simply a translator. It reads the OPC-UA data from the PLC and sends it up to other services in whatever format you like. In my case, it sends the data up to the broker as MQTT, where it's stored for others to retrieve.

The flow ends up something like this:

`PLC  --OPC-UA--> Gateway --MQTT--> Broker`

> *Of course, it's the gateway that polls the PLC for the data, the PLC doesn't initiate the connection.*

## Docker Compose File