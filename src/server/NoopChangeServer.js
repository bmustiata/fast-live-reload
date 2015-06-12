/**
 * NoopChangeServer - A change server that doesn't do anything.
 * @type {NoopChangeServer}
 */
var NoopChangeServer = createClass("NoopChangeServer", {

    /**
     * constructor - A change server that doesn't notifies.
     */
    constructor: function() {
    },

    /**
     * filesChanged - Callback method where the server is notified the monitored files changed.
     * @param {Object} changes
     * @return {void}
     */
    filesChanged : function(changes) {
        // noop on purpose.
    },

    /**
     * run - To start the serving.
     * @return {void}
     */
    run : function() {
        // noop on purpose
    }
});
