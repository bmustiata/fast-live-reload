var serveUri,
    noServe = false,
    port = 9001,
    servePort = 9000,
    interval = 100,
    delay = 50,
    executorSets = [ new ExecutorSet() ],
    parallelExecutePrograms = [];

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

    if ("-n" == arg || "--no-serve" == arg) {
        noServe = true;
        continue;
    }

    if ("-ep" == arg || "-pe" == arg || "--parallel-execute" == arg) {
        var parallelExecute = nextArgument(i, arg);
        i++; // skip the next parameter
        parallelExecutePrograms.push(parallelExecute);

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
