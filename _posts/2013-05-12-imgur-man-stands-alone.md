---
layout: post
title: ImgurMan Stands Alone
summary: |
    The first in a series of blog posts about the process of building an imgur themed pacman clone. In this post we produce a "hello world!"; setting up the project structure and producing a simple static output.
---

Getting Started
=============

As I explained in [my last post](/2013/05/04/imgur-pacman.html), I'm building an imgur themed HTML5 canvas pacman clone. In this post I'll go over the basics of getting the game up and running.

Project Struture
-------------

<div class="row-fluid">
	<div class="span3">
		<figure>
			<img src="/img/imgur-man-project-structure-0.png" alt="The project structure">
			<figcaption>The initial project in visual studio.</figcaption>
		</figure>
	</div>
	
	<div class="span9">
		<p>The basic set up is pretty simple, and should be familiar to anyone who's set up a website. We've got:</p>
		<ul>
			<li>One HTML file which we'll use to render our game.</li>
			<li>Bootstrap CSS (because at some point we'll need styles, and I need bootstrap as a crutch).</li>
			<li>Images for our maze and the characters.</li>
			<li>The fabricJS canvas drawing library and its TypeScript definitions.</li>
			<li><code>app.ts</code>, which is the entry point for the game code.</li>
		</ul>
		<p>Note that there's an <code>app.ts</code> file and an <code>app.js</code> file. This is because I'm using <a href="http://typescriptlang.org">TypeScript</a> (a statically typed language that comiles into JavaSctipt), rather than writing JavaScript directly. I'm a huge static typing fan.</p> 
		<p>I should also point out that the images in this project come from <a href="http://imgur.com/gallery/4tQvNZc">@konman96</a>, who is a much more talented illustrator than me.</p>
	</div>
</div>

Markup
-------------

Here's the contents of `index.html`. It's pretty basic. We're just loading up the dependencies, assigning them ids so that we can get at them from the TypeScript, and putting a canvas down so we have something to draw in.

{% highlight html %}
<!doctype html>
<html>
	<head>
		<title>imgur-man</title>
		<link rel="stylesheet" href="css/bootstrap.min.css" />
	</head>	
	<body>
		<!-- Single canvas to render the game in: -->
		<canvas id="canvas" width="560" height="620">
			Your browser doesn't support canvas, fool!
		</canvas>

		<!-- Load some images up for the game, but hide them: -->
		<div class="hide">
			<img src="img/pacmagurian-open.png" alt="pacmagurian" id="pacmagurian">
			<img src="img/pactard.png" alt="pactard" id="pactard">
			<img src="img/maze.png" alt="maze" id="maze">
			<img src="img/downvote.png" alt="downvote" id="downvote">
		</div>

		<!-- Dependencies (Todo: requireJS) -->
		<script src="lib/fabric.min.js"></script>

		<!-- Time for the magic: -->
		<script src="app.js"></script>
	</body>
</html>
{% endhighlight %}

TypeScript
------------

And here's the code itself. Again, things are pretty simple at this point. We're loading up the images that we included in the HTML and using [Fabric](http://fabricjs.com/) to draw them in the canvas. 

{% highlight javascript %}
///<reference path="lib/fabricjs.d.ts"/>

window.onload = () => {

	// Initialize canvas:
	var canvas = new fabric.StaticCanvas('canvas');

	// Load the background image:
	var mazeImg = <HTMLImageElement>document.getElementById('maze');
	var maze = new fabric.Image(mazeImg, { top: 310, left: 280 });
	canvas.add(maze);

	// Load our hero:
	var heroImg = <HTMLImageElement>document.getElementById('pacmagurian');
	var hero = new fabric.Image(heroImg, { top: 470, left: 280, flipX: true });
	canvas.add(hero);

	// Render the canvas:
	canvas.renderAll();

};
{% endhighlight %}

Result
------------

<div class="row-fluid">
	<div class="span5">
		<figure>
			<img src="/img/results-0.png" alt="The result after this early set up">
			<figcaption>The result after this early set up.</figcaption>
		</figure>
	</div>
	
	<div class="span7">
		<p>And there's the result. Not very impressive yet, since it's just positioning two images on a canvas. It should be a good starting point for the rest of the game though.</p>
		<p><a href="https://github.com/richardTowers/imgur-man/tree/v0.1" title="git tag of the repo as of this post.">ImgurMan stands alone on an empty maze.</a></p>
	</div>
</div>