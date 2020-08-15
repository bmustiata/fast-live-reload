// var _log = console.log;
var _log = function() {};

/**
 * Monitors folders or files, and notifies the registered subscribers whenever
 * files change, with an aggregate object of changes.
 * @type {Watcher}
 */
var Watcher = createClass({
    /**
     * @type {Array<Function>}
     */
    _listeners : null,

    /**
     * Holds the list of folders that will have watchers created for. Since files
     * can also be individually monitored, they will be available separately into
     * their own list.
     * @type {Array<string>}
     */
    _paths : null,

    /**
     * @type {Array<FileMonitor>}
     */
    _folderMonitors : null,

    // Use a timeout to record several changes that happen quickly in only
    // one object. The current changes keeps the changes that need to be
    // fired.
    _notificationTimeout : null,
    _currentChanges : null,

    /**
     * @type {number} At how many millis to poll the paths.
     */
    _pollInterval : null,

    /**
     * @param {number} pollInterval Time to poll the paths.
     * @param {number} delay Time to wait before triggering changes.
     * @param {Array<string>} paths Monitors the given paths.
     */
    constructor : function(pollInterval, delay, paths) {
        if (!paths || (typeof paths.length == "undefined")) {
            throw new Error('Watcher must have a paths array to monitor.');
        }

        this._delay = delay;

        this._listeners = [];
        this._folderMonitors = [];

        this._readPathsAndMonitoredFiles(paths);
        this._pollInterval = pollInterval;
    },


    /**
     * _readPathsAndMonitoredFiles - Fills in the _paths and the
     * _monitoredFileas. In the _paths there will be only the actual folders
     * that need to be monitored.
     *
     * @param {Array<string>} paths
     * @return {void}
     */
    _readPathsAndMonitoredFiles : function(paths) {
        this._paths = [];

        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];

            this._paths.push(this._normalizePath(path));
        }
    },

    /**
     * Adds a listener that will  be notified when paths
     * are changed.
     */
    addListener : function(callback) {
        this._listeners.push(callback);
    },

    /**
     * Start monitoring the given folder.
     */
    monitor : function() {
        var path;

        for (var i = 0; i < this._paths.length; i++) {
            path = this._paths[i];

            var monitor = chokidar.watch(path, {
                persistent: true
            });
            this._createMonitor(path, monitor);
        }
    },

    /**
     * Creates the file monitor.
     * @param {string} path The that the created monitor watches.
     * @param {Object} monitor The monitor object created.
     */
    _createMonitor : function(path, monitor) {
        this._folderMonitors.push(monitor);

        monitor.on("add", this._notify.bind(this, path, "created"));
        monitor.on("change", this._notify.bind(this, path, "changed"));
        monitor.on("unlink", this._notify.bind(this, path, "removed"));
    },

    /**
     * Start recording the changed paths.
     * @param {string} stringPath The path where the change occured.
     * @param {string} event The event name of what happened (created/changed/removed)
     * @param {string} f The file name where the event occured.
     */
    _notify : function(stringPath, event, f) {
        // Since we can only monitor for folders, whenever we have to monitor specific files,
        // we need to have a watcher over the folder that contains them, and we need to filter
        // out the non matching hits (since in that folder there can be changes in files
        // we don't care about).

        _log("Watcher.notify: ", stringPath, event, f);

        stringPath = this._normalizePath(stringPath);
        f = this._fileName(this._normalizePath(f));

        _log("  path:", stringPath);
        _log("  file:", f);

        if (!this._notificationTimeout) {
            var delay = this._delay >= 0 ? this._delay : 0;

            this._notificationTimeout = setTimeout(this._fireChangedFiles.bind(this), delay);
            this._currentChanges = {
                eventCount : 0,
                "created" : {},
                "changed" : {},
                "removed" : {}
            };
        }

        var fullFileName = path.resolve(stringPath, f);
        this._currentChanges[event][fullFileName] = this._currentChanges.eventCount++;
    },

    /**
     * Notify the listeners of all the changed events.
     */
    _fireChangedFiles : function() {
        this._listeners.forEach(function(listener) {
            try {
                listener.call(null, this._currentChanges);
            } catch (e) {
                console.warn("Unable to notify listener, skipping: ", e);
            }
        }.bind(this));

        this._notificationTimeout = null;
        this._currentChanges = null;
    },

    /**
     * _normalizePath - Normalizes the given path. Removes trailing slashes, and checks for empty strings,
     *                  replacing them with `.`, the current folder.
     * @param {string} path
     * @return {string}
     */
    _normalizePath : function(path) {
        if (!path) {
            return ".";
        }

        path = path.replace(/\\/g, "/"); // normalize windows Paths.

        if (path != '/' && /[\\/]$/.test(path) ) { // if the path ends with a slash
            return path.substr(0, path.length - 1);
        }

        return path;
    },

    /**
     * _fileName - Drops any folder, and returns only the file name (basename)
     * @param {string} f
     * @return {string}
     */
    _fileName: function(f) {
        return f.replace(/^.*[\\/]/, "");
    }
});

