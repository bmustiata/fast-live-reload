
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
    new StaticServer(opts['serve-port'], monitoredPaths[0]).run();
}

monitoredPaths = opts._.length ? opts._ : monitoredPaths;

var application = new Application(opts.port);
var watcher = new Watcher(opts.interval, monitoredPaths);

watcher.addListener( application.filesChanged.bind(application) );
application.run();
watcher.monitor();

