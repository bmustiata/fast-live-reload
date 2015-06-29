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
     * Holds the list of files to be monitored. The list is mapped as an Object
     * that holds for keys the folders that contain the files, and for values,
     * other objects that have for keys the individual file name.
     * @type {Object}
     */
    _monitoredFiles : null,

    /**
     * @type {Function}
     */
    _createWatch : null,

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

        this._createWatch = createWatch;
        this._delay = delay;

        this._listeners = [];
        this._folderMonitors = [];

        this._readPathsAndMonitoredFiles(paths);
        this._pollInterval = pollInterval;
    },


    /**
     * _readPathsAndMonitoredFiles - Fills in the _paths and the _monitoredFiles
     * In the _paths there will be only the actual folders that need to be monitored.
     * @param {Array<string>} paths
     * @return {void}
     */
    _readPathsAndMonitoredFiles : function(paths) {
    	this._paths = [];
        this._monitoredFiles = {};

        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];

            if (this._isFile(path)) {
                var PATH_RE = /^((.*[\\/])?.+?)$/,
                    pathTokens = PATH_RE.exec(path),
                    parentFolder = this._normalizePath(pathTokens[2]), // if the path is in the current folder, mark it as such
                    fileName = this._normalizePath(pathTokens[1]);

                if (this._paths.indexOf(parentFolder) < 0) { // this._paths doesn't contain parentFolder
                    this._paths.push(parentFolder);
                }

                if (!this._monitoredFiles[parentFolder]) {
                    this._monitoredFiles[parentFolder] = {};
                }

                this._monitoredFiles[parentFolder][fileName] = 1;
            } else {
                this._paths.push(this._normalizePath(path));
            }
        }
    },

    /**
     * _isFile - Checks if the given path is a file.
     * @param {string} path
     * @return {boolean}
     */
    _isFile : function(path) {
    	return fs.statSync(path).isFile();
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
        this._folderMonitors.push(monitor);

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
        path = this._normalizePath(path);
        f = this._normalizePath(f);

        // if the given notification is on a file that is independently monitored
        if (this._monitoredFiles[path]) {
            if (!this._monitoredFiles[path][f]) {
                // no monitored file matched, just some non monitored file changed,
                // ignoring the change.
                return;
            }
        }

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
    },

    /**
     * _normalizePath - Normalizes the given path. Remove slashes, and checks if empty strings.
     * @param {string} path
     * @return {string}
     */
    _normalizePath : function(path) {
        if (!path) {
            return ".";
        }

        if (path != '/' && /[\\/]$/.test(path) ) { // if the path ends with a slash
            return path.substr(0, path.length - 1);
        }

        return path;
    }
});

