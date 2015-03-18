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

