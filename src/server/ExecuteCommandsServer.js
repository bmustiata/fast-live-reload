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

        //console.log("On change run the following commands: ");
        //this._commands.forEach(function(command, it) {
        //    console.log( chalk.cyan(it + 1 + ".") + " " + chalk.green(command) );
        //});
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

            if (exec(command).code != 0) {
                console.log(chalk.yellow("Command failed: " + command));
            }
        });

        this._changeServer.filesChanged(changes);
    }
});
