/**
 * AjaxCall - A class that performs an AJAX call, and invokes the given callback.
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
        callbackCalled = false;

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

var ajaxCall = new AjaxCall("http://localhost:9001/?_cache=" + new Date().getTime());

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

