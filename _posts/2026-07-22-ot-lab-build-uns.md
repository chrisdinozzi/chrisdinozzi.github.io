---
layout: post
title: "OT Homelab Build - UNS"
subtitle: "The truth, the whole truth, and nothing but the truth!"
date: 2000-07-22
description: "Building the Unified Namespace (UNS) system for the OT Homelab."
---

## Goals
1. a
2. b
3. c
4. d

## What is UNS?
A Unified Namespace (UNS) is more of an *idea* than a system itself but is often used to refer to the MQTT broker that does the heavy lifting (discussed further down below) and the gateways or servers that convert the data into the correct protocol. The idea is to have one, central, real time, structured data store from which every other system can take data from. Rather than connecting up systems indivdually, everything reads from and writes to the UNS. It has a few clear benefits:
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

## Deployment
I span up my UNS system (well, the entire OT factory system) using a docker compose file. I've include ignition and caddy in the file. We'll talk about Ignition more in the next article.

The directory structure for my OT systems ended up looking like this:

``` js
~/factory-homelab/
├── docker-compose.yml
├── .env
├── secrets/
│   └── ignition_admin_password
└── caddy/
    └── Caddyfile
```

### docker-compose.yml

``` yml
# =============================================================================
# Factory Homelab - Docker Compose
# Services: NeuronEX · HiveMQ CE · Ignition · Caddy
# Network: factory-stack (internal bridge)
# Secrets: admin passwords read from files, never hardcoded
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

networks:
  factory-stack:
    driver: bridge
    internal: false   # must stay false - Ignition needs internet for licence

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
      - "127.0.0.1:8085:8085"   # loopback - Caddy proxies externally
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
      - "1883:1883"               # MQTT - LAN-exposed for S7-1200/Neuron
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
```

### .env
Never commit this file to your git repo without first removing the sensitive information.
``` js
TZ=Europe/London
IGNITION_EDITION=maker
IGNITION_LICENSE_KEY=XXXX-XXXX
IGNITION_ACTIVATION_TOKEN=your-token-here
GATEWAY_ADMIN_USERNAME=admin
```

### secrets
Never commit your secrets anywhere public.
``` bash
mkdir -p ./secrets
echo "your-admin-password" > ./secrets/ignition_admin_password
chmod 600 ./secrets/ignition_admin_password
```

## Caddyfile

``` js
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

hivemq.factory.home.lab {
  tls internal
  reverse_proxy hivemq-ce:8080 {
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
    output file /var/log/caddy/hivemq.log {
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

### DNS
I used the DNS service built into opnsense as my DNS server. You're welcome to run your own dedicated services if you prefer. 

|**Host**|**Domain**|**Type**|**IP Address**|
|--------|-----------|-------|--------------|
|neuronex|factory.home.lab|A (IPv4 address)|172.16.1.10|
|hivemq|factory.home.lab|A (IPv4 address)|172.16.1.10|
|ignition|factory.home.lab|A (IPv4 address)|172.16.1.10|


### Running Docker File
The docker file can then by run using `docker compose up -d`. You can then monitor the logs by running `docker compose logs -f`.