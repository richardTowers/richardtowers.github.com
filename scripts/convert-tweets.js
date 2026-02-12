const fs = require("fs");
const path = require("path");

const OWN_HANDLE = "RichardTowers";
const DISPLAY_NAME = "Richard Towers";
const TWEETS_JS = path.join(__dirname, "..", "_twitter-dump", "data", "tweets.js");
const MEDIA_DIR = path.join(__dirname, "..", "_twitter-dump", "data", "tweets_media");
const OUT_DIR = path.join(__dirname, "..", "shitposts");

// ---------------------------------------------------------------------------
// Parse tweets.js
// ---------------------------------------------------------------------------
const raw = fs.readFileSync(TWEETS_JS, "utf8");
const json = raw.replace("window.YTD.tweets.part0 = ", "");
const allTweets = JSON.parse(json).map((t) => t.tweet);

// ---------------------------------------------------------------------------
// Build a set of media files keyed by tweet id
// ---------------------------------------------------------------------------
const mediaFiles = fs.readdirSync(MEDIA_DIR);
const mediaByTweet = new Map();
for (const file of mediaFiles) {
  const id = file.split("-")[0];
  if (!mediaByTweet.has(id)) mediaByTweet.set(id, []);
  mediaByTweet.get(id).push(file);
}

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------
const includedTweets = allTweets.filter((t) => {
  if (t.full_text.startsWith("RT @")) return false;
  if (t.in_reply_to_screen_name && t.in_reply_to_screen_name !== OWN_HANDLE)
    return false;
  return true;
});

const includedById = new Map();
includedTweets.forEach((t) => includedById.set(t.id_str, t));

console.log(`Total tweets: ${allTweets.length}`);
console.log(`After filtering: ${includedTweets.length}`);

// ---------------------------------------------------------------------------
// Build threads
// ---------------------------------------------------------------------------
// For each tweet, walk up the self-reply chain to find the root (within our
// included set). Group tweets sharing the same root into threads.
const tweetToRoot = new Map(); // tweet id -> root id
const threadMembers = new Map(); // root id -> Set of tweet ids

for (const tweet of includedTweets) {
  // Walk up
  let current = tweet;
  while (
    current.in_reply_to_status_id_str &&
    includedById.has(current.in_reply_to_status_id_str)
  ) {
    current = includedById.get(current.in_reply_to_status_id_str);
  }
  const rootId = current.id_str;
  tweetToRoot.set(tweet.id_str, rootId);
  if (!threadMembers.has(rootId)) threadMembers.set(rootId, new Set());
  threadMembers.get(rootId).add(tweet.id_str);
}

// Build ordered threads: each thread is an array of tweets sorted oldest-first
const threads = [];
const visited = new Set();

for (const [rootId, memberIds] of threadMembers) {
  if (visited.has(rootId)) continue;
  visited.add(rootId);
  const members = [...memberIds]
    .map((id) => includedById.get(id))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  threads.push(members);
}

// Drop threads whose first tweet starts with @ (replies missing context)
const beforeFilter = threads.length;
const filtered = threads.filter((t) => !t[0].full_text.startsWith("@"));

// Sort threads newest-first by the first tweet in each thread
filtered.sort(
  (a, b) => new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime()
);

const threadCount = filtered.filter((t) => t.length > 1).length;
console.log(`Dropped ${beforeFilter - filtered.length} threads starting with @`);
console.log(`Threads: ${threadCount}, standalone: ${filtered.length - threadCount}`);

// ---------------------------------------------------------------------------
// HTML-escape
// ---------------------------------------------------------------------------
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Process tweet text using entity indices (right-to-left to preserve positions)
// ---------------------------------------------------------------------------
function processTweetText(tweet) {
  const text = tweet.full_text;
  const entities = [];

  if (tweet.entities.urls) {
    for (const url of tweet.entities.urls) {
      entities.push({
        start: parseInt(url.indices[0]),
        end: parseInt(url.indices[1]),
        replacement: `<a href="${escapeHtml(url.expanded_url)}">${escapeHtml(url.display_url)}</a>`,
      });
    }
  }

  if (tweet.entities.user_mentions) {
    for (const mention of tweet.entities.user_mentions) {
      entities.push({
        start: parseInt(mention.indices[0]),
        end: parseInt(mention.indices[1]),
        replacement: `<a href="https://twitter.com/${escapeHtml(mention.screen_name)}">@${escapeHtml(mention.screen_name)}</a>`,
      });
    }
  }

  if (tweet.entities.hashtags) {
    for (const hashtag of tweet.entities.hashtags) {
      entities.push({
        start: parseInt(hashtag.indices[0]),
        end: parseInt(hashtag.indices[1]),
        replacement: `<a href="https://twitter.com/hashtag/${escapeHtml(hashtag.text)}">#${escapeHtml(hashtag.text)}</a>`,
      });
    }
  }

  if (tweet.entities.media) {
    for (const media of tweet.entities.media) {
      entities.push({
        start: parseInt(media.indices[0]),
        end: parseInt(media.indices[1]),
        replacement: "",
      });
    }
  }

  entities.sort((a, b) => b.start - a.start);

  const chars = [...text];
  let result = chars;

  for (const entity of entities) {
    const before = result.slice(0, entity.start);
    const after = result.slice(entity.end);
    result = [...before, entity.replacement, ...after];
  }

  let html = "";
  for (const part of result) {
    if (typeof part === "string" && part.length > 1 && part.startsWith("<")) {
      html += part;
    } else {
      html += escapeHtml(String(part));
    }
  }

  html = html.replace(/\n/g, "<br>\n");

  return html.trim();
}

