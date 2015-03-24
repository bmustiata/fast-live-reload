
new UpdateNotifier(function(data) {
    console.log("reload data");
    document.location.reload();
}).requestUpdatesFromServer();

