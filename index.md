---
layout: default
title: Richard Towers
---

<img alt="Photograph of Richard sailing somewhere sunny" src="/static/images/richard-sailing.jpg" class="avatar">

I'm a software developer from York.

As of 2019 I work on [GOV.UK PaaS](https://cloud.service.gov.uk) at the
[Government Digital Service](https://gds.blog.gov.uk/about/) in London.

I’m a keen (if not very strong) chess player, and a determined (if not very
fast) cyclist. I can sail a bit too, so when the weather’s nice I like to do
that.

## Elsewhere on the internet

* [https://keybase.io/richardtowers](https://keybase.io/richardtowers)
* [https://twitter.com/richardtowers](https://twitter.com/RichardTowers)
* [https://github.com/richardtowers](https://github.com/richardTowers)

## Posts

<div>
{% for post in site.posts %}
	<div class="post">
		<h3><a href="{{ post.url }}">{{post.title}}</a></h3>
		{{ post.excerpt }}
	</div>
{% endfor %}
</div>
