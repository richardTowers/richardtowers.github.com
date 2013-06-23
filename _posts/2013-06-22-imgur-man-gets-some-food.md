---
layout: post
title: ImgurMan Gets Some Food
summary: |
    The second in a series of blog posts about the process of building an imgur themed pacman clone.
    In this post we produce continue bootstrapping the game. In the end, imgur-man's maze is populated with some tempting looking food.
---

<div class="alert alert-info">
	<button type="button" class="close" data-dismiss="alert">&times;</button>
	This is the second in a <a href="/2013/05/04/imgur-pacman.html">series of blog posts</a>.
	You can read the previous post <a href="/2013/05/12/imgur-man-stands-alone.html">here</a>.
</div>

Adding Some Food
================

In the last post we left our protagonist alone in a maze, with no friends and no food.
Obviously this is not a situation that can be allowed to stand. To make things right first we'll need to
add a bit of structure to the game.

The Plan
----------------

Ultimately we're going to need to run a game loop that ticks along, moves the characters about, and removes food when it gets eaten.
We should aim to keep the game state separate from the display. That leaves us with a pretty simple initialization process:

* Initialize the game state (character positions / food positions)
* Initialise the drawing's state (images for the background, the characters, and the food)
* Render the drawing based on the state.

The Map
----------------

We can encode most of the game's initial state (at least, the positions of the walls and the food) in a map.

<div class="row-fluid">
		<div class="span5">
{% highlight javascript %}
var mazeSource = [
    '############################',
    '#............##............#',
    '#o####.#####.##.#####.####o#',
    '#.####.#####.##.#####.####.#',
    '#.####.#####.##.#####.####.#',
    '#..........................#',
    '#.####.##.########.##.####.#',
    '#.####.##.########.##.####.#',
    '#......##....##....##......#',
    '######.##### ## #####.######',
    '     #.##### ## #####.#     ',
    '     #.##          ##.#     ',
    '     #.## ######## ##.#     ',
    '######.## #      # ##.######',
    '      .   #      #   .      ',
    '######.## #      # ##.######',
    '     #.## ######## ##.#     ',
    '     #.##          ##.#     ',
    '     #.## ######## ##.#     ',
    '######.## ######## ##.######',
    '#............##............#',
    '#.####.#####.##.#####.####.#',
    '#.####.#####.##.#####.####.#',
    '#o..##.......  .......##..o#',
    '###.##.##.########.##.##.###',
    '###.##.##.########.##.##.###',
    '#......##....##....##......#',
    '#.##########.##.##########.#',
    '#.##########.##.##########.#',
    '#..........................#',
    '############################'
];
{% endhighlight %}
	</div>
	<div class="span7">
		<dl>
			<dt><code>#</code></dt>
			<dd>Wall</dd>
			<dt><code>.</code></dt>
			<dd>Food</dd>
			<dt><code>o</code></dt>
			<dd>Powerup</dd>
		</dl>
	</div>
</div>

You can probably recognise the standard pacman maze.

Code Structure
---------------------

<figure class="span3 pull-right">
	<img src="/img/imgur-man-project-structure-1.png" alt="The project structure">
	<figcaption>By the power of Greyskull - Two whole TypeScript files!</figcaption>
</figure>

In the spirit of keeping things modular, let's split some of the code out into a separate file.
We'll keep code to do with the board in the board module in `board.ts`. Everything else
we can keep in `app.ts` for now, but we'll be splitting things up further later.

Since we're using TypeScript, we can start by thinking about types. As mentioned above, we're going
to try to keep the concept of game state separate from the canvas drawing that we're rendering. Let's declare
some interfaces to represent the two kinds of state that we'll need to keep track of:

<div class="row-fluid">
	<div class="span5">
{% highlight javascript %}
interface gameState {
	board: board.Board;
	hero: any;
	ghosts: any[];
	food: any[];
}
{% endhighlight %}
{% highlight javascript %}
interface drawingState {
	canvas: fabric.ICanvas;
	hero: fabric.IImage;
	food: any[];
}
{% endhighlight %}
	</div>
