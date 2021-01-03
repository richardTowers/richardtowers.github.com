---
layout: post
title: "Terraforming the Advent of Code"
excerpt: >
  Sometimes everything looks like a nail, but all you have is a banana.
---

# Terraforming the Advent of Code

I propped my laptop up on four coasters to stop it from melting the kitchen
table. The thunderous noise of the fans almost drowning out the radio in the
background.

For two hours, I waited. Every few minutes, a new number.

7947, 0, 7875, 40, 7539, 179, 2353, 2195...

Finally, an answer. Convergence. 2240.

The wrong answer.

I gave up on Advent of Code on day 11.

## Advent of Code

Advent of Code is a series of small programming puzzles. Each December,
programmers from around the world spend a little time solving puzzles - for
fun, as practice, or just for the challenge.

<aside>
<h3>Aside: you don't need to do Advent of Code to be a great developer</h3>

<p>When you write code for a living, writing code outside of work "for fun" can
seem a bit ludicrous. Especially when the code is not doing anything useful.</p>

<p>But Twitter makes it sound like everyone else is doing Advent of Code, so
people sometimes feel like they should be doing it too, just to keep up.</p>

<p>That's bullshit though.</p>

<p>Firstly, there are lots of things you can do to get better at being a software developer
and solving Christmas themed puzzles is almost certainly right down at the
bottom of that list.</p>

<p>Secondly, the time to get better at doing your job is <em>while you're doing your
job</em>. As an industry, we shouldn't normalise people doing learning and
development on their own time. For one thing, it's exploitative. For another,
it excludes people who have better things to do with their time.</p>

<p>So, don't feel like you should be solving puzzles in your own time unless you
think it's fun, and have nothing better to do.</p>

<p>I do think it's fun, and it's 2020 so the "better things to do" pickings are
slim. So here are my experiences.</p>
</aside>

## Terraform

Some folks like to pick a language that's totally inappropriate for the job.
That way, solving the easy puzzles feels like an achievement. And when the
puzzles get too difficult, you can claim that it's the language holding you
back rather than your own inadequacy.

