#!/usr/bin/env node


var createClass = require("superb-class").createClass,
    express = require("express"),
    chalk = require("chalk"),
    expressHandlebars = require("express-handlebars"),
    expressProxy = require("express-http-proxy"),
    expressCookieParser = require("cookie-parser"),
    exec = require("shelljs").exec,
    handlebars = require("handlebars"),
    fs = require("fs"),
    onceMany = require("once-many").onceMany,
    spawn = require("cross-spawn").spawn;

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
        var path;

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
        //console.log("Changes are served on port: " + chalk.cyan(this._port));
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
 * CommandLineParser - Parses the command line, extracting the actual command to execute, and the parameters given to it into an array.
 * @type {CommandLineParser}
 */
var CommandLineParser = createClass("CommandLineParser", {
	_command : "",
    _args : null,

    /**
     * constructor - Parses the command line
     * @param {string} commandLine
	 */
    constructor: function(commandLine) {
        var state = "NORMAL"; // can be: NORMAL, SINGLE_QUOTE, DOUBLE_QUOTE, ESCAPE_CHAR
        var previousState;
        var args = [], command = "";

        var currentToken = "";

        for (var i = 0; i < commandLine.length; i++) {
            var currentChar = commandLine[i];

            if (state == "NORMAL") {
                if (currentChar == " ") {
                    // only if we found some token, we process it,
                    // otherwise it's just bogus spaces.
                    if (currentToken.length) {
                       if (command.length) {
                            args.push(currentToken);
                        } else {
                            command = currentToken;
                        }

                        currentToken = "";
                    }

                    continue;
                }

                if (currentChar == '"') {
                    state = "DOUBLE_QUOTE";
                    continue;
                }

                if (currentChar == "'") {
                    state = "SINGLE_QUOTE";
                    continue;
                }

                if (currentChar == "\\") {
                    previousState = state;
                    state = "ESCAPE_CHAR";
                    continue;
                }

                currentToken += currentChar;
                continue;
            }

            if (state == "ESCAPE_CHAR") {
                currentToken += currentChar;
                state = previousState;
                continue;
            }

            if (state == "SINGLE_QUOTE") {
                if (currentChar == "'") {
                    state = "NORMAL";
                    continue;
                }

                currentToken += currentChar;
                continue;
            }

            if (state == "DOUBLE_QUOTE") {
                if (currentChar == '"') {
                    state = "NORMAL";
                    continue;
                }

                currentToken += currentChar;
                continue;
            }
        } // end for each char

        if (currentToken.length) {
           if (command.length) {
                args.push(currentToken);
            } else {
                command = currentToken;
            }
        }

        if (state != "NORMAL") {
            throw new Error("Unterminated command: " + commandLine);
        }

        if (!command) {
            throw new Error("Empty command: " + commandLine);
        }

        this._command = command;
        this._args = args;
    },

    /**
     * getCommand - Getter for the command
     * @return {string}
     */
    getCommand : function() {
        return this._command;
    },

    /**
     * getArgs - Gets the array of arguments of the command.
     * @return {Array<string>}
     */
    getArgs : function() {
        return this._args;
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
        //console.log("Proxy: " + chalk.cyan("http://localhost:" + this._port + "/") + "\n" +
        //            "for: " + chalk.cyan( this._serveUrl ) );

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
 * NoopChangeServer - A change server that doesn't do anything.
 * @type {NoopChangeServer}
 */
var NoopChangeServer = createClass("NoopChangeServer", {

    /**
     * constructor - A change server that doesn't notifies.
     */
    constructor: function() {
    },

    /**
     * filesChanged - Callback method where the server is notified the monitored files changed.
     * @param {Object} changes
     * @return {void}
     */
    filesChanged : function(changes) {
        // noop on purpose.
    },

    /**
     * run - To start the serving.
     * @return {void}
     */
    run : function() {
        // noop on purpose
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

        //console.log("On change run the following commands: ");
        //this._commands.forEach(function(command, it) {
        //    console.log( chalk.cyan(it + 1 + ".") + " " + chalk.green(command) );
        //});
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
 * ExecutorSet - Data assignment between a bunch of monitored folders and commands to be executed when data changes in any of the folders.
 * @type {ExecutorSet}
 */
var ExecutorSet = createClass("ExecutorSet", {
    /**
     * @type {Array<string>}
     */
    _monitoredFolders : null,

    /**
     * @type {Array<string>}
     */
	_executedCommands : null,

    /**
     * @type {boolean}
     */
    noNotifications : false,

    /**
     * constructor - Default constructor.
	 */
    constructor: function() {
        this._monitoredFolders = [];
        this._executedCommands = [];
    },

    /**
     * addMonitoredPath - Adds a monitored folder.
     * @param {string} path
     * @return {ExecutorSet}
     */
    addMonitoredPath : function(path) {
        this._monitoredFolders.push(path);
        return this;
    },

    /**
     * addExecutedCommand - Adds a command to execute.
     * @param {string} command
     * @return {ExecutorSet}
     */
    addExecutedCommand : function(command) {
        this._executedCommands.push(command);
        return this;
    },

    /**
     * Returns the monitored paths. If no paths are registered,
     * return the current folder.
     * @return {Array<string>}
     */
    getMonitoredPaths : function() {
        if (this._monitoredFolders.length == 0) {
            this._monitoredFolders.push(".");
        }

        return this._monitoredFolders;
    },

    /**
     * Returns the commands to be executed.
     * @return {Array<string>}
     */
    getExecutedCommands : function() {
        return this._executedCommands;
    }
});

/**
 * Shows the help for the application, and exits the application.
 * @return {void}
 */
function showHelp() {
    var helpText;

    helpText = fs.readFileSync(__dirname + "/readme.hbs", {
        encoding: 'utf-8'
    });

    var context;

    if (chalk.supportsColor) {
        context = {
            GRAY: chalk.styles.gray.open,
            RESET: chalk.styles.reset.open,
            BLUE: chalk.styles.cyan.open,
            GREEN: chalk.styles.green.open,
            BOLD: chalk.styles.bold.open
        };
    } else {
        context = {};
    }

    context.BINARY = "fast-live-reload";

    console.log(handlebars.compile(helpText)(context));

    process.exit();
}

var serveUri,
    noServe = false,
    port = 9001,
    servePort = 9000,
    interval = 100,
    delay = 50,
    executorSets = [ new ExecutorSet() ],
    parallelExecutePrograms = [],
    dryRun = false,
    shouldCreateClientServer = true;

//
// Process the arguments.
//
// This works by iterating over the arguments, and splitting them
// in pairs of FOLDER.. EXECUTE.. sequences, that define what chains
// of commands will execute, when files in the given folders change.
//

var currentExecutor = executorSets[0],
    paramState = "FOLDER"; // can be either FOLDER or EXECUTE

function nextArgument(index, command) {
    if (index + 1 < process.argv.length) {
        return process.argv[i + 1];
    }

    console.error("Missing extra command line parameter for " + command);
    throw new Error("Missing extra command line parameter for " + command);
}

for (var i = 2; i < process.argv.length; i++) {
    var arg = process.argv[i];

    if ("-h" == arg || "--help" == arg || "-help" == arg) {
        showHelp(); // this exits the application.
    }

    if ("--interval" == arg) {
        interval = parseInt(nextArgument(i, arg));
        i++; // skip the next parameter
        continue;
    }

    if ("-p" == arg || "--port" == arg) {
        port = parseInt(nextArgument(i, arg));
        i++; // skip the next parameter
        continue;
    }

    if ("-s" == arg || "--serve" == arg) {
        serveUri = nextArgument(i, arg);
        i++; // skip the next parameter
        continue;
    }

    if ("-sp" == arg || "-serve-port" == arg) {
        servePort = parseInt(nextArgument(i, arg));
        i++; // skip the next parameter
        continue;
    }

    if ("-d" == arg || "--delay" == arg) {
        delay = parseInt(nextArgument(i, arg));
        i++; // skip the next parameter
        continue;
    }

    if ("-ns" == arg || "--no-serve" == arg) {
        noServe = true;
        continue;
    }

    if ("-n" == arg || "--dry-run" == arg) {
        dryRun = true;
        continue;
    }

    if ("-ep" == arg || "-pe" == arg || "--parallel-execute" == arg) {
        var parallelExecute = nextArgument(i, arg);
        i++; // skip the next parameter
        parallelExecutePrograms.push(parallelExecute);

        continue;
    }

    if ("-nn" == arg || "--no-notify" == arg) {
        currentExecutor.noNotifications = true;
        continue;
    }

    if ("-nc" == arg || "--no-clients" == arg) {
        shouldCreateClientServer = false;
        continue;
    }

    if ("-e" == arg || "--execute" == arg) {
        if (paramState == "FOLDER") {
            paramState = "EXECUTE";
        }

        var programName = nextArgument(i, arg);
        i++; // skip the next parameter
        currentExecutor.addExecutedCommand(programName);

        continue;
    }

    if ("--add-path" == arg) { // a path to be added.
        arg = nextArgument(i, arg);
        i++; // skip the next parameter
    }

    if (paramState == "EXECUTE") {
        paramState = "FOLDER";
        currentExecutor = new ExecutorSet();
        executorSets.push( currentExecutor );
    }

    currentExecutor.addMonitoredPath(arg);
}

if (!serveUri) {
    serveUri = executorSets[0].getMonitoredPaths()[0];
}

/**
 * isLocalServe - Checks if the given pathOrUrl is a remote URL or not.
 * @param {string} pathOrUrl
 * @return {boolean}
 */
function isLocalServe(pathOrUrl) {
    // find only the host part for proxying
    var m = /^(.*?\:\/\/[^/]+)(\/?.*)$/.exec( pathOrUrl );

    return !m;
}


var changeServer,
    noNotificationsChangeServer = new NoopChangeServer();

var logIndex = 0,
    runningProcesses = [];

if (!dryRun) {
    changeServer = shouldCreateClientServer ? new ChangeServer(port) : noNotificationsChangeServer;
}

var sentencePrefix = dryRun ? onceMany("Should ", "and should ") : onceMany("Will ", "and will ");

if (shouldCreateClientServer) {
    console.log(++logIndex + ". " + sentencePrefix.next() +
        "notify the changes for clients on port " + chalk.cyan(port));
}

if (! noServe) {
    if (!dryRun) {
        new IFrameServer(servePort, serveUri).run();
    }
    console.log(++logIndex + ". " + sentencePrefix.next() +
        "serve the content from " + chalk.cyan(serveUri) + " on port " + chalk.cyan(servePort));
}

if (parallelExecutePrograms.length) {
    console.log(++logIndex + ". " + sentencePrefix.next() +
        "run on startup, and then kill on shutdown:");

    parallelExecutePrograms.forEach(function(command, index) {
        console.log("   " + chalk.gray( String.fromCharCode(97 + index) + ": ") + chalk.green(command));
    });

    if (!dryRun) {
        parallelExecutePrograms.forEach(function (command) {
            var parsedCommand = new CommandLineParser(command);
            var process = spawn(parsedCommand.getCommand(), parsedCommand.getArgs());

            runningProcesses.push(process);

            // output
            process.stdout.on("data", function (data) {
                console.log(chalk.gray("> " + command));
                console.log("" + data);
            });
            process.stderr.on("data", function (data) {
                console.log(chalk.red("> " + command));
                console.error("" + data);
            });
        });
    }
}

//
// We need a watcher to monitor the file system folders, and a
// change server that will notify active browser clients when changes
// occured.
//
console.log(++logIndex + ". " + sentencePrefix.next() +
    "monitor and execute when files change in subfolders:");

// find the maximum path length for padding purposes.
var maxPathLength = computeMaxPathLength(executorSets);

executorSets.forEach(function(executorSet, index) {
    var watcher,
        watcherCallback,
        i;

    var monitoredPaths = executorSet.getMonitoredPaths(),
        executedCommands = executorSet.getExecutedCommands(),
        noNotifications = executorSet.noNotifications || !shouldCreateClientServer;

    var indent = onceMany("   " + chalk.gray( String.fromCharCode(97 + index) + ": "), "      "),
        arrow = onceMany(executedCommands.length ? chalk.gray(" -> ") : "    ", "    "),
        noNotify = onceMany( noNotifications ? chalk.gray(" (no refresh)") : "", "" );

    for (i = 0; i < Math.max(monitoredPaths.length, executedCommands.length); i++) {
        console.log(indent.next() +
                    chalk.cyan(rpad(monitoredPaths[i] || "", maxPathLength)) +
                    arrow.next() +
                    chalk.green(executedCommands[i] || "") +
                    noNotify.next());
    }

    if (dryRun) { // don't actually execute anything.
        return;
    }

    watcher = new Watcher(interval, delay, monitoredPaths);

    var localChangeServer = noNotifications ? noNotificationsChangeServer : changeServer;

    //
    // In case commands need to be executed, we notify the command executor server
    // of the file changes, and in turn it will notify the change server after the
    // commands are done.
    //
    // The reason is allowing having a build that also changes data, so we don't get
    // too many triggers for reloading of the page.
    //
    if (executedCommands.length) {
        var executeCommandsServer = new ExecuteCommandsServer(executedCommands, localChangeServer);
        watcherCallback = executeCommandsServer.filesChanged.bind(executeCommandsServer);
    } else {
        watcherCallback = changeServer.filesChanged.bind(localChangeServer);
    }

    watcher.addListener( watcherCallback );
    watcher.monitor();
});

if (!dryRun) {
    changeServer.run();
}

process.on("exit", function() { // kill everything on exit.
    runningProcesses.forEach(function(process) {
        process.kill();
    });
});

/**
 * Pads the string at the end with spaces to fit the given length.
 * @param {string} s
 * @param {number} pad
 */
function rpad(s, pad) {
    for (var i = s.length; i < pad; i++) {
        s = s + " ";
    }

    return s;
}

/**
 * Finds the length of the longest path across all monitored paths from
 * the executor sets
 * @param {Array<ExecutorSet>} executorSets
 * @return {number}
 */
function computeMaxPathLength(executorSets) {
    var maxPathLength = 0;

    executorSets.forEach(function(executorSet) {
        var monitoredPaths = executorSet.getMonitoredPaths();
        for (var i = 0; i < monitoredPaths.length; i++) {
            maxPathLength = Math.max(maxPathLength, (monitoredPaths[i] || "").length);
        }
    });

    return maxPathLength;
}

//# sourceMappingURL=fast-live-reload.js.map