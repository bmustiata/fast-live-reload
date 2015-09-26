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
            console.log("\nRunning: " + chalk.green(command));

            try {
                var result = childProcess.execSync(command, {
                    encoding: 'utf-8'
                });

                console.log(result);
            } catch (e) {
                console.error(chalk.yellow("Command failed: " + command, e));
            }
        });

        this._changeServer.filesChanged(changes);
    }
});
