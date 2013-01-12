---
layout: post
title: CORS with Redmine
---

CORS with Redmine
================

I mentioned in my last post that I was working on [an AngularJS app][1] that queries the Redmine API. Towards the end I was whinging about having to write a reverse proxy server to get around the fact that the installation of redmine that I was querying lived on a different server to my angular app.

I'd like to get some of my colleagues involved in working on the project, but I think requiring them to install node and my reverse proxy, let alone redmine, will make the barrier to entry too high.

To make things a bit easier, I've set up an installation of redmine that allows [CORS][2] on [Heroku][3]. Many thanks to [this blog about getting redmine set up on heroku][4] and to [this blog about setting up CORS for Rails apps][5].

How To
----------------

To set the necessary CORS headers for all the controllers in a redmine app, just add the following code from [the aforementioned blog][5] to `app/controllers/application_controller.rb`:

{% highlight ruby %}
class ApplicationController < ActionController::Base
  include Redmine::I18n
  include Redmine::Pagination
  include RoutesHelper
  helper :routes

  class_attribute :accept_api_auth_actions
  class_attribute :accept_rss_auth_actions
  class_attribute :model_object

  layout 'base'

  protect_from_forgery
  def handle_unverified_request
    super
    cookies.delete(:autologin)
  end

  before_filter :session_expiration, :user_setup, :check_if_login_required, :set_localization

  #************ Begin Added Code ****************
  before_filter :cors_preflight_check
  after_filter :cors_set_access_control_headers

  # For all responses in this application, return the CORS access control headers.

  def cors_set_access_control_headers
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
    headers['Access-Control-Max-Age'] = "1728000"
  end

  # If this is a preflight OPTIONS request, then short-circuit the
  # request, return only the necessary headers and return an empty
  # text/plain.

  def cors_preflight_check
    if request.method == :options
      headers['Access-Control-Allow-Origin'] = '*'
      headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
      headers['Access-Control-Allow-Headers'] = 'X-Requested-With, X-Prototype-Version'
      headers['Access-Control-Max-Age'] = '1728000'
      render :text => '', :content_type => 'text/plain'
    end
  end
  #************* End Added Code *****************
{% endhighlight %}

All of the controllers in redmine inherit from this base class, so that'll set CORS headers for all you controls. Voilà!

It's probably worth noting that allowing `headers['Access-Control-Allow-Origin'] = '*'` will allow *all* domains to use the API. If you need to be in any way secure, you should be more specific than this. The same origin policy is there for a reason after all!

[1]:https://github.com/richardTowers/kanbanter
[2]:http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
[3]:http://www.heroku.com/
[4]:http://mplsalicia.wordpress.com/2012/09/27/redmine-2-1-on-heroku-cedar-with-attachments-on-s3/
[5]:http://www.tsheffler.com/blog/?p=428