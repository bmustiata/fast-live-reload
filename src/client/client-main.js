
new UpdateNotifier(function(data) {
    var data = JSON.parse(data);

    if (onlyCssChanged(data)) {
        reloadOnlyCss();

        return;
    }

    reloadDocument();

}).requestUpdatesFromServer();


/**
 * onlyCssChanged - Checks if only CSS files changed in the data response
 * from the server.
 * @param {} data
 * @return {boolean}
 */
function onlyCssChanged(data) {
    for (var k in data.changed) {
        if (!/\.css$/.test(k)) {
            return false;
        }
    }

    for (var k in data.created) {
        if (!/\.css$/.test(k)) {
            return false;
        }
    }

    for (var k in data.removed) {
        if (!/\.css$/.test(k)) {
            return false;
        }
    }

    return true;
}

/**
 * reloadOnlyCss - Resets the href for all the CSS link nodes to force
 * their reloading.
 * @return {void}
 */
function reloadOnlyCss() {
    var cssNodes = document.querySelectorAll('link[rel="stylesheet"]');

    for (var i = 0; i < cssNodes.length; i++) {
        var cssNode = cssNodes[i];
        cssNode.href = refreshHref(cssNode.href); // resetting the href forces the reload.
        new AjaxCall(cssNode.href).execute(forceRedraw, forceRedraw);
    }
}

/**
 * refreshHref - Creates a new href that will have a _cache parameter in
 * case it is needed, or it will replace the old _cache parameter, to force
 * the reloading of the resource.
 * @param {string} href
 * @return {string}
 */
function refreshHref(href) {
    if (!/\?/.test(href)) { // the href has no params, just add it.
        return href + "?_cache=" + new Date().getTime();
    }

    // the href has parameters, does it have our _cache parameter?
    if (!/[?&]_cache=\d+$/.test(href)) {
        // no it doesn't so just add it
        return href + "&_cache=" + new Date().getTime();
    }

    // it contains our parameter, we need to replace the value.
    return href.replace(/([?&]_cache=)\d+$/, "$1" + new Date().getTime());
}

/**
 * forceRedraw - Force the redraw of the page somehow.
 * @return {void}
 */
function forceRedraw() {
    var oldDisplayValue = document.body.style.display || 'block';
    document.body.style.display = 'none';
    document.body.style.display = oldDisplayValue;
}

/**
 * reloadDocument - Reloads the current document. Takes into account
 * if there is a fragment part, to force a reload.
 * @return {void}
 */
function reloadDocument() {
    document.location.reload();
}
