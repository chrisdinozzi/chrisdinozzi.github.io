---
layout: post
title: "OT Homelab Build - SCADA and Historian"
subtitle: "Supervise, Control, Acquire - and Remember!"
date: 2099-07-29
description: "Building the SCADA and Historian System system for the OT Homelab."
--- 
- [Goals](#goals)
- [What is SCADA?](#what-is-scada)
- [What is a Historian?](#what-is-a-historian)
- [Why OPC-UA over Modbus for SCADA?](#why-opc-ua-over-modbus-for-scada)
- [Systems](#systems)
  - [SCADA (Ignition)](#scada-ignition)
    - [Connecting to the PLC](#connecting-to-the-plc)
    - [Why not UNS?](#why-not-uns)
    - [Creating a HMI](#creating-a-hmi)
  - [Historian (InfluxDB 3 Core)](#historian-influxdb-3-core)
- [Viewing Data](#viewing-data)
- [Final Thoughts](#final-thoughts)

## Goals
1. Understand what SCADA and historians are and why they matter
2. Stand up Ignition as the SCADA/HMI for the lab
3. Stand up InfluxDB 3 Core as the historian, fed directly from the UNS
4. Get live PLC data visible in a dashboard and stored for historical queries

## What is SCADA?
Supervisory Control and Data Acquisition (SCADA) refers to software that sites above your PLCs (or RTUs, or whatever else you use to control your level 0), and lets you see (Supervise) what's happening on the plant floor. It can also be used to interact with (Control) deives where permitted and gather (Data Acquisition) information about the goings on. 

## What is a Historian?
A Historian is a time series database what stores tag values over time. It allows you to have a historical view over how your data has changed over time. This comes in handy for businesses when doing analysis work, since they can essentially pull a snapshot of the factory for any time period they need.

## Why OPC-UA over Modbus for SCADA?
We touched on OPC-UA in the last article, but I want to take a moment here to look at why we would use it for SCADA over something like Modbus.
Modbus is simple. It works fine as intended. It's still used on many sites. But it's old. It's extremly basic, you have to know your mappings of holding registers, you can't browser any information. It has no authentication and a myriad of other security risks.

OPC-UA can do mch more. You can browser the tags, give them meaningful names and data types, subscribe to data rather than just spam reading it. It also has a lot more security options built in like certification or account authentication, message signing, and encryption.

Modbus still has its place, and we'll explore some attacks around it later in this series, but for our homelab, we're picking OPC-UA to get more familiar with the modern conviences and security measures that it offers.

## Systems

### SCADA (Ignition)

#### Connecting to the PLC
Ignition connects to the PLCs OPC-UA server where specific tags are exposed. There tags can be read, subscribde, or written to, giving Ignition the ability to control the system, not just supervise and acquire.

I already covered setting up the OPC-UA server in [this](INSERT LINK HERE) post, so let's look at how we get Ignition talking to it.

1. We start by logging into the Ignition web portal using the credentials we set during deployment (admin:password (very secure!!)).
2. Next, navigate to **Connections -> OPC -> Connections** and click **Create OPC Connection**. Select **OPC UA Connection** and click next.
3. Enter the **Endpoint URL**. This will be our PLC IP with **opc.tcp://** prepended and the OPC UA server port on the end (4840 by default).
    - `opc.tcp://10.0.0.10:4840`
4. Click next, and if the connection was successful, you should see some information come back about the server.
    - ![](/blog/res/ot-lab-build-scada-historian-opc-ua-connection.png)
5. I selected None for **Security Policy** and **Security Mode**. Of course, this is a bad idea.
6. Confirm your connection and click **Next** until you get to step 6.
7. Give it a name and make sure the **Enabled** checkbox is ticked. Set **Authentication Type** to **Anonymous** (again, bad idea!) and click **Create OPC Connection**.

And you're done. If you navigate to **Quick Client** you can explore your OPC-UA data.
![](/blog/res/ot-lab-build-scada-historian-opc-ua-quick-client.png)

#### Why not UNS?
It would be very neat to connect the SCADA system to the PLC via the UNS, but I didn't do this, for a couple of reasons:
1. Ignition Maker Edition doesn't have MQTT support, so technically, I couldn't.
2. If for some reason the UNS broke, you have lost control and vision of your PLC. Of course, this risk could be mitigated in other manners, but this is one approach.

#### Creating a HMI
Ignition supports the creation of HMIs via their **Designer** tool. I won't delve into great depth about how to use it, since that warrants an entire series of its own - a series I don't have the expertise to write!

Once the OPC-UA connection was working, I launched Ignition Designer and connected to my Ignition server.
Then I created a new project, gave it a name and title (and left everything else default) and opened it up.
I could see my tags in the bottom left hand corner and could confirm I was able to read and write them (by switching the read/write mode in the top bar).

![OPC-UA tags in Ignition Designer](/blog/res/ot-lab-build-rig-ignition-designer-tags.png)

Next, I created a new view and dragged my tags onto it. It was super basic, but did the job of allowing me to control the fan and monitor the LEDs. 

![Very basic ignition HMI](/blog/res/ot-lab-build-ignition-hmi-basic.png)

I could then access it via Ignition Perspective (go to your Igniton Webpage -> Perspective -> Click your project) and control my PLC via the HMI!

### Historian (InfluxDB 3 Core)
As mentioned above, the historian lets us stored data mapped to time stamps, allowing us to retrieve old events and nicely chart values agaisnt time.

I found setting up InfluxDB 3 Core to ingest MQTT data a bit of a headache, so I've included a fairly comprehensive guide below that will hopefully help you avoid my pain. The guide assumes you've got the same docker config as my running already.

1. I had to fix some permissions since the container wasn't running as root:
    ``` bash
    docker exec -u root influxdb3-core chown -R \
    $(docker exec influxdb3-core id -u):$(docker exec influxdb3-core id -g) \
    /var/lib/influxdb3
    ```
2. Then, generate an auth token for use during authentication:
    ``` bash
    docker exec influxdb3-core influxdb3 create token --admin
    ```
    Copy this somewhere secure for the time being.
3. Export it, and add it to your local .env file so you don't have to keep pasting it. Of course, this is a *bad* idea in a production system!
    ``` bash
    docker exec influxdb3-core influxdb3 create token --admin
    ```
4. Then we can create our database. I named mine 'homelab' and gave it a retention period of 7 days.
    ``` bash
    docker exec influxdb3-core influxdb3 create database homelab --retention-period 7d
    ```
5. Next, we have to install the MQTT Subscribe plugin. There are commands to help with plugin installs, but I found it a bit wonky, so we'll do it manually instread.
    ``` bash
    curl -o mqtt_subscriber.py \
    https://raw.githubusercontent.com/influxdata/influxdb3_plugins/main/influxdata/mqtt_subscriber/mqtt_subscriber.py

    docker cp mqtt_subscriber.py \
    influxdb3-core:/var/lib/influxdb3/plugins/mqtt_subscriber.py
    ```
6. We also need to install some dependencies for the plugin:
    ``` bash
    docker exec influxdb3-core influxdb3 install package \
    --plugin-dir /var/lib/influxdb3/plugins \
    jsonpath-ng

    docker exec influxdb3-core influxdb3 install package \
    --plugin-dir /var/lib/influxdb3/plugins \
    paho-mqtt
    ```
7. Then we can create out configuration file `mqtt_config.toml`:
    ``` toml
    [mqtt]
    broker_host = "hivemq-ce"
    broker_port = 1883
    topics = ["/neuron/mqtt-json"]
    qos = 1

    [mapping.json]
    table_name = "plc_monitoring"
    timestamp_field = "$.timestamp:ms"

    [mapping.json.tags]
    node = "$.node"
    group = "$.group"

    [mapping.json.fields]
    fan_on = ["$.values.Fan_On", "bool"]
    green_led_on = ["$.values.Green_LED_On", "bool"]
    red_led_on = ["$.values.Red_LED_On", "bool"]
    operating_mode = ["$.values.OperatingMode", "int"]
    ```
    Since our broker is running on the same server, we can reference it by it's container name, `hivemq-ce`, otherwise this would have to be an IP or FQDN.
    Topics and mappings will also differ depending on your chosen naming structure. If you're unsure, have a look at the data in the broker using a tool like MQTT Explorer.
8. Copy the config file into the container:
    ``` bash
    docker cp mqtt_config.toml \
    influxdb3-core:/var/lib/influxdb3/plugins/mqtt_config.toml
    ```
9. Finally, we create and enable the trigger. This tells the historian how to pull the data in:
    ``` bash
    docker exec influxdb3-core influxdb3 create trigger \
    --database homelab \
    --plugin-filename mqtt_subscriber.py \
    --trigger-spec "every:10s" \
    --trigger-arguments "config_file_path=mqtt_config.toml,enable_full_logging=true" \
    mqtt_ingest

    docker exec influxdb3-core influxdb3 enable trigger \
    --database homelab \
    mqtt_ingest
    ```
10. Now wait 30 seconds and then run the following to see if data is flowing in:
    ``` bash
    watch -n 5 "docker exec influxdb3-core influxdb3 query \
    --database homelab \
    'SELECT time, fan_on, green_led_on, red_led_on, operating_mode \
    FROM plc_monitoring ORDER BY time DESC LIMIT 1'"
    ```

If no data is appearing, you can check the logs using this:
``` bash
docker exec influxdb3-core influxdb3 query \
--database homelab \
--format json \
"SELECT * FROM system.processing_engine_logs ORDER BY event_time DESC LIMIT 10"
```

One annoying error I ran into was an `exit code 132` every time I tried to start the container. This ended up being related to the proxmox CPU architecture. It was solved by changing the host VMs CPU type to `host` rather than `kvm64`.

## Viewing Data
We'll take a look at how we can start to visulise the data in the next part of this series, where we set up Grafana in our IT network!

## Final Thoughts
Through this article we've look at how to set up Ignition to work as a SCADA system over OPC-UA. We've also dived deep into setting up our historian to pull data out of the UNS system.

In the next article, we'll look at how we can visualise that historian data to be used by the business.