</div>

For now we'll use the `any` type for anything that we haven't quite worked out the structure for yet (things like the hero and food).
Later on we can add interfaces for these things to take more full advantage of static typing.

The `gameState` doesn't need to know anything about the canvas, or how it's going to be rendered, it can concentrate on things like the
positions of the actors. The `drawingState` holds on to what's been drawn, so that we don't have to re-render the entire game on each frame.

The Main Function
----------------------

From the very highest level then, here's what we're doing:

{% highlight javascript %}
(function main () {

	var width = 560;
	var height = 620;

	window.onload = () => {
		var gameState = initialiseState();
		var drawingState = initialiseDrawing(width, height, gameState);

		draw(drawingState, gameState);
	};

})();
{% endhighlight %}

When the window loads, initalise the state, then initialise the drawing, then draw it. No game loop yet, that'll come later.

Initialising the Game Sate
--------------------------

So, to build our initial game state we will loop over the maze source and build the objects and arrays that we need for the `gameState` interface above.

{% highlight javascript %}
function initialiseState() : gameState {

	// The Maze
	var mazeSource = [/*snip*/];

	// Create the board:
	var theBoard = new board.Board(mazeSource);

	var ghosts = [];
	var hero = { top: 23, left: 13.5 };

	var food = [];
	for (var rowNum = 0; rowNum < mazeSource.length; rowNum++) {
		var row = mazeSource[rowNum];
		for (var colNum = 0; colNum < row.length; colNum++) {
			switch (row[colNum]) {
				case '.':
					food.push({
						top: rowNum,
						left: colNum,
						value: 10
					});
					break;
				case 'o':
					food.push({
						top: rowNum,
						left: colNum,
						value: 50
					});
					break;
			}
		}
	}

	return {
		board: theBoard,
		food: food,
		ghosts: ghosts,
		hero: hero
	};
}
{% endhighlight %}

Awesome. Now we've got a representation of where all our things should appear, it's just a case of drawing them.

Initialising the Drawing
------------------------

{% highlight javascript %}
function initialiseDrawing(width: number, height: number, state: gameState) : drawingState {

	// Initialize canvas:
	var canvas = new fabric.StaticCanvas('canvas');

	// Load the background image:
	var mazeImg = <HTMLImageElement>document.getElementById('maze');
	var maze = new fabric.Image(
		mazeImg, {
			top: height / 2,
			left: width / 2
		});
	canvas.add(maze);

	var scale = x => 10 + x * 20;

	// Load our hero:
	var heroImg = <HTMLImageElement>document.getElementById('pacmagurian');
	var hero = new fabric.Image(
		heroImg, {
			top: scale(state.hero.top),
			left: scale(state.hero.left),
			flipX: true
		});
	canvas.add(hero);

	var food = state.food.map(x => new fabric.Circle({
		top: scale(x.top),
		left: scale(x.left),
		radius: 5,
		fill: '#0f0'
	}));

	food.forEach(x => canvas.add(x));

	return {
		canvas: canvas,
		hero: hero,
		food: food
	};
}
{% endhighlight %}

And Finally
--------------------

{% highlight javascript %}
function draw(drawing: drawingState, state: gameState) {
	// Render the canvas:
	drawing.canvas.renderAll();
}
{% endhighlight %}

Not much to do in the main draw loop yet, since the state is going to be the same as the inital state. There'll be more here later.

The Results
---------------------

<div class="row-fluid">
	<div class="span5">
		<figure>
			<img src="/img/results-1.png" alt="The results with food.">
			<figcaption>The results with food.</figcaption>
		</figure>
	</div>
	
	<div class="span7">
		<p>Hooray! Starting to look a lot like a game now, but still no movement yet. The excitement's really going to start in the next post.</p>
		<p><a href="https://github.com/richardTowers/imgur-man/tree/v0.2.1/imgur-man" title="git tag of the repo as of this post.">The maze is full of food.</a></p>
	</div>
</div>