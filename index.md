---
layout: default
title: Richard Towers
---

<img alt="Me riding a surfboard in the wind on some sand" src="https://www.gravatar.com/avatar/49aaba480eb0629ee5a6ba72af5e89ff?s=160&amp;d=identicon&amp;r=PG" class="pull-right gravatar">

Hi! I'm Richard.
===================

This is my little bit of the internet. I'm hoping to post the occasional blog and some projects I've been working on.

<div>
{% for post in site.posts %}
	<div class="post">
		<h3><a href="{{ post.url }}">{{post.title}}</a></h3>
		{{ post.summary }}
	</div>
{% endfor %}
</div>
