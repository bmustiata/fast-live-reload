/**
 * Shows the help for the application, and exits the application.
 * @return {void}
 */
function showHelp() {
    var helpText;

    helpText = fs.readFileSync(__dirname + "/readme.hbs", {
        encoding: 'utf-8'
    });

    var context;

    if (chalk.supportsColor) {
        context = {
            GRAY: chalk.styles.gray.open,
            RESET: chalk.styles.reset.open,
            BLUE: chalk.styles.cyan.open,
            GREEN: chalk.styles.green.open,
            BOLD: chalk.styles.bold.open
        };
    } else {
        context = {};
    }

    context.BINARY = "fast-live-reload";

    console.log(handlebars.compile(helpText)(context));

    process.exit();
}
