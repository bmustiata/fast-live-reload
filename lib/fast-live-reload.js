#!/usr/bin/env node


var createClass = require("superb-class").createClass,
    express = require("express"),
    nomnom = require("nomnom"),
    chalk = require("chalk"),
    expressHandlebars = require("express-handlebars"),
    expressProxy = require("express-http-proxy"),
    expressCookieParser = require("cookie-parser");

/**
 * createWatch - Creates a new watch object.
 * @return {object}
 */
function createWatch() {
    return require("watch");
}


/**
 * Monitors a folder, and notifies the registered subscribers whenever
 * files change, with an aggregate object of changes.
 */
var Watcher = createClass({
    /**
     * @type {Array<Function>}
     */
    _listeners : null,

    /**
     * @type {Array<string>}
     */
    _paths : null,

    /**
     * @type {Function}
     */
    _createWatch : null,

    /**
     * @type {Array<FileMonitor>}
     */
    _fileMonitors : null,

    // Use a timeout to record several changes that happen quickly in only
    // one object. The current changes keeps the changes that need to be
    // fired.
    _notificationTimeout : null,
    _currentChanges : null,

    /**
     * @type {number} At how many millis to poll the paths.
     */
    _pollInterval : null,

    /**
     * @param {number} pollInterval Time to poll the paths.
     * @param {Array<string>} paths Monitors the given paths.
     */
    constructor : function(pollInterval, paths) {
        if (!paths || (typeof paths.length == "undefined")) {
            throw new Error('Watcher must have a paths array to monitor.');
        }

        this._createWatch = createWatch;

        this._listeners = [];
        this._fileMonitors = [];

        this._paths = paths;
        this._pollInterval = pollInterval;
    },

    /**
     * Adds a listener that will  be notified when paths
     * are changed.
     */
    addListener : function(callback) {
        this._listeners.push(callback);
    },

    /**
     * Start monitoring the given folder.
     */
    monitor : function() {
        var path,
            pathsString;

        pathsString = this._paths.map(function(it) {
            return "'" + chalk.cyan(it) + "'";
        }).join(", ");

        console.log("Monitoring paths: " + pathsString +
                        " every " + chalk.cyan(this._pollInterval) + " millis.");

        for (var i = 0; i < this._paths.length; i++) {
            path = this._paths[i];

            this._createWatch().createMonitor(
                    path,
                    { interval : this._pollInterval },
                    this._createMonitor.bind(this, path)
            );
        }
    },

    /**
     * Creates the file monitor.
     * @param {string} path The that the created monitor watches.
     * @param {Object} monitor The monitor object created.
     */
    _createMonitor : function(path, monitor) {
        this._fileMonitors.push(monitor);

        monitor.on("created", this._notify.bind(this, path, "created"));
        monitor.on("changed", this._notify.bind(this, path, "changed"));
        monitor.on("removed", this._notify.bind(this, path, "removed"));
    },

    /**
     * Start recording the changed paths.
     * @param {string} path The path where the change occured.
     * @param {string} event The event name of what happened (created/changed/removed)
     * @param {string} f The file name where the event occured.
     */
    _notify : function(path, event, f) {
        if (!this._notificationTimeout) {
            this._notificationTimeout = setTimeout(this._fireChangedFiles.bind(this), 50);
            this._currentChanges = {
                eventCount : 0,
                "created" : {},
                "changed" : {},
                "removed" : {}
            }
        }

        this._currentChanges[event][f] = this._currentChanges.eventCount++;
    },

    /**
     * Notify the listeners of all the changed events.
     */
    _fireChangedFiles : function() {
        this._listeners.forEach(function(listener) {
            listener.call(null, this._currentChanges);
        }.bind(this));

        this._notificationTimeout = null;
        this._currentChanges = null;
    }
});


/**
 * Create a static resource server.
 */
var StaticServer = createClass({
    /**
     * StaticServer - A static server that simply serves resources.
     * @param {number} port
     * @param {string} servedPath
     * @return {void}
     */
    constructor : function(port, servedPath) {
        this._port = port;
        this._servedPath = servedPath;

        this._express = express();
        this._express.use(express.static( servedPath ));
    },

    /**
     * Starts listening.
     */
    run : function() {
        console.log("Serving " + chalk.cyan( this._servedPath ) +
                 " on port " + chalk.cyan(this._port));
        this._express.listen(this._port);
    }
});


/**
 * The server keeps all the received connections,
 * in a pending state,  and notifies all the users when a
 * change happened, with the changed data.
 */
var ChangeServer = createClass({
    _express : null,

    _connectedClients : null,

    /**
     * @type {number}
     */
    _port : null,

    /**
     * Constructs the server that will listen on the given port.
     * Defaults to 9001 if not present.
     * @param {number?} port The port to listen to.
     */
    constructor : function(port) {
        this._port = port;

        this._express = express();
        this._express.get("/", this._storeRequest.bind(this));

        this._connectedClients = [];
    },

    /**
     * Whenever a new request arrived, keep it in the list of
     * things that we should respond to when resources change.
     */
    _storeRequest : function(req, res) {
        this._connectedClients.push({
            request: req,
            response: res
        });
    },

    /**
     * Starts listening.
     */
    run : function() {
        console.log("Changes are served on port: " + chalk.cyan(this._port));
        this._express.listen(this._port);
    },

    /**
     * Callback method where the server is notified that monitored
     * files have changed.
     */
    filesChanged : function(changes) {
        for (var i = 0; i < this._connectedClients.length; i++) {
            var response = this._connectedClients[i].response,
                request = this._connectedClients[i].request;

            // if we know the origin, we allow it, otherwise default to any
            if (request.header.origin) {
                response.set('Access-Control-Allow-Origin', request.headers.origin);
            } else {
                response.set('Access-Control-Allow-Origin', '*');
            }

            response.send(JSON.stringify(changes));
        }

        this._connectedClients = [];
    }
});


