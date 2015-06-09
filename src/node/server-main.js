
var changeServer;

var logIndex = 0;

if (!dryRun) {
    changeServer = new ChangeServer(port);
}

console.log(dryRun ? "Should" : "Will");
console.log(++logIndex + ". notify the changes for clients on port " + chalk.cyan(port) + ",");

if (! noServe) {
    if (!dryRun) {
        new IFrameServer(servePort, serveUri).run();
    }
    console.log(++logIndex + ". serve the content from " + chalk.cyan(serveUri) + " on port " + chalk.cyan(servePort) + ",");
}

if (parallelExecutePrograms.length) {
    console.log(++logIndex + ". run on startup, and then kill on shutdown:");

    parallelExecutePrograms.forEach(function(command, index) {
        console.log("   " + chalk.gray( String.fromCharCode(97 + index) + ": ") + chalk.green(command));
    });

    if (!dryRun) {
        parallelExecutePrograms.forEach(function (command) {
            var parsedCommand = new CommandLineParser(command);
            var process = spawn(parsedCommand.getCommand(), parsedCommand.getArgs());

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
console.log(++logIndex + ". and will monitor and execute when files change in subfolders:");

// find the maximum path length for padding purposes.
var maxPathLength = computeMaxPathLength(executorSets);

executorSets.forEach(function(executorSet, index) {
    var watcher,
        watcherCallback,
        i;

    var monitoredPaths = executorSet.getMonitoredPaths(),
        executedCommands = executorSet.getExecutedCommands();

    var indent = onceMany("   " + chalk.gray( String.fromCharCode(97 + index) + ": "), "      "),
        arrow = onceMany(executedCommands.length ? chalk.gray(" -> ") : "    ", "    ");

    for (i = 0; i < Math.max(monitoredPaths.length, executedCommands.length); i++) {
        console.log(indent.next() +
                    chalk.cyan(rpad(monitoredPaths[i] || "", maxPathLength)) +
                    arrow.next() +
                    chalk.green(executedCommands[i] || ""));
    }

    if (dryRun) { // don't actually execute anything.
        return;
    }

    watcher = new Watcher(interval, delay, monitoredPaths);

    //
    // In case commands need to be executed, we notify the command executor server
    // of the file changes, and in turn it will notify the change server after the
    // commands are done.
    //
    // The reason is allowing having a build that also changes data, so we don't get
    // too many triggers for reloading of the page.
    //
    if (executedCommands.length) {
        var executeCommandsServer = new ExecuteCommandsServer(executedCommands, changeServer);
        watcherCallback = executeCommandsServer.filesChanged.bind(executeCommandsServer);
    } else {
        watcherCallback = changeServer.filesChanged.bind(changeServer);
    }

    watcher.addListener( watcherCallback );
    watcher.monitor();
});

if (!dryRun) {
    changeServer.run();
}

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
