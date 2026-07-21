---
layout: post
title: "OT Homelab Build - UNS"
subtitle: "The truth, the whole truth, and nothing but the truth!"
date: 2099-07-22
description: "Building the Unified Namespace (UNS) system for the OT Homelab."
---

- [Goals](#goals)
- [What is UNS?](#what-is-uns)
  - [OPC-UA](#opc-ua)
  - [MQTT](#mqtt)
    - [MQTT-JSON](#mqtt-json)
    - [Sparkplug B](#sparkplug-b)
- [Systems](#systems)
  - [MQTT Broker (HiveMQ)](#mqtt-broker-hivemq)
  - [Gateway (NeuronEX)](#gateway-neuronex)
  - [Caddy](#caddy)
  - [Systems Summary](#systems-summary)
- [Deployment](#deployment)
  - [docker-compose.yml](#docker-composeyml)
  - [.env](#env)
  - [secrets](#secrets)
  - [Caddyfile](#caddyfile)
    - [Windows](#windows)
    - [Mac](#mac)
    - [Linux](#linux)
      - [Firefox](#firefox)
      - [Security Concerns](#security-concerns)
  - [DNS](#dns)
  - [Running the Compose File](#running-the-compose-file)
- [Final Thoughts](#final-thoughts)


## Goals
1. Understand what a Unified Namespace actually is
2. Get to grips with the protocols underneath it (OPC-UA and MQTT)
3. Stand up the UNS stack - broker and gateway - as a reproducible Docker Compose setup
4. Get real PLC data flowing off the floor and onto the broker
5. Keep it tidy and reasonably secure while doing it

## What is UNS?
A Unified Namespace (UNS) is more of an *idea* than a system itself but is often used to refer to the MQTT broker that does the heavy lifting (discussed further down) and the gateways or servers that convert the data into the correct protocol. The idea is to have one, central, real time, structured data store from which every other system can take data. Rather than connecting up systems individually, everything reads from and writes to the UNS. It has a few clear benefits:
1. **A single source of truth** - everyone is singing from the same hymn sheet, making your data more reliable across all your systems.
2. **More modularity** - you can more easily switch out a gateway, or PLC, or broker, without having to do massive reconfiguration.
3. **Much needed structure** - when you're working with different protocols (MQTT, OPC-UA, Modbus), they all present data differently. By unifying everything into a UNS system, everything follows the same naming convention.

### OPC-UA
It's worth delving into OPC-UA a bit more here, in case you haven't come across it before.
OPC-UA (Open Platform Communications - Unified Architecture) is a vendor neutral protocol for moving data around in industrial networks. 
Unlike a lot of older industrial protocols that were tied to a single vendor's ecosystem, OPC-UA is an open standard, so kit from different manufacturers can all speak it without needing a bespoke driver for every pairing. That alone makes it a sensible backbone for getting data off the floor.
It works on a client-server model. The PLC runs an OPC-UA server that exposes its data (on TCP port 4840 by default), and anything that wants that data - my SCADA, my gateway - connects to it as a client. Clients can read values, write them back, or subscribe to a tag and be told whenever it changes, rather than having to sit there constantly polling for updates.

The really nice part, especially coming from something like Modbus, is that OPC-UA is browseable and symbolic. Instead of having to know that the fan status lives in some holding register at a particular offset, a client can browse the server's address space and find a tag called, sensibly, Fan_On. We set this up back in the build article when we configured the Server Interface and added our data blocks to it.

It also has proper security built in - certificate-based authentication, message signing, and encryption. I'm using none of it, because (as is becoming a theme) I've deliberately left mine wide open so we've got something worth attacking later in the series. In the real world you would absolutely not do that. We'll explore that more in later articles.

### MQTT
MQTT is another protocol that's commonly found in industrial environments, mostly manufacturing. It boasts a lightweight, pub/sub model which makes it perfect for shifting lots of small messages across sites without much fuss.

What trips people up about MQTT (including myself) is that it's the *envelope* and not the *letter*. It handles topics, subscribers, Quality of Service (QoS), but it doesn't really care about the payload or how it's formatted. So while MQTT is a good choice for delivering data, you still need to decide how you'll structure it inside the payload. 

Two common approaches are MQTT-JSON (no prizes for guessing how this one works!) and Sparkplug B.

(If you want to delve further into the technical aspects of MQTT, check out [this](https://www.hivemq.com/blog/mqtt-packets-comprehensive-guide/) article!)

#### MQTT-JSON
The simplest approach is to just bung a JSON object in the payload. Something like:

```json
{
  "fan_on": true,
  "green_led": true,
  "red_led": false,
  "timestamp": "2026-07-22T14:03:00Z"
}
```
The main pros are:
1. We all know JSON (don't we?)
2. It's easy to read and parse
3. It's easy to troubleshoot

You can use a tool like [MQTT Explorer](https://mqtt-explorer.com/) to easily see the data going in and out of the broker.

The downsides are the flipside of the pros. There's no defined structure - it's up to you to decide how to structure your data, and keep it consistent everywhere. 
JSON is also chattier than Sparkplug B. Not a big deal for your homelab, but is worth considering in a real production system.

I ended up using JSON. The gateway ingests data from the PLC via OPC-UA and exports it up to IT as JSON.

#### Sparkplug B
This is the proper good one. It's an open spec that sits on top of MQTT and adds in all the prescriptive structure that MQTT, rightfully, avoids. Sparkplug B brings in:
- **Defined topic namespaces** - rather than coming up with your own topic layout, Sparkplug B prescribes you with one: `spBv1.0/{group}/{message type}/{edge node}/{device}`. This means everything that speaks Sparkplug B speaks it the same way.
- **Birth and Death Certificates** - when an edge node connects, it publishes a *birth* certificate, letting everyone else know who it is and what it knows. It also gives a *death* certificate to the broker, so that if the node falls off the network, the broker can tell everyone else about it.
- **Binary Payloads** - rather than plain text, messages are encoded, and thus compressed, shrinking their footprint on the wire.
- **Sequence Numbers** - to help subscribers know if they missed a memo.

One of the obvious downsides is that you can't read it straight out the box like you can with JSON, you need some way of decoding the message first if you're trying to troubleshoot.

> Why are you using JSON instead of Sparkplug B?

For simplicity and compatibility. Using standard MQTT with JSON payloads is much more simple than Sparkplug B, and much more widely supported by different systems. My historian doesn't support it out of the box but I will explore Sparkplug B for homelabs in later articles.

Now we have some background, lets look at how we actually deploy this.

## Systems
### MQTT Broker (HiveMQ)
This is the brains of the UNS. Systems publish data to topics within it, others subscribe to the topics they care about. The publishers and subscribers never have to talk to each other, they don't need to know a thing about one another. They just need to know where the broker is, and what topics they want to publish or subscribe to.

The broker, however, isn't a database, nor a replacement for a historian. It only holds the last value of data, helping it to be lightweight and fast at its job. Once a value is updated, it doesn't care about what it was before.

The topic structure for my broker was as follows:
```
/neuron/mqtt-json
```

Here's an example of some of the data flowing through:
``` json
{"node": "s7-1200", 
"group": "MONITORING", 
"timestamp": 1782298975045, 
"values": 
    {"OperatingMode": 8, 
    "Fan_On": false, 
    "Green_LED_On": false, 
    "Red_LED_On": true}, 
    "errors": {}, 
    "metas": {}
}
```

### Gateway (NeuronEX)
You can think of the gateway as simply a translator. It reads the OPC-UA data from the PLC and sends it up to other services in whatever format you like. In my case, it sends the data up to the broker as MQTT, where it's stored for others to retrieve.

The flow ends up something like this:

`PLC  --OPC-UA--> Gateway --MQTT--> Broker`

> *Of course, it's the gateway that polls the PLC for the data, the PLC doesn't initiate the connection.*

### Caddy
Caddy isn't an industrial system, but it's very useful and worth a mention here. It's an open source web server and reverse proxy. In this build it's doing two things: serving all the web UIs (NeuronEX, Ignition) over clean *.factory.home.lab subdomains rather than a handful of port numbers, and providing HTTPS via its own internal CA. The internal CA is what lets us use proper TLS on a private network without buying certificates - which is why you need to install the root cert on your machine, as covered below.

### Systems Summary

|**Service**|**Image**|**Web UI**|**Purpose**|
|-------|-----|------|-------|
|NeuronEX|emqx/neuronex:3.7.1|neuronex.factory.home.lab|Gateway|
|HiveMQ CE|hivemq/hivemq-ce:2026.5|None|MQTT broker / UNS|
|Ignition|inductiveautomation/ignition:latest|ignition.factory.home.lab|SCADA / HMI|
|InfluxDB 3 Core|influxdb:3-core|None|Historian|
|Caddy|caddy:2-alpine| None	| Reverse proxy / TLS termination|

## Deployment
I spun up my UNS system (well, the entire OT factory system) using a docker compose file. I've included Ignition and Caddy in the file. We'll talk about Ignition more in the next article.

The directory structure for my OT systems ended up looking like this:

``` js
~/factory-homelab/
├── docker-compose.yml
├── mqtt_config.toml  <-- we'll talk about this in the next article!
├── .env
├── secrets/
│   └── ignition_admin_password <-- we'll talk about this in the next article!
└── caddy/
    └── Caddyfile
```

All the files can also be found on [my github](https://github.com/chrisdinozzi/caaf/tree/main/factory-systems).

### docker-compose.yml

``` yml
# =============================================================================
# Factory Homelab — Docker Compose
# Services: NeuronEX · HiveMQ CE · Ignition · Caddy · InfluxDB3 Core
# Network: factory-stack (internal bridge)
# Secrets: admin passwords read from files/env, never hardcoded
# =============================================================================

name: factory-homelab

secrets:
  ignition_admin_password:
    file: ./secrets/ignition_admin_password

volumes:
  neuronex-data:
  hivemq-data:
  hivemq-logs:
  ignition-data:
  caddy-data:     # persists TLS certs
  caddy-config:
  influxdb3-data:
  influxdb3-plugins:

networks:
  factory-stack:
    driver: bridge
    internal: false   # must stay false — Ignition needs internet for licence

services:

  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    networks:
      - factory-stack
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "caddy", "version"]
      interval: 30s
      timeout: 10s
      retries: 3

  neuronex:
    image: emqx/neuronex:3.7.1
    container_name: neuronex
    restart: unless-stopped
    privileged: true
    ports:
      - "127.0.0.1:8085:8085"   # loopback — Caddy proxies externally
    volumes:
      - neuronex-data:/opt/neuronex/data
    networks:
      - factory-stack
    logging:
      driver: json-file
      options:
        max-size: "100m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8085/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

  hivemq:
    image: hivemq/hivemq-ce:2026.5
    container_name: hivemq-ce
    restart: unless-stopped
    environment:
      HIVEMQ_LOG_LEVEL: INFO
    ports:
      - "1883:1883"               # MQTT — LAN-exposed for S7-1200/Neuron
                                        # NOTE: HiveMQ CE has no web UI
                                        # Control Centre is commercial only
    volumes:
      - hivemq-data:/opt/hivemq/data
      - hivemq-logs:/opt/hivemq/log
    networks:
      - factory-stack
    logging:
      driver: json-file
      options:
        max-size: "100m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "bash", "-c", "echo > /dev/tcp/localhost/1883"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

  ignition:
    image: inductiveautomation/ignition:latest
    container_name: ignition
    restart: unless-stopped
    pull_policy: always
    ports:
      - "8088:8088"
      - "8043:8043"
    volumes:
      - ignition-data:/usr/local/bin/ignition/data
      - ./modules:/modules   # pre-load third-party .modl files here
                             # Ignition auto-installs on startup
                             # Required: MQTT-Engine-signed.modl from
                             # https://inductiveautomation.com/downloads/ignition
    environment:
      ACCEPT_IGNITION_EULA: "Y"
      GATEWAY_ADMIN_USERNAME: ${GATEWAY_ADMIN_USERNAME:-admin}
      GATEWAY_ADMIN_PASSWORD_FILE: /run/secrets/ignition_admin_password
      IGNITION_EDITION: ${IGNITION_EDITION:-maker}
      IGNITION_LICENSE_KEY: ${IGNITION_LICENSE_KEY:-}
      IGNITION_ACTIVATION_TOKEN: ${IGNITION_ACTIVATION_TOKEN:-}
      TZ: ${TZ:-Europe/London}
      DISABLE_QUICKSTART: "true"
      GATEWAY_MODULES_ENABLED: >-
        perspective,
        tag-historian,
        alarm-notification,
        opc-ua,
        modbus-driver-v2,
        reporting,
        sql-bridge,
        symbol-factory,
        audit-log
    secrets:
      - ignition_admin_password
    networks:
      - factory-stack
    depends_on:
      hivemq:
        condition: service_healthy
    command: >
      -n homelab-gateway
      -a ignition.factory.home.lab
      -h 8088
      -s 8043
      -m 1024
    logging:
      driver: json-file
      options:
        max-size: "100m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8088/StatusPing"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  influxdb3-core:
    image: influxdb:3-core
    container_name: influxdb3-core
    ports:
      - 8181:8181
    command:
      - influxdb3
      - serve
      - --node-id=node0
      - --object-store=file
      - --data-dir=/var/lib/influxdb3/data
      - --plugin-dir=/var/lib/influxdb3/plugins  # Optional: only needed for processing engine plugins
    networks:
      - factory-stack
    logging:
      driver: json-file
      options:
        max-size: "100m"
        max-file: "3"
    volumes:
      - influxdb3-data:/var/lib/influxdb3/data
      - influxdb3-plugins:/var/lib/influxdb3/plugins

    environment:
      INFLUXDB3_AUTH_TOKEN: ${INFLUXDB3_AUTH_TOKEN}
      INFLUXDB3_LOG_FILTER: "warn"
```

### .env
Never commit this file to your git repo without first removing the sensitive information.
``` bash
TZ=Europe/London
IGNITION_EDITION=maker
IGNITION_LICENSE_KEY=XXXX-XXXX
IGNITION_ACTIVATION_TOKEN=your-token-here
GATEWAY_ADMIN_USERNAME=admin

INFLUXDB3_AUTH_TOKEN=XXXXX...
```

### secrets
Never commit your secrets anywhere public.
``` bash
mkdir -p ./secrets
echo "your-admin-password" > ./secrets/ignition_admin_password
chmod 600 ./secrets/ignition_admin_password
```

### Caddyfile
Here's the full Caddyfile:

``` Caddyfile
{
  local_certs
  admin localhost:2019
  log {
    format json
  }
}

neuronex.factory.home.lab {
  tls internal
  reverse_proxy neuronex:8085 {
    header_up Host {host}
    header_up X-Real-IP {remote_host}
    header_up X-Forwarded-For {remote_host}
    header_up X-Forwarded-Proto {scheme}
  }
  header {
    X-Content-Type-Options nosniff
    X-Frame-Options SAMEORIGIN
    Referrer-Policy strict-origin-when-cross-origin
    -Server
  }
  log {
    output file /var/log/caddy/neuronex.log {
      roll_size 10mb
      roll_keep 3
    }
  }
}

# NOTE: -a flag in docker-compose.yml must match this hostname
ignition.factory.home.lab {
  tls internal
  reverse_proxy ignition:8088 {
    header_up Host {host}
    header_up X-Real-IP {remote_host}
    header_up X-Forwarded-For {remote_host}
    header_up X-Forwarded-Proto {scheme}
    transport http {
      dial_timeout 30s
      response_header_timeout 60s
    }
  }
  header {
    X-Content-Type-Options nosniff
    X-Frame-Options SAMEORIGIN
    Referrer-Policy strict-origin-when-cross-origin
    -Server
  }
  log {
    output file /var/log/caddy/ignition.log {
      roll_size 10mb
      roll_keep 3
    }
  }
}

http:// {
  redir https://{host}{uri} permanent
}
```

You'll need to grab the root certificate from caddy and install it on your computer, otherwise you'll get HTTPS errors.

First, grab it out of the container by running:
``` bash
docker cp caddy:/data/caddy/pki/authorities/local/root.crt ~/caddy-root.crt
```
Then copy it over to your device (run these commands on your own machine, not the server):
```bash 
scp your-user@172.16.1.10:~/caddy-root.crt .
```

And install it:
#### Windows
``` powershell
Import-Certificate -FilePath .\caddy-root.crt -CertStoreLocation Cert:\LocalMachine\Root
```

#### Mac
``` bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain caddy-root.crt
```

#### Linux
You can figure it out yourself! 

##### Firefox
If you're a firefox user (like me), make sure you install the cert in Firefox's own CA. It won't use the system's one.

##### Security Concerns
> but if someone steals your root.key file they can create certificates that your computer will explicitly trust and they can hack you and steal all your money!!!!!!!

Well yes, they *could*, but equally Tom Clancy could break into your home and install key loggers on all your devices using 0-day exploits, and feed your dog a magic snack that turns him against you.

There is a real risk that, if the root.key file for your Caddy system was compromised, someone could use it to attack you, so therefore, please don't be using any of these guides to deploy real production systems.
However, for our use case of a homelab, that isn't exposed to the internet, is on our own private network, and only has the root CA installed on our own trusted machines, I wouldn't be too worried. 
If you want to mitigate the risk, you can:
1. Not upload your root.key file anywhere.
2. Don't even take a copy of the root.key file off the server.
3. Uninstall the root CA when you're done with your lab.
4. Don't let strangers into your house who might try and exfiltrate the key and use it against you.


### DNS
I used the DNS service built into OPNsense as my DNS server. You're welcome to run your own dedicated services if you prefer. 

|**Host**|**Domain**|**Type**|**IP Address**|
|--------|-----------|-------|--------------|
|neuronex|factory.home.lab|A (IPv4 address)|172.16.1.10|
|hivemq|factory.home.lab|A (IPv4 address)|172.16.1.10|
|ignition|factory.home.lab|A (IPv4 address)|172.16.1.10|


### Running the Compose File
The compose file can then be run using `docker compose up -d`. You can then monitor the logs by running `docker compose logs -f`.

## Final Thoughts
Through this article, we've looked at how we can set up our own UNS system to help move data around our lab in a more painless way. Although we've been unable to fully utilise it due to incompatability issues between Ignition Maker Edition and MQTT, it's still been a very worthwhile learning excerise to get hands on with systems that are becoming more and more relevant within OT.

In the next article, we'll delve deeper into the SCADA and Historian systems.