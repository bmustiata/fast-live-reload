# fast-live-reload
A live reload that works with all the possible browsers (ie8+)
without external dependencies.

## Example
```sh
fast-live-reload
```

This will start monitoring the current folder, listening on port
9001. Make sure the client-fast-reload.js is loaded into your
application:

```html
<!-- remove in production!! -->
<script type="text/javascript" src="client-fast-reload.js"></script>
```

### A More Advanced Example

```sh
fast-live-reload -p 9000 path1 path2 path3
```

This will monitor the given paths, listening on port 9000.

Since the port is different, this also needs to reflect in the client:

```html
<!-- remove in production!! -->
<script type="text/javascript">
    window.clientFastReloadPort=9000;
</script>
<script type="text/javascript" src="client-fast-reload.js"></script>
```

## Install

In order to install this run:

```sh
npm install fast-live-reload
```

To fetch the client javascript, run:

```sh
bower install fast-live-reload
```

