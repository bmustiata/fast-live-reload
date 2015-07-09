/**
 * Create a server that serves the iframe page,
 * in a handlebars template, to provide the URL
 * to redirect to automatically, and proxies the
 * content of the original page. In case the URI
 * is a file, it just serves the file.
 */
var IFrameServer = createClass({
    _port : null,
    _parsedServeUri : null,
    _injectClientCode : true,

    /**
     * Constructs a handlebars server that serves the given path.
     * @param {number} port The port to start listening onto.
     * @param {ParsedUri} parsedUri A parsed URI to proxy or serve.
     * @param {boolean} shouldInjectClientCode A flag if to inject the client code
     *      in the HTML pages or not.
     */
    constructor : function(port, parsedUri, shouldInjectClientCode) {
        this._port = port;
        this._parsedServeUri = parsedUri;
        this._injectClientCode = shouldInjectClientCode;

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
        if (this._parsedServeUri.isFileUri) {
            this._serveFileUri();
        } else {
            this._serveProxyUri();
        }

        /**
         * Redirect on the first reload.
         */
        if (!this._injectClientCode) { // redirect only if no client code is injected.
            this._app.use('/', function (req, res, next) {

                if (req.path == '/fast-live-reload/' || req.cookies.fastLiveReload) {
                    if (!req.cookies.fastLiveReload) { // called directly /fast-live-reload/
                        res.cookie('fastLiveReload', 'true');
                    }
                    return next();
                }

                res.cookie('fastLiveReload', 'true');
                res.redirect('/fast-live-reload/');
            }.bind(this));
        }

        /**
         * Serve the fast-live-reload page.
         */
        this._app.get('/fast-live-reload/', function(req, res, next) {
        	res.render('index', {
                TARGET_URL : this._parsedServeUri.requestPath
            });
        }.bind(this));

        this._app.listen(this._port);
    },

    /**
     * _serveProxyUri - Serves the content using a PROXY.
     * @return {void}
     */
    _serveProxyUri : function() {
        /**
         * Load the proxy.
         */
        var _this = this;
        this._app.use('/', expressProxy(this._parsedServeUri.proxyHost, {
            filter : function(req, res) {
                // if this is a fast-live-reload request for the iframe integration,
                //then we don't need to do anyhting.
                if (/^\/fast-live-reload\//.test(req.path)) {
                    return false;
                }

                return true;
            },

            intercept : function(rsp, data, req, res, callback) {
                // allow in frame embedding.
                res.set('Access-Control-Allow-Origin', '*');
                res.set('X-Frame-Options', '');

                if (this._injectClientCode) {
                    var bufferData = data.toString();
                    if (/<\/body>\s*<\/html>\s*$/i.test(bufferData)) {
                        data = bufferData.replace(/(<\/body>\s*<\/html>\s*)$/i, "<script src='/fast-live-reload/js/client-reload.js'></script>$1");
                    }
                }

                callback(null, data);
            }.bind(this)
        }));
    },

    /**
     * _serveFileUri - Serves local files content.
     * @return {void}
     */
    _serveFileUri : function() {
        if (this._injectClientCode) {
            this._app.use(tamper(function (req, res) {
                var mime = res.getHeader('Content-Type')

                if (!/text\/html/.test(mime)) {
                    return false;
                }

                // Return a function in order to capture and modify the response body:
                return function (body) {
                    return body.replace(/(<\/body>\s*<\/html>\s*)$/i,
                        "<script src='/fast-live-reload/js/client-reload.js'></script>$1");
                }
            }));
        }
        this._app.use(express.static( this._parsedServeUri.folderUri ));
    },
});

