---
layout: post
title: "Representing graphs in Postgresql"
excerpt: "Some tricks and techniques for working with graph or tree like data in Postgresql"
---

# Representing graphs in Postgresql

Let's say we've got some graph-like data, such as a social network.

We can represent this generically with two tables:

```sql
create table nodes (
  id serial primary key,
  name text,
  details jsonb
);

create table edges (
  id serial primary key,
  type text,
  from_id integer references nodes(id),
  to_id integer references nodes(id),
  details jsonb
);
```

And we can insert some data (using lord of the rings characters) like this:

```sql
insert into nodes (name, details) values
  ('Frodo Baggins', '{"species": "Hobbit"}'), -- 1
  ('Bilbo Baggins', '{"species": "Hobbit"}'), -- 2
  ('Samwise Gamgee', '{"species": "Hobbit"}'), -- 3
  ('Hamfast Gamgee', '{"species": "Hobbit"}'), -- 4
  ('Gandalf', '{"species": "Wizard"}'), -- 5
  ('Aragorn', '{"species": "Human"}'), -- 6
  ('Arathorn', '{"species": "Human"}'), -- 7
  ('Legolas', '{"species": "Elf"}'), -- 8
  ('Thranduil', '{"species": "Elf"}'), -- 9
  ('Gimli', '{"species": "Dwarf"}'), -- 10
  ('Gloin', '{"species": "Dwarf"}'); -- 11

-- Parents
insert into edges (type, from_id, to_id, details) values
  ('parent', 2, 1, '{}'),
  ('parent', 4, 3, '{}'),
  ('parent', 7, 6, '{}'),
  ('parent', 9, 8, '{}'),
  ('parent', 11, 10, '{}');
```

## Simple queries - finding parents and children

We can find someone's parents by joining the `edges` table to the `nodes` table.

Hardcoding the child id (3) to find Samwise's parents:

```sql
select parent.name from nodes child
join edges on edges.to_id = child.id
join nodes parent on edges.from_id = parent.id
where child.id = 3;
```

If we didn't know Samwise's id, we could find him by name first using a CTE:

```sql
with child as (select id from nodes where name = 'Samwise Gamgee')
select parent.name from child
join edges on edges.to_id = child.id
join nodes parent on edges.from_id = parent.id;
```

## More complex queries - friends of friends

Not all of our characters knew each other directly. The friendship graph is a bit more complex:

```sql
insert into edges (type, from_id, to_id, details) values
  -- Everyone in the fellowship is friends with everyone else
  ('friend', 1, 3, '{}'), -- Frodo and Sam
  ('friend', 1, 5, '{}'), -- Frodo and Gandalf
  ('friend', 1, 6, '{}'), -- Frodo and Aragorn
  ('friend', 1, 8, '{}'), -- Frodo and Legolas
  ('friend', 1, 10, '{}'), -- Frodo and Gimli
  ('friend', 3, 1, '{}'), -- Sam and Frodo
  ('friend', 3, 5, '{}'), -- Sam and Gandalf
  ('friend', 3, 6, '{}'), -- Sam and Aragorn
  ('friend', 3, 8, '{}'), -- Sam and Legolas
  ('friend', 3, 10, '{}'), -- Sam and Gimli
  ('friend', 5, 1, '{}'), -- Gandalf and Frodo
  ('friend', 5, 3, '{}'), -- Gandalf and Sam
  ('friend', 5, 6, '{}'), -- Gandalf and Aragorn
  ('friend', 5, 8, '{}'), -- Gandalf and Legolas
  ('friend', 5, 10, '{}'), -- Gandalf and Gimli
  ('friend', 6, 1, '{}'), -- Aragorn and Frodo
  ('friend', 6, 3, '{}'), -- Aragorn and Sam
  ('friend', 6, 5, '{}'), -- Aragorn and Gandalf
  ('friend', 6, 8, '{}'), -- Aragorn and Legolas
  ('friend', 6, 10, '{}'), -- Aragorn and Gimli
  ('friend', 8, 1, '{}'), -- Legolas and Frodo
  ('friend', 8, 3, '{}'), -- Legolas and Sam
  ('friend', 8, 5, '{}'), -- Legolas and Gandalf
  ('friend', 8, 6, '{}'), -- Legolas and Aragorn
  ('friend', 8, 10, '{}'), -- Legolas and Gimli
  ('friend', 10, 1, '{}'), -- Gimli and Frodo
  ('friend', 10, 3, '{}'), -- Gimli and Sam
  ('friend', 10, 5, '{}'), -- Gimli and Gandalf
  ('friend', 10, 6, '{}'), -- Gimli and Aragorn
  ('friend', 10, 8, '{}'), -- Gimli and Legolas
  -- Bilbo was friends with Hamfast and Gandalf
  ('friend', 2, 4, '{}'), -- Bilbo and Hamfast
  ('friend', 2, 5, '{}'), -- Bilbo and Gandalf
  -- And vice versa
  ('friend', 4, 2, '{}'), -- Hamfast and Bilbo
  ('friend', 5, 2, '{}'), -- Gandalf and Bilbo
  -- Gandalf was friends with Bilbo, Hamfast and Thranduil, but for the sake of
  -- argument let's say he didn't know Gloin or Arathorn
  ('friend', 5, 2, '{}'), -- Gandalf and Bilbo
  ('friend', 5, 4, '{}'), -- Gandalf and Hamfast
  ('friend', 5, 9, '{}'), -- Gandalf and Thranduil
  -- And vice versa
  ('friend', 2, 5, '{}'), -- Bilbo and Gandalf
  ('friend', 4, 5, '{}'), -- Hamfast and Gandalf
  ('friend', 9, 5, '{}'); -- Thranduil and Gandalf
```

