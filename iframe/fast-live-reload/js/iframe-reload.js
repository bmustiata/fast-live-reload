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
                    callback(JSON.parse(request.responseText));
                } else {
                    callbackCalled = callbackCalled || errorCallback();
                }
            }
        };

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


/**
 * IFrameSite - A website that is inside an iframe.
 * @return {void}
 */
function IFrameSite(parentNode, initialSite) {
    var width,
        height,
        self = this;

    this._parentNode = parentNode;
    this._location = initialSite;

    /**
     * create the DOM element.
     */
    this._element = $('<iframe>');
    this._element.attr('src', initialSite);

    parentNode.append(this._element);

    /**
     * Bind its UI.
     */
    this._resizeIFrame();
    $(window).resize(function() {
        self._resizeIFrame();
    });

    this._element.load(function() {
        self._onIFrameReloaded();
    });
}

/**
 * _resizeIFrame - Resizes the iframe, on window change.
 * @return {void}
 */
IFrameSite.prototype._resizeIFrame = function() {
    width = this._parentNode.width();
    height = this._parentNode.height();

    this._element.css({
        width: width,
        height: height
    });
};

/**
 * navigate - Navigate to the given location.
 * @param {} location
 * @return {void}
 */
IFrameSite.prototype.navigate = function(location) {
    this._location = location;
    this._element.attr('src', location);
};

/**
 * reload - Reloads the iframe.
 * @return {void}
 */
IFrameSite.prototype.reload = function() {
    try {
        this._element[0].contentWindow.document.location.reload();
    } catch (e) { // security exception, default to basic reloading
        this._element.attr('src', this._location);
    }
};

/**
 * element - Returns the IFrameElement
 * @return {Array<Element>} Returns the jQuery element.
 */
IFrameSite.prototype.element = function() {
    return this._element;
};

/**
 * _onIFrameReloaded - Function called when the iframe was reloaded.
 * @return {void}
 */
IFrameSite.prototype._onIFrameReloaded = function(ev) {
    var iframeLocation = this._element[0].contentWindow.document.location.href;
    this._location = iframeLocation;
};

/**
 * location - Returns the current location of the iframe.
 * @return {string}
 */
IFrameSite.prototype.location = function() {
    return this._location;
};

/**
 * title - Returns the title of the current IFrame.
 * @return {string}
 */
IFrameSite.prototype.title = function() {
    return this._element[0].contentWindow.document.title;
};


/**
 * initializeFastLiveReload - Initializes the fast live reload.
 * @param {string} targetUrl
 * @return {void}
 */
function initializeFastLiveReload(targetUrl) {
    var m = /^((.*?)\/\/(.*?)(\:\d+))?\/.*?(\?(.*?))?(\#(.*))?$/.exec( document.location.href );
    var hostString = m[1] + targetUrl;

    var ENTER = 13;

    $(document).ready(function() {
        var iframeSite = new IFrameSite( $('#iframe-container'), hostString ),
            webAddressInput = $('#webAddress'),
            goButton = $("#goButton");

        webAddressInput[0].value = hostString;

        iframeSite.element().load(function() {
        	webAddressInput[0].value = iframeSite.location();
          document.title = iframeSite.title();
        });

        goButton.on("click", function(ev) {
            iframeSite.navigate( webAddressInput[0].value );
        });

        webAddressInput.on("keyup", function(ev) {
            if (ev.keyCode == ENTER) { // jump to the given address.
                iframeSite.navigate( webAddressInput[0].value );
            }
        });

        new UpdateNotifier(function(data) {
            iframeSite.reload();
        }).requestUpdatesFromServer();
    });
}

window.initializeFastLiveReload = initializeFastLiveReload;


//# sourceMappingURL=iframe-reload.js.map