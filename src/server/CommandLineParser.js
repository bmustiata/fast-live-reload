/**
 * CommandLineParser - Parses the command line, extracting the actual command to execute, and the parameters given to it into an array.
 * @type {CommandLineParser}
 */
var CommandLineParser = createClass("CommandLineParser", {
	_command : "",
    _args : null,

    /**
     * constructor - Parses the command line
     * @param {string} commandLine
	 */
    constructor: function(commandLine) {
        var state = "NORMAL"; // can be: NORMAL, SINGLE_QUOTE, DOUBLE_QUOTE, ESCAPE_CHAR
        var previousState;
        var args = [], command = "";

        var currentToken = "";

        for (var i = 0; i < commandLine.length; i++) {
            var currentChar = commandLine[i];

            if (state == "NORMAL") {
                if (currentChar == " ") {
                    // only if we found some token, we process it,
                    // otherwise it's just bogus spaces.
                    if (currentToken.length) {
                       if (command.length) {
                            args.push(currentToken);
                        } else {
                            command = currentToken;
                        }

                        currentToken = "";
                    }

                    continue;
                }

                if (currentChar == '"') {
                    state = "DOUBLE_QUOTE";
                    continue;
                }

                if (currentChar == "'") {
                    state = "SINGLE_QUOTE";
                    continue;
                }

                if (currentChar == "\\") {
                    previousState = state;
                    state = "ESCAPE_CHAR";
                    continue;
                }

                currentToken += currentChar;
                continue;
            }

            if (state == "ESCAPE_CHAR") {
                currentToken += currentChar;
                state = previousState;
                continue;
            }

            if (state == "SINGLE_QUOTE") {
                if (currentChar == "'") {
                    state = "NORMAL";
                    continue;
                }

                currentToken += currentChar;
                continue;
            }

            if (state == "DOUBLE_QUOTE") {
                if (currentChar == '"') {
                    state = "NORMAL";
                    continue;
                }

                currentToken += currentChar;
                continue;
            }
        } // end for each char

        if (currentToken.length) {
           if (command.length) {
                args.push(currentToken);
            } else {
                command = currentToken;
            }
        }

        if (state != "NORMAL") {
            throw new Error("Unterminated command: " + commandLine);
        }

        if (!command) {
            throw new Error("Empty command: " + commandLine);
        }

        this._command = command;
        this._args = args;
    },

    /**
     * getCommand - Getter for the command
     * @return {string}
     */
    getCommand : function() {
        return this._command;
    },

    /**
     * getArgs - Gets the array of arguments of the command.
     * @return {Array<string>}
     */
    getArgs : function() {
        return this._args;
    }
});
