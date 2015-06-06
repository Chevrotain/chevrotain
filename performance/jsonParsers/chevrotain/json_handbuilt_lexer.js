var chevrotain;
(function (chevrotain) {
    var examples;
    (function (examples) {
        var json;
        (function (json) {
            var lexer;
            (function (lexer) {
                function reset() {
                    index = 0;
                    result = {
                        errors: [],
                        tokens: []
                    };
                    currLine = 1;
                    currColumn = 1;
                }

                var source;
                var index;
                var result;
                var currLine;
                var currColumn;
                var length;

                function lex(text) {
                    reset();
                    source = text;
                    length = text.length;
                    var inputSize = source.length;
                    while (index < inputSize) {
                        try {
                            scanNext();
                        }
                        catch (e) {
                            throw e;
                        }
                    }
                    return result;
                }

                lexer.lex = lex;
                var startLine;
                var startColumn;
                var startOffset;

                function scanNext() {
                    startLine = currLine;
                    startColumn = currColumn;
                    startOffset = index;
                    var tokens = result.tokens;
                    var ch = NEXT_CHAR();
                    // handling of line terminators
                    if (ch === "\r") {
                        var ch2 = PEEK_CHAR();
                        if (ch2 === "\n") {
                            NEXT_CHAR();
                        }
                        currLine++;
                        currColumn = 1;
                        return;
                    }
                    if (ch === "\n") {
                        currLine++;
                        currColumn = 1;
                        return;
                    }
                    if (isWhiteSpace(ch)) {
                        return; // ignore whitespace
                    }
                    switch (ch) {
                        case "\"":
                            tokens.push(scanStringLiteral());
                            break;
                        case ",":
                            tokens.push(new Comma(startLine, startColumn, ","));
                            break;
                        case "{":
                            tokens.push(new LCurly(startLine, startColumn, "{"));
                            break;
                        case "}":
                            tokens.push(new RCurly(startLine, startColumn, "}"));
                            break;
                        case "[":
                            tokens.push(new LSquare(startLine, startColumn, "["));
                            break;
                        case "]":
                            tokens.push(new RSquare(startLine, startColumn, "]"));
                            break;
                        case ":":
                            tokens.push(new Colon(startLine, startColumn, ":"));
                            break;
                        case "n":
                            if (source.substring(startOffset, index + 3) === "null") {
                                NEXT_CHAR();
                                NEXT_CHAR();
                                NEXT_CHAR();
                                tokens.push(new Null(startLine, startColumn, "null"));
                            }
                            else {
                                throw new Error("invalid character 'n'");
                            }
                            break;
                        case "t":
                            if (source.substring(startOffset, index + 3) === "true") {
                                NEXT_CHAR();
                                NEXT_CHAR();
                                NEXT_CHAR();
                                tokens.push(new True(startLine, startColumn, "true"));
                            }
                            else {
                                throw new Error("invalid character 't'");
                            }
                            break;
                        case "f":
                            if (source.substring(startOffset, index + 4) === "false") {
                                NEXT_CHAR();
                                NEXT_CHAR();
                                NEXT_CHAR();
                                NEXT_CHAR();
                                tokens.push(new False(startLine, startColumn, "false"));
                            }
                            else {
                                throw new Error("invalid character 'f'");
                            }
                            break;
                        case "-":
                            ch2 = PEEK_CHAR();
                            if (ch2 === '0') {
                                NEXT_CHAR();
                                if (ch2 === '.') {
                                    NEXT_CHAR();
                                    advanceDecimalPart();
                                    tokens.push(new NumberLiteral(startLine, startColumn, source.substring(startOffset, index)));
                                }
                                tokens.push(new NumberLiteral(startLine, startColumn, "-0"));
                            }
                            else if (isIntegerStart(ch2)) {
                                advanceIntegerPart();
                                tokens.push(new NumberLiteral(startLine, startColumn, source.substring(startOffset, index)));
                            }
                            break;
                        case "0":
                            ch2 = PEEK_CHAR();
                            if (ch2 === '.') {
                                NEXT_CHAR();
                                advanceDecimalPart();
                                tokens.push(new NumberLiteral(startLine, startColumn, source.substring(startOffset, index)));
                            }
                            else {
                                tokens.push(new NumberLiteral(startLine, startColumn, "0"));
                            }
                            break;
                        case "1":
                        case "2":
                        case "3":
                        case "4":
                        case "5":
                        case "6":
                        case "7":
                        case "8":
                        case "9":
                            advanceIntegerPart();
                            tokens.push(new NumberLiteral(startLine, startColumn, source.substring(startOffset, index)));
                            break;
                        default:
                            throw new Error("sad sad panda, nothing matched");
                    }
                }

                /**
                 * @return {string}
                 */
                function PEEK_CHAR() {
                    return source.charAt(index);
                }

                /**
                 * @return {string}
                 */
                function NEXT_CHAR() {
                    currColumn++;
                    return source.charAt(index++);
                }

                function isDigit(ch) {
                    return "0123456789".indexOf(ch) !== -1;
                }

                function isIntegerStart(ch) {
                    return "123456789".indexOf(ch) !== -1;
                }

                function isWhiteSpace(ch) {
                    return " \t".indexOf(ch) !== -1;
                }

                function scanStringLiteral() {
                    var ch2 = PEEK_CHAR();
                    while (ch2 !== "\"") {
                        if (ch2 === "\\") {
                            NEXT_CHAR();
                            ch2 = PEEK_CHAR();
                            switch (ch2) {
                                case "\"":
                                case "\\":
                                case "/":
                                case "b":
                                case "f":
                                case "n":
                                case "r":
                                case "t":
                                    NEXT_CHAR();
                                    ch2 = PEEK_CHAR();
                                    break;
                                default:
                                    throw new Error("invalid escape sequence \\" + ch2);
                            }
                        }
                        else if (ch2 === "\n" || ch2 === "\r") {
                            throw new Error("unterminated string literal");
                        }
                        else {
                            NEXT_CHAR();
                            ch2 = PEEK_CHAR();
                        }
                    }
                    NEXT_CHAR(); // closing quotes
                    return new StringLiteral(startLine, startColumn, source.substring(startOffset, index));
                }

                function advanceIntegerPart() {
                    var ch2 = PEEK_CHAR();
                    while (isDigit(ch2)) {
                        NEXT_CHAR();
                        ch2 = PEEK_CHAR();
                    }
                    if (ch2 === ".") {
                        NEXT_CHAR();
                        advanceDecimalPart();
                    }
                }

                function advanceDecimalPart() {
                    var ch2 = PEEK_CHAR();
                    if (!isDigit(ch2)) {
                        throw new Error("invalid decimal part, must have at least one digit after the dot");
                    }
                    while (isDigit(ch2)) {
                        NEXT_CHAR();
                        ch2 = PEEK_CHAR();
                    }
                    if (ch2 === "e" || ch2 === "E") {
                        NEXT_CHAR();
                        advanceExponentialPart();
                    }
                }

                function advanceExponentialPart() {
                    var ch2 = PEEK_CHAR();
                    if (ch2 === "+" || ch2 === "-") {
                        NEXT_CHAR();
                        ch2 = PEEK_CHAR();
                    }
                    if (!isDigit(ch2)) {
                        throw new Error("invalid exponential part, must have at least one digit after the 'E' or 'e'");
                    }
                    while (isDigit(ch2)) {
                        NEXT_CHAR();
                        ch2 = PEEK_CHAR();
                    }
                }
            })(lexer = json.lexer || (json.lexer = {}));
        })(json = examples.json || (examples.json = {}));
    })(examples = chevrotain.examples || (chevrotain.examples = {}));
})(chevrotain || (chevrotain = {}));
//# sourceMappingURL=json_handbuilt_lexer.js.map