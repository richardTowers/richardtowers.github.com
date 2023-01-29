---
layout: post
title: "Finding the longest matching prefix in SQL"
excerpt: "How to efficiently find the longest matching prefix of some string in SQL, and the dangers of stackexchange"
---

# Finding the longest matching prefix in SQL

[Skip to the solution](#the-solution)

  
<figure>
  <img class="fixed-width-20" alt="Photograph of a large deciduous tree in Richmond Park. The photographer, Simon Wilkes, commented: Perhaps one the best vantage points in Richmond Park, London. This bench is perfectly placed beneath a lonely tree, giving a clear view of the open fields and woodlands in every direction. In the early morning mist there’s a certain melancholy about the place - you could sit and ponder life here, without a care in the world." src="/static/images/simon-wilkes-S297j2CsdlM-unsplash.jpg">
  <figcaption>Photo by <a href="https://unsplash.com/@simonfromengland?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Simon Wilkes</a> on <a href="https://unsplash.com/images/nature/tree?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
</figcaption>
</figure>

We've got this fancy application at work - [router](https://github.com/alphagov/router). Router uses a data structure called a [trie](https://en.wikipedia.org/wiki/Trie) to efficiently search a list of strings and find the one that is the longest prefix of some input.

For example, if I searched for `/apply-for-a-licence/temporary-event-notice/east-hertfordshire/apply-1`, router could very quickly tell me that the longest prefix in its database is `/apply-for-a-licence`. As [this GDS' blog post from 2013 says](https://technology.blog.gov.uk/2013/12/05/building-a-new-router-for-gov-uk/), the trie data structure is a natural choice for this task.

But what if we wanted to accomplish the same thing in SQL, in a database which doesn't come with a trie data structure?

## The perils of stackexchange

Obviously the first thing to do is to Google it. For me, the most promising result was [this dba.stackexchange.com question](https://dba.stackexchange.com/questions/43415/algorithm-for-finding-the-longest-prefix), which asks for an "Algorithm for finding the longest prefix".

The example is a tiny bit more complicated than ours, but it looks similar enough. This looks like it should have a good answer.

When I first found this question there were three answers. [The top answer](https://dba.stackexchange.com/a/43444/268010) had 22 upvotes and was marked as the best answer, the other two answers had one and zero upvotes each. So obviously the top answer is the place to focus.

But... oh boy is this complicated. The "simple" solution uses `DISTINCT ON`, a postgres specific extension, and is acknowledged to be very slow without an index. Next we're into trigram indexes, but whether we use GIST or GIN, the query is still slow - taking around 1 second. The answer goes through a bunch of options - `text_pattern_ops`, "partial functional indexes", recursive CTEs, explicitly laid out recursion with `UNION ALL`, SQL funtions, and finally dynamic SQL.

I know enough SQL to be dangerous, but at this point my eyes glazed over and I started to think that this problem was probably just too hard.

Maybe a relational database is just not the right solution to this problem?

## A relational database is always the right solution to the problem

Later on, in the shower (always the best place to get thinking done), the problem popped back into my head.

What if we sorted all the possible prefixes we know about, and then inserted the search key into that table?

If there's a matching prefix, the prefix would always come immediately before the thing we're searching for if they're sorted alphabetically. Something like:

```
  /apply-first-provisional-driving-licence
  /apply-for-a-digital-tachograph-company-smart-card
  /apply-for-a-digital-tachograph-driver-smart-card
👀/apply-for-a-licence <--- 👀 The longest matching prefix
✨/apply-for-a-licence/temporary-event-notice/east-hertfordshire/apply-1 <--- ✨ The thing we're searching for
  /apply-for-a-patent
  /apply-for-a-thames-accommodation-licence
```

The default data structure that postgres uses for its indexes is the [B-Tree](https://en.wikipedia.org/wiki/B-tree). B-Trees maintain a sorted order, so shouldn't the database be able to work out an efficient way to do this? So long as we give it the right query?

## Initial attempts

Taking a really simple example where we've just got one column with all our path prefixes in:

```sql
create table routes(path text);
create index routes_index on routes (path);
```

The first thing I tried was basically the same as the approach I sketched out above - find the item that would appear just before this item in the list:

```sql
select path from routes
where '/apply-for-a-licence/temporary-event-notice/east-hertfordshire/apply-1' >= path
order by path desc
limit 1;
```

```
/apply-for-a-licence
```

Which works! "Perfectly"...

It's also efficient!

```sql
explain analyze select path from routes
where '/apply-for-a-licence/temporary-event-notice/east-hertfordshire/apply-1' >= path
order by path desc
limit 1;
```

```
Limit (cost=0.28..0.42 rows=1 width=32) (actual time=0.036..0.037 rows=1 loops=1)
-> Index Only Scan Backward using routes_index on routes (cost=0.28..303.96 rows=2267 width=32) (actual time=0.034..0.035 rows=1 loops=1)
Index Cond: (path <= '/apply-for-a-licence/temporary-event-notice/east-hertfordshire/apply-1'::text)
Heap Fetches: 1
Planning Time: 0.329 ms
Execution Time: 0.056 ms
```

That "Index Only Scan" is what we want to see. Postgres can answer this query using the index only, which is very fast.

Unfortunately, this query will produce confusing / wrong results whenever you search for something which _doesn't_ have a matching prefix:

```sql
select path from routes
where '/aaron-a-aaronson' >= path
order by path desc
limit 1;
```

```
/30-hours-free-childcare
```

wat.

This could be fixed by wrapping the result in a check that it's really a prefix of the search string, but there's a better way.

## Back to stackexchange

At this point I thought back to the stackexchange question. The people on that forum know a lot more about databases than I do. If it was really this easy to solve this problem, wouldn't they have already suggested this approach? Perhaps there was some subtlety I hadn't spotted.

Sure enough, [the second answer](https://dba.stackexchange.com/a/148947/268010) (which I had ignored because it only had the one upvote) takes exactly this approach.

> A string S is a prefix of a string T iff T is between S and SZ where Z is lexicographically larger than any other string (eg 99999999 with enough 9's to exceed the longest possible phone number in the dataset, or sometimes 0xFF will work).
> The longest common prefix for any given T is also lexicographically maximal, so a simple group by and max will find it.
> ...
> - KWillets answered Sep 6, 2016 at 18:15

Fancier words, but it's the same idea.

Additionally, they had the bright idea to use `between ... and ` and tack a suffix onto the column being searched to avoid the problem when you search for something which doesn't have a matching prefix. 9 is a good choice of suffix if you're dealing with numbers, but we've got letters too so I think `~` is a better choice (`~` is the last ASCII character when sorted alphabetically).

Repeating the sketch above, this would be something like:

```
  /apply-first-provisional-driving-licence
  /apply-first-provisional-driving-licence~~~~~~~~
  /apply-for-a-digital-tachograph-company-smart-card
  /apply-for-a-digital-tachograph-company-smart-card~~~~~~~~
  /apply-for-a-digital-tachograph-driver-smart-card
  /apply-for-a-digital-tachograph-driver-smart-card~~~~~~~~
👀/apply-for-a-licence <--- 👀 The longest matching prefix
✨/apply-for-a-licence/temporary-event-notice/east-hertfordshire/apply-1 <--- ✨ The thing we're searching for
👀/apply-for-a-licence~~~~~~~~ <--- 👀 The longest matching prefix, with a bunch of ~s tacked on to the end
  /apply-for-a-patent
  /apply-for-a-patent~~~~~~~~
  /apply-for-a-thames-accommodation-licence
  /apply-for-a-thames-accommodation-licence~~~~~~~~
```

I've given this answer another upvote. I think it's really elegant (even if the bit about appending a bunch of `9`s / `~`s is a bit weird). If you've got a stackexchange account, [you should upvote it too](https://dba.stackexchange.com/a/148947/268010).

## The solution

Combining the clever insight from stackexchange with the query I came up with in the shower gives:

```sql
select path from routes
where ? between path and path||'~~~~~'
order by path desc
limit 1;
```

With `'/apply-for-a-licence/temporary-event-notice/east-hertfordshire/apply-1'` this gives:

```
/apply-for-a-licence
```

With `'/aaron-a-aaronson'` this gives:

```
[No results]
```

Which is exactly what we want. And it's still efficient:

```sql
explain analyze select path from routes
where '/aaron-a-aaronson' between path and path||'~~~~~'
order by path desc
limit 1;
```

```
Limit (cost=0.28..0.70 rows=1 width=32) (actual time=0.036..0.036 rows=0 loops=1)
-> Index Only Scan Backward using routes_index on routes (cost=0.28..315.29 rows=756 width=32) (actual time=0.035..0.035 rows=0 loops=1)
Index Cond: (path <= '/aaron-a-aaronson'::text)
Filter: ('/aaron-a-aaronson'::text <= (path || '~~~~~'::text))
Rows Removed by Filter: 5
Heap Fetches: 5
Planning Time: 0.305 ms
Execution Time: 0.057 ms
```

## Conclusions

1. Relational databases are brilliant
1. It is possible to efficiently query for a longest prefix in SQL
1. The best answer on stackexchange is sometimes hiding without many upvotes
1. Try not to get intimidated by watching someone go down the rabbit hole on stackexchange
