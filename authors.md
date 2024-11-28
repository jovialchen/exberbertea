---
permalink: /authors/
title: Yo Yo Ho
layout: default
---
<ul class="author-cloud">
{% assign all_authors = site.posts | map: "authors" | compact | join: "," | split: "," | uniq %}
{% for author in all_authors %}
  {% assign posts_by_author = site.posts | where_exp: "post", "post.authors contains author" %}
  <li style="font-size: {{ posts_by_author.size | times: 100 | divided_by: site.posts.size | plus: 70 }}%">
    <a href="#{{ author | slugize }}">
      {{ author }} ({{ posts_by_author.size }})
    </a>
  </li>
{% endfor %}
</ul>

<div id="archives">
{% for author in all_authors %}
  {% assign posts_by_author = site.posts | where_exp: "post", "post.authors contains author" %}
  <div class="archive-group">
    <h3 id="{{ author | slugize }}">{{ author }} ({{ posts_by_author.size }})</h3>
    {% for post in posts_by_author %}
      <article class="archive-item">
        <h4>
          <a href="{{ post.url | relative_url }}">{{ post.title }}</a> - {{ post.date | date: "%Y-%m-%d" }}
        </h4>
      </article>
    {% endfor %}
  </div>
{% endfor %}
</div>

