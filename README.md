# fast-live-reload
The swiss army knife of live reloading.

A live reload that works with all the possible browsers (ie8+)
without external dependencies (like jQuery), and can also serve
local files.

Works also without changing the code of your web site.

Watch a [presentation for v1.1.0](https://www.youtube.com/watch?v=VXN0rTAuMO4).
It's only 10 minutes long, and you get to see fast-live-reload in action. Even on IE.

## Why

I wanted a tool where I can test small and bigger applications with
ease on all browsers, even on remote machines (see for example
[https://www.modern.ie/en-us]() ).

This tool is specifically designed for that.

## Example
```
$ fast-live-reload
Serving . on port 9000
Changes are served on port: 9001
Monitoring paths: '.' every 100 millis.
```

This will start monitoring the current folder for changes,
serving it on port 9000, and using port 9001 in order to notify
updates. All of the above parameters can be changed.

Live reloading is possible without having to add any client script
_even for static resources_, by navigating to the /fast-live-reload/ URL,
in this case it would be:

```
http://localhost:9000/fast-live-reload/
```

## Remote Locations

Remote locations are proxied, and the reloader will allow to reload the
browser even if it's an external URL, when files change.

```
$ fast-live-reload -s http://localhost:8080/my-webapp/some-page.jsp
Serving IFrame reloader for http://localhost:8080/my-webapp/some-page.jsp on port 9000
Proxying host: http://localhost:8080
Changes are served on port: 9001
Monitoring paths: '.' every 100 millis.
```

This will proxy the localhost:8080 host on port 9000, and will allow getting
the /fast-live-reload/ URL into the website, where the monitoring of the site
will take place.

Here are the benefits of using remote locations:

1. You don't need the client listener code, since it's part of the parent iframe.
2. In case the page would crash (e.g. 500 error), the reloader will still attempt
    to reload it, when changes occur.
3. Changing the page works, and when reloading, it will reload the current iframe
    page.

## A Complete Example

```sh
fast-live-reload -e "grunt build-client" -s /tmp -p 8000 path1 path2 path3 -d 1000
```

This will monitor the given paths: `path1`, `path2` and `path3`, serve the `/tmp` folder
on port `9000`, and publishing the changes on port `8000`.

Whenever files will change in either path1, path2 or path3, fast-live-reload will
wait for a second (`-d 1000`) and then

```
grunt build-client
```

will be executed before notifying the browser clients of the changes.

## No IFrame reloading

When the IFrame reloading is not possible, or undesired, you can also use
the client reload script awailable in bower.

Make sure the `client-fast-reload.js` is
loaded into your application (see **Install** section for details):

```html
<!-- remove in production!! -->
<script type="text/javascript" src="client-fast-reload.js"></script>
```

### Different Port Configuration

If the ports/host are different, these also need to be reflected in the client.
There are several ways to configure this.

#### 0. fastLiveReloadHost Default Value

*This option is preferred*

In case no value is specified, te default value is the current host
with the port 9001.

For example if you're calling your page from a remote machine:
```
http://my-test-site:8080/application/test.html
```
or
```
http://my-test-site/application/test.html
```

The client-fast-reload will default the value of the `fastLiveReloadHost`
to `my-test-site:9001`.

#### 1. fastLiveReloadHost Global Variable

Use the global variable `fastLiveReloadHost`.

```html
<!-- remove in production!! -->
<script type="text/javascript">
    window.fastLiveReloadHost="localhost:8000";
</script>
<script type="text/javascript" src="client-fast-reload.js"></script>
```

#### 2. fastLiveReloadHost Query Parameter

In the URL of the page that includes the `client-fast-reload.js` script,
add the `fastLiveReloadHost` query parameter.

For example:
```
http://my-site:1111/my-site/my-page.jsp?fastLiveReloadHost=localhost:8000
```

You can still use other parameters if you wish. This will overwrite the
`fastLiveReloadHost` global variable setting if it is defined.

#### 3. fastLiveReloadHost Hash Parameter

In the URL of the page that includes the `client-fast-reload.js` script,
add the `fastLiveReloadHost` query parameter.

For example:
```
http://my-site:1111/my-site/my-page.jsp#fastLiveReloadHost=localhost:8000
```

This has the highest precedence, and will overwrite other settings.

## Install

In order to install this run:

```sh
npm install -g fast-live-reload
```

### Client JavaScript

_You don't need to change your code if you're using the IFrame reloader. In
order to access it just go to `http://localhost:9000/fast-live-reload/`_

To fetch the client javascript, run:

```sh
bower install fast-live-reload
```

If you don't have yet bower installed, of course, install it first:
```sh
npm install -g bower
```

## Change Log

* v1.4.3  2015-06-01  Allow setting a delay for commands with `-d`.
* v1.4.2  2015-05-13  *BugFix* Responsive layout for the address bar. Display the title of the page.
* v1.4.1  2015-05-12  *BugFix* Add --add-path param. A bunch of bugfixes.
* v1.4.0  2015-05-11  Allow executing commands with `-e`.
* v1.3.2  2015-05-11  Correct version in the metadata.
* v1.3.1  2015-05-11  Allow the iframe reloader for local content. Fixed handlebars null data bug.
* v1.3.0  2015-03-26  Proxy remote hosts when using `-s`.
* v1.2.0  2015-03-25  Adds remote monitoring via iframe (`-s http://host/my-app/my-page.jsp`).
* v1.1.0  2015-03-20  Default the fastLiveReloadHost parameter to `current-page-host:9001`.
* v1.0.0  2015-03-19  Initial Release.

