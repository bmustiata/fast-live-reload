
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

/**
 * Shows the help for the application.
 */
function showHelp() {
    var helpText;

    helpText = fs.readFileSync("lib/readme.hbs", {
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

    context.BINARY = "binary";

    console.log(handlebars.compile(helpText)(context));
    process.exit();
}

showHelp();

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

