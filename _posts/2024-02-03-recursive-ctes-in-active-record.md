---
layout: post
title: "Recursive CTEs in ActiveRecord"
excerpt: "Using ActiveRecord / Arel to write the example recursive CTE from the Postgresql docs"
---

# Recursive CTEs in ActiveRecord

[ActiveRecord](https://guides.rubyonrails.org/active_record_basics.html) is the
Object Relational Mapper (ORM) in Rails which lets you interact with the database.

A lot of the time, you don't have to think about SQL all that much - you write queries like:

```ruby
User.where(name: 'Richard', occupation: 'Code Monkey').order(created_at: :desc)
```

... and ActiveRecord turns them to SQL invisibly when it goes to the database
to fetch the results.

Occasionally though, we want to write a some SQL that isn't well supported in
ActiveRecord, or is quite separate from the models we have in the database.

## Recursive CTEs in Postgresql

The [Postgresql docs on Recursive Queries](https://www.postgresql.org/docs/current/queries-with.html#QUERIES-WITH-RECURSIVE)
give the following example of a SQL query that sums the integers from 1 through 100:

```sql
WITH RECURSIVE t(n) AS (
    VALUES (1)
  UNION ALL
    SELECT n+1 FROM t WHERE n < 100
)
SELECT sum(n) FROM t;
```

How would we express this in ActiveRecord? It doesn't refer to any tables in
the database, and it uses a few bits of SQL which ActiveRecord hasn't got great
support for (`WITH RECURSIVE`, `VALUES(1)`, `UNION ALL`).

ActiveRecord includes a lower-level library called Arel, which allows us to
manipulate the Abstract Syntax Tree more directly.

This includes the `Arel.sql()` method, which marks arbitrary strings as SQL
statements. So the easiest thing to do would be to just wrap the whole SQL
string with `Arel.sql()` and be done with it. That doesn't compose well with
the rest of ActiveRecord though - it would be nice if we could mix and match
bits of custom SQL with ActiveRecord queries.

## Recursive CTEs in ActiveRecord / Arel

We can use Arel to construct the syntax tree for the SQL in Postgresql's docs.

First, we create a "table" reference called "t" - note that this isn't actually
creating a table (and in fact there is no table in the database called "t" at
all), it's just a way to refer to a table-like thing called "t", like the one
we have in `WITH RECURSIVE t(n)`.

```ruby
cte_table = Arel::Table.new(:t)
```

Next up we need the base case, which in SQL is `VALUES (1)`. The best way I can work out to do this is:

```ruby
base_case = Arel::Nodes::ValuesList.new([[1]])
```

Then we need the recursive case, `SELECT n+1 FROM t WHERE n < 100` in SQL. We can refer to the `n` column on the `t` table reference using `cte_table[:n]`, leading to:

```ruby
recursive_case = cte_table
    .project(cte_table[:n] + 1)
    .where(cte_table[:n].lt(100))
```

Now we can create the CTE, which names itself `t(n)`, and is a `UNION ALL` between the base case and the recursive case:

```ruby
cte_definition = Arel::Nodes::Cte.new(
  Arel.sql("t(n)"),
  Arel::Nodes::UnionAll.new(base_case, recursive_case),
)
```

(Note that we had to use `Arel.sql()` here - this isn't very elegant, but I
couldn't work out a way to get it to emit `t(n)` without wrapping it in quotes
like `"t(n)"` which doesn't work).

Finally, we can put this all together with the `SELECT sum(n) FROM t` clause
and we have the full CTE:

```ruby
cte = cte_table.project(cte_table[:n].sum).with(:recursive, cte_definition)
```

Calling `cte.to_sql` gives us (almost) the exact SQL we wanted:

```sql
WITH RECURSIVE t(n) AS ( VALUES (1) UNION ALL (SELECT ("t"."n" + 1) FROM "t" WHERE "t"."n" < 100) ) SELECT SUM("t"."n") FROM "t"
```

And running this against a Postgresql database with ActiveRecord:

```ruby
ActiveRecord::Base.connection.execute(cte.to_sql)
```

Gives the answer - `{"sum"=>5050}`

All in all, a very convoluted way to do the equivalent of `(1..100).sum`.

(Or the more efficient `(100 * (1 + 100)) / 2` - thanks Carl Friedrich Gauss!)

## Closing thoughts

The main reason to go to all this trouble is to be able to compose bits of
ActiveRecord with less well-supported SQL features, which can occasionally have
big performance advantages. Recursive CTEs can be very useful for traversing
tree and graph structures without having to make multiple calls to the
database, which in some situations can lead to big speed ups.

I'm not sure how stable the Arel library is - it's possible it's only really
intended to be used inside ActiveRecord, so this approach could be a bit of a
maintenance headache with ActiveRecord upgrades.

## Prior art / Credits

I worked a lot of this out by following other people's blog posts. In particular:

- [6 Useful Arel Techniques for Composing Queries](https://medium.com/driven-by-code/6-useful-arel-techniques-for-composing-queries-544059e5f413)
- [The definitive guide to Arel, the SQL manager for Ruby](https://jpospisil.com/2014/06/16/the-definitive-guide-to-arel-the-sql-manager-for-ruby)
- [Arel, part II: Common table expressions - rails](https://scimed.io/news/arel-part-ii-common-table-expressions-rails)

... none of them quite made it clear how to implement the case in the docs
though, so here we are with another blog post.
