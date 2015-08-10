(function() { // don't pollute the environment.


/**
 * AjaxCall - A class that performs an AJAX call, and invokes the given callbacks.
 * @param {string} url
 * @param {string} method?
 * @return {void}
 */
function AjaxCall(url, method) {
    this.url = url;
    this.method = method || "GET";
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
                    callback(request.responseText);
                } else {
                    callbackCalled = callbackCalled || errorCallback();
                }
            }
        };

        request.open(this.method, this.url, true);
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
            setTimeout(loadUpdates, 500);
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
    var data = JSON.parse(data);

    if (onlyCssChanged(data)) {
        reloadOnlyCss();

        return;
    }

    reloadDocument();

}).requestUpdatesFromServer();


/**
 * onlyCssChanged - Checks if only CSS files changed in the data response
 * from the server.
 * @param {} data
 * @return {boolean}
 */
function onlyCssChanged(data) {
    for (var k in data.changed) {
        if (!/\.css$/.test(k)) {
            return false;
        }
    }

    for (var k in data.created) {
        if (!/\.css$/.test(k)) {
            return false;
        }
    }

    for (var k in data.removed) {
        if (!/\.css$/.test(k)) {
            return false;
        }
    }

    return true;
}

/**
 * reloadOnlyCss - Resets the href for all the CSS link nodes to force
 * their reloading.
 * @return {void}
 */
function reloadOnlyCss() {
    var cssNodes = document.querySelectorAll('link[rel="stylesheet"]');

    for (var i = 0; i < cssNodes.length; i++) {
        var cssNode = cssNodes[i];
        cssNode.href = refreshHref(cssNode.href); // resetting the href forces the reload.
        new AjaxCall(cssNode.href).execute(forceRedraw, forceRedraw);
    }
}

/**
 * refreshHref - Creates a new href that will have a _cache parameter in
 * case it is needed, or it will replace the old _cache parameter, to force
 * the reloading of the resource.
 * @param {string} href
 * @return {string}
 */
function refreshHref(href) {
    if (!/\?/.test(href)) { // the href has no params, just add it.
        return href + "?_cache=" + new Date().getTime();
    }

    // the href has parameters, does it have our _cache parameter?
    if (!/[?&]_cache=\d+$/.test(href)) {
        // no it doesn't so just add it
        return href + "&_cache=" + new Date().getTime();
    }

    // it contains our parameter, we need to replace the value.
    return href.replace(/([?&]_cache=)\d+$/, "$1" + new Date().getTime());
}

/**
 * forceRedraw - Force the redraw of the page somehow.
 * @return {void}
 */
function forceRedraw() {
    var oldDisplayValue = document.body.style.display || 'block';
    document.body.style.display = 'none';
    document.body.style.display = oldDisplayValue;
}

/**
 * reloadDocument - Reloads the current document. Takes into account
 * if there is a fragment part, to force a reload.
 * @return {void}
 */
function reloadDocument() {
    document.location.reload();
}

})();


//# sourceMappingURL=client-fast-reload.js.map