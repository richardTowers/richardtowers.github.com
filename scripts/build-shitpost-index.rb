#!/usr/bin/env ruby
#
# Reads individual tweet pages from shitposts/, builds shitposts/index.html.
# Run with: ruby scripts/build-shitpost-index.rb

require "yaml"

SHITPOSTS_DIR = File.join(__dir__, "..", "shitposts")

# Parse front matter + body from a file
def parse_page(path)
  text = File.read(path)
  if text =~ /\A---\n(.*?\n)---\n(.*)\z/m
    fm = YAML.safe_load($1, permitted_classes: [Date])
    body = $2
    [fm, body]
  end
end

# Replace <time class="tweet-timestamp" ...>...</time> with
# <a class="tweet-timestamp" href="..."><time ...>...</time></a>
# using the data-tweet-id from the enclosing .tweet div.
def linkify_timestamps(html)
  current_id = nil
  html.gsub(/(?:data-tweet-id="(\d+)")|(?:<time class="tweet-timestamp"(.*?)<\/time>)/m) do
    if $1
      current_id = $1
      $& # pass through unchanged
    else
      time_tag = $&
      if current_id
        %(<a class="tweet-timestamp" href="/shitposts/#{current_id}.html">#{time_tag.sub(' class="tweet-timestamp"', '')}</a>)
      else
        time_tag
      end
    end
  end
end

# Collect all tweet pages (not index.html)
pages = Dir.glob(File.join(SHITPOSTS_DIR, "*.html"))
  .reject { |f| File.basename(f) == "index.html" }
  .filter_map { |f| parse_page(f) }

# Keep only root tweets (no thread_root) — standalone tweets + thread roots
roots = pages.select { |fm, _| fm["tweet_id"] && !fm["thread_root"] }

# Sort by date descending
roots.sort_by! { |fm, _| fm["date"] || Date.new(1970) }
roots.reverse!

# Build the index
fragments = roots.map { |_, body| linkify_timestamps(body) }

index = <<~HTML
---
layout: default
title: Twitter archive
---
<h1>Twitter archive</h1>
<p>An archive of tweets from my deleted Twitter account. Elon Musk can fuck off.</p>

#{fragments.join("\n")}
HTML

File.write(File.join(SHITPOSTS_DIR, "index.html"), index)
puts "Generated shitposts/index.html with #{roots.size} entries"
