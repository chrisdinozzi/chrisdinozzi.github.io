---
layout: post
title: "OT Homelab Build - IT and Data Visulisation"
subtitle: "You can look, but you can't touch!"
date: 2099-07-29
description: "Creating visulisation dashboards using Grafana using data from the Historian."
--- 

- [Goals](#goals)


## Goals

## Systems
Our IT section is much more simple, with only one application running (well, plus Caddy). Again, it's all run using Docker:

``` docker

```

### Caddy
As mentioned in the [UNS build](insert.link) article, Caddy is used as a reverse proxy to serve the web interface of the application over a nice clean *home.lab domain. It also provides HTTPS via the local CA.

### Grafana
Grafana is used to serve dashboards fed by the data historian.

#### Accessing Data
#### Creating a Dashboard