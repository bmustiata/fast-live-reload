/**
 * The server application keeps all the received connections,
 * in a pending state,  and notifies all the users when a
 * change happened, with the changed data.
 */
var Application = createClass({
    _express : null,

    _responses : null,

    constructor : function() {
        this._express = express();
        this._express.get("/", this._processCall.bind(this));

        this._responses = [];
    },

    _processCall : function(req, res) {
        this._responses.push(res);
    },

    /**
     * Starts listening.
     */
    run : function() {
        this._express.listen(3000);
    },

    filesChanged : function(changes) {
        for (var i = 0; i < this._responses.length; i++) {
            this._responses[i].send(JSON.stringify(changes));
        }

        this._responses = [];
    }
});

