/**
 * ExecutorSet - Data assignment between a bunch of monitored folders and commands to be executed when data changes in any of the folders.
 * @type {ExecutorSet}
 */
var ExecutorSet = createClass("ExecutorSet", {
    /**
     * @type {Array<string>}
     */
    _monitoredFolders : null,

    /**
     * @type {Array<string>}
     */
	_executedCommands : null,

    /**
     * constructor - Default constructor.
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
     * @param {string} command
     * @return {ExecutorSet}
     */
    addExecutedCommand : function(command) {
        this._executedCommands.push(command);
        return this;
    },

    /**
     * Returns the monitored paths. If no paths are registered,
     * return the current folder.
     * @return {Array<string>}
     */
    getMonitoredPaths : function() {
        if (this._monitoredFolders.length == 0) {
            this._monitoredFolders.push(".");
        }

        return this._monitoredFolders;
    },

    /**
     * Returns the commands to be executed. If no commands are registered,
     * returns null.
     * @return {Array<string>}
     */
    getExecutedCommands : function() {
        return this._executedCommands.length ? this._executedCommands : null;
    }
});