/**
 * Create a server that serves the iframe page,
 * in a handlebars template, to provide the URL
 * to redirect to automatically, and proxies the
 * content of the original page.
 */
var IFrameServer = createClass({
    /**
     * Constructs a handlebars server that serves the given path.
     */
    constructor : function(port, servedPath, serveUrl) {
        this._port = port;
        this._servedPath = servedPath;
        this._serveUrl = serveUrl;

        var app = this._app = express();

        app.set('views', __dirname + '/../iframe/fast-live-reload/');

        var hbs = expressHandlebars.create();

        app.engine('handlebars', hbs.engine);
        app.set('view engine', 'handlebars');

        app.use(expressCookieParser());
        app.use(express.static( __dirname + '/../iframe' ));
    },

    /**
     * Runs the actual server.
     */
    run : function() {
        console.log("Serving IFrame reloader for " + chalk.cyan( this._serveUrl ) +
                 " on port " + chalk.cyan(this._port));

        // find only the host part for proxying
        var m = /^(.*?\:\/\/[^/]+)(\/?.*)$/.exec( this._serveUrl );

        if (!m) {
            throw new Error("Invalid URL: " + this._serveUrl);
        }

        var proxyHost = m[ 1 ],
            requestPath = m[ 2 ];

        console.log("Proxying host: " + chalk.cyan(proxyHost));

        /**
         * Load the proxy.
         */
        this._app.use('/', expressProxy(proxyHost, {
            filter : function(req, res) {
                // if fast live reload already loaded, there's no need to do anything.
                if (req.cookies.fastLiveReload && !/^\/fast-live-reload\//.test(req.path)) {
                    return true;
                }

                return false;
            },

            intercept : function(data, req, res, callback) {
                // allow in frame embedding.
                res.set('Access-Control-Allow-Origin', '*');
                res.set('X-Frame-Options', '');

                callback(null, data);
            }
        }));

        /**
         * Redirect on the first reload.
         */
        this._app.use('/', function(req, res, next) {
            if (req.path == '/fast-live-reload/' || req.cookies.fastLiveReload) {
                if (!req.cookies.fastLiveReload) { // called directly /fast-live-reload/
                    res.cookie('fastLiveReload', 'true');
                }
                return next();
            }

            res.cookie('fastLiveReload', 'true');
        	res.redirect('/fast-live-reload/');
        }.bind(this));

        /**
         * Serve the fast-live-reload page.
         */
        this._app.get('/fast-live-reload/', function(req, res, next) {
        	res.render('index', {
                TARGET_URL : requestPath
            });
        }.bind(this));

        this._app.listen(this._port);
    }
});



var opts = nomnom.script("fast-live-reload")
        .help("Monitors multiple folders for changes, and notifies connected clients.")
        .option("interval", {
            help: "Poll every how many milliseconds.",
            transform: function(millis) {
                return parseInt(millis) || 100;
            },
            default : 100
        })
        .option("port", {
            abbr: "p",
            help: "Port to listen to.",
            transform: function(port) {
                return parseInt(port) || 9001;
            },
            default : 9001
        })
        .option("serve", {
            abbr: "s",
            help: "Folder or site (via IFrame) to serve."
        })
        .option("serve-port", {
            abbr: "sp",
            help: "Port to serve files to.",
            transform: function(port) {
                return parseInt(port) || 9000;
            },
            default: 9000
        })
        .option("no-serve", {
            abbr: "n",
            help: "Don't serve any local folder or site.",
            flag: true
        })
        .option("paths", {
            list: true,
            help: "Paths to monitor for changes. Defaults to the serve folder if used.",
        })
        .parse();

// in case no paths are given for monitoring, monitor the current folder.

var monitoredPaths = ['.'];

if (opts.serve) {
    monitoredPaths = [ opts.serve ];
}

if (! opts['no-serve']) {
    var serveUri = monitoredPaths[0];

    if (/^\w+\:\/\//.test(serveUri)) { // is a remote URI.
        // restore the monitored paths, since the watcher can't process em
        monitoredPaths = ['.'];
        new IFrameServer(opts['serve-port'], 'iframe', serveUri).run();
    } else {
        new StaticServer(opts['serve-port'], monitoredPaths[0]).run();
    }
}

monitoredPaths = opts._.length ? opts._ : monitoredPaths;

var changeServer = new ChangeServer(opts.port);
var watcher = new Watcher(opts.interval, monitoredPaths);

watcher.addListener( changeServer.filesChanged.bind(changeServer) );
changeServer.run();
watcher.monitor();


//# sourceMappingURL=fast-live-reload.js.map