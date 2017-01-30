#!/usr/bin/env node


var createClass = require("superb-class").createClass,
    express = require("express"),
    expressWs = require("express-ws"),
    chalk = require("chalk"),
    expressHandlebars = require("express-handlebars"),
    expressProxy = require("express-http-proxy"),
    expressCookieParser = require("cookie-parser"),
    handlebars = require("handlebars"),
    fs = require("fs"),
    path = require("path"),
    onceMany = require("once-many").onceMany,
    tamper = require("tamper"),
    glob = require("glob"),
    sane = require("sane"),
    childProcess = require("child_process");


//var _log = console.log;
var _log = function() {};

/**
 * Monitors folders or files, and notifies the registered subscribers whenever
 * files change, with an aggregate object of changes.
 * @type {Watcher}
 */
var Watcher = createClass({
    /**
     * @type {Array<Function>}
     */
    _listeners : null,

    /**
     * Holds the list of folders that will have watchers created for. Since files
     * can also be individually monitored, they will be available separately into
     * their own list.
     * @type {Array<string>}
     */
    _paths : null,

    /**
     * Holds the list of files to be monitored. The list is mapped as an Object
     * that holds for keys the folders that contain the files, and for values,
     * other objects that have for keys the individual file name.
     * @type {Object}
     */
    _monitoredFiles : null,

    /**
     * @type {Array<FileMonitor>}
     */
    _folderMonitors : null,

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

        this._delay = delay;

        this._listeners = [];
        this._folderMonitors = [];

        this._readPathsAndMonitoredFiles(paths);
        this._pollInterval = pollInterval;
    },


    /**
     * _readPathsAndMonitoredFiles - Fills in the _paths and the
     * _monitoredFileas. In the _paths there will be only the actual folders
     * that need to be monitored.
     *
     * @param {Array<string>} paths
     * @return {void}
     */
    _readPathsAndMonitoredFiles : function(paths) {
    	this._paths = [];
        this._monitoredFiles = {};

        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];

            if (this._isFile(path)) {
                var PATH_RE = /^((.*[\\/])?(.+?))$/,
                    pathTokens = PATH_RE.exec(path),
                    parentFolder = this._normalizePath(pathTokens[2]), // if the path is in the current folder, mark it as such
                    fileName = this._normalizePath(pathTokens[3]);

                if (this._paths.indexOf(parentFolder) < 0) { // this._paths doesn't contain parentFolder
                    this._paths.push(parentFolder);
                }

                if (!this._monitoredFiles[parentFolder]) {
                    this._monitoredFiles[parentFolder] = {};
                }

                this._monitoredFiles[parentFolder][fileName] = 1;
            } else {
                this._paths.push(this._normalizePath(path));
            }
        }
    },

    /**
     * _isFile - Checks if the given path is a file.
     * @param {string} path
     * @return {boolean}
     */
    _isFile : function(path) {
    	return fs.statSync(path).isFile();
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

            var monitor = sane(path, {});
            this._createMonitor(path, monitor);
            //sane(path, this.createMonitor.bind(this, path));
        }
    },

    /**
     * Creates the file monitor.
     * @param {string} path The that the created monitor watches.
     * @param {Object} monitor The monitor object created.
     */
    _createMonitor : function(path, monitor) {
        this._folderMonitors.push(monitor);

        monitor.on("add", this._notify.bind(this, path, "created"));
        monitor.on("change", this._notify.bind(this, path, "changed"));
        monitor.on("delete", this._notify.bind(this, path, "removed"));
    },

    /**
     * Start recording the changed paths.
     * @param {string} stringPath The path where the change occured.
     * @param {string} event The event name of what happened (created/changed/removed)
     * @param {string} f The file name where the event occured.
     */
    _notify : function(stringPath, event, f) {
        // Since we can only monitor for folders, whenever we have to monitor specific files,
        // we need to have a watcher over the folder that contains them, and we need to filter
        // out the non matching hits (since in that folder there can be changes in files
        // we don't care about).

        _log("Watcher.notify: ", stringPath, event, f);

        stringPath = this._normalizePath(stringPath);
        f = this._normalizePath(f);

        _log("  path:", stringPath);
        _log("  file:", f);

        // if the given notification is on a file that is independently monitored
        if (this._monitoredFiles[stringPath]) {
            if (!this._monitoredFiles[stringPath][f]) {
                _log("The file: ", f, " is not monitored in the path: ", this._monitoredFiles[stringPath]);
                // no monitored file matched, just some non monitored file changed,
                // ignoring the change.
                return;
            }
        } else {
            _log("Path is not in monitored files: ", stringPath, " monitored files: ", this._monitoredFiles);
        }

        if (!this._notificationTimeout) {
            var delay = this._delay >= 0 ? this._delay : 0;

            this._notificationTimeout = setTimeout(this._fireChangedFiles.bind(this), delay);
            this._currentChanges = {
                eventCount : 0,
                "created" : {},
                "changed" : {},
                "removed" : {}
            };
        }

        var fullFileName = path.resolve(stringPath, f);
        this._currentChanges[event][fullFileName] = this._currentChanges.eventCount++;
    },

    /**
     * Notify the listeners of all the changed events.
     */
    _fireChangedFiles : function() {
        this._listeners.forEach(function(listener) {
            try {
                listener.call(null, this._currentChanges);
            } catch (e) {
                console.warn("Unable to notify listener, skipping: ", e);
            }
        }.bind(this));

        this._notificationTimeout = null;
        this._currentChanges = null;
    },

    /**
     * _normalizePath - Normalizes the given path. Removes trailing slashes, and checks for empty strings,
     *                  replacing them with `.`, the current folder.
     * @param {string} path
     * @return {string}
     */
    _normalizePath : function(path) {
        if (!path) {
            return ".";
        }

        path = path.replace(/\\/g, "/"); // normalize windows Paths.

        if (path != '/' && /[\\/]$/.test(path) ) { // if the path ends with a slash
            return path.substr(0, path.length - 1);
        }

        return path;
    }
});


