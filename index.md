---
title:  0x 
layout: default
---

# Bienvenido a mi blog personal
Este es mi sitio personal con artículos técnicos.

## Últimos artículos
{% for articulo in site.articulos %}
- [{{ articulo.title }}]({{ articulo.url }})
{% endfor %}


