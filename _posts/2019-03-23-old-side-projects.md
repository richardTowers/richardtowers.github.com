---
layout: post
title: "Old side projects"
excerpt: >
  Looking back on some old side projects from when I was learning to code.
---

Old side projects
=================

We all have to start somewhere. When I was learning to code I did a lot of
playing around with JavaScript, HTML and CSS. This resulted in a few "side
projects" which are still around on the internet.

Looking back now, years later, they hold an interesting kind of nostalgia.

Mandelbrot Viewer
-----------------

![Screenshot of the Mandelbrot viewer](/static/images/mandelbrot.png)

<dl>
<dt>Github</dt>
<dd><a href="https://github.com/richardTowers/mandelbrot">https://github.com/richardTowers/mandelbrot</a></dd>
<dt>"Literate" source code</dt>
<dd><a href="https://richard-towers.com/mandelbrot/docs/coffee/mandelbrot.coffee.html">https://richard-towers.com/mandelbrot/docs/coffee/mandelbrot.coffee.html</a></dd>
<dt>Result</dt>
<dd><a href="https://richard-towers.com/mandelbrot/">https://richard-towers.com/mandelbrot/</a></dd>
</dl>

This is interesting to look back on for a few reasons.

### Coffeescript

For some reason I was really in to [Coffescript](https://coffeescript.org/)
back then. Given I hadn't even learned ruby at this point I'm not really sure
why. I guess JavaScript wasn't confusing enough for me or something. `¯\_(ツ)_/¯`

### Literate programming

I'd been reading about [literate
programming](http://wiki.c2.com/?LiterateProgramming), and was enthusiastic
enough about it that I bothered to generate docs from the code.

Since then I've worked on teams where we write very few comments, instead
preferring to keep documentation in commit messages, stories and actual
documentation. I wouldn't necessarily say I agree with the no-comments
convention either - seems to me we often miss documentation around "why is this
code the way it is" and "what does this class do".

I don't think literate programming is practical in most codebases though.
When I explain a codebase I like to start at a high level of abstraction, gloss
over details, and then iteratively add detail until I've explained the thing I
need to. It's very difficult to structure code so you can just read it in an
order that gives you this gradual reveal. Writing code is difficult enough anyway,
without trying to turn the codebase into a book.

### Performance

I think this might have been the first time I ran into a major performance issue
writing front end code. Even drawing a Mandelbrot this size requires a lot of
iteration, and that meant it would lock the browser up while the thing rendered.

I did a couple of things to sort this out. Firstly there was a big algorithmic win
by not calculating the iterations for any of the big black circle in the
middle. Secondly I pulled all of the maths into a web worker, which meant it
didn't freeze the browser any more.

I haven't had a use for web workers since, which probably means I'm not doing
anything fun anymore :)

5nake
-----

![Screenshot of the 5nake game](/static/images/5nake.png)

<dl>
<dt>Github</dt>
<dd><a href="https://github.com/richardTowers/5nake">https://github.com/richardTowers/5nake</a></dd>
<dt>Result</dt>
<dd><a href="https://richard-towers.com/5nake/">https://richard-towers.com/5nake/</a></dd>
</dl>

This one was fun because it was my first ever game. Obviously it's pretty
simple, but it was really satisfying to have something that people could
actually play.

The high scores are all stored in some [mongolab](https://mlab.com/) thing, and
the API key is just right there in plain text in the JavaScript, so it's
amazing that nobody cheated and gave themselves a super high score. I'm
impressed that the database is still up after all this time, despite the fact
I've never paid anyone any money for it.

I think the main lesson with this project was "ship early". If you play for a
bit you'll notice it's quite buggy (sometimes the new apple appears in the
middle of the snake). I could have fixed these issues easily enough
with a bit of time, but I'm glad that I prioritized the features that made it
fun and then shipped it instead.

Other things
------------

I've got [close to 100](https://github.com/richardTowers?tab=repositories)
repositories sitting around in GitHub now. Most never got beyond the "fun joke"
stage, but a few might be worth looking back over in a future post.