/**
 * The server keeps all the received connections,
 * in a pending state,  and notifies all the users when a
 * change happened, with the changed data.
 */
var ChangeServer = createClass({
    _express : null,

    _expressWs : null,

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

        this._expressWs = expressWs(this._express);
        this._express.ws("/", this._wsClientConnection.bind(this));

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

    _wsClientConnection : function(ws, req){
        // Nothing to do here!
        // ws.on('message', function(msg) {
        //     console.log(msg);
        // });
        // ws.on('close', function(ws){
        //     console.log('connection closed');
        //     console.log(ws);
        // });
        // console.log('new connection');
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
        // AJAX clients
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

        // WebSocket clients
        this._expressWs.getWss().clients.forEach(function(client){
            client.send(JSON.stringify(changes));
        });
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
 * ParsedUri - Parses the URI for serving the content.
 *
 * In case the URI given is a remote location, is used as is, and the
 * `proxyHost` and `requestPath` will be extracted from the given URI.
 * `folderUri` will point to the given `uri` for remote locations.
 *
 * In case the URI given is a local location, the parser will check if
 * the uri is actually a file. If it's a file, then folderUri will point
 * to the parent folder of that file, otherwise folderUri and uri will
 * be the same.
 *
 * @type {UriParser}
 */
var ParsedUri = createClass("ParsedUri", {
	uri : null,
    folderUri : null,

    isfileUri : false,

    proxyHost : null,
    requestPath : null,

    /**
     * constructor - default constructor
     * @param {} uri
	 */
    constructor: function(uri) {
        var m = /^(.*?\:\/\/[^/]+)(\/?.*)$/.exec( uri );

        this.uri = uri;
        this.folderUri = uri;

        if (!m) {
            this.isFileUri = true;

            if (fs.statSync(uri).isFile()) {
                this.folderUri = path.dirname(uri);
            }
        } else {
            this.proxyHost = m[ 1 ],
            this.requestPath = m[ 2 ];
        }
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
    _port : null,
    _parsedServeUri : null,
    _injectClientCode : true,

    /**
     * Constructs a handlebars server that serves the given path.
     * @param {number} port The port to start listening onto.
     * @param {ParsedUri} parsedUri A parsed URI to proxy or serve.
     * @param {number} clientPort The client port where the client waits for notifications.
     * @param {boolean} shouldInjectClientCode A flag if to inject the client code
     *      in the HTML pages or not.
     */
    constructor : function(port, parsedUri, clientPort, shouldInjectClientCode) {
        this._port = port;
        this._parsedServeUri = parsedUri;
        this._injectClientCode = shouldInjectClientCode;
        this._clientPort = clientPort;

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
        if (this._parsedServeUri.isFileUri) {
            this._serveFileUri();
        } else {
            this._serveProxyUri();
        }

        /**
         * Redirect on the first reload.
         */
        if (!this._injectClientCode) { // redirect only if no client code is injected.
            this._app.use('/', function (req, res, next) {

                if (req.path == '/fast-live-reload/' || req.cookies.fastLiveReload) {
                    if (!req.cookies.fastLiveReload) { // called directly /fast-live-reload/
                        res.cookie('fastLiveReload', 'true');
                    }
                    return next();
                }

                res.cookie('fastLiveReload', 'true');
                res.redirect('/fast-live-reload/');
            }.bind(this));
        }

        /**
         * Serve the fast-live-reload page.
         */
        this._app.get('/fast-live-reload/', function(req, res, next) {
        	res.render('index', {
                TARGET_URL : this._parsedServeUri.requestPath,
                CLIENT_HOST : this._getClientHost(req)
            });
        }.bind(this));

        this._app.listen(this._port);
    },

    /**
     * _serveProxyUri - Serves the content using a PROXY.
     * @return {void}
     */
    _serveProxyUri : function() {
        /**
         * Load the proxy.
         */
        var _this = this;
        this._app.use('/', expressProxy(this._parsedServeUri.proxyHost, {
            filter : function(req, res) {
                // if this is a fast-live-reload request for the iframe integration,
                //then we don't need to do anyhting.
                if (/^\/fast-live-reload\//.test(req.path)) {
                    return false;
                }

                return true;
            },

            intercept : function(rsp, data, req, res, callback) {
                // allow in frame embedding.
                res.set('Access-Control-Allow-Origin', '*');
                res.set('X-Frame-Options', '');

                if (this._injectClientCode) {
                    var bufferData = data.toString();
                    if (/(<\/body>([\s\S]*?)<\/html>\s*)$/i.test(bufferData)) {
                        var codeToInject = this._generateInjectClientCode(req);
                        data = bufferData.replace(/(<\/body>([\s\S]*?)<\/html>\s*)$/i, codeToInject + "$1");
                        data = data.replace(/<base\s+href=".*?"\s*(\/>)|(><\/base>)/i, "");
                    }
                }

                callback(null, data);
            }.bind(this)
        }));
    },

    /**
     * _generateInjectClientCode - Generates the code that needs to be injected
     * into a page in order to get the live reloading. It should be the client
     * configuration, and the reference to the client-reload.js script.
     * @param {Request} req The original request
     * @return {string}
     */
    _generateInjectClientCode : function(req) {
        var clientHost = this._getClientHost(req);

        return "<script type='text/javascript'>window.fastLiveReloadHost = window.fastLiveReloadHost || '" + clientHost + "';</script>" +
            "<script src='/fast-live-reload/js/client-reload.js'></script>";
    },

    /**
     * _getClientHost - Gets the client host, from the current request, and the this._clientPort.
     * @param {Request} req
     * @return {string}
     */
    _getClientHost : function(req) {
        var result = req.headers.host.replace(/^(.+?)(:\d+)?$/, '$1:' + this._clientPort);

        return result;
    },

    /**
     * _serveFileUri - Serves local files content.
     * @return {void}
     */
    _serveFileUri : function() {
        if (this._injectClientCode) {
            this._app.use(tamper(function (req, res) {
                var mime = res.getHeader('Content-Type')

                if (!/text\/html/.test(mime)) {
                    return false;
                }

                // Return a function in order to capture and modify the response body:
                return function (body) {
                    return body.replace(/(<\/body>([\s\S]*?)<\/html>\s*)$/i,
                        "<script src='/fast-live-reload/js/client-reload.js'></script>$1");
                }
            }));
        }
        this._app.use(express.static( this._parsedServeUri.folderUri ));
    },
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
            var k;

            if (!isSingleFileCommand(command)) {
                runCommand(command);
                return;
            }

            for (k in changes.created) {
                runCommand(command, k);
            }

            for (k in changes.changed) {
                runCommand(command, k);
            }
        });

        this._changeServer.filesChanged(changes);
    }
});


function runCommand(command, file) {
    if (file) {
        console.log("\nRunning: " + chalk.green(command) + " for '" + chalk.blue(file) + "'");
    } else {
        console.log("\nRunning: " + chalk.green(command));
    }

    try {
        var options = {
            encoding: 'utf-8'
        };

        if (file) {
            options['env'] = merge(process.env, {
                "FILE" : file
            });
        }

        var result = childProcess.execSync(command, options);

        console.log(result);
    } catch (e) {
        console.error(chalk.yellow("Command failed: " + command), e.message);
        console.log(e.stdout);
        console.error(e.stderr);
    }
}

/**
 * isSingleFileCommand - Returns true if this command is meant to process a single
 *                       file, that is refers to $FILE or ${FILE} or %FILE% in the
 *                       command string.
 * @param {string} command
 * @return {boolean}
 */
function isSingleFileCommand(command) {
    return /.*\$FILE.*/.test(command) ||
           /.*\$\{FILE\}.*/.test(command) ||
           /.*%FILE%.*/.test(command);
}

/**
 * joinProperties - Create a new object with the properties of the extra
 *         item overlayed over the base one. Protypal chain is ignored.
 *         This IS NOT A DEEP COPY.
 * @param {} base
 * @param {} extra
 * @return {object}
 */
function merge(base, extra) {
  var result = {};

  for (var k in base) {
    if (base.hasOwnProperty(k)) {
      result[k] = base[k];
    }
  }

  for (var k in extra) {
    result[k] = extra[k];
  }

  return result;
}


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
    _resolvedGlobPaths : null,

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
        this._resolvedGlobPaths = null;
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
     * return the current folder. The paths are going to be resolved
     * using globs.
     * @return {Array<string>}
     */
    getMonitoredPaths : function() {
        var foundItems = {},
            resolvedGlob;

        if (this._monitoredFolders.length == 0) {
            this._resolvedGlobPaths = null;
            this._monitoredFolders.push(".");
        }

        if (this._resolvedGlobPaths) {
            return this._resolvedGlobPaths;
        }

        for (var i = 0; i < this._monitoredFolders.length; i++) {
            var monitoredGlobPattern = this._monitoredFolders[i];
            var globFoundPaths = glob.sync(monitoredGlobPattern);

            for (var j = 0; j < globFoundPaths.length; j++) {
                var globPath = globFoundPaths[j];
                foundItems[globPath] = 1;
            }
        }

        this._resolvedGlobPaths = [];
        for (var resolvedGlobPath in foundItems) {
            this._resolvedGlobPaths.push(resolvedGlobPath);
        }

        return this._resolvedGlobPaths;
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
    shouldCreateClientServer = true,
    shouldInjectClientCode = true;

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

    if ("-ni" == arg || "--no-inject" == arg) {
        shouldInjectClientCode = false;
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
        shouldInjectClientCode = false;
        continue;
    }

    if ("-o" == arg || "--offline" == arg) { // no clients, and no served files
        shouldInjectClientCode = false;
        shouldCreateClientServer = false;
        noServe = true;
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
    var parsedUri = new ParsedUri(serveUri);
    if (!dryRun) {
        new IFrameServer(servePort, parsedUri, port, shouldInjectClientCode).run();
    }
    console.log(++logIndex + ". " + sentencePrefix.next() +
        "serve the content from " + chalk.cyan(parsedUri.folderUri) +
        " on port " + chalk.cyan(servePort));
}

if (parallelExecutePrograms.length) {
    console.log(++logIndex + ". " + sentencePrefix.next() +
        "run on startup, and then kill on shutdown:");

    parallelExecutePrograms.forEach(function(command, index) {
        console.log("   " + chalk.gray( String.fromCharCode(97 + index) + ": ") + chalk.green(command));
    });

    if (!dryRun) {
        parallelExecutePrograms.forEach(function startCommand(command) {
            var process = childProcess.exec(command);
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

            process.on('exit', function() {
                console.log(chalk.red("`" + command + "` failed. Restarting."));
                runningProcesses.splice( runningProcesses.indexOf(process), 1 );

                startCommand(command);
            })
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