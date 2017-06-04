// modified from: https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
// removed the re-assembly of the JSON object making this parser into just a recognizer.

/*jslint for */

/*property
 at, b, call, charAt, f, fromCharCode, hasOwnProperty, message, n, name,
 prototype, push, r, t, text
 */

var parse = (function () {
    "use strict";

// This is a function that can parse a JSON text, producing a JavaScript
// data structure. It is a simple, recursive descent parser. It does not use
// eval or regular expressions, so it can be used as a model for implementing
// a JSON parser in other languages.

// We are defining the function inside of another function to avoid creating
// global variables.

    var at;     // The index of the current character
    var ch;     // The current character
    var escapee = {
        "\"": "\"",
        "\\": "\\",
        "/": "/",
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t"
    };
    var text;

    var error = function (m) {

// Call error when something is wrong.

        throw {
            name: "SyntaxError",
            message: m,
            at: at,
            text: text
        };
    };

    var next = function (c) {

// If a c parameter is provided, verify that it matches the current character.

        if (c && c !== ch) {
            error("Expected '" + c + "' instead of '" + ch + "'");
        }

// Get the next character. When there are no more characters,
// return the empty string.

        ch = text.charAt(at);
        at += 1;
        return ch;
    };

    var number = function () {

// Parse a number value.

        var numString = "";

        if (ch === "-") {
            numString = "-";
            next("-");
        }
        while (ch >= "0" && ch <= "9") {
            numString += ch;
            next();
        }
        if (ch === ".") {
            numString += ".";
            while (next() && ch >= "0" && ch <= "9") {
                numString += ch;
            }
        }
        if (ch === "e" || ch === "E") {
            numString += ch;
            next();
            if (ch === "-" || ch === "+") {
                numString += ch;
                next();
            }
            while (ch >= "0" && ch <= "9") {
                numString += ch;
                next();
            }
        }
        return numString;
    };

    var string = function () {

        // Parse a string value.

        var hex;
        var i;
        var value = "";
        var uffff;

        // When parsing for string values, we must look for " and \ characters.

        if (ch === "\"") {
            while (next()) {
                if (ch === "\"") {
                    next();
                    return value;
                }
                if (ch === "\\") {
                    next();
                    if (ch === "u") {
                        uffff = 0;
                        for (i = 0; i < 4; i += 1) {
                            hex = parseInt(next(), 16);
                            if (!isFinite(hex)) {
                                break;
                            }
                            uffff = uffff * 16 + hex;
                        }
                        value += String.fromCharCode(uffff);
                    } else if (typeof escapee[ch] === "string") {
                        value += escapee[ch];
                    } else {
                        break;
                    }
                } else {
                    value += ch;
                }
            }
        }
        error("Bad string");
    };

    var white = function () {

// Skip whitespace.

        while (ch && ch <= " ") {
            next();
        }
    };

    var word = function () {

// true, false, or null.

        switch (ch) {
            case "t":
                next("t");
                next("r");
                next("u");
                next("e");
                return true;
            case "f":
                next("f");
                next("a");
                next("l");
                next("s");
                next("e");
                return false;
            case "n":
                next("n");
                next("u");
                next("l");
                next("l");
                return null;
        }
        error("Unexpected '" + ch + "'");
    };

    var value;  // Place holder for the value function.

    var array = function () {
        var item;
// Parse an array value.

        if (ch === "[") {
            next("[");
            white();
            if (ch === "]") {
                next("]");
                return;   // empty array
            }
            while (ch) {
                item = value();
                white();
                if (ch === "]") {
                    next("]");
                    return;
                }
                next(",");
                white();
            }
        }
        error("Bad array");
    };

    var object = function () {

// Parse an object value.

        var key, val;

        if (ch === "{") {
            next("{");
            white();
            if (ch === "}") {
                next("}");
                return;   // empty object
            }
            while (ch) {
                key = string();
                white();
                next(":");
                val = value();
                white();
                if (ch === "}") {
                    next("}");
                    return;
                }
                next(",");
                white();
            }
        }
        error("Bad object");
    };

    value = function () {

// Parse a JSON value. It could be an object, an array, a string, a number,
// or a word.

        white();
        switch (ch) {
            case "{":
                return object();
            case "[":
                return array();
            case "\"":
                return string();
            case "-":
                return number();
            default:
                return (ch >= "0" && ch <= "9")
                    ? number()
                    : word();
        }
    };

// Return the json_parse function. It will have access to all of the above
// functions and variables.

    return function (source) {
        var result;

        text = source;
        at = 0;
        ch = " ";
        result = value();
        white();
        if (ch) {
            error("Syntax error");
        }

        return result;
    };
}());
