/**
 * ExecutorSet - Data assignment between a bunch of monitored folders and commands to be executed when data changes in any of the folders.
 * @type {ExecutorSet}
 */
var ExecutorSet = createClass("ExecutorSet", {
	_monitoredFolders : null,
	_executedCommands : null,

    /**
     * constructor - Default constructor.
     * @param {Array<string>} monitoredFolders
	 * @param {Array<string>} executedCommands
	 */
    constructor: function() {
        this._monitoredFolders = [];
        this._executedCommands = [];
    },

    /**
     * addMonitoredPath - Adds a monitored folder.
     * @param {string} path
     * @return {ExecutorSet}
     */
    addMonitoredPath : function(path) {
        this._monitoredFolders.push(path);
        return this;
    },

    /**
     * addExecutedCommand - Adds a command to execute.
     * @param {} command
     * @return {ExecutorSet}
     */
    addExecutedCommand : function(command) {
        this._executedCommands.push(command);
        return this;
    },
});
