

$(document).ready(function() {
    var iframeSite = new IFrameSite( $('#iframe-container'), "http://ciplogic.com" );

    $('#goButton').on("click", function(ev) {
        iframeSite.navigate( $('#webAddress')[0].value );
    });

    new UpdateNotifier(function(data) {
        console.log('changes', data);
    }).requestUpdatesFromServer();
});