This year, I picked [Terraform](https://www.terraform.io/).

> Terraform is an open-source infrastructure as code software tool that
> provides a consistent CLI workflow to manage hundreds of cloud services.

In other words, it's not really a programming language at all. To my knowledge
none of the Advent of Code puzzles so far have involved managing hundreds of
cloud services.

Nevertheless, Terraform does include [a configuration language](https://www.terraform.io/docs/configuration/index.html),
which is surprisingly powerful.

```ruby
locals {
  # You can have lists:
  a_list = [1,2,3,4]

  # And you can do list comprehensions:
  evens = [for item in local.a_list: item if item % 2 == 0]

  # And there are lots of built in functions:
  squares = [for item in local.a_list: pow(item, 2)]
}

# And you can have outputs:
output "evens"   { value = local.evens   }
output "squares" { value = local.squares }
```

Applying the above with `terraform apply -auto-approve` gives:

```
Apply complete! Resources: 0 added, 0 changed, 0 destroyed.

Outputs:

evens = [
  2,
  4,
]
squares = [
  1,
  4,
  9,
  16,
]
```

For the easier puzzles, these features were all I needed. Some of the solutions
were even quite elegant!

## Terraform Triumphs

The most concise solution I found was to [day 6's
puzzle](https://adventofcode.com/2020/day/6). This required a little bit of
string processing on the input, and then some set operations (union and
intersection). Terraform has all these functions built in, so the solution was very nice:

```ruby
locals {
  groups = [for group in split("\n\n", trimspace(file("input.txt"))):
    [for person in split("\n", group): split("", person)]
  ]
  anyone_yes_counts   = [for g in local.groups: length(setunion(g...)) ]
  everyone_yes_counts = [for g in local.groups: length(setintersection(g...)) ]
}

output "part_1_answer" {
  value = sum(local.anyone_yes_counts)
}

output "part_2_answer" {
  value = sum(local.everyone_yes_counts)
}
```

I also enjoyed [day 5](https://adventofcode.com/2020/day/5), which could be
[solved](https://github.com/richardTowers/advent-of-code-2020/blob/main/day-5/main.tf)
with a trick. The elaborate description in the question is a roundabout way of
describing binary numbers, so converting the input (strings of `F`s, `B`s, `L`s
and `R`s) into a binary string (`0`s and `1`s) and then using `parseint(str,
2)` made the solution nice and simple.

Terraform's surprisingly wide range of built-in functions helped out (I didn't
expect there to be a function for parsing numbers in base 2 in Terraform, but
there is).

I also found [Terraform's list (and object) comprehensions](https://www.terraform.io/docs/configuration/expressions/for.html)
to be very elegant and expressive. Anything that you would express with
`filter` and `map` in a "normal" language can be nicely expressed in Terraform.

There were a few times in the easy puzzles when the solutions I came up with in
Terraform were shorter and more readable than my friends' solutions in much
more well regarded languages (even Haskell). A triumph.

## Terraform Troubles

Because Terraform's purpose is managing infrastructure, they've deliberately
avoided making the language more powerful than it needs to be. That means no
user defined functions, no while loops, no recursion, and no equivalent to the
`reduce()` function on lists.

I believe the absence of these features means that Terraform's configuration
language is not Turing Complete (although I have not proved that, so I could be
wrong).

This is a sensible choice when the goal is managing hundreds of cloud services -
you really don't want your configuration going through arbitrarily complex
machinations to work out what infrastructure you should be running (and paying
for).

It does make Advent of Code quite tricky though.

My workaround for this was to run Terraform lots of times. On each run it would
read some state from a local file, do some computations, and then write some
new state to the file. The process was "Done" when Terraform reached a fixed
point - i.e the file no longer changed.

Basically, wrapping Terraform with a little shell script like this:

```bash
#!/usr/bin/env bash
set -eu

output_file=$(mktemp -t aoc-terraform-output)
while ! grep -F 'Apply complete! Resources: 0 added, 0 changed, 0 destroyed.' "$output_file"
do
  terraform apply -auto-approve | tee "$output_file"
done
```

Diffing things is another strength of Terraform (the whole point is to converge
your infrastructure into the state described by the code), so this worked
pretty well too.

Unfortunately, this approach can be a bit ...slow...

The Advent of Code exercises are all supposed to have solutions that complete
in 15 seconds or less on modest hardware. Terraform is surprisingly fast at
doing computation while it's running. Unfortunately even an `O(n)` solution can
be slow if you have to let Terraform refresh its state `n` times.

Having to wait minutes to run Terraform ~100s of times, only to discover I'd
made a mistake and would need to do it all again was not fun.

Because Terraform computes it's list comprehensions eagerly, there's no way to
say "keep going until you find something that looks like this, and then stop".
Basically this means you always get worst case performance - even if Terraform
has already found the answer you're looking for, it will keep going until it's
done all the computation you asked for.

Some Terraform functions can be slow if you're running them in a very tight
loop. I found that using `try()` in the middle of a nested loop that needed to
run millions of times was a bad plan.

## Defeat

As I mentioned in the introduction, I was defeated by [day 11](https://adventofcode.com/2020/day/11).
This one is basically Conway's Game of Life, which was very fun to do in
Terraform.

Sadly, I couldn't come up with an `O(sensible)` solution for Part 2. Which lead
to me letting my machine run hot for hours on end, and still coming out with
the wrong answer.

While this was happening I was absent mindedly wondering about the carbon
footprint of it all, and a lot of the fun evaporated.

Since then I think I've spotted my mistake - there's a reasonably big bit of
work that's happening every time Terraform runs, but it's the same answer every
time.  If I could just do it once, and cache the result in a local file I'd
probably get through day 11. But first I'd have to work up the enthusiasm.

## What did I learn?

I certainly learned a lot about Terraform, which is good because it's a tool I
use a lot at work.

Now that I'm more confident with the Terraform language, I'm starting to think
about the whole tool a bit differently.

Maybe Terraform is not a Big Infrastructure Tool with a tiny language inside,
but actually a Big Language in its own right 🤔

If that's the case, then perhaps some of the best practices from the rest of
software development are more applicable to Terraform than I thought.

One thing I've been thinking about is pure functions (functions with inputs and
outputs, but no side effects) in the context of Terraform modules.

Sometimes we find ourselves using a module to create a single resource, just
because there's a bit of configuration that would be duplicated otherwise.

In a "real" language, a function that took some inputs, mapped them into a more
complex structure, and then _created an entire virtual machine as a side
effect_ would be frowned upon.

It's easier to reason about and test modules that only take inputs, do some
computation, and return outputs. These modules can leave creating any resources
to the caller.

I wonder if Terraform should reconsider its position on user-defined functions.
If pure modules are a good idea, then perhaps giving them a nicer syntax might
also be a good idea. Maybe some ideas from [Dhall](https://dhall-lang.org/#)
could be folded in. This would make future Advent of Codes much easier!
(although I think that's a non-goal for the team at Hashicorp).

## Did I have fun?

Yes. Although to be fair, what else was I going to do in December 2020?

## My solutions

If you're curious, all of [my solutions are in this git repository](https://github.com/richardTowers/advent-of-code-2020).

