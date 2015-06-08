var changeServer = new ChangeServer(port);

var logIndex = 0;

console.log("Will");
console.log(++logIndex + ". notify the changes for clients on port " + chalk.cyan(port) + ",");

if (! noServe) {
    new IFrameServer(servePort, serveUri).run();
    console.log(++logIndex + ". serve the content from " + chalk.cyan(serveUri) + " on port " + chalk.cyan(servePort) + ",");
}

if (parallelExecutePrograms.length) {
    console.log(++logIndex + ". run on startup, and then kill on shutdown:");
    parallelExecutePrograms.forEach(function(command, index) {
        console.log("   " + chalk.gray( String.fromCharCode(97 + index) + ": ") + chalk.green(command));
    });
}

//
// We need a watcher to monitor the file system folders, and a
// change server that will notify active browser clients when changes
// occured.
//
console.log(++logIndex + ". and will monitor and execute when files change in subfolders:");

executorSets.forEach(function(executorSet, index) {
    var watcher = new Watcher(interval, delay, executorSet.getMonitoredPaths()),
        watcherCallback;

    var indent = onceMany("   " + chalk.gray( String.fromCharCode(97 + index) + ": "), "      "),
        arrow = onceMany(" -> ", "    ");

    var monitoredPaths = executorSet.getMonitoredPaths(),
        executedCommands = executorSet.getExecutedCommands();

    for (var i = 0; i < Math.max(monitoredPaths.length, executedCommands.length); i++) {
        console.log(indent.next() +
                    chalk.cyan(monitoredPaths[i] || "") +
                    arrow.next() +
                    chalk.green(executedCommands[i] || ""));
    }

    //
    // In case commands need to be executed, we notify the command executor server
    // of the file changes, and in turn it will notify the change server after the
    // commands are done.
    //
    // The reason is allowing having a build that also changes data, so we don't get
    // too many triggers for reloading of the page.
    //
    if (executorSet.getExecutedCommands()) {
        var executeCommandsServer = new ExecuteCommandsServer(executorSet.getExecutedCommands(), changeServer);
        watcherCallback = executeCommandsServer.filesChanged.bind(executeCommandsServer);
    } else {
        watcherCallback = changeServer.filesChanged.bind(changeServer);
    }

    watcher.addListener( watcherCallback );
    watcher.monitor();
});

changeServer.run();