We could follow two friendship links using CTEs like before. Let's say friends of friends of Samwise:

```sql
with samwise as (select id from nodes where name = 'Samwise Gamgee'),
samwise_friends as (
  select distinct edges.to_id from edges
  join samwise on edges.from_id = samwise.id and edges.type = 'friend'
),
friends_of_friends as (
  select distinct edges.to_id from edges
  join samwise_friends on edges.from_id = samwise_friends.to_id and edges.type = 'friend'
)
select name from friends_of_friends join nodes on nodes.id = friends_of_friends.to_id;
```

This returns almost everyone, except for Arathorn and Gloin who we've decided weren't friends with anyone Samwise knew
(even though they probably knew Gandalf, in reality).

If we don't mind building up arbitrarily long chains of CTEs, we can follow any number of edges using this technique.

It would be kind of nice to be able to pass in the root node and the edge paths as parameters though, rather than
dynamically building up the CTEs.

## Parameterised recursive CTEs

Let's say we want to find the parents of the friends-of-friends of Samwise.

We could do this naively by building up a CTE for each level of friendship:

```sql
with samwise as (select id from nodes where name = 'Samwise Gamgee'),
samwise_friends as (
  select distinct edges.to_id from edges
  join samwise on edges.from_id = samwise.id and edges.type = 'friend'
),
friends_of_friends as (
  select distinct edges.to_id from edges
  join samwise_friends on edges.from_id = samwise_friends.to_id and edges.type = 'friend'
),
friends_of_friends_parents as (
  select distinct edges.from_id from edges
  join friends_of_friends on edges.to_id = friends_of_friends.to_id and edges.type = 'parent'
)
select name from friends_of_friends_parents join nodes on nodes.id = friends_of_friends_parents.from_id;
```

But this quickly becomes unwieldy. Instead, let's pull the variable bits out, and use a recursive CTE:

```sql
with recursive 
root(id) as (select id from nodes where name = 'Samwise Gamgee'),
paths(path) as (values ('{friend,friend,parent}'::text[])),
results(id) as (
  select root.id, 1 as path_index from root
union
  select edges.from_id, path_index + 1 as path_index from results
  join edges on edges.to_id = results.id
  join paths on edges.type = paths.path[path_index]
)
select * from results
join nodes on nodes.id = results.id
join paths on cardinality(paths.path) + 1 = results.path_index;
```

This can then be parameterised, so we can create this as a prepared statement and call it lots of times with
different root nodes and paths.

```sql
with recursive 
root(id) as (select id from nodes where name = ?),
paths(path) as (values (?::text[])),
results(id) as (
  select root.id, 1 as path_index from root
union
  select edges.from_id, path_index + 1 as path_index from results
  join edges on edges.to_id = results.id
  join paths on edges.type = paths.path[path_index]
)
select * from results
join nodes on nodes.id = results.id
join paths on cardinality(paths.path) + 1 = results.path_index;
```

If we wanted every node along the path, instead of just the end node, we could remove the join to `paths` in the final
line.

## Conclusion

This is one way of representing graph-like data in Postgresql, and querying it in a flexible way.

I'd be very interested in hearing about other techniques or improvements.
