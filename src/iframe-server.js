/**
 * Create a server that serves the iframe page,
 * in a handlebars template, to provide the URL
 * to redirect to automatically, and proxies the
 * content of the original page.
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

        app.set('views', __dirname + '/../iframe/fast-live-reload/');

        var hbs = expressHandlebars.create();

        app.engine('handlebars', hbs.engine);
        app.set('view engine', 'handlebars');

        app.use(expressCookieParser());
        app.use(express.static( __dirname + '/../iframe' ));
    },

    /**
     * Runs the actual server.
     */
    run : function() {
        console.log("Serving IFrame reloader for " + chalk.cyan( this._serveUrl ) +
                 " on port " + chalk.cyan(this._port));

        // find only the host part for proxying
        var m = /^(.*?\:\/\/[^/]+)(\/?.*)$/.exec( this._serveUrl );

        if (!m) {
            throw new Error("Invalid URL: " + this._serveUrl);
        }

        var proxyHost = m[ 1 ],
            requestPath = m[ 2 ];

        console.log("Proxying host: " + chalk.cyan(proxyHost));

        /**
         * Load the proxy.
         */
        this._app.use('/', expressProxy(proxyHost, {
            filter : function(req, res) {
                // if fast live reload already loaded, there's no need to do anything.
                if (req.cookies.fastLiveReload && !/^\/fast-live-reload\//.test(req.path)) {
                    return true;
                }

                return false;
            },

            intercept : function(data, req, res, callback) {
                // allow in frame embedding.
                res.set('Access-Control-Allow-Origin', '*');
                res.set('X-Frame-Options', 'ALLOW-FROM *');

                callback(null, data);
            }
        }));

        /**
         * Redirect on the first reload.
         */
        this._app.use('/', function(req, res, next) {
            if (req.path == '/fast-live-reload/' || req.cookies.fastLiveReload) {
                if (!req.cookies.fastLiveReload) { // called directly /fast-live-reload/
                    res.cookie('fastLiveReload', 'true');
                }
                return next();
            }

            res.cookie('fastLiveReload', 'true');
            res.redirect('/fast-live-reload/');
        }.bind(this));

        /**
         * Serve the fast-live-reload page.
         */
        this._app.get('/fast-live-reload/', function(req, res, next) {
            res.render('index', {
                TARGET_URL : requestPath
            });
        }.bind(this));

        this._app.listen(this._port);
    }
});

