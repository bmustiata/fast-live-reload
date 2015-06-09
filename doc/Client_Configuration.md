# Client Configuration

## No IFrame reloading

When the IFrame reloading is not possible, or undesired, you can also use
the client reload script available in bower.

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

To fetch the client javascript, run:

```sh
bower install fast-live-reload
```
