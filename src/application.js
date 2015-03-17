/**
 * The server application keeps all the received connections,
 * in a pending state,  and notifies all the users when a
 * change happened, with the changed data.
 */
var Application = createClass({
    _express : null,

    _responses : null,

    /**
     * @type {number}
     */
    _port : null,

    /**
     * Constructs the server that will listen on the given port.
     * Defaults to 9001 if not present.
     * @param {number?} port The port to listen to.
     */
    constructor : function(port) {
        this._port = port;

        this._express = express();
        this._express.get("/", this._storeRequest.bind(this));

        this._responses = [];
    },

    /**
     * Whenever a new request arrived, keep it in the list of
     * things that we should respond to when resources change.
     */
    _storeRequest : function(req, res) {
        this._responses.push(res);
    },

    /**
     * Starts listening.
     */
    run : function() {
        console.log("Listening on port: " + chalk.cyan(this._port));
        this._express.listen(this._port);
    },

    /**
     * Callback method where the server is notified that monitored
     * files have changed.
     */
    filesChanged : function(changes) {
        for (var i = 0; i < this._responses.length; i++) {
            this._responses[i].send(JSON.stringify(changes));
        }

        this._responses = [];
    }
});

