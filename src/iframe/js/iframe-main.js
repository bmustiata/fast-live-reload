/**
 * initializeFastLiveReload - Initializes the fast live reload.
 * @param {string} targetUrl
 * @return {void}
 */
function initializeFastLiveReload(targetUrl) {
    var m = /^((.*?)\/\/(.*?)(\:\d+))?\/.*?(\?(.*?))?(\#(.*))?$/.exec( document.location.href );
    var hostString = m[1] + targetUrl;

    $(document).ready(function() {
        var iframeSite = new IFrameSite( $('#iframe-container'), hostString );

        $('#webAddress')[0].value = hostString;

        iframeSite.element().load(function() {
        	$('#webAddress')[0].value = iframeSite.location();
        });

        $('#goButton').on("click", function(ev) {
            iframeSite.navigate( $('#webAddress')[0].value );
        });

        new UpdateNotifier(function(data) {
            iframeSite.reload();
        }).requestUpdatesFromServer();
    });
}

window.initializeFastLiveReload = initializeFastLiveReload;

