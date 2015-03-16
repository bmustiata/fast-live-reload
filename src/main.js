
var opts = nomnom.script("fast-live-reload")
        .help("Monitors multiple folders for changes, and notifies connected clients.")
        .option("port", {
            abbr: "p",
            help: "Port to listen to.",
            transform: function(port) {
                return port ? parseInt(port) : null;
            }
        })
        .option("paths", {
            list: true,
            help: "Paths to monitor for changes.",
        })
        .parse();

// in case no paths are given for monitoring, monitor the current folder.
var monitoredPaths = opts._.length ? opts._ : ["."];

var application = new Application(opts.port);
var watcher = new Watcher(monitoredPaths);

watcher.addListener( application.filesChanged.bind(application) );
application.run();
watcher.monitor();

