---
layout: post
title: Kanban with AngularJS
summary: |
    At work we've been experimenting with Agile software development methods. On the whole, I'm not completely convinced by the whole Agile hoo-ha. Neverltheless I decided to use it as an excuse to try building a little web app. Intoducing kanbanter, a terribly named javascript app using AngularJS and the redmine API.
---

Kanban with AngularJS and Redmine
================

At work we've been experimenting with Agile software development methods. On the whole, I'm not completely convinced by the whole Agile hoo-ha. I mean, we all work <var>n</var> hours a day doing roughly the same thing regardless of our chosen management system. I think that means there probably functionally equivalent, and we should just go with [this][1] one. That's another argument for another day.

Kanban
----------------

Our most recent adventure takes us into the land of [Kanban][2]. This basically involves a large whiteboard covered in post-it notes.

<figure class="pull-right">
	<img src="/img/kanban.jpg" alt="A typical kanban board.">
	<figcaption><a href="http://www.flickr.com/photos/blambar/5392387797/">flickr | blambar</a></figcaption>
</figure>

When The Man decides that we need to do a bit of work they raise a ticket in [Redmine][3] (our issue tracker), then copy some details of the ticket onto a post-it and stick it in the 'Backlog' column of the board.

When one of the devs finishes their current task they look in the backlog column for a new one to start and put it in the 'In Progress' column. From there it makes its way through 'Development Done', 'Review', 'Review Done', 'In Testing' and finally 'Complete'.

Despite my earlier complaints about Agile, I actually like this Kanban malarky, largely because for the first time it has got us doing Code Review which I am convinced is an absolutely essential part of producing good software.

The kanban board at work does pretty well, and you might argue that "If it ain't broke, don't fix it". I don't hold with that. I'm more of a [perfect sandwich][4] kind of guy. Anyway, there are a couple of annoyances: sometimes tickets fall off the board and often a ticket's position on the board won't match up with its status in Redmine.

Idea!
----------------

I've played with the Redmine API before in an (unfinished) attempt to automatically generate Scrum burndown charts. To be honest, the API is by far my favorite bit of Redmine. Lovely and [RESTful][5]. Mmmmm.

Anyway. Knowing Redmine's API was pretty badass, I thought: "there's an ideal opportunity for a web app here". I'd been meaning to try out AngularJS seriously and so: off I went.

Project
----------------

[Kanbanter][6] is the terribly named result. It took me about a weekend to get it up and running, but it's still very rough around the edges. The initial reaction at work has been really positive. I'm trying to cultivate the idea in my non-developer colleagues that developers are wizards.

There were a couple of technical annoyances getting it up and running. The biggest of these was due to the redmine installation running on a separate domain. Because of the [Same Origin Policy][7] this meant that I had to reverse proxy all my requests through a server on the same domain. In the future I hope to restructure the project so that it runs as a redmine plugin. Of course, that would require my companies IT team to allow me to install an open source plugin&hellip;

I'll talk more about the technical details and progress in future posts.


[1]:http://programming-motherfucker.com/
[2]:http://en.wikipedia.org/wiki/Kanban_(development)
[3]:http://www.redmine.org/
[4]:http://markdotto.com/2012/11/29/the-perfect-sandwich/
[5]:http://en.wikipedia.org/wiki/Representational_state_transfer
[6]:https://github.com/richardTowers/kanbanter
[7]:http://en.wikipedia.org/wiki/Same_origin_policy