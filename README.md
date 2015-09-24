# fast-live-reload
Watch your pages change without refreshing your browser. The live reload that finally feels perfect.

![demo](https://raw.githubusercontent.com/bmustiata/fast-live-reload/master/doc/simple-demo.gif)

A live reload that works with all the possible browsers (ie8+)
without external dependencies (like jQuery), and can do pretty much anything,
and integrate with whatever development flow you're having,
including other watcher tools or build steps.

**Don't take my word for it, see why it's awesome in a short [presentation for v2.2.7](https://www.youtube.com/watch?v=XC4aLM21YAU).
It's only 18 minutes long, and you get to feel the power of fast-live-reload.**

Reloading works without touching the code of your web site.

## Why

I wanted a simple tool where I can develop and test all kinds of web applications with
ease on all browsers, even on remote machines (see for example
[https://www.modern.ie/en-us]() ).

This tool is specifically designed for that.

## Example
```
$ fast-live-reload
1. Will notify the changes for clients on port 9001
2. and will serve the content from . on port 9000
3. and will monitor and execute when files change in subfolders:
   a: .    
```

All of the above parameters can be changed.


You can open in a browser any HTML page via the `http://localhost:9000/`, edit it, and
see the page reloading live.


For all the resources that have the mimetype as text/html, the live reload client script will
be automatically injected before the end of the body tag (the auto injection can be disabled
via `-no-inject`).


Live reloading is possible without having to add any client script
_even for static resources_, by navigating to the /fast-live-reload/ URL,
in this case it would be:

```
http://localhost:9000/fast-live-reload/
```

## Complete Help and Example
```
$ fast-live-reload -h

fast-live-reload: The swiss army knife of live reloading.
Monitors multiple folders for changes, notifies connected clients, executes programs, serves local content, proxies sites, iframe reloads existing pages...

Usage: fast-live-reload [options]

Options:
    --interval          Poll every how many milliseconds.  [100]
    -d, --delay         Delay to avoid throttling.  [50]
    -s, --serve         Folder or site (via IFrame) to serve.
    -e, --execute       Execute the given commands on change.
    -ep, -pe, --parallel-execute
                        Run processes as long as fast-live-reload runs.
    -p, --port          Port to listen to.  [9001]
    -sp, --serve-port   Port to serve files to.  [9000]
    -ns, --no-serve     Don't serve any local folder or site.
    -nc, --no-clients   Don't start the client change server.
    -o,  --offline      Don't serve local files nor notify clients.
    -ni, --no-inject    Don't inject client code.
    -nn, --no-notify    Don't notify clients.
    -n, --dry-run       Show what will be done. Don't execute.
    --add-path          Paths to monitor for changes. Defaults to serve folder.

Example:
fast-live-reload -s /target/ \
    -ep "tsc --watch --rootDir src/ts --outDir out/js --sourceMap src/ts/*.ts"\
    -ep "compass watch"\
    src/js -e "grunt concat sync"\
    src/html src/css -e "grunt sync"

1. Will notify the changes for clients on port 9001
2. and will serve the content from /target/ on port 9000
3. and will run on startup, and then kill on shutdown:
   a: tsc --watch --rootDir src/ts --outDir out/js --sourceMap src/ts/*.ts
   b: compass watch
4. and will monitor and execute when files change in subfolders:
   a: src/js   -> grunt concat sync
   b: src/html -> grunt sync
      src/css
```

### Run only programs when files change

We disable both serving or proxying files (`-ns`) and the client reload
server (`-nc`), using the offline shortcut `-o` (`--offline`) that activates
both `-ns` and `-nc`.

```
$ fast-live-reload -o graph-data \
    -e "groovy generate-graph-data.groovy" \
    -e "dot -Tpng -ocustom-graph.png custom.graph"
1. Will monitor and execute when files change in subfolders:
   a: graph-data -> groovy generate-graph-data.groovy (no refresh)
                    dot -Tpng -ocustom-graph.png custom.graph
```

## Remote Locations

Remote locations are proxied, and the reloader will allow to reload the
browser even if it's an external URL, when files change.

```
$ fast-live-reload -s http://localhost:8080/my-webapp/some-page.jsp
Will
1. notify the changes for clients on port 9001,
2. serve the content from http://localhost:8080/my-webapp/some-page.jsp on port 9000,
3. and will monitor and execute when files change in subfolders:
   a: .
```

This will proxy the localhost:8080 host on port 9000, and will allow getting
the /fast-live-reload/ URL into the website, where the monitoring of the site
will take place.

Here are the benefits of using remote locations:

1. In case the page would crash (e.g. 500 error), the reloader will still attempt
    to reload it, when changes occur.
2. Changing the page works, and when reloading, it will reload the current iframe
    page.

## Install

In order to install this run:

```sh
npm install -g fast-live-reload
```

### Client JavaScript


_You don't need to change your code if you're serving files (`-s`) without `--no-inject`, 
or using the IFrame reloader._


If you must use the reloader script (e.g. a site that redirects to itself due to security)
then fetch it with bower, and refer to it into your html pages.

```sh
bower install fast-live-reload
```

Check the [documentation](doc/Client_Configuration.md) for full details.

## Change Log

* v2.4.0  2015-09-24  Treat monitored paths as globs. Documented delay (`-d`) param.
* v2.3.3  2015-08-18  *BugFix* Updated documentation.
* v2.3.2  2015-08-12  *BugFix* Reload CSS only also in iframes, even the programatically created ones.
* v2.3.1  2015-08-10  *BugFix* Removed the doc folder from the bower download.
* v2.3.0  2015-08-10  Reload only CSS link elements if only changes in `.css` files occured.
* v2.2.7  2015-07-25  *BugFix* Remove the `<base/>` tag when existing, if injecting the client script.
* v2.2.5  2015-07-09  *BugFix* Don't serve single files. Fix for proxy redirect.
* v2.2.4  2015-07-06  *BugFix* Fix for broken offline. Exclude iframe folder from bower client.
* v2.2.3  2015-07-06  *BugFix* Don't inject client code when `-nc` is set. Added `-o` alias for `-ns` and `-nc` together. (run commands only)
* v2.2.2  2015-06-29  *BugFix* Allow monitoring single file resources.
* v2.2.1  2015-06-16  *BugFix* Added demo gif.
* v2.2.0  2015-06-12  Automatically inject the client script in html resources. (disable with `-ni`)
* v2.1.0  2015-06-12  Allow no client notifications for executions (`-nn`) or no client server altogether (`-ns`)
* v2.0.0  2015-06-09  Allow parallel execution (`-pe`), multiple monitor/execution flows, dry runs (`-n`). Major refactor.
* v1.4.4  2015-06-01  Allow setting a delay for commands with `-d`.
* v1.4.3  2015-05-13  *BugFix* Removed scss bower dependency. Better log messages.
* v1.4.2  2015-05-13  *BugFix* Responsive layout for the address bar. Display the title of the page.
* v1.4.1  2015-05-12  *BugFix* Add --add-path param. A bunch of bugfixes.
* v1.4.0  2015-05-11  Allow executing commands with `-e`.
* v1.3.2  2015-05-11  Correct version in the metadata.
* v1.3.1  2015-05-11  Allow the iframe reloader for local content. Fixed handlebars null data bug.
* v1.3.0  2015-03-26  Proxy remote hosts when using `-s`.
* v1.2.0  2015-03-25  Adds remote monitoring via iframe (`-s http://host/my-app/my-page.jsp`).
* v1.1.0  2015-03-20  Default the fastLiveReloadHost parameter to `current-page-host:9001`.
* v1.0.0  2015-03-19  Initial Release.
