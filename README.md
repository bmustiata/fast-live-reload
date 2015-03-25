# fast-live-reload
A live reload that works with all the possible browsers (ie8+)
without external dependencies (like jQuery), and can also serve
local files.

Works even without changing the code of your web site.

## Why

I wanted a tool where I can test small and bigger applications with
ease on different browsers, even on remote machines (see for example
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

Make sure the `client-fast-reload.js` is
loaded into your application (see **Install** section for details):

```html
<!-- remove in production!! -->
<script type="text/javascript" src="client-fast-reload.js"></script>
```

## Remote

In case the served location is a remote location, then an iframe
reloader will be used instead, that will keep reloading _to the served
url_ whenever changes are detected in the monitored folders.

```
$ fast-live-reload -s http://localhost:8080/my-webapp/some-page.jsp
Serving IFrame reloader for http://localhost:8080/my-webapp/some-page.jsp on port 9000
Changes are served on port: 9001
Monitoring paths: '.' every 100 millis.
```

*Pros*

1. You don't need the client listener code, since it's part of the parent iframe.
2. In case the page would crash (e.g. 500 error), the reloader will still attempt
    to reload it, when changes occur.

*Cons*

1. Changing the page works, but when reloading, it will reload back to the original
    given link.

## A More Advanced Example

```sh
fast-live-reload -s /tmp -p 8000 path1 path2 path3
```

This will monitor the given paths: `path1`, `path2` and `path3`, serve the `/tmp` folder
on port `9000`, and publishing the changes on port `8000`.

### Different Port Configuration

Since the port is different, this also needs to reflect in the client.
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

To fetch the client javascript, run:

```sh
bower install fast-live-reload
```

If you don't have yet bower installed, of course, install it first:
```sh
npm install -g bower
```

## Change Log

* v1.1.0  2015-03-20  Default the fastLiveReloadHost parameter to current-page-host:9001
* v1.0.0  2015-03-19  Initial Release

