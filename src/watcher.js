/**
 * Monitors a folder, and notifies the registered subscribers whenever
 * files change, with an aggregate object of changes.
 */
var Watcher = createClass({
    /**
     * @type {Array<Function>}
     */
    _listeners : null,

    _path : null,

    _watch : null,
    _fileMonitor : null,

    // Use a timeout to record several changes that happen quickly in only
    // one object. The current changes keeps the changes that need to be
    // fired.
    _notificationTimeout : null,
    _currentChanges : null,

    /**
     * @param {string} path Monitors the given path.
     */
    constructor : function(path) {
        this._listeners = [];
        this._path = path;
        this._watch = watch;
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
        this._watch.createMonitor(this._path, this._createMonitor.bind(this));
    },

    /**
     * Creates the file monitor.
     */
    _createMonitor : function(monitor) {
        this._fileMonitor = monitor;

        monitor.on("created", this._notify.bind(this, "created"));
        monitor.on("changed", this._notify.bind(this, "changed"));
        monitor.on("removed", this._notify.bind(this, "removed"));
    },

    /**
     * Start recording the changed paths.
     */
    _notify : function(event, f) {
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

