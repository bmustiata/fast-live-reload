(function() { // don't pollute the environment.

// mark it anyway, so if we have nested iframes,
// we'll still have it set correctly.
window._ciplogic_fast_live_reload = true;

if (parent != window && parent._ciplogic_fast_live_reload) {
	return; // bail out if loaded in the parent iframe.
}

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
            continue;
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
 * @param {string} defaultHost The client host to connect to in order to wait for updates.
 * @param {function} callback
 * @return {void}
 */
function UpdateNotifier(defaultHost, callback) {
    this._defaultHost = defaultHost;
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

    host = hostString + ':9001';
    host = this._defaultHost ? this._defaultHost : host;
    host = window.fastLiveReloadHost ? window.fastLiveReloadHost : host;
    host = queryParams.get("fastLiveReloadHost", host);
    host = hashParams.get("fastLiveReloadHost", host);

    /**
     * Do the actual ajax call.
     */
    function loadUpdates() {
        if (window.WebSocket) {
            wsChangesListener(host, self.callback);
            return;
        }

        // on older IEs the console is defined only when the developer tools are open.
        if (typeof console != "undefined") {
            console.info('fast-live-reload - Web Sockets are not supported, AJAX fallback will be used.');
        }
        ajaxChangesListener();
    }

    /**
     * The AJAX change listener does a loop, by calling again itself using
     * setTimeout. We don't use setInterval, since we don't want multiple
     * parallel requests if the response comes slower.
     */
    function ajaxChangesListener() {
        ajaxCall = new AjaxCall("http://" + host + "/?_cache=" + new Date().getTime());
        ajaxCall.execute(function(data) {
            self.callback.call(null, data);
            setTimeout(ajaxChangesListener, 500);
        }, function() {
            // wait a bit so we don't always update in case the stuff is
            // down.
            setTimeout(ajaxChangesListener, 500);
            return true;
        });
    }

    function wsChangesListener(host, callBack) {
      // open connection
      var connection = null;

      init();

      function init() {

        connection = new WebSocket('ws://' + host);

        connection.onopen = function () {
          // console.log('flr - connection established.');
        };

        connection.onerror = function (error) {
          // just in there were some problems ...
          // console.error('flr - error in communication: ', error);
          if(connection){
            connection.close();
            connection = null;
          }
          // reestablishWebSocketConnection(host, callBack);
        };

        connection.onclose = function(){
          if(connection){
            // console.log('flr - connection closed.');
            connection.close();
            connection = null;
          }
          reestablishWebSocketConnection(host, callBack);
        };

        connection.onmessage = function (message) {
          callBack.call(null, message.data);
        };

      }
    }

    function reestablishWebSocketConnection(host, callBack) {
      setTimeout(function() {
          // console.log('flr - reconnecting to web socket.');
          wsChangesListener(host, callBack);
        }
      , 3000);
    }

    loadUpdates();
};



new UpdateNotifier(null, function(data) {
    data = JSON.parse(data);

    if (onlyCssChanged(data)) {
        reloadOnlyCss();

        return;
    }

    reloadDocument();

}).requestUpdatesFromServer();


/**
 * onlyCssChanged - Checks if only CSS files changed in the data response
 * from the server.
 * @param {any} data
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
 * Reloads the CSS for all the iframes, including the iframes that are
 * created programatically, and assumes accessing the document of the
 * iframe might fail.
 */
function reloadOnlyCss() {
    for (var i = 0; i < window.frames.length; i++) {
        var frame = window.frames[0];
        
        try {
            reloadOnlyCssForDocument(frame.document);
        } catch(e) {
            // ignore on purpose, if reloading failed, it might be because we
            // are not CORS compliant.
        }
    }
    
    reloadOnlyCssForDocument(document);
}

/**
 * reloadOnlyCssForDocument - Resets the href for all the CSS link 
 * nodes to force their reloading.
 * @param {Document} doc The document to reload only the CSS.
 * @return {void}
 */
function reloadOnlyCssForDocument(doc) {
    var cssNodes = doc.querySelectorAll('link[rel="stylesheet"]');

    for (var i = 0; i < cssNodes.length; i++) {
        var cssNode = cssNodes[i];
        cssNode.href = refreshHref(cssNode.href); // resetting the href forces the reload.

        // FIXME: this is a hack for a bug chrome that doesn't redraws, unless at least
        // a mouse over occurs even if colors actually changed, on some platforms.
        new AjaxCall(cssNode.href).execute(function() {
        	forceRedraw(doc);
        }, function() {
            forceRedraw(doc);
        });
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
 * This is implemented currently by alternating the display style of the
 * body element;
 * @param {Document} doc The document to reload.
 * @return {void}
 */
function forceRedraw(doc) {
    var oldDisplayValue = doc.body.style.display || 'block';
    doc.body.style.display = 'none';
    doc.body.style.display = oldDisplayValue;
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


//# sourceMappingURL=client-reload.js.map