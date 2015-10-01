
new UpdateNotifier(null, function(data) {
    data = JSON.parse(data);

    if (onlyCssChanged(data)) {
        reloadOnlyCss();

        return;
    }

    reloadDocument();

}).requestUpdatesFromServer();


/**
 * onlyCssChanged - Checks if only CSS files changed in the data response
 * from the server.
 * @param {any} data
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
 * Reloads the CSS for all the iframes, including the iframes that are
 * created programatically, and assumes accessing the document of the
 * iframe might fail.
 */
function reloadOnlyCss() {
    for (var i = 0; i < window.frames.length; i++) {
        var frame = window.frames[0];
        
        try {
            reloadOnlyCssForDocument(frame.document);
        } catch(e) {
            // ignore on purpose, if reloading failed, it might be because we
            // are not CORS compliant.
        }
    }
    
    reloadOnlyCssForDocument(document);
}

/**
 * reloadOnlyCssForDocument - Resets the href for all the CSS link 
 * nodes to force their reloading.
 * @param {Document} doc The document to reload only the CSS.
 * @return {void}
 */
function reloadOnlyCssForDocument(doc) {
    var cssNodes = doc.querySelectorAll('link[rel="stylesheet"]');

    for (var i = 0; i < cssNodes.length; i++) {
        var cssNode = cssNodes[i];
        cssNode.href = refreshHref(cssNode.href); // resetting the href forces the reload.

        // FIXME: this is a hack for a bug chrome that doesn't redraws, unless at least
        // a mouse over occurs even if colors actually changed, on some platforms.
        new AjaxCall(cssNode.href).execute(function() {
        	forceRedraw(doc);
        }, function() {
            forceRedraw(doc);
        });
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
 * This is implemented currently by alternating the display style of the
 * body element;
 * @param {Document} doc The document to reload.
 * @return {void}
 */
function forceRedraw(doc) {
    var oldDisplayValue = doc.body.style.display || 'block';
    doc.body.style.display = 'none';
    doc.body.style.display = oldDisplayValue;
}

/**
 * reloadDocument - Reloads the current document. Takes into account
 * if there is a fragment part, to force a reload.
 * @return {void}
 */
function reloadDocument() {
    document.location.reload();
}
