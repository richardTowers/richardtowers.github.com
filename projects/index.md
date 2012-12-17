---
layout: default
title: Richard Towers - Projects
rows:
    - projects:
        - title: Risk Viewer
          description: |
            At work we deal with a great deal of hierarchical data representing insurance quotes. This is a concept for a tree viewer in JavaScript. It's basically a thin wrapper around the <a href="https://github.com/mbostock/d3/wiki/Tree-Layout">d3 tree layout</a> with some irrelevant pop culture references thrown in.
          url: /Risk
          isReady: true
        - title: DecafScript
          description: |
            A silly JavaScript transcompiler. It just adds a bit of sugar so that you can use the <code>() -></code> syntax from CoffeeScript rather than JS's horrible <code>function</code> keyword. The implementation is naive in the <em>extreme</em>.
          url: https://github.com/richardTowers/decaf-script
          isReady: true
        - title: Mandelbrot Set
          description: |
            The mandelbrot set is the poster boy of the fractal world. Infinite complexity from a simple iterated polynomial. It also makes a good test case for playing with the html canvas tag.
          url: /Mandelbrot
          isReady: false
    - projects:
        - title: Angular Risk
          description: |
            An experiment using the <a href="http://angularjs.org/">AngularJS</a> framework to build a rich client side web app with similar functionality to those I work on at work.
          url: /AngularRisk
          isReady: false
        - title: Poll Balancer
          description: |
            A little canvas game based on the classic <a href="http://anji.sourceforge.net/polebalance.htm">Poll Balancing</a> problem in control theory. The player has to write some JavaScript to sove the problem.
          url: /PollBalancer
          isReady: false

---

The following are some demos of a few projects I've been working on in my spare time. Some are only half done, and some are still concepts (hence the disabled links). Feel free to have a browse. If you find something interesting the source is all on [github](https://github.com/richardTowers). Comments (constructive or otherwise) are welcome.

<div class="projects">
	{% for row in page.rows %}
		<div class="row-fluid">
			{% for project in row.projects %}
			    <div class="span4 clearfix">
					<h2>{{ project.title }}</h2>
			    	<p class="clearfix">
			    		{{ project.description }}
			    	</p>
			    	{% if project.isReady %}
			    		<a href="{{ project.url }}" class="btn pull-right">
			    	{% else %}
			    		<a class="btn pull-right" disabled="disabled" title="Sorry, this isn't ready yet.">
			    	{% endif %}
						<i class="icon-eye-open"> </i> View Project &raquo;
					</a>
				</div>
			{% endfor %}
		</div>
	{% endfor %}
</div>