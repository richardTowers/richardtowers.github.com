---
layout: post
title: CORS with Redmine
---

CORS with Redmine
================

I mentioned in my last post that I was working on [an AngularJS app][1] that queries the Redmine API. Towards the end I was whinging about having to write a reverse proxy server to get around the fact that the installation of redmine that I was querying lived on a different server to my angular app.

I'd like to get some of my colleagues involved in working on the project, but I think requiring them to install node and my reverse proxy, let alone redmine, will make the barrier to entry too high.

To make things a bit easier, I've set up an installation of redmine that allows [CORS][2] on [Heroku][3].

A Sunday Well Spent
----------------

There are two parts to a CORS request. First the client sends an HTTP `OPTIONS` request to the remote server (this is known as the preflight check). The remote server is expected to accept this request and return some `Access-Control` headers in the response. Assuming that's succesful, the client can then proceed with the main request (be it `GET`, `POST`, `PUT` or whatever). Again, the server is expected to respond with `Access-Control` headers set.

My quest to get this working with Redmine started with [this blog by Tom Sheffler][4] about setting up CORS for Rails apps. It suggests adding a `before_filter` for the preflight check, and an `after_filter` for setting the headers for the main response. I tried this out in Redmine's base controller class `ApplicationController` (so that the filters would be used by all the controllers) and lo-and-behold... nearly.

Making straight `$.get()`s with jQuery worked fine, I could see that the headers were set correctly, and no same-origin-policy violations in the console. Hooray! *However*, when I tried the same thing with AngularJS's `$http.get()` I got 404s for the preflight check. Unhooray.

I had a look at the `heroku logs` and, sure enough, Redmine was not routing HTTP `OPTIONS` requests - hence the 404. Not being a rails expert I wasn't sure how to get all Redmine's routes to accept these requests. Quick and Dirty solution - a new catchall route for all `OPTIONS` requests.

How To:
---------------

First let's adress the preflight check. I've added a whole new controller, just for this, at `/app/controllers/cors_controller.rb`. It looks like:

{% highlight ruby%}
class CorsController < ApplicationController

        skip_before_filter :session_expiration, :user_setup, :check_if_login_required, :set_localization

        def preflight
                headers['Access-Control-Allow-Origin'] = '*'
                headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS, PUT'
                headers['Access-Control-Allow-Headers'] = 'X-Requested-With, X-Prototype-Version, Content-Type'
                headers['Access-Control-Max-Age'] = '1728000'
                render :text => '', :content_type => 'text/plain'
        end

end
{% endhighlight %}

Pretty simple stuff. I've then routed all `OPTIONS` requests to this controller in `/config/routes.rb`:

{% highlight ruby %}

match '*path', :to => 'cors#preflight', :constraints => {:method => 'OPTIONS'}

{% endhighlight %}

Preflight checks taken care of, it's just a case of adding the headers to the main response using an `after_filter` in `/app/controllers/application_controller.rb` as suggested by Tom:

{% highlight ruby %}
class ApplicationController < ActionController::Base
  include Redmine::I18n
  # ...
  before_filter :session_expiration, :user_setup, :check_if_login_required, :set_localization

  #************ Begin Added Code ****************
  after_filter :cors_set_access_control_headers

  # For all responses in this application, return the CORS access control headers.

  def cors_set_access_control_headers
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS, PUT'
    headers['Access-Control-Max-Age'] = "1728000"
  end
  #************* End Added Code *****************
  #...
end
{% endhighlight %}

Success! Now I can invite contributers to the kanban project without having to make them set up a reverse proxy server on their machine.

It's probably worth noting that allowing `headers['Access-Control-Allow-Origin'] = '*'` will allow *all* domains to use the API. If you need to be in any way secure, you should be more specific than this. The same origin policy is there for a reason after all!

[1]:https://github.com/richardTowers/kanbanter
[2]:http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
[3]:http://www.heroku.com/
[4]:http://www.tsheffler.com/blog/?p=428