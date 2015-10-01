/**
 * initializeFastLiveReload - Initializes the fast live reload.
 * @param {string} targetUrl
 * @param {string} clientUrl The client used url to wait for update notifications.
 * @return {void}
 */
function initializeFastLiveReload(targetUrl, clientUrl) {
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

        new UpdateNotifier(clientUrl, function(data) {
            iframeSite.reload();
        }).requestUpdatesFromServer();
    });
}

window.initializeFastLiveReload = initializeFastLiveReload;

