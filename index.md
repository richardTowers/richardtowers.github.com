---
layout: default
title: Richard Towers
---

Hi! I'm Richard.
===================

This is my little bit of the internet. I'm hoping to post the occasional blog and some projects I've been working on.

<div class="post">
{% for post in site.posts %}
	<div class="post">
		<h3><a href="{{ post.url }}">{{post.title}}</a></h3>
		{{ post.summary }}
	</div>
{% endfor %}
</div>
