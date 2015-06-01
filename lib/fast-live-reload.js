#!/usr/bin/env node


var createClass = require("superb-class").createClass,
    express = require("express"),
    nomnom = require("nomnom"),
    chalk = require("chalk"),
    expressHandlebars = require("express-handlebars"),
    expressProxy = require("express-http-proxy"),
    expressCookieParser = require("cookie-parser"),
    exec = require("shelljs").exec;

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
 * @type {Watcher}
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
     * @param {number} delay Time to wait before triggering changes.
     * @param {Array<string>} paths Monitors the given paths.
     */
    constructor : function(pollInterval, delay, paths) {
        if (!paths || (typeof paths.length == "undefined")) {
            throw new Error('Watcher must have a paths array to monitor.');
        }

        this._createWatch = createWatch;
        this._delay = delay;

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
            var delay = this._delay >= 0 ? this._delay : 0;

            this._notificationTimeout = setTimeout(this._fireChangedFiles.bind(this), delay);
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
 * content of the original page. In case the URI
 * is a file, it just serves the file.
 */
var IFrameServer = createClass({
    /**
     * Constructs a handlebars server that serves the given path.
     */
    constructor : function(port, serveUri) {
        this._port = port;
        this._serveUrl = serveUri;

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
        console.log("Proxy: " + chalk.cyan("http://localhost:" + this._port + "/") + "\n" +
                    "for: " + chalk.cyan( this._serveUrl ) );

        // find only the host part for proxying
        var m = /^(.*?\:\/\/[^/]+)(\/?.*)$/.exec( this._serveUrl );

        if (!m) {
            this._serveFileUri();
        } else {
            var proxyHost = m[ 1 ],
                requestPath = m[ 2 ];

            this._serveProxyUri(proxyHost, requestPath);
        }

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
    },

    /**
     * _serveProxyUri - Serves the content using a PROXY.
     * @param {string} proxyHost
     * @param {string} requestPath
     * @return {void}
     */
    _serveProxyUri : function(proxyHost, requestPath) {
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
    },

    /**
     * _serveFileUri - Serves local files content.
     * @return {void}
     */
    _serveFileUri : function() {
        this._app.use(express.static( this._serveUrl ));
    }
});


/**
 * ExecuteCommandsServer - An executor that will run the given
 *                         commands before notifying the change
 *                         server of the changes.
 * @type {ExecuteCommandsServer}
 */
var ExecuteCommandsServer = createClass("ExecuteCommandsServer", {
	_commands : null,
	_changeServer : null,

    /**
     * constructor
     * @param {Array<string>} commands
	 * @param {ChangeServer} changeServer
	 */
    constructor: function(commands, changeServer) {
        this._commands = commands;
        this._changeServer = changeServer;

        console.log("On change run the following commands: ");
        this._commands.forEach(function(command, it) {
            console.log( chalk.cyan(it + 1 + ".") + " " + chalk.green(command) );
        });
    },

    /**
     * filesChanged - Executes the registered commands and then forwards the
     *                change to the change server.
     * @param {} changes
     * @return {void}
     */
    filesChanged : function(changes) {
        console.log(chalk.green("\nChanges occurred"));

        this._commands.forEach(function(command) {
            console.log("\nRunning: " + chalk.green(command));

            if (exec(command).code != 0) {
                console.log(chalk.yellow("Command failed: " + command));
            }
        });

        this._changeServer.filesChanged(changes);
    }
});


/**
 * isLocalServe - Checks if the given pathOrUrl is a remote URL or not.
 * @param {} pathOrUrl
 * @return {boolean}
 */
function isLocalServe(pathOrUrl) {
    // find only the host part for proxying
    var m = /^(.*?\:\/\/[^/]+)(\/?.*)$/.exec( pathOrUrl );

    return !m;
}

//
// Parse the input options.
//
var opts = nomnom.script("fast-live-reload")
        .help("The swiss army knife of live reloading.\n\nMonitors multiple folders for changes, notifies connected clients, executes programs, serves local content, proxies sites, iframe reloads existing pages...\n")
        .option("interval", {
            help: "Poll every how many milliseconds.",
            transform: function(millis) {
                return parseInt(millis) || 100;
            },
            default : 100
        })
        .option("delay", {
            abbr: "d",
            help: "Time to wait in milliseconds before triggering changes.",
            transform: function(millis) {
                millis = parseInt(millis);

                if ("" + millis == "NaN") {
                    return -1;
                }
                return millis;
            },
            default : -1
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
        .option("execute", {
            abbr: "e",
            help: "Execute the given commands on change. Only after the commands runs, will the clients be notified of the changes.",
            list: true
        })
        .option("add-path", {
            list: true,
            help: "Paths to monitor for changes. Defaults to the serve folder if not present.",
        })
        .parse();

// in case no paths are given for monitoring, monitor the current folder.

var monitoredPaths = ['.'],
    serveUri;

serveUri = opts.serve;

if (!serveUri) { // there is no `-s` set
    serveUri = monitoredPaths[0]; // monitor ./
}

// if there was a `-s` specified with a local path, monitor that by default.
if (isLocalServe(serveUri)) {
     monitoredPaths = [ serveUri ];
}

if (! opts['no-serve']) {
    new IFrameServer(opts['serve-port'], serveUri).run();
}

monitoredPaths = opts._.length ? opts._ : monitoredPaths;

//
// Add paths for both the items specified with --add-path, and also
// for the parameters that are not prefixed by anything.
//
if (opts['add-path']) {
    for (var i = 0; i < opts['add-path'].length; i++) {
        var path = opts['add-path'][i];
        monitoredPaths.push(path);
    }
}

//
// We need a watcher to monitor the file system folders, and a
// change server that will notify active browser clients when changes
// occured.
//
var changeServer = new ChangeServer(opts.port);
var watcher = new Watcher(opts.interval, opts.delay, monitoredPaths),
    watcherCallback;

//
// In case commands need to be executed, we notify the command executor server
// of the file changes, and in turn it will notify the change server after the
// commands are done.
//
// The reason is allowing having a build that also changes data, so we don't get
// too many triggers for reloading of the page.
//
if (opts.execute) {
    var executeCommandsServer = new ExecuteCommandsServer(opts.execute, changeServer);
    watcherCallback = executeCommandsServer.filesChanged.bind(executeCommandsServer);
} else {
    watcherCallback = changeServer.filesChanged.bind(changeServer);
}

watcher.addListener( watcherCallback );

changeServer.run();
watcher.monitor();


//# sourceMappingURL=fast-live-reload.js.map