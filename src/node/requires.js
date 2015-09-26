var createClass = require("superb-class").createClass,
    express = require("express"),
    chalk = require("chalk"),
    expressHandlebars = require("express-handlebars"),
    expressProxy = require("express-http-proxy"),
    expressCookieParser = require("cookie-parser"),
    handlebars = require("handlebars"),
    fs = require("fs"),
    path = require("path"),
    onceMany = require("once-many").onceMany,
    tamper = require("tamper"),
    glob = require("glob"),
    childProcess = require("child_process");

/**
 * createWatch - Creates a new watch object.
 * @return {object}
 */
function createWatch() {
    return require("watch");
}

