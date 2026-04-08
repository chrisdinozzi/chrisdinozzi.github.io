---
layout: default
title: projects
---

## /projects/

### apps

wip

### papers

If you find my papers any help, I would love to hear from you! Please contact me on [twitter](https://x.com/cdin0x) and let me know if they're still any good!

{% assign papers = site.static_files | where_exp: "file", "file.path contains '/projects/papers/'" %}
{% for paper in papers %}
- [{{ paper.basename | replace: '_', ' ' | replace: '-', ' '}}]({{ paper.path }})
{% endfor %}

### university

- [Software Development for Mobile Devices - CMP309](https://github.com/chrisdinozzi/cmp309-camera-app)