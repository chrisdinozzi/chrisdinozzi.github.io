---
layout: post
title: "OT Systems and Network Hardening (OT Security Lab Pt. 8)"
subtitle: ""
date: 2099-10-14
description: "TODO"
--- 

- [Goals](#goals)
- [PLC](#plc)
- [Firewall](#firewall)
- [Ignition (SCADA)](#ignition-scada)
- [Industrial Gateway](#industrial-gateway)
- [Historian](#historian)
- [Checklist](#checklist)
- [Final Thoughts](#final-thoughts)

## Goals

## PLC
I covered hardening a S7-1200 in more depth in this article.

## Firewall
This is the biggest bang for our buck here. We set up the firewall but never actually put in place any rules, just an 'ANY ANY' across all the interfaces. So lets write some rules.

The easiest way to do this is to figure out who needs to talk to who over which ports in which directions, add the rules in one by one (keeping our any/any rule), and tweak them until no required traffic is hitting the any/any rule.

|**Source**|**Destination**|**Port**|
|----------|---------------|-------|
|Grafana (192.168.1.3)|Historian (172.16.1.10)|8181/TCP|
|Gateway (172.16.1.10)| PLC (10.0.0.10)| 48540/TCP|
|SCADA (172.16.1.10) | PLC (10.0.0.10) | 4840/TCP

## Ignition (SCADA)

## Industrial Gateway

## Historian


## Checklist
- [ ] x
- [ ] Y
- [ ] Z

## Final Thoughts
