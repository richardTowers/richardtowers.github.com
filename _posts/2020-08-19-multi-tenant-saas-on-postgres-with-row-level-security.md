---
layout: post
title: "Multi-tenant SaaS on PostgreSQL with Row Level Security"
image: /static/images/james-eades-elephants-unsplash.jpg
excerpt: >
  <p>
  Writing software as a service (SaaS) applications securely and efficiently is
  a lot trickier than it seems at first glance. Usually you'll have lots of
  users in lots of separate organisations. Users should only be able to see
  data from their own organisation. Any bug that lets someone see data that
  they're not supposed to could shatter confidence in your product.
  </p>

  <p>
  I've been doing some reading on PostgreSQL's row level security (RLS)
  feature, which is one tool that can help you implement a multi-tenant
  application securely.
  </p>

  <p>
  In this post, I'm going to play with some ideas around RLS, and propose a
  specific architecture which I think improves on some of the common trade-offs
  in multi-tenant SaaS applications.
  </p>
---

# {{page.title}}

{{ page.excerpt }}

<figure>
  <img alt="A herd of elephants making their morning walk to a watering hole in Amboseli National Park, Kenya." src="{{ page.image }}">
  <figcaption>A herd of elephants making their morning walk to a watering hole in Amboseli National Park, Kenya. Photo by <a href="https://unsplash.com/@eadesstudio?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">James Eades</a> on <a href="https://unsplash.com/s/photos/elephants?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Unsplash</a>.</figcaption>
</figure>

## Simple Multi-tenancy with Row Level Security

Michael Beardsley from Amazon Web Services recently wrote a post on
[Multi-tenant data isolation with PostgreSQL Row Level
Security](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/),
which provides a nice introduction to the topic. They describe three
"Data partitioning options" - Silo (one database per tenant), Bridge (one
schema per tenant), and Pool (one shared database and schema for all tenants).

Choosing a Pool model where data for all tenants is kept in a shared schema
reduces operational cost (there's no need to maintain 𝑛 databases for 𝑛
tenants, or create a new database every time a new tenant signs up). However,
it introduces a major security risk - a small coding error (like a forgotten
`WHERE` clause) could allow one tenant to see data they should not have access
to about a different tenant.

Row level security allows you to enforce security rules at the database table
level. In theory, this allows you to get the operational benefits of the Pool
model, without the security drawbacks.

In practice though, there are still some operational difficulties.

```sql
CREATE POLICY tenant_isolation_policy ON tenant
USING (tenant_id::TEXT = current_user);
```

A simple RLS policy like the above works at the level of the database user, not
the human user who logged in to use the service. As Michael points out in their
post, this means you need to create a PostgreSQL role for every tenant, and your
application then needs some way to make different database connections depending on
which tenant the current user belongs to.

Instead, the recommendation is to use a connection level setting to set the
tenant ID, and refer to this in the RLS policy.

```sql
CREATE POLICY tenant_isolation_policy ON tenant
USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

This makes managing database connections a lot easier.

Using row level security in this way gives us much more confidence that simple
coding errors like forgotten `WHERE` clauses aren't going to lead to
catastrophic data breaches. But what about other vulnerabilities? If someone
finds a SQL injection vulnerability in the application, there's nothing to stop
them from using `set_config` with some other tenant's tenant ID, and then
they're off to the races.

In a Silo'd model where each tenant gets their own application and their own
database, finding a SQL injection vulnerability would only allow them access to
their own data. This could still be bad, but it's much less bad than getting
access to absolutely everything.

Is it possible to do better than this in the Pool model? Can we secure data
from other tenants, even if application code is vulnerable?

## Securing tenant data, even in the presence of application vulnerabilities

If we assume that a tenant manages to get the ability to run arbitrary SQL in
the context of the application, is there some way we can stop them from
accessing other tenants' data?

Intuitively, I thought this would be impossible - of course it's going to be
game over if the application is compromised!

But it turns out it _is_ possible to do better, as demonstrated by Bennie
Stewart in [this talk at the 2018 PostgresConf South Africa](
https://www.youtube.com/watch?v=-9QqQ2jkG_4) (if you've got a spare 40 minutes,
I'd really recommend having a watch of Bennie's talk, as it's a much more clear
and thorough introduction to these topics than I've been able to give in this
post).

The basic idea is to move authentication and creation of sessions into the
database, and have the RLS policy look up which tenant the user belongs to
based on their session ID. By getting clever with `SECURITY DEFINER` functions,
it's possible to ensure that it's impossible to query rows belonging to another
tenant unless you either know one of their users' credentials (so you can
create a session as that user), or can steal an active session ID.

If you can steal someone's password or session ID it really is game over for
their data, regardless of how secure the rest of the application and
infrastructure is. So this is a major improvement.

With credit to Bennie Stewart, here's a rough outline of how you'd do this in
SQL.

Since we need to be able to hash passwords, we'll need `pgcrypto`.

```sql
create extension pgcrypto;
```

We need a table of users, and a table of sessions.

```sql
create table users (
    id            serial not null primary key,
    username      text   not null,
    password_hash text   not null
);
```

```sql
create table sessions (
    id      serial not null primary key,
    user_id int    not null references user (id),
    token   uuid   not null default gen_random_uuid() unique
);
```

`sessions.token` will be a random unique identifier which is not practically
guessable. (`pgcrypto` provides a version of `gen_random_uuid` which uses a
secure random number generator).

"Signing in" will involve creating a new session, and then setting the random
token as a session level setting `app.token` using `set_config`.

```sql
create function login(_username text, _password text, out _token uuid) as $$
  declare
    _user_id int;
  begin

    select id from users
    where username = _username
    and password_hash = crypt(_password, password_hash)
    into _user_id;

    if _user_id is null then
      raise 'INVALID_LOGIN';
    else
      insert into sessions (user_id) values (_user_id)
      returning token into _token;

      perform set_config('app.token'::text, _token::text, false);
    end if;
  end;
