
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
        .option("execute", {
            abbr: "e",
            help: "Execute the given commands on change. Only after the commands runs, will the clients be notified of the changes.",
            list: true
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

    monitoredPaths = ['.'];
    new IFrameServer(opts['serve-port'], serveUri).run();
}

monitoredPaths = opts._.length ? opts._ : monitoredPaths;

//
// We need a watcher to monitor the file system folders, and a
// change server that will notify active browser clients when changes
// occured.
//
var changeServer = new ChangeServer(opts.port);
var watcher = new Watcher(opts.interval, monitoredPaths),
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

