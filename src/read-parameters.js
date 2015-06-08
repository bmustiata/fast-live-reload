var serveUri,
    noServe = false,
    port = 9001,
    servePort = 9000,
    interval = 100,
    executorSets = [];

//
// process the arguments.

function nextArgument(index, command) {
    if (index + 1 < process.argv.length) {
        return process.argv[i];
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
        i++;
        continue;
    }

    if ("-sp" == arg || "-serve-port" == arg) {
        servePort = parseInt(nextArgument(i, arg));
        i++;
        continue;
    }

    if ("-n" == arg || "--no-serve" == arg) {
        noServe = true;
        continue;
    }
}
