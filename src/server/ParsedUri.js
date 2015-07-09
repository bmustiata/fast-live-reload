/**
 * ParsedUri - Parses the URI for serving the content.
 *
 * In case the URI given is a remote location, is used as is, and the
 * `proxyHost` and `requestPath` will be extracted from the given URI.
 * `folderUri` will point to the given `uri` for remote locations.
 *
 * In case the URI given is a local location, the parser will check if
 * the uri is actually a file. If it's a file, then folderUri will point
 * to the parent folder of that file, otherwise folderUri and uri will
 * be the same.
 *
 * @type {UriParser}
 */
var ParsedUri = createClass("ParsedUri", {
	uri : null,
    folderUri : null,

    isfileUri : false,

    proxyHost : null,
    requestPath : null,

    /**
     * constructor - default constructor
     * @param {} uri
	 */
    constructor: function(uri) {
        var m = /^(.*?\:\/\/[^/]+)(\/?.*)$/.exec( uri );

        this.uri = uri;
        this.folderUri = uri;

        if (!m) {
            this.isFileUri = true;

            if (fs.statSync(uri).isFile()) {
                this.folderUri = path.dirname(uri);
            }
        } else {
            this.proxyHost = m[ 1 ],
            this.requestPath = m[ 2 ];
        }
    }
});
