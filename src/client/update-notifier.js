/**
 * UpdateNotifier - Notifies when updates were reported by the server.
 * @param {string} clientHost The client host to connect to in order to wait for updates.
 * @param {function} callback
 * @return {void}
 */
function UpdateNotifier(clientHost, callback) {
    this._clientHost = clientHost || "localhost:9001";
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

    host = window.fastLiveReloadHost ? window.fastLiveReloadHost : this._clientHost;
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

