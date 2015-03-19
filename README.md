# fast-live-reload
A live reload that works with all the possible browsers (ie8+)
without external dependencies.

## Example
```sh
fast-live-reload
```

This will start monitoring the current folder for changes,
listening on port 9001. Make sure the client-fast-reload.js is
loaded into your application (see Install for details):

```html
<!-- remove in production!! -->
<script type="text/javascript" src="client-fast-reload.js"></script>
```

### A More Advanced Example

```sh
fast-live-reload -p 9000 path1 path2 path3
```

This will monitor the given paths, listening on port 9000.

### Different Port Configuration

Since the port is different, this also needs to reflect in the client.
There are several ways to configure this.

#### 1. clientFastReloadHost Global Variable

Use the global variable `clientFastReloadHost`.

```html
<!-- remove in production!! -->
<script type="text/javascript">
    window.clientFastReloadHost="localhost:9000";
</script>
<script type="text/javascript" src="client-fast-reload.js"></script>
```

#### 2. clientFastReloadHost Query Parameter

In the URL of the page that includes the client-fast-reload.js script,
add the clientFastReloadHost query parameter.

For example:
```
http://my-site:1111/my-site/my-page.jsp?clientFastReloadHost=localhost:9000
```

You can still use other parameters if you wish. This will overwrite the
clientFastReloadHost global variable setting if it is defined.

#### 3. clientFastReloadHost Hash Parameter

In the URL of the page that includes the client-fast-reload.js script,
add the clientFastReloadHost query parameter.

For example:
```
http://my-site:1111/my-site/my-page.jsp#clientFastReloadHost=localhost:9000
```

This has the highest precedence, and will overwrite other settings.

## Install

In order to install this run:

```sh
npm install fast-live-reload
```

To fetch the client javascript, run:

```sh
bower install fast-live-reload
```

