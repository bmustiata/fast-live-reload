/**
 * Create a server that serves the iframe page,
 * in a handlebars template, to provide the URL
 * to redirect to automatically.
 */
var IFrameServer = createClass({
    /**
     * Constructs a handlebars server that serves the given path.
     */
    constructor : function(port, servedPath, serveUrl) {
        this._port = port;
        this._servedPath = servedPath;
        this._serveUrl = serveUrl;

        var app = this._app = express();

        app.set('views', __dirname + '/../iframe');

        var hbs = expressHandlebars.create();

        app.engine('handlebars', hbs.engine);
        app.set('view engine', 'handlebars');

        app.use(express.static( __dirname + '/../iframe' ));
    },

    /**
     * Runs the actual server.
     */
    run : function() {
        console.log("Serving IFrame reloader for " + chalk.cyan( this._serveUrl ) +
                 " on port " + chalk.cyan(this._port));

        this._app.get('/', function(req, res, next) {
        	res.render('index', {
                TARGET_URL : this._serveUrl
            });
        }.bind(this));

        this._app.listen(this._port);
    }
});

