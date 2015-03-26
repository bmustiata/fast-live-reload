var createClass = require("superb-class").createClass,
    express = require("express"),
    nomnom = require("nomnom"),
    chalk = require("chalk"),
    expressHandlebars = require("express-handlebars"),
    expressProxy = require("express-http-proxy"),
    expressCookieParser = require("cookie-parser");

/**
 * createWatch - Creates a new watch object.
 * @return {object}
 */
function createWatch() {
    return require("watch");
}

