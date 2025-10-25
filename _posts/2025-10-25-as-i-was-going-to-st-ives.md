---
layout: post
title: "As I was going to St Ives..."
excerpt: "I met a man with seven wives..."
---

# As I was going to St Ives...

## Prelude

```sql
drop table if exists relationships;
create table relationships(
  id serial,
  source uuid,
  target uuid default gen_random_uuid(),
  relationship text
);

drop table if exists characters;
create table characters(
  id uuid default gen_random_uuid() unique,
  type text,
  name text
);
```

## As I was going to St Ives

```sql
with
  narrator as (
    insert into characters (name, type)
    values ('Narrator', 'Narrator')
    returning id
  ),
  journey as (
    insert into relationships(source, relationship)
    select narrator.id, 'Going to'
    from narrator
    returning target
  ),
  st_ives as (
    insert into characters (id, name, type)
    select journey.target, 'St Ives', 'Place'
    from journey
    returning id
  ),
```

## I met a man

```sql
  meeting as (
    insert into relationships(source, relationship)
    select narrator.id, 'Met'
    from narrator
    returning target
  ),
  man as (
    insert into characters(id, name, type)
    select meeting.target, 'Man', 'Man'
    from meeting
    returning id
  ),
```
## with seven wives,

```sql
  marriages as (
    insert into relationships(source, relationship)
    select man.id, 'Wife'
    from man, generate_series(1, 7)
    returning target
  ),
  wives as (
    insert into characters(id, name, type)
    select marriages.target, 'Wife ' || row_number() over (), 'Wife'
    from marriages
    returning id
  ),
```
## Each wife had seven sacks,

```sql
  sack_owners as (
    insert into relationships(source, relationship)
    select wives.id, 'Owns'
    from wives, generate_series(1, 7)
    returning target
  ),
  sacks as (
    insert into characters(id, name, type)
    select sack_owners.target, 'Sack ' || row_number() over (), 'Sack'
    from sack_owners
    returning id
  ),
```

## Each sack had seven cats,

```sql
  cat_sacks as (
    insert into relationships(source, relationship)
    select sacks.id, 'Contains'
    from sacks, generate_series(1, 7)
    returning target
  ),
  cats as (
    insert into characters(id, name, type)
    select cat_sacks.target, 'Cat ' || row_number() over (), 'Cat'
    from cat_sacks
    returning id
  ),
```

## Each cat had seven kits:

```sql
  kit_cats as (
    insert into relationships(source, relationship)
    select cats.id, 'Parent'
    from cats, generate_series(1, 7)
    returning target
  )
insert into characters(id, name, type)
select kit_cats.target, 'Kit ' || row_number() over (), 'Kit'
from kit_cats;
```

## Kits, cats, sacks, and wives, How many were there going to St Ives?

```sql
select count(*)
from relationships
join characters place on relationships.target = place.id and relationship = 'Going to' and place.name='St Ives'
join characters on relationships.source = characters.id
where characters.type in ('Kit', 'Cat', 'Sack', 'Wife');

-- +-----+
-- |count|
-- +-----+
-- |0    |
-- +-----+
```

```sql
select type, count(*)
from characters
where type != 'Place'
group by rollup (type)
order by count(*), type;

-- +--------+-----+
-- |type    |count|
-- +--------+-----+
-- |Man     |1    |
-- |Narrator|1    |
-- |Wife    |7    |
-- |Sack    |49   |
-- |Cat     |343  |
-- |Kit     |2401 |
-- |null    |2802 |
-- +--------+-----+
```