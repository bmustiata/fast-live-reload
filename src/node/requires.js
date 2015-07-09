var createClass = require("superb-class").createClass,
    express = require("express"),
    chalk = require("chalk"),
    expressHandlebars = require("express-handlebars"),
    expressProxy = require("express-http-proxy"),
    expressCookieParser = require("cookie-parser"),
    exec = require("shelljs").exec,
    handlebars = require("handlebars"),
    fs = require("fs"),
    path = require("path"),
    onceMany = require("once-many").onceMany,
    spawn = require("cross-spawn").spawn,
    tamper = require("tamper");

/**
 * createWatch - Creates a new watch object.
 * @return {object}
 */
function createWatch() {
    return require("watch");
}

