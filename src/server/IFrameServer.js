/**
 * Create a server that serves the iframe page,
 * in a handlebars template, to provide the URL
 * to redirect to automatically, and proxies the
 * content of the original page. In case the URI
 * is a file, it just serves the file.
 */
var IFrameServer = createClass({
    /**
     * Constructs a handlebars server that serves the given path.
     */
    constructor : function(port, serveUri) {
        this._port = port;
        this._serveUrl = serveUri;

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
        //console.log("Proxy: " + chalk.cyan("http://localhost:" + this._port + "/") + "\n" +
        //            "for: " + chalk.cyan( this._serveUrl ) );

        // find only the host part for proxying
        var m = /^(.*?\:\/\/[^/]+)(\/?.*)$/.exec( this._serveUrl );

        if (!m) {
            this._serveFileUri();
        } else {
            var proxyHost = m[ 1 ],
                requestPath = m[ 2 ];

            this._serveProxyUri(proxyHost, requestPath);
        }

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
    },

    /**
     * _serveProxyUri - Serves the content using a PROXY.
     * @param {string} proxyHost
     * @param {string} requestPath
     * @return {void}
     */
    _serveProxyUri : function(proxyHost, requestPath) {
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
                res.set('X-Frame-Options', '');

                callback(null, data);
            }
        }));
    },

    /**
     * _serveFileUri - Serves local files content.
     * @return {void}
     */
    _serveFileUri : function() {
        this._app.use(express.static( this._serveUrl ));
    }
});

