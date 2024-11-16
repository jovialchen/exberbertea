---
permalink: /authors/
title: Yo Yo Ho
layout: default
---

<ul class="author-cloud">
{% assign authors = site.posts | group_by: "author" %}
{% for author in authors %}
  <li style="font-size: {{ author.size | times: 100 | divided_by: authors.size | plus: 70  }}%">
    <a href="#{{ author.name | slugize }}">
      {{ author.name }}
    </a>
  </li>
{% endfor %}
</ul>

<div id="archives">
{% for author in authors %}
  <div class="archive-group">
    {% capture author_name %}{{ author.name }}{% endcapture %}
    <h3 id="{{ author_name | slugize }}">{{ author_name }} ({{ author.size }})</h3>
    <a name="{{ author_name | slugize }}"></a>
    {% for post in author.items %}
    <article class="archive-item">
      <h4><a href="{{ post.url }}">{{ post.title }}</a> - {{ post.date | date: "%Y-%m-%d" }}</h4>
    </article>
    {% endfor %}
  </div>
{% endfor %}
</div>
