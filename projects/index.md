---
layout: default
title: Richard Towers - Projects
projects:
  - title: Mandelbrot Set
    description: |
      The mandelbrot set is the poster boy of the fractal world. Infinite complexity from a simple iterated polynomial. It also makes a good test case for playing with the html canvas tag.
    url: /mandelbrot
    img: /img/mandelbrot.png
  - title: Risk Viewer
    description: |
      At work we deal with a great deal of hierarchical data representing insurance quotes. This is a concept for a tree viewer in JavaScript. It's basically a thin wrapper around the <a href="https://github.com/mbostock/d3/wiki/Tree-Layout">d3 tree layout</a> with some irrelevant pop culture references thrown in.
    url: /Risk
    img: /img/riskViewer.png
  - title: Pole Balancer
    description: |
      A little canvas game based on the classic <a href="http://anji.sourceforge.net/polebalance.htm">Pole Balancing</a> problem in control theory. The player has to write some JavaScript to sove the problem.
    url: /poleBalancer
    img: /img/poleBalancer.png
  - title: 5nake
    description: |
      A quick and dirty nokia style snake game using html5 canvas. Also uses angularJS and mongoDB for some user interface / presistence wizadry,
    url: /5nake
    img: /img/5nake.png

---

The following are some demos of a few projects I've been working on in my spare time. Some are only half done, and some are still concepts (hence the disabled links). Feel free to have a browse. If you find something interesting the source is all on [github](https://github.com/richardTowers). Comments (constructive or otherwise) are welcome.


<div class="row-fluid">
  <div id="myCarousel" class="projects carousel slide span10 offset1">
    <ol class="carousel-indicators">
      {% assign counter = 0 %}
      {% for project in page.projects %}
        <li data-target="#myCarousel" data-slide-to="{{ counter }}" {% if counter == 0 %}class="active"{% endif %}>&nbsp;</li>
      {% capture counter %}{{ counter | plus:1 }}{% endcapture %}
      {% endfor %}
    </ol>
    <div class="carousel-inner">
      {% assign counter = 0 %}
      {% for project in page.projects %}
      <div class="item {% if counter == 0 %}active{% endif %}">
        <img src="{{ project.img }}" alt="{{ project.title }}">
        <div class="carousel-caption">
          <h4><a href="{{ project.url }}">{{ project.title }}</a></h4>
          <p>{{ project.description }}</p>
        </div>
      </div>
      {% capture counter %}{{ counter | plus:1 }}{% endcapture %}
      {% endfor %}
    </div>
  
    <a class="carousel-control left" href="#myCarousel" data-slide="prev">&lsaquo;</a>
    <a class="carousel-control right" href="#myCarousel" data-slide="next">&rsaquo;</a>
  </div>
</div>