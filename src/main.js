
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
        .option("paths", {
            list: true,
            help: "Paths to monitor for changes.",
        })
        .parse();

// in case no paths are given for monitoring, monitor the current folder.
var monitoredPaths = opts._.length ? opts._ : ["."];

var application = new Application(opts.port);
var watcher = new Watcher(opts.interval, monitoredPaths);

watcher.addListener( application.filesChanged.bind(application) );
application.run();
watcher.monitor();

