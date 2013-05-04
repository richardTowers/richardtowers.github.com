---
layout: post
title: Imgur Pacman
summary: |
    A while back @konman96 posted <a href="http://imgur.com/gallery/4tQvNZc">this gif</a> on imgur. Pretty stylishly done. There was a fair amount of interest in the comments for an actual game, and I wanted to have a go. Turns out it's a bit harder than I thought. This is my third attempt at getting something going, and I'm going to wheel out some of the big lessons in project management that I've learned recently. I'll be blogging about the steps as I go.
---

Imgur Pacman
=============

<figure class="pull-right">
	<img src="http://i.imgur.com/4tQvNZc.gif" alt="@konman96's immense .gif" width="300">
	<figcaption><a href="http://imgur.com/gallery/4tQvNZc">imgur | @konman96</a></figcaption>
</figure>

A while back @konman96 posted an awesome gif on imgur. Very stylishly done.

People seemed interested in a game, and I've been looking for an excuse to get stuck in to some simple HTML5 game stuff, so I thought I'd have a go.

My initial attempts didn't get very far. Turns out, there are quite a lot of features possible in a game like this and I wanted to do all of them. Perfectly. Each time I made a finished one thing and started a new one, I'd decide that things weren't perfect and have to go back. Too loosely typed. Not modular enough. No unit tests. Yuk.

I tell myself that the whole point of spare-time hacking like this is to try out new approaches and technologies that I wouldn't get a chance to use at work. To be fair, I still think that is a Good Thing&#0153;. However, when it gets to the point that I can't get anything done it's not so fun. I need to make a conscious effort to avoid this destructive kind of [magpie development](http://www.codinghorror.com/blog/2008/01/the-magpie-developer.html).

The Plan
------------

I'm going to put a fixed (but quite large) limit on the technologies I'm allowing myself to try out with this thing. I'm then going to break the game down into a series of incremental steps which can be done in blog-sized chunks. At the end of each chunk I'll create a blog post and a tag in the git repo so others can follow along.

#### Technologies

* [TypeScript](http://www.typescriptlang.org/) for some static typing goodness
* [Require](http://requirejs.org/) for modularity (using TypeScript's `--module AMD` flag)
* [QUnit](http://qunitjs.com/) and [Sinon](http://sinonjs.org/) for testing

If I get as far as Highscores then I'll be looking to use:

* [Angular](http://angularjs.org/) for any non-canvas UI
* [Mongolab](https://mongolab.com/) for data persistence
* [Imgur API](http://api.imgur.com/) for authentication

#### Milestones

Each of the following will be addressed as an independent chunk of work, and should be accompanied by unit tests and a blog post.

* Imgur-man stands alone on a grid full of food
* Imgur-man moves in a fixed direction
* Imgur-man wraps around
* The player can control the direction of Imgur-man
* Imgur-man eats food
* Imgur-man stops on walls
* Imgur-man will not rotate into walls
* Score
* Levels
* Simple Monsters
* Lives
* Advanced Monster Behaviour
* Improvements to animation
* Highscores

Work will happen in some branch of [the github repository](https://github.com/richardTowers/imgur-man).

#### Namco

Obviously all of the IP for the Pacman games belongs to Namco. I hope that if they see this project, they see it in the spirit that it is intended - as an educational project and a respectful homage to all their fantastic work. Namco, if you'd prefer me to take this down just let me know. No hard feelings, you guys are awesome. &hearts;