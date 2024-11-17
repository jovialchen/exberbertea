---
permalink: /tags/
title: Yo Yo Ho
layout: default
---


<ul class="tag-cloud">
{% for tag in site.tags %}
  <li style="font-size: {{ tag | last | size | times: 100 | divided_by: site.tags.size | plus: 70  }}%">
    <a href="#{{ tag | first | slugize }}">
      {{ tag | first }}
    </a>
  </li>
{% endfor %}
</ul>

<div id="archives">
{% for tag in site.tags %}
  <div class="archive-group">
    {% capture tag_name %}{{ tag | first }}{% endcapture %}
    <h3 id="#{{ tag_name | slugize }}">{{ tag_name }} ({{ site.tags[tag_name] | size }})</h3>
    <a name="{{ tag_name | slugize }}"></a>
    {% for post in site.tags[tag_name] %}
    <article class="archive-item">
      <h4><a href="{{ post.url | relative_url }}">{{post.title}}</a> - {{ post.date | date: "%Y-%m-%d" }}</h4>
    </article>
    {% endfor %}
  </div>
{% endfor %}
</div>