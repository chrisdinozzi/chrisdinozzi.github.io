---
layout: post
title: "S7-1200 PLC Hardening Guide"
subtitle: "Doing what we should have done when we plugged it in."
date: 2099-10-07
description: "TODO"
--- 

- [Goals](#goals)

The over arching message of this post is as follows: If you don't need it, turn it off. If you need it, harden it.

It also should go without saying that being on the latest firmware will almost always put you in a better place - but firmware upgrades aren't always the quickest or easiest things on the factory floor.

## Goals

## PLC Project
1. Protect PLC Configuration Data
![](/blog/res/s7-1200-hardening-project-protect-config-data.png)

2. Access Control
![](/blog/res/s7-1200-hardening-project-access-control.png)

Can then set a different password for each access level

3. Secure PG/PC Communication
![](/blog/res/s7-1200-hardening-project-pg-pc-secure-comms.png)

4. Project Protection
Security Settings -> Project Protection

5. Password Policy
   

6. Firewall
Security Settings -> Security Features -> Firewall

1. Management ACL

2. Syslog

## Webserver/HTTP
If you don't need it, turn it off. If you *really* need it, there are a few controls we should consider.
1. HTTPS
Enforce HTTPS for the webserver 
General -> Webserver -> General -> Permit Access with only HTTPS

![Enabling HTTPS on the PLC](/blog/res/s7-1200-hardening-enable-https.png)

2. Manage your HTTPS certificate properly
If you have a Certificate Authoririty (CA) for your OT zones, then use it for the HTTPS certificate.

General -> Webserver -> Security -> Certificate Type: Software Downloaded
![Enabling custom uploaded certificate](/blog/res/s7-1200-hardening-https-cert.png)

Then upload your (TODO: why can't i sign a cert with a CA?)

3. User Accounts
User accounts with the minimum amount of permission required to do what needs done via the web instance.

General -> Webserver -> User mangagement

For instance, I've added a maintenance engineer role that can only really read things and flash the LEDs.

![A seperate user account](/blog/res/s7-1200-hardening-https-users-maint-eng.png)

![](/blog/res/s7-1200-hardening-https-maint-eng-access.png)

Create seperate admin account

![](/blog/res/s7-1200-hardening-https-users.png)

Remove all permissions from default account
![](/blog/res/s7-1200-hardening-https-users-everyone.png)

![](/blog/res/s7-1200-hardening-https-default-access.png)

4. Keep it far, far away from the internet
I don't really buy the line that people purposfully expose their PLCs to the internet because they're idiots. I think it's usally done unknowingly. But if you're thinking about doing it, please don't. If you need remote access, there's plenty of better ways than doing it across the internet. Try a VPN. Or a jump box.

## Modbus
If you don't need it, turn it off. If you *really* need it, then you should... well, actually, there's not a lot of options here.

You can start by whitelisting the IP that needs to talk to it. But you can only do that for one IP per Modbus server data block. I guess you could add a bunch of server blocks for each one you need?

![Whitelisting a remote IP address](/blog/res/s7-1200-hardening-modbus-remote-addr.png)

There actually isn't a lot that can be done to make Modbus more secure in itself. You'll need to rely on compensating controls, and a good dose of monitoring, to make yourself feel safe here.

## S7Comm
1. Disable PUT/GET Access

![](/blog/res/s7-1200-hardening-s7comm-disable-putget.png)

This now stops that S7Comm attack from the other post TODO: insert link

## OPC-UA
If you don't need it, turn it off. If you *really* need it, we have a good few controls we can use.
1. Security Policy
Use the strongest one you can, and make sure you do Sign & Encrypt, not just Sign. Ensure 'None' is disabled at the minimum.

![](/blog/res/s7-1200-hardening-opcua-policy.png)

2. Disable anonymous authentication.
Use username/password combinations, or certificates, for authentication.

![](/blog/res/s7-1200-hardening-opcua-disable-anon.png)

![](/blog/res/s7-1200-hardening-opcua-user.png)

3. Certificates

4. Granualar node/tag control
Assess each node or tag in its on right, and decide if it needs read/write/subscribe access. 

![](/blog/res/s7-1200-hardening-opcua-readonly-nodes.png)

5. ACL

![](/blog/res/s7-1200-hardening-opc-ua-recon.png)




## Checklist
### HTTP/Webserver
- [ ] Disable unneeded protocols and services
- [ ] Enable HTTPS and disable HTTP
- [ ] Use a proper certificate for HTTPS
- [ ] Create user accounts for web access
- [ ] Take your PLC off the internet

### Modbus
- [ ] Whitelist Modbus client/server IPs

### OPC-UA
- [ ] Disable the 'None' OPC-UA policy
- [ ] Enable the strong OPC-UA policies your other devices will support
- [ ] Disable anonymous OPC-UA access
- [ ] Remove write access from any tags/nodes that don't require it

## Final Thoughts
