---
layout: post
title: "How I manage my email"
tags: [productivity]
excerpt: >
  This is a post on how I manage my email inbox. Should be a strong contender for my most boring blog post.
image: /static/images/screenshot-of-gmail-grafana-dashboard.png
---

# How I manage my email

This is a post on how I manage my email inbox. Should be a strong contender for my most boring blog post.

2021 was not a good year for my relationship with my email inbox.

> If you sent me an email, I probably haven’t read it yet. Sorry about that.
> - me in weeknote S01E02 (17 Jan 2021)

I get a lot of emails at work - somewhere between 50 and 100 per day.

Most of these emails are automated notifications of one kind or another, of which most can be safely ignored. A few automated notifications are (potentially) important enough that I let them hit my inbox.

Then there are emails sent by actual human beings - calendar invitations, trello and github updates, questions, messages about recruitment campaigns and so on. Some of these just need reading, some of them need quick responses. Occasionally someone sends me an email which requires a bit of work to respond to (maybe I need to do a bit of investigation to answer a question, maybe it just needs a detailed reply).

What tended to happen to me was:

- I would get “on top of my emails” (a state where I was aware of everything in my inbox, and felt I would eventually address them all)
- A few emails would arrive which I didn’t have time to respond to immediately, and I’d leave these as unread to remind me to respond later
- Lots of less important emails would arrive, burying the few big emails that needed my response
- I’d start to feel anxious about the situation
- I’d start to avoid looking at my inbox because it made me feel anxious
- The situation would get much, much worse while I was ignoring it
- Occasionally I would entirely miss a chain of important emails, causing bad things to happen in the real world
- Eventually, I would have a multi-hour email binge and get back into a state where I was “on top of my emails”
- And then the cycle would repeat

This was really a bad situation, to the point where I’m nervous even admitting it. It made me less effective at my job, and it made me feel awful too.

This year I’ve been trying to sort my relationship with email out. I figured I’d share a few techniques I use for managing my inbox. They’re gmail specific, but there will be equivalents in other providers. Most are obvious, but I imagine a few are niche enough that they'll be new.

## Unsubscribe

If I get sent any automated marketing emails, I’ll find the unsubscribe link in the footer and unsubscribe.

If it’s in any way difficult to unsubscribe that email gets marked as spam. If you send marketing emails without unsubscribe links you deserve to have your reputation tarnished.

When I’m a member of a google group that gets a lot of email, I’ll consider whether I need to see every email, or whether [switching my subscription to digest, abridged, or no email](https://support.google.com/groups/answer/9792489) is better.

## Skip the inbox using filters

I get some automated emails which I can’t unsubscribe from, but which are never relevant to me. These are usually sent by systems within my own organization, so it’s not a good idea to try to get these flagged as spam.

Fortunately, gmail lets you [create rules to filter your emails](https://support.google.com/mail/answer/6579). One of the filtering options is to “Skip the Inbox (Archive it)”. Archived emails in gmail aren’t lost, they just don’t show up in the Inbox. So you can still search for these messages, or view them in the “All Mail” view.

## Use labels

Gmail lets you create your own labels, which you can then use to label messages in your inbox. [The Gmail Help docs explain how to use labels](https://support.google.com/mail/answer/118708).

I start most of my labels with numbers so they’ll appear in the order I want in the sidebar (they’re ordered alphabetically).

I have labels for things I particularly care about, like `3 - Apprentices`, `3 - Recruitment`, `4 - Incident`. I also have a tree of labels for various kinds of automated notifications - `5 - Automated Notifications/AWS`, `5 - Automated Notifications/GitHub`, `5 - Automated Notifications/Trello`.

The most important label I use is `0 - Needs response`. I use this one to stop me from leaving important things lingering in my inbox. Where there are things that are too big for me to respond immediately, I label them as “needs response” and archive them for later.

## Label using filters

You can use filters to assign labels to messages.

This is useful for stuff that’s being automatically archived because if you don’t label it, it’ll get lost in the “All Mail” swamp. A lot of my automatically archived email gets one kind or another kind of `5 - Automated Notifications` label. Mostly I still never look at this stuff, but when I do it’s useful to have it organised.

Note that you don’t have to Skip the Inbox when using filters. Some of my most useful filters just label stuff as it hits the inbox.

My favourite filter is the one that labels google calendar invitations:

```
Matches: (invite.ics OR invite.vcs) has:attachment
Do this: Apply label "Calendar Invitation"
```

Having these labeled in the inbox means I can go through just my calendar invitations. This is a lot less psychologically daunting than general mail, because calendar invitations rarely need more than a couple of seconds’ worth of thought - “am I going to attend this meeting? Yes / No”.

The same is true of Trello and GitHub notifications - I want to look at these, and I know they rarely take more than a few seconds to get through. Even if my inbox is a bit full, if there are a lot of Trello and GitHub notifications I know I can plough through those labels really quickly and see the total unread messages number plummet. Feels good.

## Use keyboard shortcuts

Sadly, at some point, I have to actually read the email. This is a process that has to be done manually.

It pays to be as efficient as possible. I want to focus on the emails, and spend as little time as possible clicking buttons in gmail.

There are [keyboard shortcuts for Gmail](https://support.google.com/mail/answer/6594?hl=en) (which have to be enabled in the settings). Software developers famously love shortcut keys. Taking your hands off the keyboard and reaching for the mouse is such a waste of time, and an invitation for repetitive strain injury.

It’s worth mentioning that these keyboard shortcuts can be a little… dangerous. Sometimes I get the interface wrong and start typing a reply outside of the right text area. I can press a dozen different shortcut keys before I work out that I’m not typing a reply. A dozen potentially destructive actions which I have no memory of. Still, it’s totally worth it.

My most used shortcuts are:

- `?` - the ever useful help dialog - shows you what all the keyboard shortcuts are
- `l` - to open the labels dialog. For example l0 will open the labels dialog and search for 0 (which will be my 0 – Needs response label)
- `e` - to archive an email. Once I’ve handled an email (either responded, or determined it doesn’t need a response), I’ll archive it.
- `j/k` - older / newer conversation
- `}` - archive conversation and go to the next newer conversation

I can hammer through emails pretty quickly labelling and archiving as I go. Almost feels like vim.

## Archive manually to reach ✨ Inbox Zero ✨

I’m not a strict adherent to the Inbox Zero philosophy, but I do try to reach zero occasionally. I like to archive messages, rather than just reading them and leaving them in the inbox.

Some of the archiving is done automatically by my filters, the rest is done with the e and } keyboard shortcuts.

## Track metrics and set service level objectives

The most extreme thing I’ve done to get on top of my emails is to keep metrics on them.

I wrote [a prometheus exporter for gmail](https://github.com/richardTowers/prometheus-gmail-exporter-go) and used it to hook up my inbox and grafana. Hopefully I’ll find time to write a separate post about this thing.

The metrics integration has enabled me to create a kind of Service Level Objective dashboard for my emails. I aim to manually archive about 30 emails per day, and I track the change in messages in my Inbox over 24 hour and 1 hour periods.

If these numbers go red, I know it’s past time for me to look at my emails again. This screenshot shows that I’m not there yet with my Needs Response label.

![Screenshot showing an empty gmail inbox alongside a grafana dashboard with various metrics. The metrics show 0 Threads in Inbox (green), -211 Change in Inbox (green), 233 Emails archived (green), -34 Change in Inbox (green), and 12 Needs Response (red). There are line graphs showing a downward trend in Inbox Total and a slight upward trend in Needs Response.](/static/images/screenshot-of-gmail-grafana-dashboard.png)
