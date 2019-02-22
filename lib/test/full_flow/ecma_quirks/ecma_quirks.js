"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var tokens_public_1 = require("../../../src/scan/tokens_public");
var lexer_public_1 = require("../../../src/scan/lexer_public");
var parser_traits_1 = require("../../../src/parse/parser/traits/parser_traits");
var parser_1 = require("../../../src/parse/parser/parser");
var exceptions_public_1 = require("../../../src/parse/exceptions_public");
var utils_1 = require("../../../src/utils/utils");
var Return = tokens_public_1.createToken({
    name: "Return",
    pattern: /return/
});
var DivisionOperator = tokens_public_1.createToken({
    name: "DivisionOperator",
    pattern: /\//
});
var RegExpLiteral = tokens_public_1.createToken({
    name: "RegExpLiteral",
    pattern: /\/\d+\//
});
var NumberLiteral = tokens_public_1.createToken({
    name: "NumberLiteral",
    pattern: /\d+/
});
// todo differentiate line terminators and other whitespace?
var WhiteSpace = tokens_public_1.createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: lexer_public_1.Lexer.SKIPPED,
    line_breaks: true
});
var Semicolon = tokens_public_1.createToken({
    name: "Semicolon",
    pattern: /;/
});
var allTokens = [
    WhiteSpace,
    NumberLiteral,
    Return,
    DivisionOperator,
    RegExpLiteral,
    Semicolon
];
// Avoids errors in browser tests where the bundled specs will execute this
// file even if the tests will avoid running it.
if (typeof new RegExp("(?:)").sticky === "boolean") {
    utils_1.forEach(allTokens, function (currTokType) {
        currTokType.PATTERN = new RegExp(currTokType.PATTERN.source, "y");
    });
}
var ErrorToken = tokens_public_1.createToken({ name: "ErrorToken" });
var EcmaScriptQuirksParser = /** @class */ (function (_super) {
    __extends(EcmaScriptQuirksParser, _super);
    function EcmaScriptQuirksParser() {
        var _this = _super.call(this, allTokens, { outputCst: false }) || this;
        _this.statement = _this.RULE("statement", function () {
            _this.CONSUME(Return);
            _this.OPTION7(function () {
                _this.SUBRULE(_this.expression);
            });
            _this.CONSUME(Semicolon);
        });
        _this.expression = _this.RULE("expression", function () {
            _this.SUBRULE(_this.atomic);
            _this.MANY(function () {
                _this.CONSUME(DivisionOperator);
                _this.SUBRULE2(_this.atomic);
            });
        });
        _this.atomic = _this.RULE("atomic", function () {
            _this.OR6([
                { ALT: function () { return _this.CONSUME(RegExpLiteral); } },
                { ALT: function () { return _this.CONSUME(NumberLiteral); } }
            ]);
        });
        _this.performSelfAnalysis();
        return _this;
    }
    Object.defineProperty(EcmaScriptQuirksParser.prototype, "textInput", {
        get: function () {
            return this.orgText;
        },
        // lexer related methods
        set: function (newInput) {
            this.reset();
            this.orgText = newInput;
        },
        enumerable: true,
        configurable: true
    });
    // TODO: this should be protected at least but there seems some strange bug in the
    // definitions generation, try adding protected in newer releases of typescript.
    EcmaScriptQuirksParser.prototype.resetLexerState = function () {
        this.textIdx = 0;
    };
    EcmaScriptQuirksParser.prototype.IS_NEXT_TOKEN = function (expectedType) {
        if (this.orgText.length <= this.textIdx) {
            return parser_1.END_OF_FILE;
        }
        else {
            this.skipWhitespace();
            return this.consumeExpected(expectedType);
        }
    };
    EcmaScriptQuirksParser.prototype.skipWhitespace = function () {
        var wsPattern = WhiteSpace.PATTERN;
        wsPattern.lastIndex = this.textIdx;
        var wsMatch = wsPattern.exec(this.orgText);
        if (wsMatch !== null) {
            var wsLength = wsMatch[0].length;
            this.textIdx += wsLength;
        }
    };
    EcmaScriptQuirksParser.prototype.consumeExpected = function (expectedType) {
        // match expected
        var expectedPattern = expectedType.PATTERN;
        expectedPattern.lastIndex = this.textIdx;
        var match = expectedPattern.exec(this.orgText);
        if (match !== null) {
            var image = match[0];
            var startOffset = this.textIdx;
            var newToken = {
                tokenTypeIdx: expectedType.tokenTypeIdx,
                image: image,
                startOffset: startOffset
            };
            this.textIdx += image.length;
            return newToken;
        }
        return false;
    };
    EcmaScriptQuirksParser.prototype.consumeInternal = function (tokClass, idx) {
        this.skipWhitespace();
        var nextToken = this.consumeExpected(tokClass);
        if (nextToken !== false) {
            return nextToken;
        }
        else {
            var errorToken = {
                tokenTypeIdx: ErrorToken.tokenTypeIdx,
                image: this.orgText[this.textIdx],
                startOffset: this.textIdx
            };
            var previousToken = this.LA(0);
            var msg = this.errorMessageProvider.buildMismatchTokenMessage({
                expected: tokClass,
                actual: errorToken,
                previous: previousToken,
                ruleName: this.getCurrRuleFullName()
            });
            throw this.SAVE_ERROR(new exceptions_public_1.MismatchedTokenException(msg, errorToken, previousToken));
        }
    };
    EcmaScriptQuirksParser.prototype.exportLexerState = function () {
        return this.textIdx;
    };
    EcmaScriptQuirksParser.prototype.importLexerState = function (newState) {
        this.textIdx = newState;
    };
    EcmaScriptQuirksParser.prototype.lookAheadBuilderForOptional = function (alt, tokenMatcher, dynamicTokensEnabled) {
        if (!utils_1.every(alt, function (currAlt) { return currAlt.length === 1; })) {
            throw Error("This scannerLess parser only supports LL(1) lookahead.");
        }
        var allTokenTypes = utils_1.flatten(alt);
        return function () {
            // save & restore lexer state as otherwise the text index will move ahead
            // and the parser will fail consuming the tokens we have looked ahead for.
            var lexerState = this.exportLexerState();
            try {
                for (var i = 0; i < allTokenTypes.length; i++) {
                    var nextToken = this.IS_NEXT_TOKEN(allTokenTypes[i]);
                    if (nextToken !== false) {
                        return true;
                    }
                }
                return false;
            }
            finally {
                // this scannerLess parser is not very smart and efficient
                // because we do not remember the last token was saw while lookahead
                // we will have to lex it twice, once during lookahead and once during consumption...
                this.importLexerState(lexerState);
            }
        };
    };
    EcmaScriptQuirksParser.prototype.lookAheadBuilderForAlternatives = function (alts, hasPredicates, tokenMatcher, dynamicTokensEnabled) {
        if (!utils_1.every(alts, function (currPath) {
            return utils_1.every(currPath, function (currAlt) { return currAlt.length === 1; });
        })) {
            throw Error("This scannerLess parser only supports LL(1) lookahead.");
        }
        var allTokenTypesPerAlt = utils_1.map(alts, utils_1.flatten);
        return function () {
            // save & restore lexer state as otherwise the text index will move ahead
            // and the parser will fail consuming the tokens we have looked ahead for.
            var lexerState = this.exportLexerState();
            try {
                for (var i = 0; i < allTokenTypesPerAlt.length; i++) {
                    var currAltTypes = allTokenTypesPerAlt[i];
                    for (var j = 0; j < currAltTypes.length; j++) {
                        var nextToken = this.IS_NEXT_TOKEN(currAltTypes[j]);
                        if (nextToken !== false) {
                            return i;
                        }
                    }
                }
                return undefined;
            }
            finally {
                // this scannerLess parser is not very smart and efficient
                // because we do not remember the last token was saw while lookahead
                // we will have to lex it twice, once during lookahead and once during consumption...
                this.importLexerState(lexerState);
            }
        };
    };
    return EcmaScriptQuirksParser;
}(parser_traits_1.Parser));
// reuse the same parser instance.
var parser = new EcmaScriptQuirksParser();
function parse(text) {
    parser.textInput = text;
    var value = parser.statement();
    return {
        value: value,
        errors: parser.errors
    };
}
exports.parse = parse;
//# sourceMappingURL=ecma_quirks.js.map