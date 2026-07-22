---
layout: post
title: "OT Homelab Build - OPC-UA Scanning"
subtitle: "Knock Knock. Who's there? None/None."
date: 2099-07-29
description: "Analysing security controls in OPC-UA servers and what we can learn by scanning them"
--- 

- [Goals](#goals)
- [Why Secure your OPC-UA Server](#why-secure-your-opc-ua-server)
- [OPC-UA Server Security Controls](#opc-ua-server-security-controls)
  - [Security Policies](#security-policies)
  - [Security Mode](#security-mode)
  - [User Authentication](#user-authentication)
    - [Guest / Anonymous](#guest--anonymous)
    - [Username and Password](#username-and-password)
    - [Certificates](#certificates)
- [Scanning OPC-UA Servers](#scanning-opc-ua-servers)
  - [Tooling](#tooling)



## Goals
1. Understand the security controls commonly found on an OPC-UA server
2. Understand the pros and cons of said security controls and why you would or wouldn't want to use them
3. Understand how a lack of security controls can lead to major vulnerabilities in the system

## Why Secure your OPC-UA Server
Your OPC-UA server is full of data, assigned to different tags. You want to be able to control who or what can access those tags to read (or even write) to them. You also want to be able to dictate the security of the connection between clients and servers to prevent eavesdropping or man-in-the-middle attacks.

## OPC-UA Server Security Controls
Nearly all OPC-UA servers will present the same, common security controls. The ones I will focus on here are:
- Security Policies
- Security Mode
- User Authentication

If you've worked with other systems before, none of these will come as a surprise but it is worth taking some time to understand them in an OT context to ensure we know the tools we have at our disposal.

### Security Policies
[Security Policies](https://reference.opcfoundation.org/specs/OPC-10000-2/4.6) are how servers tell clients which cryptographic algorithms is can support for encryption, signing, and hashing. The client can pick from these to initiate its secure (or in some cases, not secure) connection to the server.

The below table (which is nabbed from [here](https://deepwiki.com/awcullen/opcua/6.1-security-policies-and-modes#security-policies)) gives a helpful overview.

|Policy Name|URI|Description|
|-----------|---|-----------|
|None|http://opcfoundation.org/UA/SecurityPolicy#None|No security (no encryption, no signing)|
|Basic128Rsa15|http://opcfoundation.org/UA/SecurityPolicy#Basic128Rsa15|RSA-15 key wrap algorithm, 128-bit encryption|
|Basic256|http://opcfoundation.org/UA/SecurityPolicy#Basic256|RSA PKCS#1 v1.5 key wrap algorithm, 256-bit encryption|
|Basic256Sha256|http://opcfoundation.org/UA/SecurityPolicy#Basic256Sha256|RSA-OAEP key wrap algorithm, SHA-256 for signing|
|Aes128Sha256RsaOaep|http://opcfoundation.org/UA/SecurityPolicy#Aes128_Sha256_RsaOaep|AES-128 with SHA-256 and RSA-OAEP|
|Aes256Sha256RsaPss|http://opcfoundation.org/UA/SecurityPolicy#Aes256_Sha256_RsaPss|AES-256 with SHA-256 and RSA-PSS|

### Security Mode
If Security Policy defines what should be applied to the connection, the Security Mode defines how it should be done. There are 3 differrent security modes that can be chosen from.
- **None** - No security is applied to the communication - nothing is signed or encrypted.
- **Sign** - Messages are signed but are not encrypted.
- **SignAndEncrypt** - Messages are both encrypted and signed.

None should only be used for testing or debugging.

You could get away with Sign if your data is not confidential (which this type of data often isn't really that confidential). This gives you the ability to still sniff the traffic for debugging purposes but adds a much needed layer of integrity between client and server, reducing the risk of packets being tampered with.

Of course, Sign and Encrypt is the best, and should be used in production where possible. It keeps your traffic private and integral, and will impress your auditors! However, this adds the need to manage certificates for your OPC-UA server which is an added layer of complexity. An added layer of complexity that is worth dealing with to reduce the risk, but none the less, it's added.

### User Authentication
You don't want just anyone logging into your OPC-UA server and looking at (or writing to!) your tags. These controls allow you to set up user accounts, or at least create some layer of trust, to facilatate the connection between a client and server.

#### Guest / Anonymous
Well, this one doesn't achieve much. Leaving Guest or Anonymous access on allows anyone to connect to your OPC-UA server. There are *some* scenarios where this might be desired, but 99/100 times you will not want any of your OPC-UA endpoints to support this.

#### Username and Password
As it says on the tin. A username and password can be supplied by the client to authenticate the session. Depending on the OPC-UA server itself, this method will differ in terms of management and customisation, but it's often a great starting point to bolster security.

#### Certificates
This is where we get a big fancier and even more secure.
TODO

## Scanning OPC-UA Servers
As mentioned above, when you first connect to an OPC-UA server, it will advertise what security controls it supports. This means we can write a little tool to scan OPC-UA servers and gather information on how secure (or not!) they are. 

This led me to create [OPC-UA Recon](https://github.com/chrisdinozzi/opcua-recon) (with a little help from Claude, of course!).

### Tooling
