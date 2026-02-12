---
layout: default
title: Home
---

<img alt="Photograph of Richard sailing somewhere sunny" src="/static/images/richard-sailing.jpg" class="avatar" width="160" height="160">

I'm a software developer from York.

As of 2026 I'm taking a break and pursuing my own projects. For the preceding
decade I wrote software and managed people at the [Government Digital
Service](https://gds.blog.gov.uk/about/), including a little over a year as the
Head of Software Engineering for [GOV.UK](https://www.gov.uk).

I’m a keen (if not very strong) chess player, and a determined (if not very
fast) cyclist and runner. I can sail a bit too, so when the weather’s nice I
like to do that.

## Elsewhere on the internet

* [Mastodon](https://hachyderm.io/@richardtowers)
* [GitHub](https://github.com/richardTowers)
* [Keybase](https://keybase.io/richardtowers)
* [Twitter archive](/shitposts/)

## Posts

<div>
{% for post in site.posts %}
	<div class="post">
		<h3><a href="{{ post.url }}">{{post.title}}</a></h3>
		<time class="post-date" datetime="{{ post.date | date: '%Y-%m-%d' }}">
		  {{ post.date | date: "%-d %b %Y" }}
		</time>
		{% if post.tags.size > 0 %}
		<div class="tags">
		  {% for tag in post.tags %}
		  <span class="tag">{{ tag }}</span>
		  {% endfor %}
		</div>
		{% endif %}
		{{ post.excerpt }}
	</div>
{% endfor %}
</div>
