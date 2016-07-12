/**
 * ExecuteCommandsServer - An executor that will run the given
 *                         commands before notifying the change
 *                         server of the changes.
 * @type {ExecuteCommandsServer}
 */
var ExecuteCommandsServer = createClass("ExecuteCommandsServer", {
	_commands : null,
	_changeServer : null,

    /**
     * constructor
     * @param {Array<string>} commands
	 * @param {ChangeServer} changeServer
	 */
    constructor: function(commands, changeServer) {
        this._commands = commands;
        this._changeServer = changeServer;
    },

    /**
     * filesChanged - Executes the registered commands and then forwards the
     *                change to the change server.
     * @param {} changes
     * @return {void}
     */
    filesChanged : function(changes) {
        console.log(chalk.green("\nChanges occurred"));

        this._commands.forEach(function(command) {
            var k;

            if (!isSingleFileCommand(command)) {
                runCommand(command);
                return;
            }

            for (k in changes.created) {
                runCommand(command, k);
            }

            for (k in changes.changed) {
                runCommand(command, k);
            }
        });

        this._changeServer.filesChanged(changes);
    }
});


function runCommand(command, file) {
    if (file) {
        console.log("\nRunning: " + chalk.green(command) + " for '" + chalk.blue(file) + "'");
    } else {
        console.log("\nRunning: " + chalk.green(command));
    }

    try {
        var options = {
            encoding: 'utf-8'
        };

        if (file) {
            options['env'] = {
                "FILE" : file
            };
        }

        var result = childProcess.execSync(command, options);

        console.log(result);
    } catch (e) {
        console.error(chalk.yellow("Command failed: " + command), e.message);
        console.log(e.stdout);
        console.error(e.stderr);
    }
}

/**
 * isSingleFileCommand - Returns true if this command is meant to process a single
 *                       file, that is refers to $FILE or ${FILE} or %FILE% in the
 *                       command string.
 * @param {string} command
 * @return {boolean}
 */
function isSingleFileCommand(command) {
    return /.*\$FILE.*/.test(command) ||
           /.*\$\{FILE\}.*/.test(command) ||
           /.*%FILE%.*/.test(command);
}
