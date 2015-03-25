/**
 * IFrameSite - A website that is inside an iframe.
 * @return {void}
 */
function IFrameSite(parentNode, initialSite) {
    var width,
        height,
        self = this;

    this._parentNode = parentNode;
    this._location = initialSite;

    /**
     * create the DOM element.
     */
    this._element = $('<iframe>');
    this._element.attr('src', initialSite);

    parentNode.append(this._element);

    /**
     * Bind its UI.
     */
    this._resizeIFrame();
    $(window).resize(function() {
        self._resizeIFrame.call(self);
    });
}

/**
 * _resizeIFrame - Resizes the iframe, on window change.
 * @return {void}
 */
IFrameSite.prototype._resizeIFrame = function() {
    width = this._parentNode.width();
    height = this._parentNode.height();

    this._element.css({
        width: width,
        height: height
    });
};

/**
 * navigate - Navigate to the given location.
 * @param {} location
 * @return {void}
 */
IFrameSite.prototype.navigate = function(location) {
    this._location = location;
    this._element.attr('src', location);
};

/**
 * reload - Reloads the iframe.
 * @return {void}
 */
IFrameSite.prototype.reload = function() {
    this._element.attr('src', this._location);
};

/**
 * element - Returns the IFrameElement
 * @return {Array<Element>} Returns the jQuery element.
 */
IFrameSite.prototype.element = function() {
    return this._element;
};

