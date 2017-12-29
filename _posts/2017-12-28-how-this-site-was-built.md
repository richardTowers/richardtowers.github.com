---
layout: post
title: "How this site was built"
summary: >
  <p>In which we explore how the content of this website
  made its way from my keyboard to your computer screen.</p>

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
platforms have become ever more popular many people have bemoaned the shift in
power on the internet from independent websites into the hands of these few,
huge providers. The good news though is that the internet has grown up to the
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
* Serve HTML, CSS and JavaScript
* Tell the domain name system (DNS) to answer requests for
  `richard-towers.com` with a thing which will serve the content
* Handle HTTPS connections

Registering a domain name
-------------------------

As an example, `google.com` is a "domain name" - an identifier that is used by
the domain name system to lookup internet addresses. Before you can tell the
domain name system what to do when it is asked for the address of `google.com`
you have to "register" `google.com` - which essentially means buying it.

You can buy domains from one of the domain name registrars, who have to behave
in compliance with a set of regulations. Obviously you can't just buy
`google.com`, because it's already owned by google, so the domain registrars
won't let you.

Most domain name registrars allow you to search for domains which aren't owned
by someone else. Depending on how valuable the registrar thinks the domain name
is it might cost you more or less money.

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

[GitHub](https://github.com/) (a company who provide hosting for
source code) provide a service called [GitHub Pages](https://pages.github.com/),
where they will host your HTML on their servers for free. This service uses a
tool called [Jekyll](https://jekyllrb.com/), which is a convenient
way of writing blog posts in [Markdown](https://daringfireball.net/projects/markdown/)
and having them built into and delivered as HTML.

Once you've got GitHub Pages set up they will serve your content on
`https://$username.github.io`, which is probably good enough for
most cases. You can set up a `CNAME` record from your own domain
(`richard-towers.com` in this case) if you would prefer to use that as your
website.

Set up DNS
----------

Now that the website is hosted, DNS needs setting up. This will mean that when
requests are made to `richard-towers.com` they're routed to the right place to
serve up the content.

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

Once all the DNS records have propagated visitors to
`http://richard-towers.com` get the content from GitHub pages.

Handling HTTPS connections
--------------------------

Websites on today's internet can chose to allow connections over HTTP and
HTTPS. HTTPS websites use Transport Layer Security to protect the requests and
responses so that users of the website can be confident what they're seeing is
an unmodified copy of the website the server sent, and so that third parties
cannot spy on their traffic.

Even though traffic to and from `richard-towers.com` is not likely to be sensitive
in any meaningful way it is still beneficial to support HTTPS connections and
redirect HTTP connections to HTTPS. There are several reasons for this, including:

0. The more internet users get used to HTTPS the less trust there will be in
   potentially insecure HTTP only connections.
0. The more of the internet that is served over HTTPS, the easier it becomes
   for browsers to mark non-HTTPS websites as insecure.
0. Using HTTPS prevents malicious ISPs and other rogue actors from injecting
   adds and trackers into responses, which may even break the website.

Cloudflare have a service which provides free TLS - for `richard-towers.com`
I'm using the "Full SSL" mode of operation. What that means is that connections
between users' browsers and Cloudflare's servers go over TLS, and connections
between Cloudflare's servers and GitHub's also go over a separate TLS connection.
The upshot of this is that both Cloudflare and Github see requests and responses
in cleartext, and could chose to modify traffic.

Trusting Cloudflare not to abuse their position in the network is a trade-off
I'm happy to make in this situation, given the low sensitivity of the content.
If personally identifiable information or other sensitive content was being
handled it would still be possible to provision TLS for free -
[Let's Encrypt](https://letsencrypt.org/) have been providing free certificates
since 2016, but the management overhead is slightly higher.

Summary
-------

Using free services from GitHub and Cloudflare you can host a website over
HTTPS for free. You do need to place some trust in GitHub and Cloudflare,
but for low sensitivity situations this should be acceptable.

Custom domains are easy to register, but do cost a small amount of money each
year.

Of course, it's possible to achieve all the same things in many other ways. The
trade-offs are between convenience, security, and cost. With today's
proliferation of low-cost solutions to all the above issues there should be
many other ways to get the same (or better) results.

