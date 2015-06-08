
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

