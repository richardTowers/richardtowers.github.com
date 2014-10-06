---
layout: post
title: Cruise Control .NET on Linux
summary: |
    Cruise Control .NET is an open source build server that I have been contributing to. This post is primarily aimed at CCNet devs and documents
    the steps to build and run CCNet on a fresh ubuntu virtual machine.
---

Cruise Control .NET on Linux
============================

Introduction
----------------------------

Cruise Control .NET (CCNet) is an open source build server, originally by ThoughtWorks. I've used it in the past for a range of tasks (continuous integration, triggering scripts etc.) and it has proved very useful. There are a couple of improvements I'd like to see, and so I've started contributing to the project. First up was fixing unix support, which was slightly broken in `master`. Following [#215](https://github.com/ccnet/CruiseControl.NET/pull/215) it's now once more possible to build and run CCNet under mono on unix environments. What follows are the steps I took to get a CCNet build running on Ubuntu.

Creating a Virtual Machine
----------------------------

These days it's pretty cheap and easy to get a virtual machine set up in the cloud. I'm running Ubuntu 14.04 on the cheapest [DigitalOcean](https://www.digitalocean.com/) droplet, instructions on setting one of these up can be found [here](https://www.digitalocean.com/community/tutorials/how-to-create-your-first-digitalocean-droplet-virtual-server). Once we have a linux VM running and have connected to it we can start building CCNet.

    Welcome to Ubuntu 14.04.1 LTS (GNU/Linux 3.13.0-27-generic x86_64)  
                                                                    
	 * Documentation:  https://help.ubuntu.com/                         
	                                                                    
	  System information as of Mon Sep 29 08:44:19 EDT 2014             
	                                                                    
	  System load:  0.0               Processes:           65           
	  Usage of /:   9.4% of 19.56GB   Users logged in:     0            
	  Memory usage: 9%                IP address for eth0: 178.62.39.169
	  Swap usage:   0%                                                  
	                                                                    
	  Graph this data and manage this system at:                        
	    https://landscape.canonical.com/                                
	                                                                    
	Last login: Mon Sep 29 08:44:19 2014                                
	root@ccnet:~#                                                       

Getting the Cruise Control .NET Source
--------------------------------------

CCNet's source is hosted on [github](https://github.com/ccnet/CruiseControl.NET) so we can clone it using `git`. First we need to install git, which assuming a debian-based OS (e.g. Ubuntu) is a simple:

    sudo apt-get install git

We can then clone the repository with:

    git clone git://github.com/ccnet/CruiseControl.NET.git

Once that's done we should have a CruiseControl.NET directory which we can `cd` into.

    cd CruiseControl.NET

Getting Mono
------------

Because CCNet is a C# .NET application we need the mono compiler to build it and the mono runtime to run it. Again these are easy to install with your package manager:

    sudo apt-get install mono-devel mono-xsp

That might take a minute or so, after which we're ready to build CCNet.

Building CCNet
--------------

<span class="badge badge-important">Hack</span> At the moment mono's Visual Basic support is a bit dodgy, so we have to remove the mono example project from the solution file before we build. We can strip the project out of the solution file with `sed`:

    sed --in-place '/^\s*{6984BCE9/d' project/ccnet.sln

There's a handy shell script that wraps up the build process for you, so all you need to do now is run:

    ./build.sh build

Which basically just runs

    mono Tools/NAnt/NAnt.exe -buildfile:ccnet.build

This will put a the build products in the `Build` folder.

Running CCNet
-------------

There are two parts (that I'm going to talk about) to CCNet: the server and the dashboard. First let's talk about the server.

### Server

    cd Build/Server

<span class="badge badge-important">Hack</span> We use Log4Net for logging, by default using the `ColoredConsoleAppender`, which doesn't work on unix. We can switch to using the `ConsoleAppender` which does work:

    sed --in-place 's/ColoredConsoleAppender/ConsoleAppender/' ccnet.exe.config

It should then be possible to run the server with:

    mono ccnet.exe

If all goes well you should see output like:

	CruiseControl.NET Server 0.0.0.0 -- .NET Continuous Integration Server
	Copyright © 2003 - 2014 ThoughtWorks Inc.  All Rights Reserved.
	.NET Runtime Version: 4.0.30319.17020 [Mono]    Image Runtime Version: v4.0.30319
	OS Version: Unix 3.13.0.27      Server locale: en-US
	[CCNet Server:INFO] Reading configuration file "/root/CruiseControl.NET/Build/Server/ccnet.config"
	...

<span class="badge badge-info">Note</span> You'll have to change the config in ccnet.config so that it does what you want it to. The default `MyFirstProject` config assumes a windows environment, so it doesn't work out of the box.

### Dashboard

First let's change back into the root `CruiseControl.NET` directory.

    cd ../../

<span class="badge badge-important">Hack</span> The NAnt build script puts the binaries for the web dashboard in `Build/WebDashboard`, but to run the server we need them next to the `Web.config` file and the other assets. We can copy the files into `project/WebDeshboard/bin`.

    cp -R Build/WebDashboard project/WebDashboard/bin

We can then `cd` into the dashboard directory:

    cd project/WebDashboard

And run the website with:

    xsp --port 80 --nonstop

If all went well you should now be able to see your dashboard by navigating to the public IP address of your virtual machine in your browser.

