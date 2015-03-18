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


var host = window.clientFastReloadHost ? window.clientFastReloadHost : "localhost:9001";
var ajaxCall = new AjaxCall("http://" + clientFastReloadHost + "/?_cache=" + new Date().getTime());

function loadUpdates() {
    ajaxCall.execute(function(data) {
        // reload page.
        document.location.href = document.location.href;
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