---
layout: default
title: Richard Towers
---

I'm a software developer from York. As of 2018 I work at the
[Government Digital Service](https://gds.blog.gov.uk/about/)
in London.

You can find me on the internet in these places:

* Keybase - [https://keybase.io/richardtowers](https://keybase.io/richardtowers)
* Twitter - [https://twitter.com/richardTowers](https://twitter.com/RichardTowers)
* GitHub - [https://github.com/richardTowers](https://github.com/richardTowers)
* Facebook - [https://www.facebook.com/RichardSebastianTowers](https://www.facebook.com/RichardSebastianTowers)

<div>
{% for post in site.posts %}
	<div class="post">
		<h3><a href="{{ post.url }}">{{post.title}}</a></h3>
		{{ post.summary }}
	</div>
{% endfor %}
</div>
