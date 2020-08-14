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
    _resolvedGlobPaths : null,

    /**
     * @type {Array<string>}
     */
    executedCommands : null,

    /**
     * @type {boolean}
     */
    noNotifications : false,

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
        this._resolvedGlobPaths = null;
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
     * return the current folder. The paths are going to be resolved
     * using globs.
     * @return {Array<string>}
     */
    getMonitoredPaths : function() {
        var foundItems = {},
            resolvedGlob;

        if (this._monitoredFolders.length == 0) {
            this._resolvedGlobPaths = null;
            this._monitoredFolders.push(".");
        }

        if (this._resolvedGlobPaths) {
            return this._resolvedGlobPaths;
        }

        for (var i = 0; i < this._monitoredFolders.length; i++) {
            var monitoredGlobPattern = this._monitoredFolders[i];
            var globFoundPaths = glob.sync(monitoredGlobPattern);

            for (var j = 0; j < globFoundPaths.length; j++) {
                var globPath = globFoundPaths[j];
                foundItems[globPath] = 1;
            }
        }

        this._resolvedGlobPaths = [];
        for (var resolvedGlobPath in foundItems) {
            this._resolvedGlobPaths.push(resolvedGlobPath);
        }

        return this._resolvedGlobPaths;
    },

    /**
     * Returns the commands to be executed.
     * @return {Array<string>}
     */
    getExecutedCommands : function() {
        return this._executedCommands;
    }
});