// ---------------------------------------------------------------------------
// Build media HTML for a tweet
// ---------------------------------------------------------------------------
function buildMediaHtml(tweet) {
  const files = mediaByTweet.get(tweet.id_str);
  if (!files || files.length === 0) return "";

  let html = '    <div class="tweet-media">\n';
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (ext === ".mp4") {
      html += `      <video controls playsinline preload="metadata" src="/static/tweets/${file}"></video>\n`;
    } else {
      html += `      <img src="/static/tweets/${file}" alt="" loading="lazy">\n`;
    }
  }
  html += "    </div>\n";
  return html;
}

// ---------------------------------------------------------------------------
// Format date
// ---------------------------------------------------------------------------
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function isoDate(dateStr) {
  return new Date(dateStr).toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Build a single tweet's HTML
// ---------------------------------------------------------------------------
function buildTweet(tweet, { linkDate, continued }) {
  const tweetHtml = processTweetText(tweet);
  const mediaHtml = buildMediaHtml(tweet);
  const date = formatDate(tweet.created_at);
  const iso = isoDate(tweet.created_at);

  const dateEl = linkDate
    ? `<a class="tweet-timestamp" href="/shitposts/${tweet.id_str}.html"><time datetime="${iso}">${date}</time></a>`
    : `<time class="tweet-timestamp" datetime="${iso}">${date}</time>`;

  const tweetClass = continued ? "tweet tweet--continued" : "tweet";

  return `<div class="${tweetClass}">
  <img class="tweet-avatar" src="/static/tweets/avatar.jpg" alt="" width="48" height="48">
  <div class="tweet-body">
    <div class="tweet-header">
      <span class="tweet-name">${DISPLAY_NAME}</span>
      <span class="tweet-handle">@${OWN_HANDLE}</span>
      <span class="tweet-dot">\u00b7</span>
      ${dateEl}
    </div>
    <div class="tweet-text">${tweetHtml}</div>
${mediaHtml}  </div>
</div>`;
}

// ---------------------------------------------------------------------------
// Build a thread (array of tweets) as HTML for the index
// ---------------------------------------------------------------------------
function buildThread(thread, { linkDate }) {
  if (thread.length === 1) {
    return buildTweet(thread[0], { linkDate, continued: false });
  }

  let html = '<div class="tweet-thread">\n';
  for (let i = 0; i < thread.length; i++) {
    html += buildTweet(thread[i], { linkDate, continued: i > 0 });
    html += "\n";
  }
  html += "</div>";
  return html;
}

// ---------------------------------------------------------------------------
// Generate individual tweet pages — show full thread context
// ---------------------------------------------------------------------------
fs.mkdirSync(OUT_DIR, { recursive: true });

for (const thread of filtered) {
  for (let i = 0; i < thread.length; i++) {
    const tweet = thread[i];
    const iso = isoDate(tweet.created_at);

    let content;
    if (thread.length === 1) {
      content = buildTweet(tweet, { linkDate: false, continued: false });
    } else {
      // Show the full thread, but the current tweet is the "focus"
      content = '<div class="tweet-thread">\n';
      for (let j = 0; j < thread.length; j++) {
        content += buildTweet(thread[j], { linkDate: false, continued: j > 0 });
        content += "\n";
      }
      content += "</div>";
    }

    const page = `---
layout: shitpost
title: "Shitpost ${tweet.id_str}"
date: ${iso}
---
${content}
`;
    fs.writeFileSync(path.join(OUT_DIR, `${tweet.id_str}.html`), page);
  }
}

const pageCount = filtered.reduce((n, t) => n + t.length, 0);
console.log(`Generated ${pageCount} individual tweet pages`);

// ---------------------------------------------------------------------------
// Generate index page
// ---------------------------------------------------------------------------
let index = `---
layout: default
title: Shitposts
---
<h1>Shitposts</h1>
<p>An archive of tweets from my deleted Twitter account.</p>

`;

for (const thread of filtered) {
  index += buildThread(thread, { linkDate: true }) + "\n\n";
}

fs.writeFileSync(path.join(OUT_DIR, "index.html"), index);
console.log("Generated index page");
