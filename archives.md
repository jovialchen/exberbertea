---
permalink: /archives/
title: Yo Yo Ho
layout: default
---

  <div class="container">
    <section>
      {% for post in site.posts %}
        {% assign year = post.date | date: "%Y" %}
        {% assign month = post.date | date: "%B" %}
        {% assign month_year = post.date | date: "%Y-%B" %}
        
        {% if month_year != currentMonth %}
          {% unless forloop.first %}
            </ul>
          {% endunless %}
          <h2>{{ month }} {{ year }}</h2>
          <ul>
          {% assign currentMonth = month_year %}
        {% endif %}
        
        <li><a href="{{ post.url | relative_url }}">{{ post.title }}</a>- {{ post.date | date: "%Y-%m-%d" }}</li>
      {% endfor %}
      </ul>
    </section>
  </div>