(function() { // don't pollute the environment.


/**
 * AjaxCall - A class that performs an AJAX call, and invokes the given callbacks.
 * @param {string} url
 * @return {void}
 */
function AjaxCall(url) {
    this.url = url;
}

/**
 * execute - Executes the actual AJAX call.
 * @return {void}
 */
AjaxCall.prototype.execute = function(callback, errorCallback) {
    var request = new XMLHttpRequest(),
        callbackCalled = false; // error callback check, so we don't double call it.

    try {
        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                if (parseInt(request.status / 100) == 2) {
                    callback();
                } else {
                    callbackCalled = callbackCalled || errorCallback();
                }
            }
        }

        request.open("GET", this.url, true);
        request.send();
    } catch (e) {
        callbackCalled = callbackCalled || errorCallback();
    }
};


/**
 * ParameterParser - Parses the given parameters.
 * @param {string} queryString
 * @return {void}
 */
function ParameterParser(queryString) {
    var parameters,
        match,
        i;

    this._queryString = queryString;
    this._parameters = {};

    if (queryString == null || /^\s*$/.test(queryString)) {
        return; // nothing to parse
    }

    parameters = queryString.split("&");

    for (i = 0; i < parameters.length; i++) {
        match = /^(.*?)=(.*)$/.exec( parameters[i] );

        if (!match) { // parameter is present, but has no value
            this._parameters[ decodeURIComponent( parameters[i] ) ] = true;
        }

        this._parameters[ decodeURIComponent( match[1] ) ] = decodeURIComponent( match[2] );
    }
}

/**
 * get - Gets the value of the given parameter, or the default
 * value if the parameter is not defined.
 * @param {string} name The name of the parameter.
 * @param {string} defaultValue The default value to return if the param is not defined.
 * @return {string}
 */
ParameterParser.prototype.get = function(name, defaultValue) {
    var result = this._parameters[ name ];

    if (typeof result == "undefined") {
        return defaultValue;
    }

    return result;
}

/**
 * UpdateNotifier - Notifies when updates were reported by the server.
 * @param {function} callback
 * @return {void}
 */
function UpdateNotifier(callback) {
    this.callback = callback;
}

/**
 * requestUpdatesFromServer - Requests the updates from the server.
 * @return {void}
 */
UpdateNotifier.prototype.requestUpdatesFromServer = function() {
    var m,
        queryString,
        hashString,
        hostString,
        queryParams,
        hashParams,
        host,
        ajaxCall,
        self = this;

    /**
     * Parse the parameters and find the fastLiveReloadHost string.
     */
    m = /^(.*?)\/\/(.*?)(\:\d+)?\/.*?(\?(.*?))?(\#(.*))?$/.exec( document.location.href );
    hostString = m[2];
    queryString = m[5];
    hashString = m[7];

    queryParams = new ParameterParser(queryString);
    hashParams =  new ParameterParser(hashString);

    host = window.fastLiveReloadHost ? window.fastLiveReloadHost : (hostString + ":9001");
    host = queryParams.get("fastLiveReloadHost", host);
    host = hashParams.get("fastLiveReloadHost", host);

    /**
     * Do the actual ajax call.
     */
    function loadUpdates() {
        ajaxCall = new AjaxCall("http://" + host + "/?_cache=" + new Date().getTime());
        ajaxCall.execute(function(data) {
            self.callback.call(null, data);
        }, function() {
            // wait a bit so we don't always update in case the stuff is
            // down.
            setTimeout(loadUpdates, 500);
            return true;
        });
    }

    loadUpdates();
}



new UpdateNotifier(function(data) {
    console.log("reload data");
    document.location.reload();
}).requestUpdatesFromServer();


})();


//# sourceMappingURL=client-fast-reload.js.map