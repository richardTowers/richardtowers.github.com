---
layout: post
title: "Content-addressable storage with postgres"
tags: [postgres, gds]
excerpt: >
  At work we've got a database backed email system that's running into some
  performance issues. In particular, we're placing the database's disk under a
  lot of write load.

  I've had an idea that we could use content-addressable data to reduce the
  amount we write to disk, and get better performance from a smaller database.

  This post is an exploration of some techniques that we might look at using to
  do this in postgres - they're new to me, and as yet untested in a production
  environment.
---

Content-addressable storage with postgres
=========================================

At work we've got a database backed email system that's running into some
performance issues. In particular, we're placing the database's disk under a
lot of write load.

I've had an idea that we could use content-addressable data to reduce the
amount we write to disk, and get better performance from a smaller database.

This post is an exploration of some techniques that we might look at using to
do this in postgres - they're new to me, and as yet untested in a production
environment.

Our email system
----------------

We manage a [pretty high traffic website](https://www.gov.uk) at work. One of
the more interesting features we have is a system where users can subscribe to
certain pages, and receive email updates whenever a page is updated.

Emails are customised for each change and each subscriber, so roughly speaking
if we have `m` content changes and `n` subscribers, we'll send out `m×n` unique
emails.

Since a single update to a page will often need to send _a lot_ of emails we
can't just do this synchronously, so we use a queue (or several, actually).

Simplifying things a bit:

* a single message is placed on a queue for each content change
* a worker process picks these up, finds all the subscribers for the change,
  and places each combination of change and subscriber as a message on a second
  queue
* a second worker picks each of these messages up and generates a customised
  email that's specific to this change and this subscriber. This email is
  written to the database, and then eventually yet another message is placed on
  yet another queue - this time saying "delivery the email in the database with
  this ID"
* finally, a third worker picks each of the delivery messages from the queue,
  finds the email in the database corresponding to the ID in the message, and
  sends it to our email provider

As a sequence diagram, this looks like:

<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" contentScriptType="application/ecmascript" contentStyleType="text/css" preserveAspectRatio="xMaxYMin" version="1.1" viewBox="0 0 1157 834" zoomAndPan="magnify"><defs/><g><rect fill="#FFFFFF" height="89.3984" style="stroke: #000000; stroke-width: 2.0;" width="470" x="13" y="99.2969"/><rect fill="#FFFFFF" height="161.6641" style="stroke: #000000; stroke-width: 2.0;" width="548.5" x="228.5" y="202.6953"/><rect fill="#FFFFFF" height="168.7969" style="stroke: #000000; stroke-width: 2.0;" width="686.5" x="228.5" y="378.3594"/><rect fill="#FFFFFF" height="133.6641" style="stroke: #000000; stroke-width: 2.0;" width="779.5" x="228.5" y="561.1563"/><line style="stroke: #383838; stroke-width: 1.0; stroke-dasharray: 5.0,5.0;" x1="59" x2="59" y1="82.2969" y2="746.9531"/><line style="stroke: #383838; stroke-width: 1.0; stroke-dasharray: 5.0,5.0;" x1="184.5" x2="184.5" y1="82.2969" y2="746.9531"/><line style="stroke: #383838; stroke-width: 1.0; stroke-dasharray: 5.0,5.0;" x1="275.5" x2="275.5" y1="82.2969" y2="746.9531"/><line style="stroke: #383838; stroke-width: 1.0; stroke-dasharray: 5.0,5.0;" x1="400" x2="400" y1="82.2969" y2="746.9531"/><line style="stroke: #383838; stroke-width: 1.0; stroke-dasharray: 5.0,5.0;" x1="528" x2="528" y1="82.2969" y2="746.9531"/><line style="stroke: #383838; stroke-width: 1.0; stroke-dasharray: 5.0,5.0;" x1="675" x2="675" y1="82.2969" y2="746.9531"/><line style="stroke: #383838; stroke-width: 1.0; stroke-dasharray: 5.0,5.0;" x1="803" x2="803" y1="82.2969" y2="746.9531"/><line style="stroke: #383838; stroke-width: 1.0; stroke-dasharray: 5.0,5.0;" x1="872" x2="872" y1="82.2969" y2="746.9531"/><line style="stroke: #383838; stroke-width: 1.0; stroke-dasharray: 5.0,5.0;" x1="956" x2="956" y1="82.2969" y2="746.9531"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="66" x="23" y="78.9951">Publisher</text><ellipse cx="59" cy="13" fill="#F8F8F8" rx="8" ry="8" style="stroke: #383838; stroke-width: 2.0;"/><path d="M59,21 L59,48 M46,29 L72,29 M59,48 L46,63 M59,48 L72,63 " fill="none" style="stroke: #383838; stroke-width: 2.0;"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="66" x="23" y="758.9482">Publisher</text><ellipse cx="59" cy="772.25" fill="#F8F8F8" rx="8" ry="8" style="stroke: #383838; stroke-width: 2.0;"/><path d="M59,780.25 L59,807.25 M46,788.25 L72,788.25 M59,807.25 L46,822.25 M59,807.25 L72,822.25 " fill="none" style="stroke: #383838; stroke-width: 2.0;"/><rect fill="#F8F8F8" height="30.2969" style="stroke: #383838; stroke-width: 1.5;" width="87" x="141.5" y="51"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="73" x="148.5" y="70.9951">Controller</text><rect fill="#F8F8F8" height="30.2969" style="stroke: #383838; stroke-width: 1.5;" width="87" x="141.5" y="745.9531"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="73" x="148.5" y="765.9482">Controller</text><rect fill="#F8F8F8" height="30.2969" style="stroke: #383838; stroke-width: 1.5;" width="74" x="238.5" y="51"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="60" x="245.5" y="70.9951">Workers</text><rect fill="#F8F8F8" height="30.2969" style="stroke: #383838; stroke-width: 1.5;" width="74" x="238.5" y="745.9531"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="60" x="245.5" y="765.9482">Workers</text><path d="M333,56 L468,56 C473,56 473,69.1484 473,69.1484 C473,69.1484 473,82.2969 468,82.2969 L333,82.2969 C328,82.2969 328,69.1484 328,69.1484 C328,69.1484 328,56 333,56 " fill="#F8F8F8" style="stroke: #383838; stroke-width: 2.0;"/><path d="M468,56 C463,56 463,69.1484 463,69.1484 C463,82.2969 468,82.2969 468,82.2969 " fill="none" style="stroke: #383838; stroke-width: 2.0;"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="125" x="333" y="73.9951">Content Changes</text><path d="M333,745.9531 L468,745.9531 C473,745.9531 473,759.1016 473,759.1016 C473,759.1016 473,772.25 468,772.25 L333,772.25 C328,772.25 328,759.1016 328,759.1016 C328,759.1016 328,745.9531 333,745.9531 " fill="#F8F8F8" style="stroke: #383838; stroke-width: 2.0;"/><path d="M468,745.9531 C463,745.9531 463,759.1016 463,759.1016 C463,772.25 468,772.25 468,772.25 " fill="none" style="stroke: #383838; stroke-width: 2.0;"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="125" x="333" y="763.9482">Content Changes</text><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="84" x="483" y="78.9951">Subscribers</text><path d="M510,30 C510,20 528,20 528,20 C528,20 546,20 546,30 L546,56 C546,66 528,66 528,66 C528,66 510,66 510,56 L510,30 " fill="#F8F8F8" style="stroke: #000000; stroke-width: 1.5;"/><path d="M510,30 C510,40 528,40 528,40 C528,40 546,40 546,30 " fill="none" style="stroke: #000000; stroke-width: 1.5;"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="84" x="483" y="758.9482">Subscribers</text><path d="M510,772.25 C510,762.25 528,762.25 528,762.25 C528,762.25 546,762.25 546,772.25 L546,798.25 C546,808.25 528,808.25 528,808.25 C528,808.25 510,808.25 510,798.25 L510,772.25 " fill="#F8F8F8" style="stroke: #000000; stroke-width: 1.5;"/><path d="M510,772.25 C510,782.25 528,782.25 528,782.25 C528,782.25 546,782.25 546,772.25 " fill="none" style="stroke: #000000; stroke-width: 1.5;"/><path d="M588,56 L762,56 C767,56 767,69.1484 767,69.1484 C767,69.1484 767,82.2969 762,82.2969 L588,82.2969 C583,82.2969 583,69.1484 583,69.1484 C583,69.1484 583,56 588,56 " fill="#F8F8F8" style="stroke: #383838; stroke-width: 2.0;"/><path d="M762,56 C757,56 757,69.1484 757,69.1484 C757,82.2969 762,82.2969 762,82.2969 " fill="none" style="stroke: #383838; stroke-width: 2.0;"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="164" x="588" y="73.9951">Changes + Subscribers</text><path d="M588,745.9531 L762,745.9531 C767,745.9531 767,759.1016 767,759.1016 C767,759.1016 767,772.25 762,772.25 L588,772.25 C583,772.25 583,759.1016 583,759.1016 C583,759.1016 583,745.9531 588,745.9531 " fill="#F8F8F8" style="stroke: #383838; stroke-width: 2.0;"/><path d="M762,745.9531 C757,745.9531 757,759.1016 757,759.1016 C757,772.25 762,772.25 762,772.25 " fill="none" style="stroke: #383838; stroke-width: 2.0;"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="164" x="588" y="763.9482">Changes + Subscribers</text><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="46" x="777" y="78.9951">Emails</text><path d="M785,30 C785,20 803,20 803,20 C803,20 821,20 821,30 L821,56 C821,66 803,66 803,66 C803,66 785,66 785,56 L785,30 " fill="#F8F8F8" style="stroke: #000000; stroke-width: 1.5;"/><path d="M785,30 C785,40 803,40 803,40 C803,40 821,40 821,30 " fill="none" style="stroke: #000000; stroke-width: 1.5;"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="46" x="777" y="758.9482">Emails</text><path d="M785,772.25 C785,762.25 803,762.25 803,762.25 C803,762.25 821,762.25 821,772.25 L821,798.25 C821,808.25 803,808.25 803,808.25 C803,808.25 785,808.25 785,798.25 L785,772.25 " fill="#F8F8F8" style="stroke: #000000; stroke-width: 1.5;"/><path d="M785,772.25 C785,782.25 803,782.25 803,782.25 C803,782.25 821,782.25 821,772.25 " fill="none" style="stroke: #000000; stroke-width: 1.5;"/><path d="M844,56 L900,56 C905,56 905,69.1484 905,69.1484 C905,69.1484 905,82.2969 900,82.2969 L844,82.2969 C839,82.2969 839,69.1484 839,69.1484 C839,69.1484 839,56 844,56 " fill="#F8F8F8" style="stroke: #383838; stroke-width: 2.0;"/><path d="M900,56 C895,56 895,69.1484 895,69.1484 C895,82.2969 900,82.2969 900,82.2969 " fill="none" style="stroke: #383838; stroke-width: 2.0;"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="46" x="844" y="73.9951">Emails</text><path d="M844,745.9531 L900,745.9531 C905,745.9531 905,759.1016 905,759.1016 C905,759.1016 905,772.25 900,772.25 L844,772.25 C839,772.25 839,759.1016 839,759.1016 C839,759.1016 839,745.9531 844,745.9531 " fill="#F8F8F8" style="stroke: #383838; stroke-width: 2.0;"/><path d="M900,745.9531 C895,745.9531 895,759.1016 895,759.1016 C895,772.25 900,772.25 900,772.25 " fill="none" style="stroke: #383838; stroke-width: 2.0;"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="46" x="844" y="763.9482">Emails</text><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="77" x="915" y="78.9951">Subscriber</text><ellipse cx="956.5" cy="13" fill="#F8F8F8" rx="8" ry="8" style="stroke: #383838; stroke-width: 2.0;"/><path d="M956.5,21 L956.5,48 M943.5,29 L969.5,29 M956.5,48 L943.5,63 M956.5,48 L969.5,63 " fill="none" style="stroke: #383838; stroke-width: 2.0;"/><text fill="#000000" font-family="sans-serif" font-size="14" lengthAdjust="spacingAndGlyphs" textLength="77" x="915" y="758.9482">Subscriber</text><ellipse cx="956.5" cy="772.25" fill="#F8F8F8" rx="8" ry="8" style="stroke: #383838; stroke-width: 2.0;"/><path d="M956.5,780.25 L956.5,807.25 M943.5,788.25 L969.5,788.25 M956.5,807.25 L943.5,822.25 M956.5,807.25 L969.5,822.25 " fill="none" style="stroke: #383838; stroke-width: 2.0;"/><path d="M13,99.2969 L168,99.2969 L168,106.2969 L158,116.2969 L13,116.2969 L13,99.2969 " fill="#EEEEEE" style="stroke: #000000; stroke-width: 1.0;"/><rect fill="none" height="89.3984" style="stroke: #000000; stroke-width: 2.0;" width="470" x="13" y="99.2969"/><text fill="#000000" font-family="sans-serif" font-size="13" font-weight="bold" lengthAdjust="spacingAndGlyphs" textLength="110" x="28" y="112.3638">publish change</text><polygon fill="#383838" points="173,133.5625,183,137.5625,173,141.5625,177,137.5625" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="59" x2="179" y1="137.5625" y2="137.5625"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacingAndGlyphs" textLength="102" x="66" y="132.4966">Content change</text><polygon fill="#383838" points="388.5,147.5625,398.5,151.5625,388.5,155.5625,392.5,151.5625" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="185" x2="394.5" y1="151.5625" y2="151.5625"/><polygon fill="#383838" points="70,176.6953,60,180.6953,70,184.6953,66,180.6953" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="64" x2="184" y1="180.6953" y2="180.6953"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacingAndGlyphs" textLength="13" x="76" y="175.6294">&#128077;</text><path d="M228.5,202.6953 L456.5,202.6953 L456.5,209.6953 L446.5,219.6953 L228.5,219.6953 L228.5,202.6953 " fill="#EEEEEE" style="stroke: #000000; stroke-width: 1.0;"/><rect fill="none" height="161.6641" style="stroke: #000000; stroke-width: 2.0;" width="548.5" x="228.5" y="202.6953"/><text fill="#000000" font-family="sans-serif" font-size="13" font-weight="bold" lengthAdjust="spacingAndGlyphs" textLength="183" x="243.5" y="215.7622">process content change</text><polygon fill="#383838" points="286.5,236.9609,276.5,240.9609,286.5,244.9609,282.5,240.9609" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="280.5" x2="399.5" y1="240.9609" y2="240.9609"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacingAndGlyphs" textLength="101" x="292.5" y="235.895">Process change</text><polygon fill="#383838" points="516,266.0938,526,270.0938,516,274.0938,520,270.0938" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="275.5" x2="522" y1="270.0938" y2="270.0938"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacingAndGlyphs" textLength="176" x="282.5" y="265.0278">Find subscribers for change</text><polygon fill="#383838" points="286.5,295.2266,276.5,299.2266,286.5,303.2266,282.5,299.2266" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="280.5" x2="527" y1="299.2266" y2="299.2266"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacingAndGlyphs" textLength="74" x="292.5" y="294.1606">Subscribers</text><polygon fill="#383838" points="663,324.3594,673,328.3594,663,332.3594,667,328.3594" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="275.5" x2="669" y1="328.3594" y2="328.3594"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacingAndGlyphs" textLength="134" x="282.5" y="323.2935">Change + Subscriber</text><polygon fill="#383838" points="663,338.3594,673,342.3594,663,346.3594,667,342.3594" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="275.5" x2="669" y1="342.3594" y2="342.3594"/><polygon fill="#383838" points="663,352.3594,673,356.3594,663,360.3594,667,356.3594" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="275.5" x2="669" y1="356.3594" y2="356.3594"/><path d="M228.5,378.3594 L488.5,378.3594 L488.5,385.3594 L478.5,395.3594 L228.5,395.3594 L228.5,378.3594 " fill="#EEEEEE" style="stroke: #000000; stroke-width: 1.0;"/><rect fill="none" height="168.7969" style="stroke: #000000; stroke-width: 2.0;" width="686.5" x="228.5" y="378.3594"/><text fill="#000000" font-family="sans-serif" font-size="13" font-weight="bold" lengthAdjust="spacingAndGlyphs" textLength="215" x="243.5" y="391.4263">process change + subscriber</text><polygon fill="#383838" points="286.5,412.625,276.5,416.625,286.5,420.625,282.5,416.625" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="280.5" x2="674" y1="416.625" y2="416.625"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacingAndGlyphs" textLength="185" x="292.5" y="411.5591">Process change + subscriber</text><path d="M280,429.625 L280,454.625 L400,454.625 L400,439.625 L390,429.625 L280,429.625 " fill="#ECECEC" style="stroke: #383838; stroke-width: 1.0;"/><path d="M390,429.625 L390,439.625 L400,439.625 L390,429.625 " fill="#ECECEC" style="stroke: #383838; stroke-width: 1.0;"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacingAndGlyphs" textLength="99" x="286" y="446.6919">Generate email</text><polygon fill="#383838" points="791,476.8906,801,480.8906,791,484.8906,795,480.8906" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="275.5" x2="797" y1="480.8906" y2="480.8906"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacingAndGlyphs" textLength="112" x="282.5" y="475.8247">Write email to DB</text><polygon fill="#383838" points="286.5,506.0234,276.5,510.0234,286.5,514.0234,282.5,510.0234" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="280.5" x2="802" y1="510.0234" y2="510.0234"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacingAndGlyphs" textLength="53" x="292.5" y="504.9575">email_id</text><polygon fill="#383838" points="860,535.1563,870,539.1563,860,543.1563,864,539.1563" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="275.5" x2="866" y1="539.1563" y2="539.1563"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacingAndGlyphs" textLength="53" x="282.5" y="534.0903">email_id</text><path d="M228.5,561.1563 L377.5,561.1563 L377.5,568.1563 L367.5,578.1563 L228.5,578.1563 L228.5,561.1563 " fill="#EEEEEE" style="stroke: #000000; stroke-width: 1.0;"/><rect fill="none" height="133.6641" style="stroke: #000000; stroke-width: 2.0;" width="779.5" x="228.5" y="561.1563"/><text fill="#000000" font-family="sans-serif" font-size="13" font-weight="bold" lengthAdjust="spacingAndGlyphs" textLength="104" x="243.5" y="574.2231">process email</text><polygon fill="#383838" points="286.5,595.4219,276.5,599.4219,286.5,603.4219,282.5,599.4219" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="280.5" x2="871" y1="599.4219" y2="599.4219"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacingAndGlyphs" textLength="89" x="292.5" y="594.356">Process email</text><polygon fill="#383838" points="791,624.5547,801,628.5547,791,632.5547,795,628.5547" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="275.5" x2="797" y1="628.5547" y2="628.5547"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacingAndGlyphs" textLength="102" x="282.5" y="623.4888">Find email by ID</text><polygon fill="#383838" points="286.5,653.6875,276.5,657.6875,286.5,661.6875,282.5,657.6875" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="280.5" x2="802" y1="657.6875" y2="657.6875"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacingAndGlyphs" textLength="35" x="292.5" y="652.6216">Email</text><polygon fill="#383838" points="944.5,682.8203,954.5,686.8203,944.5,690.8203,948.5,686.8203" style="stroke: #383838; stroke-width: 1.0;"/><line style="stroke: #383838; stroke-width: 1.0;" x1="275.5" x2="950.5" y1="686.8203" y2="686.8203"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacingAndGlyphs" textLength="71" x="282.5" y="681.7544">Send email</text><path d="M961,706.8203 L961,731.8203 L1145,731.8203 L1145,716.8203 L1135,706.8203 L961,706.8203 " fill="#ECECEC" style="stroke: #383838; stroke-width: 1.0;"/><path d="M1135,706.8203 L1135,716.8203 L1145,716.8203 L1135,706.8203 " fill="#ECECEC" style="stroke: #383838; stroke-width: 1.0;"/><text fill="#000000" font-family="sans-serif" font-size="13" lengthAdjust="spacingAndGlyphs" textLength="163" x="967" y="723.8872">Hooray! I have my email!</text><!--MD5=[a103caaf364a6a3df014d1ffd19b8ea7]
@startuml
skinparam monochrome true
skinparam shadowing false

actor publisher as "Publisher"
participant controller as "Controller"
participant worker as "Workers"
queue content_change_queue as "Content Changes"
database subscribers as "Subscribers"
queue change_subscriber_queue as "Changes + Subscribers"
database email_db as "Emails"
queue email_queue as "Emails"
actor subscriber as "Subscriber"

group publish change

    publisher -> controller: Content change
    controller -> content_change_queue: 
    controller -> publisher: 👍
end 

group process content change

    worker <- content_change_queue: Process change
    worker -> subscribers: Find subscribers for change
    worker <- subscribers: Subscribers
    worker -> change_subscriber_queue: Change + Subscriber
    worker -> change_subscriber_queue:
    worker -> change_subscriber_queue:

end

group process change + subscriber

    worker <- change_subscriber_queue: Process change + subscriber
    note right of worker: Generate email
    worker -> email_db: Write email to DB
    email_db -> worker: email_id
    worker -> email_queue: email_id

end

group process email

    worker <- email_queue: Process email
    worker -> email_db: Find email by ID
    worker <- email_db: Email
    worker -> subscriber: Send email

end

note right of subscriber: Hooray! I have my email!
@enduml

PlantUML version 1.2020.12(Sat Jun 06 10:54:15 UTC 2020)
(GPL source distribution)
Java Runtime: Java(TM) SE Runtime Environment
JVM: Java HotSpot(TM) 64-Bit Server VM
Default Encoding: UTF-8
Language: en
Country: US
--></g></svg>

Our email system and its problems
---------------------------------

I'm sure the above all looks very impressive, but I've already mentioned that
this system is starting to have problems. Why?

Some pages on our website have a lot of subscribers, and sometimes lots of
pages with lots of subscribers get lots of changes. Obviously, this means we
have to send lots of emails.

When this happens, things tend to get very slow, and we end up with a huge queue of emails to send.

At the same time, our database metrics start to look a little bit scary:

![Screenshot of database IOPS and burst balance showing a sustained period of more than seven thousand IOPS, and burst balance being depleted to zero](/static/images/govuk_blue_postgres_primary_iops_burst_balance.png)

At the time this screenshot was taken, our database had enough allocated
storage to be allowed 4,500 IOPS (input / output operations per second). Having
a sustained period of more than 7,000 IOPS caused the disk to eat through its
burst balance, resulting in severely degraded performance.

As a short term fix, we made the disk bigger to increase the IOPS thresholds we
get. This should mean we can process many more emails before we start running
into issues. However - bigger disks cost more money, and as demand for emails
grows, this approach isn't going to work forever.

Perhaps there are some changes we could make that would reduce the load on the
database, and allow the system to perform well without needing enormous disks.

Where's the performance bottleneck?
-----------------------------------

I haven't had time to do a deeper analysis of our database metrics yet, but
there's a particular part of this system that stands out to me as something
that's going to put a lot of write load on the database.

> ... a second worker picks each of these messages up and generates a customised
  email that's specific to this change and this subscriber. This email is
  written to the database...

> This email is written to the database...

We're writing every single email we want to send to the database - like the
whole thing - subject, body, the lot.

Since we send millions of emails every day, this is a pretty hefty amount of
data.

A lot of these emails are quite similar though - we might send out a particular
content change notification to 100,000 subscribers, but 90% of the emails is
the same for every subscriber - the only differences will be little things like
"Hello $name," and "use this link (https://example.com/Ov4rZrfNjV) to unsubscribe".

We could reduce the amount of duplicate data we need write to the database by
storing the bits that don't change in the email once (as a template), and only
storing the values for the placeholders for each subscriber.

At query time, we'd need to find the right template, and populate it with the
placeholder values to get the email we actually want to send.

There are probably a few ways we could achieve this, but I'm interested in
exploring how we might store the templates as content addressable entries in
postgres, so I'm going to explore that.

What is content addressable data, and why should we consider it?
----------------------------------------------------------------

"Content addressable" data is data that can be addressed based on its content,
instead of its location. This usually means the data is hashed, and the hash is
used as a key to look up the data.

This feels like it might be useful in our case because we will have many
"process change + subscriber" jobs running concurrently, attempting to generate
the same email template. They can all hash the email template they generate,
and then use an `insert ... on conflict do nothing;` to store the template in a
table keyed on its hash. This guarantees that each template will only be
written once, and concurrent jobs can use the hash to refer to the template,
even if they weren't the lucky job that got there first and wrote it to the
database.

(Now that I've got this far into writing this post, I think a more elegant way
of solving this would be to have the worker that only runs once for each
content change create the email template. There would be no need to mess around
with hashing to achieve that. But I've started this line of thought now, so
let's finish it.)

What would this look like in postgres?
--------------------------------------

At the moment we've got an email table with a body column, something like this:

```sql
create table emails
(
    body text,
    email_address text,
);
```

As discussed, this isn't ideal because we have to store almost the exact same
email over and over again, once for each email address we're going to send it
to.

Instead, we'd want this table to contain a reference to a template and some
placeholders to fill in. Something like this:

```sql
create table body_templates
(
    id       bytea not null constraint body_templates_pk primary key,
    template text
);

create table emails
(
    body_template_id bytea constraint emails_body_templates_id_fk references body_templates,
    placeholders     text[],
    email_address    text
);
```

When we need to generate a new email, the worker can do something like:

```sql
insert into body_templates (id, template)
values ($1, $2)
on conflict do nothing;
```

where `$1` is the hash (say sha256) of the template, and `$2` is the template
(which might be something like "Hello %s, thanks for subscribing. To
unsubscribe, click here: %s").

(It would be possible for the worker to get the DB to do the hashing using
postgres 11's built in sha256 function, but it would mean getting the ID back
with a `returning` clause, and that doesn't work with `on conflict do
nothing`).

The worker doesn't need to worry whether another worker has already written
this template to the table - if it has, it will have the same hash and (unless
there's an incredibly unlikely hash collision) the same template, and the
insert will silently `do nothing`.

Writing to the `emails` table is simple:

```sql
insert into emails (body_template_id, placeholders, email_address)
values
(
    E'\\xC0930168570D829F...'::bytea, -- the hash of the template
    '{"Fatima", "www.example.com/unsubscribe/1f7a345e"}',
    'fatima@example.com'
)
```

When the worker that needs to send these emails comes along, it doesn't need to
do any additional work - that can all be handed off to the database with a query like:

```sql
select format(template, variadic placeholders), email_address
from emails
join body_templates on emails.body_template_id = body_templates.id
```

Assuming that the template uses a format that's compatible with [postgres's format function](https://www.postgresql.org/docs/12/functions-string.html#FUNCTIONS-STRING-FORMAT).

Conclusions - what should we do with our database?
--------------------------------------------------

We still haven't done enough of an investigation into our database's
performance to be sure that the issues we're seeing would be resolved by
reducing the amount of email body we're writing (although that seems a likely
suspect to me).

If further investigation shows that excessive email body writing is a cause of
some of our issues, we should think hard about whether this approach is the
easiest thing for future developers to understand - if there's a way we can do
this without resorting to clever tricks we should definitely do that instead.

Whatever we decide, I've enjoyed having a think about this, and now that I've
written it up hopefully my mind can move onto more interesting things (like the
bottle of tequila we've got in the kitchen).