$$ language plpgsql security definer;
```

The database user that the application uses will have no direct access to the
`sessions` table (so it will not be able to insert rows directly). Instead, the
above function will be defined by a user which does have access to the sessions
table, and the application's database user will be granted permission to call
it. Because it's defined with `SECURITY DEFINER` the function will be able to
insert sessions, even though the user calling it doesn't have permission to
insert into the table. This way, the application only has permission to create
sessions if it can provide the correct username and password for a user.

Once `login` has been called successfully, the connection level `app.token`
setting will point at the current session. Getting the `user_id` for a
particular token can be done in another `SECURITY DEFINER` function.

```sql
create function current_user_id(out _user_id int) as $$
  begin
    select user_id from sessions where token = current_setting('app.token')
    into _user_id;
  end
$$ language plpgsql security definer;
```

Now we have all the pieces we need to create a row level security policy which
prevents the application from accessing any rows the currently logged in user
doesn't have access to. For example, to restrict the users table so the user
can only see their own entry:

```sql
create policy user_isolation_policy on users
using (id = current_user_id());

alter table users enable row level security;
```

When the application user does `select * from users;`, they'll only be able to
see results for the current session. And the only way for the application user
to create a session is by calling the `login` function with correct credentials.

If someone malicious exploits a vulnerability in the application and gets the
ability to run arbitrary SQL, they still won't have permission to do anything
that isn't permitted by their session's RLS policy, so other users' data is
safe.

When I saw Bennie explain all this in his talk, I was absolutely blown away -
it's really incredible what you can do in postgres. I can really see the
security benefits of centralising policies in the database, rather than
expecting application developers not to make any mistakes.

But is this actually a good idea? There are certainly some major drawbacks.

For one thing, all that authentication code you've moved to the database is
_hard_ to get right. How confident are you that the hashing algorithm that
`pgcrypto` uses is the right choice for your data? It looks like you can use
`'bf'`, which is some kind of blowfish based thing, which is kinda like bcrypt,
but not the same? I'd much rather do this bit the same way that everyone else
does (i.e. in the application), rather than going off-the-beaten path by doing
crypto in the database.

More seriously, what if you want to implement other kinds of authentication?
How are you going to implement second factor authentication? How are those
WebAuthn libraries coming on? Signing in with a third party identity provider?
Better implement your own asymmetric crypto so you can validate the JWT...

So, a nice idea, but probably not ready for production (at least, not in 2020).

But let's not give up too soon - there must be some way of getting these
security benefits, without the big cost of moving all of this code into the
database? Enter, stage left, microservices.

## Separating session handling from application code

The idea so far has been to move authentication and session handling into the
database, so the application itself can only access data with the privileges of
the current user.

Rough outline of the rest:

- We can also do this with MS
- Have a session MS connected to the same DB as the application
- Apps use the session MS as an IDP, using something like OIDC
- The session MS does the authentication - checking user creds
- The session MS has a DB user with permission to touch _only_ the sessions
  table - just enough to insert rows when it thinks a user is properly
  authenticated
- Other microservices don't have access to the sessions table, but RLS is
  implemented as above
- Session ids are still random, unguessable strings, so compromising the
  application doesn't let you access anyone else's stuff.





