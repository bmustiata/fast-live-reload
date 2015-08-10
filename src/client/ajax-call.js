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

