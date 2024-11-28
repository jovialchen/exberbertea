---
permalink: /authors/
title: Yo Yo Ho
layout: default
---

<ul class="author-cloud">
{% for author in site.authors %}
  <li style="font-size: {{ author | last | size | times: 100 | divided_by: site.authors.size | plus: 70  }}%">
    <a href="#{{ author | first | slugize }}">
      {{ author | first }}
    </a>
  </li>
{% endfor %}
</ul>

<div id="archives">
{% for author in site.authors %}
  <div class="archive-group">
    {% capture author_name %}{{ author | first }}{% endcapture %}
    <h3 id="#{{ author_name | slugize }}">{{ author_name }} ({{ site.authors[author_name] | size }})</h3>
    <a name="{{ author_name | slugize }}"></a>
    {% for post in site.authors[author_name] %}
    <article class="archive-item">
      <h4><a href="{{ post.url | relative_url }}">{{post.title}}</a> - {{ post.date | date: "%Y-%m-%d" }}</h4>
    </article>
    {% endfor %}
  </div>
{% endfor %}
</div>
