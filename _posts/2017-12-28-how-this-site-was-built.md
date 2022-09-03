---
layout: post
title: "How this site was built"
excerpt: >
  How the content of this website made its way from my keyboard to your computer screen.
---

How this site was built
=======================

For a long time it hasn't been necessary to have your own domain to host
content on the internet. Platforms like facebook, twitter, tumblr and others
allow you to post your thoughts in a place where others can read them. As these
platforms have become ever more popular there has been a shift in
power on the internet from independent websites into the hands of these few,
huge providers. There's good news though: the internet has grown up to the
point where it's easy and cheap to host your own content. In this post I'm
going to describe how I've set up
[https://www.richard-towers.com](https://www.richard-towers.com)
and the trade-offs I've made.

What do you need to do to host a site?
--------------------------------------

The goal of this website is that when someone visits
[https://www.richard-towers.com](https://www.richard-towers.com)
in their browser they will be served the content I have written. To make that
happen I needed to do the following things:

* Register the domain name `richard-towers.com`
* Set up DNS to to point requests for
  `www.richard-towers.com` to a thing which will serve the content
* Handle HTTPS connections
* Serve HTML, CSS and JavaScript

Registering a domain name
-------------------------

I registered `richard-towers.com` with [Namecheap](https://www.namecheap.com/),
which costs me roughly $10/year. There are many other good options for domain
registrars, for example [gandi.net](https://www.gandi.net). There was some good
discussion of their relative merits
[on hacker news](https://news.ycombinator.com/item?id=1766439)
back in 2010.

Serving HTML, CSS and JavaScript
--------------------------------

Since this website always serves the same content regardless of who is reading
there is no need for the server to do anything clever - it can simply serve
static pages.

[GitHub](https://github.com/) provide a service called [GitHub
Pages](https://pages.github.com/), where they will host your HTML on their
servers for free. This service uses a tool called
[Jekyll](https://jekyllrb.com/), which is a convenient way of writing blog
posts in [Markdown](https://daringfireball.net/projects/markdown/) and having
them built into and delivered as HTML.

You can set up a `CNAME` record from your own domain (`www.richard-towers.com`
in this case).

Set up DNS
----------

The GitHub Pages documentation has
[instructions for setting up a custom domain](https://help.github.com/articles/using-a-custom-domain-with-github-pages/).
Long story short, tell GitHub about the domain and set up DNS records in your DNS provider.

It's probably simplest to use your domain registrar's DNS service, but for my
own learning and development [I've used AWS Route53 for my
DNS](https://github.com/richardTowers/personal-aws/blob/main/richard-towers-com/route53.tf).

An earlier version of this post recommended Cloudflare for this, but I no
longer feel comfortable making that recommendation due to their sustained
support for an anti-trans hate group in 2022.

Handling HTTPS connections
--------------------------

GitHub Pages [supports HTTPS out of the
box](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
these days. If you're using Pages, all you need to do is set a CNAME record
pointing at GitHub and they'll do the rest.

Summary
-------

Using free services from GitHub you can host a website over HTTPS for free.

There are lots of other ways to run a website, but this is pretty convenient.

Edit History
------------

* September 2022 - removed recommendation of Cloudflare for DNS and HTTPS.
  Their continued provision (as of September 2022) of service to anti-trans
  hate groups means they're not an organisation I want my personal website
  associated with. In any case, their service is no longer required now that
  GitHub Pages supports HTTPS out of the box.

