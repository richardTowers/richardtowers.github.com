---
layout: post
title: "How this site was built"
summary: >
  <p>How the content of this website made its way from my keyboard to your computer screen.</p>

  <p>Including:
    <ul>
      <li>Hosting on GitHub Pages and Jekyll</li>
      <li>Registering a domain name</li>
      <li>Using Cloudflare to set up HTTPS</li>
    </ul>
  </p>
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
[https://richard-towers.com](https://richard-towers.com)
and the trade-offs I've made.

What do you need to do to host a site?
--------------------------------------

The goal of this website is that when someone visits
[https://richard-towers.com](https://richard-towers.com)
in their browser they will be served the content I have written. To make that
happen I needed to do the following things:

* Register the domain name `richard-towers.com`
* Set up DNS to to point requests for
  `richard-towers.com` to a thing which will serve the content
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

You can set up a `CNAME` record from your own domain (`richard-towers.com` in
this case).

Set up DNS
----------

The GitHub Pages documentation has
[instructions for setting up a custom domain](https://help.github.com/articles/using-a-custom-domain-with-github-pages/).
Long story short, tell GitHub about the domain and set up DNS records in your DNS provider.

For `richard-towers.com` I'm using [Cloudflare](https://www.cloudflare.com/) as
my DNS provider. In most situations your domain registrar will offer DNS
provisions for you, but these can sometimes be slow or unreliable. Cloudflare's
free DNS offering is very good and their service provides some nice features on
top of just DNS.

I've configured the domain in Namecheap to point `richard-towers.com` at
Cloudflare's nameservers. Then there's an A record configured in DNS in
Cloudflare which points at the IP addresses GitHub provides for Pages.

Handling HTTPS connections
--------------------------

Cloudflare have a service which provides free managed TLS.

In the "Full SSL" mode of operation connections between users' browsers and
Cloudflare's servers go over TLS, and connections between Cloudflare's servers
and GitHub Pages go over a separate TLS connection.

This means Cloudflare are in a position where they could intercept or modify
traffic. Since this is just a blog that's a worthwhile trade-off for the
convenience.

Summary
-------

Using free services from GitHub and Cloudflare you can host a website over
HTTPS for free.

There are lots of other ways to run a website, but this is pretty convenient.

