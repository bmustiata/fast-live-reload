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
        if (!window.WebSocket) {
            console.info('flr - web socket not supported, fallback with ajax will be used.');

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
            return;
        } else {
            wsChangesListener(host, self.callback);
        }
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
}

