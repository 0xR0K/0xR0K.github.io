---
layout: home
title: LifeOnline
---

<div class="posts-grid">
  {% for articulo in site.articulos %}
    <article class="post-card">
      <a href="{{ articulo.url | relative_url }}">
        
        <div class="post-image">
          {% if articulo.image %}
            <img src="{{ articulo.image | relative_url }}" alt="{{ articulo.title }}">
          {% else %}
            <img src="https://via.placeholder.com/800x450/111111/333333?text=LifeOnline" alt="No Image">
          {% endif %}
        </div>

        <div class="post-content">
          <span class="post-date">{{ articulo.date | date: "%b %d, %Y" }}</span>
          <h2 class="post-title">{{ articulo.title }}</h2>
        </div>

      </a>
    </article>
  {% endfor %}
</div>
