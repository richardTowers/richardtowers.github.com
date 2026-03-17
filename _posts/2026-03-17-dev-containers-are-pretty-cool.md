---
layout: post
title: "Dev containers are pretty cool, actually"
tags: [workflow, security]
excerpt: "Just because you’re paranoid doesn’t mean everyone isn’t out to get you."
---

# Dev containers are pretty cool, actually

Just because you’re paranoid doesn’t mean everyone isn’t out to get you.

Running the twin gauntlets of npm and `--dangerously-skip-permissions` gives you a lot to be paranoid about.

It seems like every other week someone manages to compromise a popular npm package and tries to steal all my precious NFT apes, and it’s just a matter of time until someone prompt-injects my yolo-mode vibecoding session.

I’ve been thinking about this problem in one form or another for years - mostly through a “compromised package” lens, but more recently with coding agents as well. How do you keep your development environment secure, while still reaping the productivity benefits of open source and AI?

The solution is to separate the *things you don’t trust* from the *things you care about*. You shouldn’t trust npm packages or coding agents. You should care about your API keys, user data, and (if you’re that way inclined) your apes.

Assume the environment you’re developing software in might be compromised, because you’ve exposed it to *things you don’t trust*. Then make sure that the *things you care about* exist in an environment that’s well separated from the potentially compromised development environment.

In an enterprise setting, you might achieve this with some fancy pattern like Privileged Access Workstations (PAWs), or by doing your dev work on virtualised desktop infrastructure (VDI). Those patterns come with big drawbacks though - PAWs require ~double the hardware, VDIs have setup costs and inevitably seem to have terrible user experience (UX).

Dev containers provide a lighter weight option that's more accessible to solo developers and smaller companies. A bit of discipline is required (which is always bad where security is concerned), but I think they hit a nice sweet spot between security and convenience.

## What’s a dev container?

> A development container (or dev container for short) allows you to use a container as a full-featured development environment
-- [https://containers.dev/](https://containers.dev/)

It’s a container with the development tooling you need installed (things like language runtimes, linters, language servers), and your source code mounted in. You can connect an editor (e.g. VSCode or IntelliJ) running on your host machine to a dev container running in docker locally, or in a remote environment.

There are a few nice things about this.

Firstly, you avoid most of the annoying UX issues of a virtualised desktop environment, because your editor is still running on the same machine with the keyboard and mouse plugged into it.

Secondly, and more relevant to my concerns above, it isolates the development environment from the host machine. This means that a malicious npm package installed in the dev container has dramatically less scope to cause trouble than it would running on the host environment - so long as the *things you care about* haven’t made their way into your dev container.

Coming up with a secure workflow using dev containers does mean you need to think about what you care about, and carefully separate it from the things you don’t trust.

## Securing the things you care about with dev containers

If you’re relying on dev containers for security, you need to make sure you actually separate your dev environments from the things you care about. It’s no help being in a dev container if you use the AWS CLI to administer your cloud environment in the same container you just npm installed some untrustworthy package from the internet.

Things you want to keep out of the container you’re doing dev work in:

- API keys and credentials  
- User data (particularly PII, or anything sensitive)  
- Private or commercially sensitive source code

You can still use dev containers to administer systems from the CLI, if you want, but you should make sure you don’t run anything you don’t trust in *those* containers.

As mentioned above, one of the untrustworthy things you might want to do in your dev container is run a coding agent. If you’re using a remote model (e.g. claude code), this results in a circular problem - as soon as you authenticate your coding agent to its API, you’ve given it something you care about (API credentials), so you have to at least worry that a prompt injection or hallucination-squatting npm package (i.e. a malicious package with a name likely to be hallucinated by an LLM) might steal those credentials. I don’t think there’s a way around this - `--dangerously-skip-permissions` still does what it says on the tin, sadly. At least isolating the agent from your host OS and any other secrets that it doesn’t fundamentally need is better than nothing though.

## Gotchas and caveats

Dev containers aren’t designed with security as their primary use case, so it is probably possible for a motivated and skilled adversary to cause problems outside of the container. There’s the security of the container runtime itself (say, docker), which I’m not qualified to judge.

If you’re connecting your IDE (say VSCode) to the container, that opens up more attack surface that you have to worry about. Often, IDEs will do clever things like forward your host machine’s ssh session into the container, often without warning you that they’re doing it, so you might expose something you care about (being able to ssh into things and pull / push from git remotes) without even realizing it.

Also I’m just a bloke on the internet - probably don’t take security advice from some random guy’s blog.

All that said, I think dev containers are a good step up from just running everything on your host OS, which is still what a lot of developers do. Usability is really okay, and the isolation is a lot better than nothing.
