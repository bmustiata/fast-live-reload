/**
 * The server keeps all the received connections,
 * in a pending state,  and notifies all the users when a
 * change happened, with the changed data.
 */
var ChangeServer = createClass({
    _express : null,

    _expressWs : null,

    _connectedClients : null,

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

        this._expressWs = expressWs(this._express);
        this._express.ws("/", this._wsClientConnection.bind(this));

        this._connectedClients = [];
    },

    /**
     * Whenever a new request arrived, keep it in the list of
     * things that we should respond to when resources change.
     */
    _storeRequest : function(req, res) {
        this._connectedClients.push({
            request: req,
            response: res
        });
    },

    _wsClientConnection : function(ws, req){
        // Nothing to do here!
        // ws.on('message', function(msg) {
        //     console.log(msg);
        // });
        // ws.on('close', function(ws){
        //     console.log('connection closed');
        //     console.log(ws);
        // });
        // console.log('new connection');
    },

    /**
     * Starts listening.
     */
    run : function() {
        //console.log("Changes are served on port: " + chalk.cyan(this._port));
        this._express.listen(this._port);
    },

    /**
     * Callback method where the server is notified that monitored
     * files have changed.
     */
    filesChanged : function(changes) {
        // AJAX clients
        for (var i = 0; i < this._connectedClients.length; i++) {
            var response = this._connectedClients[i].response,
                request = this._connectedClients[i].request;

            // if we know the origin, we allow it, otherwise default to any
            if (request.header.origin) {
                response.set('Access-Control-Allow-Origin', request.headers.origin);
            } else {
                response.set('Access-Control-Allow-Origin', '*');
            }

            response.send(JSON.stringify(changes));
        }

        this._connectedClients = [];

        // WebSocket clients
        this._expressWs.getWss().clients.forEach(function(client){
            client.send(JSON.stringify(changes));
        });
    }
});

