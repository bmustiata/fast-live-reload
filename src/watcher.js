/**
 * Monitors a folder, and notifies the registered subscribers whenever
 * files change, with an aggregate object of changes.
 */
var Watcher = createClass({
    /**
     * @type {Array<Function>}
     */
    _listeners : null,

    /**
     * @type {Array<string>}
     */
    _paths : null,

    /**
     * @type {Function}
     */
    _createWatch : null,

    /**
     * @type {Array<FileMonitor>}
     */
    _fileMonitors : null,

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
     * @param {Array<string>} paths Monitors the given paths.
     */
    constructor : function(pollInterval, paths) {
        if (!paths || (typeof paths.length == "undefined")) {
            throw new Error('Watcher must have a paths array to monitor.');
        }

        this._createWatch = createWatch;

        this._listeners = [];
        this._fileMonitors = [];

        this._paths = paths;
        this._pollInterval = pollInterval;
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
        var path,
            pathsString;

        pathsString = this._paths.map(function(it) {
            return "'" + chalk.cyan(it) + "'";
        }).join(", ");

        console.log("Monitoring paths: " + pathsString +
                        " every " + chalk.cyan(this._pollInterval) + " millis.");

        for (var i = 0; i < this._paths.length; i++) {
            path = this._paths[i];

            this._createWatch().createMonitor(
                    path,
                    { interval : this._pollInterval },
                    this._createMonitor.bind(this, path)
            );
        }
    },

    /**
     * Creates the file monitor.
     * @param {string} path The that the created monitor watches.
     * @param {Object} monitor The monitor object created.
     */
    _createMonitor : function(path, monitor) {
        this._fileMonitors.push(monitor);

        monitor.on("created", this._notify.bind(this, path, "created"));
        monitor.on("changed", this._notify.bind(this, path, "changed"));
        monitor.on("removed", this._notify.bind(this, path, "removed"));
    },

    /**
     * Start recording the changed paths.
     * @param {string} path The path where the change occured.
     * @param {string} event The event name of what happened (created/changed/removed)
     * @param {string} f The file name where the event occured.
     */
    _notify : function(path, event, f) {
        if (!this._notificationTimeout) {
            this._notificationTimeout = setTimeout(this._fireChangedFiles.bind(this), 50);
            this._currentChanges = {
                eventCount : 0,
                "created" : {},
                "changed" : {},
                "removed" : {}
            }
        }

        this._currentChanges[event][f] = this._currentChanges.eventCount++;
    },

    /**
     * Notify the listeners of all the changed events.
     */
    _fireChangedFiles : function() {
        this._listeners.forEach(function(listener) {
            listener.call(null, this._currentChanges);
        }.bind(this));

        this._notificationTimeout = null;
        this._currentChanges = null;
    }
});

