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

var m,
    queryString,
    hashString,
    queryParams,
    hashParams,
    host,
    ajaxCall;

/**
 * Parse the parameters and find the clientFastReloadHost string.
 */
m = /^.*?(\?(.*?))?(\#(.*))?$/.exec( document.location.href );
queryString = m[2];
hashString = m[4];

queryParams = new ParameterParser(queryString);
hashParams =  new ParameterParser(hashString);

host = window.clientFastReloadHost ? window.clientFastReloadHost : "localhost:9001";
host = queryParams.get("clientFastReloadHost", host);
host = hashParams.get("clientFastReloadHost", host);

/**
 * Do the actual ajax call.
 */
function loadUpdates() {
    ajaxCall = new AjaxCall("http://" + host + "/?_cache=" + new Date().getTime());
    ajaxCall.execute(function(data) {
        // reload page.
        document.location.reload();
    }, function() {
        // wait a bit so we don't always update in case the stuff is
        // down.
        setTimeout(loadUpdates, 500);
        return true;
    });
}

loadUpdates();


})();


//# sourceMappingURL=fast-live-reload.js.map