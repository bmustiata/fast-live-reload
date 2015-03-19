/**
 * Create a static resource server.
 */
var StaticServer = createClass({
    /**
     * StaticServer - A static server that simply serves resources.
     * @param {number} port
     * @param {string} servedPath
     * @return {void}
     */
    constructor : function(port, servedPath) {
        this._port = port;
        this._servedPath = servedPath;

        this._express = express();
        this._express.use(express.static( servedPath ));
    },

    /**
     * Starts listening.
     */
    run : function() {
        console.log("Serving " + chalk.cyan( this._servedPath ) +
                 " on port " + chalk.cyan(this._port));
        this._express.listen(this._port);
    }
});

