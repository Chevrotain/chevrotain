"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../../src/utils/utils");
var tokens_public_1 = require("../../src/scan/tokens_public");
var lexer_public_1 = require("../../src/scan/lexer_public");
var lexer_1 = require("../../src/scan/lexer");
var matchers_1 = require("../utils/matchers");
var tokens_1 = require("../../src/scan/tokens");
var ORG_SUPPORT_STICKY = lexer_1.SUPPORT_STICKY;
function defineLexerSpecs(contextName, createToken, tokenMatcher, skipValidationChecks, lexerConfig) {
    if (skipValidationChecks === void 0) { skipValidationChecks = false; }
    var testFull = lexerConfig.positionTracking === "full";
    var testStart = lexerConfig.positionTracking === "onlyStart" || testFull;
    function lexerSpecs() {
        var IntegerTok = createToken({
            name: "IntegerTok",
            pattern: /[1-9]\d*/
        });
        var IdentifierTok = createToken({
            name: "IdentifierTok",
            pattern: /[A-Za-z_]\w*/
        });
        var BambaTok = createToken({ name: "BambaTok", pattern: /bamba/ });
        BambaTok.LONGER_ALT = IdentifierTok;
        var testLexer = new lexer_public_1.Lexer([BambaTok, IntegerTok, IdentifierTok], {
            positionTracking: "onlyOffset"
        });
        describe("The Chevrotain Lexers", function () {
            it("can create a token from a string with priority to the First Token Type with the longest match #1", function () {
                // this can match either IdentifierTok or BambaTok but should match BambaTok has its pattern is defined before IdentifierTok
                var input = "bamba";
                var result = testLexer.tokenize(input);
                expect(tokenMatcher(result.tokens[0], BambaTok)).to.be.true;
                expect(result.tokens[0].image).to.equal("bamba");
                expect(result.tokens[0].startOffset).to.equal(0);
            });
            it("can create a token from a string with priority to the First Token Type with the longest match #2", function () {
                var input = "bambaMIA";
                var result = testLexer.tokenize(input);
                expect(tokenMatcher(result.tokens[0], IdentifierTok)).to.be.true;
                expect(result.tokens[0].image).to.equal("bambaMIA");
                expect(result.tokens[0].startOffset).to.equal(0);
            });
            it("can create a token from a string with priority to the First Token Type with the longest match - negative", function () {
                var IntegerTok = createToken({
                    name: "IntegerTok",
                    pattern: /[1-9]\d*/
                });
                var IdentTok = createToken({
                    name: "IdentifierTok",
                    pattern: /[A-Za-z]+/
                });
                // a bit contrived to test all code branches, the BambaTok is not actually prefix of Identifier tok due to the "_"
                var BambaTok = createToken({
                    name: "BambaTok",
                    pattern: /_bamba/
                });
                BambaTok.LONGER_ALT = IdentTok;
                var myLexer = new lexer_public_1.Lexer([BambaTok, IntegerTok, IdentTok], {
                    positionTracking: "onlyOffset"
                });
                var input = "_bamba123";
                var result = myLexer.tokenize(input);
                expect(tokenMatcher(result.tokens[0], BambaTok)).to.be.true;
                expect(result.tokens[0].image).to.equal("_bamba");
                expect(tokenMatcher(result.tokens[1], IntegerTok)).to.be.true;
                expect(result.tokens[1].image).to.equal("123");
            });
            it("can create a token from a string", function () {
                var input = "6666543221231";
                var result = testLexer.tokenize(input);
                expect(tokenMatcher(result.tokens[0], IntegerTok)).to.be.true;
                expect(result.tokens[0].image).to.equal("6666543221231");
                expect(result.tokens[0].startOffset).to.equal(0);
            });
        });
        var ValidNaPattern = createToken({
            name: "ValidNaPattern",
            pattern: lexer_public_1.Lexer.NA
        });
        var ValidNaPattern2 = createToken({
            name: "ValidNaPattern2",
            pattern: lexer_public_1.Lexer.NA
        });
        // TODO: not sure this API allows invalid stuff
        var InvalidPattern = createToken({
            name: "InvalidPattern",
            pattern: 666
        });
        var MissingPattern = createToken({
            name: "MissingPattern",
            pattern: undefined
        });
        var MultiLinePattern = createToken({
            name: "MultiLinePattern",
            pattern: /bamba/m
        });
        var GlobalPattern = createToken({
            name: "GlobalPattern",
            pattern: /bamba/g
        });
        var CaseInsensitivePattern = createToken({
            name: "CaseInsensitivePattern",
            pattern: /bamba/i
        });
        var IntegerValid = createToken({
            name: "IntegerValid",
            pattern: /0\d*/
        });
        // oops we did copy paste and forgot to change the pattern (same as Integer)
        var DecimalInvalid = createToken({
            name: "DecimalInvalid",
            pattern: /0\d*/
        });
        var Skipped = createToken({ name: "Skipped" });
        Skipped.GROUP = lexer_public_1.Lexer.SKIPPED;
        var Special = createToken({ name: "Special" });
        Special.GROUP = "Strange";
        var InvalidGroupNumber = createToken({
            name: "InvalidGroupNumber",
            pattern: /\d\d\d/
        });
        InvalidGroupNumber.GROUP = 666;
        if (!skipValidationChecks) {
            describe("The Simple Lexer Validations", function () {
                it("won't detect valid patterns as missing", function () {
                    var result = lexer_1.findMissingPatterns([
                        BambaTok,
                        IntegerTok,
                        IdentifierTok
                    ]);
                    expect(result.errors).to.be.empty;
                    expect(result.valid).to.deep.equal([
                        BambaTok,
                        IntegerTok,
                        IdentifierTok
                    ]);
                });
                it("will detect missing patterns", function () {
                    var tokenClasses = [ValidNaPattern, MissingPattern];
                    var result = lexer_1.findMissingPatterns(tokenClasses);
                    expect(result.errors.length).to.equal(1);
                    expect(result.errors[0].tokenTypes).to.deep.equal([
                        MissingPattern
                    ]);
                    expect(result.errors[0].type).to.equal(lexer_public_1.LexerDefinitionErrorType.MISSING_PATTERN);
                    expect(result.errors[0].message).to.contain("MissingPattern");
                    expect(result.valid).to.deep.equal([ValidNaPattern]);
                });
                it("won't detect valid patterns as invalid", function () {
                    var result = lexer_1.findInvalidPatterns([
                        BambaTok,
                        IntegerTok,
                        IdentifierTok,
                        ValidNaPattern
                    ]);
                    expect(result.errors).to.be.empty;
                    expect(result.valid).to.deep.equal([
                        BambaTok,
                        IntegerTok,
                        IdentifierTok,
                        ValidNaPattern
                    ]);
                });
                it("will detect invalid patterns as invalid", function () {
                    var tokenClasses = [ValidNaPattern, InvalidPattern];
                    var result = lexer_1.findInvalidPatterns(tokenClasses);
                    expect(result.errors.length).to.equal(1);
                    expect(result.errors[0].tokenTypes).to.deep.equal([
                        InvalidPattern
                    ]);
                    expect(result.errors[0].type).to.equal(lexer_public_1.LexerDefinitionErrorType.INVALID_PATTERN);
                    expect(result.errors[0].message).to.contain("InvalidPattern");
                    expect(result.valid).to.deep.equal([ValidNaPattern]);
                });
                it("won't detect valid patterns as using unsupported flags", function () {
                    var errors = lexer_1.findUnsupportedFlags([
                        BambaTok,
                        IntegerTok,
                        IdentifierTok,
                        CaseInsensitivePattern
                    ]);
                    expect(errors).to.be.empty;
                });
                it("will detect patterns using unsupported multiline flag", function () {
                    var tokenClasses = [ValidNaPattern, MultiLinePattern];
                    var errors = lexer_1.findUnsupportedFlags(tokenClasses);
                    expect(errors.length).to.equal(1);
                    expect(errors[0].tokenTypes).to.deep.equal([
                        MultiLinePattern
                    ]);
                    expect(errors[0].type).to.equal(lexer_public_1.LexerDefinitionErrorType.UNSUPPORTED_FLAGS_FOUND);
                    expect(errors[0].message).to.contain("MultiLinePattern");
                });
                it("will detect patterns using unsupported global flag", function () {
                    var tokenClasses = [ValidNaPattern, GlobalPattern];
                    var errors = lexer_1.findUnsupportedFlags(tokenClasses);
                    expect(errors.length).to.equal(1);
                    expect(errors[0].tokenTypes).to.deep.equal([GlobalPattern]);
                    expect(errors[0].type).to.equal(lexer_public_1.LexerDefinitionErrorType.UNSUPPORTED_FLAGS_FOUND);
                    expect(errors[0].message).to.contain("GlobalPattern");
                });
                it("won't detect valid patterns as duplicates", function () {
                    var errors = lexer_1.findDuplicatePatterns([
                        MultiLinePattern,
                        IntegerValid
                    ]);
                    expect(errors).to.be.empty;
                });
                it("won't detect NA patterns as duplicates", function () {
                    var errors = lexer_1.findDuplicatePatterns([
                        ValidNaPattern,
                        ValidNaPattern2
                    ]);
                    expect(errors).to.be.empty;
                });
                it("will detect patterns using unsupported end of input anchor", function () {
                    var InvalidToken = createToken({
                        name: "InvalidToken",
                        pattern: /BAMBA$/
                    });
                    var tokenClasses = [ValidNaPattern, InvalidToken];
                    var errors = lexer_1.findEndOfInputAnchor(tokenClasses);
                    expect(errors.length).to.equal(1);
                    expect(errors[0].tokenTypes).to.deep.equal([InvalidToken]);
                    expect(errors[0].type).to.equal(lexer_public_1.LexerDefinitionErrorType.EOI_ANCHOR_FOUND);
                    expect(errors[0].message).to.contain("InvalidToken");
                });
                it("won't detect valid patterns as using unsupported end of input anchor", function () {
                    var errors = lexer_1.findEndOfInputAnchor([
                        IntegerTok,
                        IntegerValid
                    ]);
                    expect(errors).to.be.empty;
                });
                it("will detect patterns using unsupported start of input anchor", function () {
                    var InvalidToken = createToken({
                        name: "InvalidToken",
                        pattern: /^BAMBA/
                    });
                    var tokenClasses = [ValidNaPattern, InvalidToken];
                    var errors = lexer_1.findStartOfInputAnchor(tokenClasses);
                    expect(errors.length).to.equal(1);
                    expect(errors[0].tokenTypes).to.deep.equal([InvalidToken]);
                    expect(errors[0].type).to.equal(lexer_public_1.LexerDefinitionErrorType.SOI_ANCHOR_FOUND);
                    expect(errors[0].message).to.contain("InvalidToken");
                });
                it("will detect unreachable patterns", function () {
                    var ClassKeyword = createToken({
                        name: "ClassKeyword",
                        pattern: /class/
                    });
                    var Identifier = createToken({
                        name: "Identifier",
                        pattern: /\w+/
                    });
                    var tokenClasses = [Identifier, ClassKeyword];
                    var errors = lexer_1.findUnreachablePatterns(tokenClasses);
                    expect(errors.length).to.equal(1);
                    expect(errors[0].tokenTypes).to.deep.equal([
                        Identifier,
                        ClassKeyword
                    ]);
                    expect(errors[0].type).to.equal(lexer_public_1.LexerDefinitionErrorType.UNREACHABLE_PATTERN);
                    expect(errors[0].message).to.contain("can never be matched");
                });
                it("won't detect negation as using unsupported start of input anchor", function () {
                    var negationPattern = createToken({
                        name: "negationPattern",
                        pattern: /[^\\]/
                    });
                    var errors = lexer_1.findStartOfInputAnchor([negationPattern]);
                    expect(errors).to.be.empty;
                });
                it("won't detect valid patterns as using unsupported start of input anchor", function () {
                    var errors = lexer_1.findStartOfInputAnchor([
                        IntegerTok,
                        IntegerValid
                    ]);
                    expect(errors).to.be.empty;
                });
                it("will detect identical patterns for different Token Types", function () {
                    var tokenClasses = [DecimalInvalid, IntegerValid];
                    var errors = lexer_1.findDuplicatePatterns(tokenClasses);
                    expect(errors.length).to.equal(1);
                    expect(errors[0].tokenTypes).to.deep.equal([
                        DecimalInvalid,
                        IntegerValid
                    ]);
                    expect(errors[0].type).to.equal(lexer_public_1.LexerDefinitionErrorType.DUPLICATE_PATTERNS_FOUND);
                    expect(errors[0].message).to.contain("IntegerValid");
                    expect(errors[0].message).to.contain("DecimalInvalid");
                });
                it("will detect patterns that can match an empty string", function () {
                    // should use \d+ as * allows zero repetitions
                    var emptyMatch = createToken({
                        name: "emptyMatch",
                        pattern: /\d*/
                    });
                    var tokenClasses = [emptyMatch];
                    var errors = lexer_1.findEmptyMatchRegExps(tokenClasses);
                    expect(errors.length).to.equal(1);
                    expect(errors[0].tokenTypes).to.deep.equal([emptyMatch]);
                    expect(errors[0].type).to.equal(lexer_public_1.LexerDefinitionErrorType.EMPTY_MATCH_PATTERN);
                    expect(errors[0].message).to.contain("emptyMatch");
                    expect(errors[0].message).to.contain("must not match an empty string");
                });
                it("won't detect valid groups as unsupported", function () {
                    var errors = lexer_1.findInvalidGroupType([
                        IntegerTok,
                        Skipped,
                        Special
                    ]);
                    //noinspection BadExpressionStatementJS
                    expect(errors).to.be.empty;
                });
                it("will detect unsupported group types", function () {
                    var tokenClasses = [InvalidGroupNumber];
                    var errors = lexer_1.findInvalidGroupType(tokenClasses);
                    expect(errors.length).to.equal(1);
                    expect(errors[0].tokenTypes).to.deep.equal([
                        InvalidGroupNumber
                    ]);
                    expect(errors[0].type).to.equal(lexer_public_1.LexerDefinitionErrorType.INVALID_GROUP_TYPE_FOUND);
                    expect(errors[0].message).to.contain("InvalidGroupNumber");
                });
            });
        }
        var PatternNoStart = createToken({
            name: "PatternNoStart",
            pattern: /bamba/i
        });
        var Keyword = createToken({ name: "Keyword", pattern: lexer_public_1.Lexer.NA });
        var If = createToken({
            name: "If",
            pattern: /if/,
            categories: Keyword
        });
        var Else = createToken({
            name: "Else",
            pattern: "else",
            categories: Keyword
        });
        var Return = createToken({
            name: "Return",
            pattern: /return/i,
            categories: Keyword
        });
        var Integer = createToken({ name: "Integer", pattern: /[1-9]\d*/ });
        var Punctuation = createToken({
            name: "Punctuation",
            pattern: lexer_public_1.Lexer.NA
        });
        var LParen = createToken({
            name: "Return",
            pattern: /\(/,
            categories: Punctuation
        });
        var RParen = createToken({
            name: "Return",
            pattern: /\)/,
            categories: Punctuation
        });
        var Whitespace = createToken({
            name: "Whitespace",
            pattern: /(\t| )/
        });
        Whitespace.GROUP = lexer_public_1.Lexer.SKIPPED;
        var NewLine = createToken({
            name: "NewLine",
            pattern: /(\n|\r|\r\n)/
        });
        NewLine.GROUP = lexer_public_1.Lexer.SKIPPED;
        NewLine.LINE_BREAKS = true;
        var WhitespaceNotSkipped = createToken({
            name: "WhitespaceNotSkipped",
            pattern: /\s+/
        });
        WhitespaceNotSkipped.LINE_BREAKS = true;
        var Comment = createToken({ name: "Comment", pattern: /\/\/.+/ });
        Comment.GROUP = "comments";
        var WhitespaceOrAmp = createToken({
            name: "WhitespaceOrAmp",
            pattern: /\s+|&/
        });
        WhitespaceOrAmp.LINE_BREAKS = true;
        var PileOfPoo = createToken({ name: "PileOfPoo", pattern: /💩/ });
        describe("The Simple Lexer transformations", function () {
            it("can transform a pattern to one with startOfInput mark ('^') #1 (NO OP)", function () {
                var orgSource = BambaTok.PATTERN.source;
                var transPattern = lexer_1.addStartOfInput(BambaTok.PATTERN);
                expect(transPattern.source).to.equal("^(?:" + orgSource + ")");
                expect(/^\^/.test(transPattern.source)).to.equal(true);
            });
            it("can transform a pattern to one with startOfInput mark ('^') #2", function () {
                var orgSource = PatternNoStart.PATTERN.source;
                var transPattern = lexer_1.addStartOfInput(PatternNoStart.PATTERN);
                expect(transPattern.source).to.equal("^(?:" + orgSource + ")");
                expect(/^\^/.test(transPattern.source)).to.equal(true);
            });
            if (!skipValidationChecks) {
                it("can transform/analyze an array of Token Typees into matched/ignored/patternToClass", function () {
                    var tokenClasses = [
                        Keyword,
                        If,
                        Else,
                        Return,
                        Integer,
                        Punctuation,
                        LParen,
                        RParen,
                        Whitespace,
                        NewLine
                    ];
                    var analyzeResult = lexer_1.analyzeTokenTypes(tokenClasses, {
                        useSticky: false
                    });
                    var allPatterns = utils_1.map(analyzeResult.patternIdxToConfig, function (currConfig) { return currConfig.pattern; });
                    expect(allPatterns.length).to.equal(8);
                    var allPatternsString = utils_1.map(allPatterns, function (pattern) {
                        return utils_1.isString(pattern) ? pattern : pattern.source;
                    });
                    matchers_1.setEquality(allPatternsString, [
                        "^(?:(\\t| ))",
                        "^(?:(\\n|\\r|\\r\\n))",
                        "^(?:[1-9]\\d*)",
                        "(",
                        ")",
                        "^(?:if)",
                        "^(?:else)",
                        "^(?:return)"
                    ]);
                    var patternIdxToClass = utils_1.map(analyzeResult.patternIdxToConfig, function (currConfig) { return currConfig.tokenType; });
                    expect(utils_1.keys(patternIdxToClass).length).to.equal(8);
                    expect(patternIdxToClass[0]).to.equal(If);
                    expect(patternIdxToClass[1]).to.equal(Else);
                    expect(patternIdxToClass[2]).to.equal(Return);
                    expect(patternIdxToClass[3]).to.equal(Integer);
                    expect(patternIdxToClass[4]).to.equal(LParen);
                    expect(patternIdxToClass[5]).to.equal(RParen);
                    expect(patternIdxToClass[6]).to.equal(Whitespace);
                    expect(patternIdxToClass[7]).to.equal(NewLine);
                });
            }
            if (!skipValidationChecks && ORG_SUPPORT_STICKY) {
                it("can transform/analyze an array of Token Typees into matched/ignored/patternToClass - sticky", function () {
                    var tokenClasses = [
                        Keyword,
                        If,
                        Else,
                        Return,
                        Integer,
                        Punctuation,
                        LParen,
                        RParen,
                        Whitespace,
                        NewLine
                    ];
                    // on newer node.js this will run with the 2nd argument as true.
                    var analyzeResult = lexer_1.analyzeTokenTypes(tokenClasses, {
                        useSticky: true
                    });
                    var allPatterns = utils_1.map(analyzeResult.patternIdxToConfig, function (currConfig) { return currConfig.pattern; });
                    expect(allPatterns.length).to.equal(8);
                    var allPatternsString = utils_1.map(allPatterns, function (pattern) {
                        return utils_1.isString(pattern) ? pattern : pattern.source;
                    });
                    matchers_1.setEquality(allPatternsString, [
                        "(\\t| )",
                        "(\\n|\\r|\\r\\n)",
                        "(",
                        ")",
                        "[1-9]\\d*",
                        "if",
                        "else",
                        "return"
                    ]);
                    utils_1.forEach(allPatterns, function (currPattern) {
                        if (utils_1.isRegExp(currPattern)) {
                            expect(currPattern.sticky).to.be.true;
                        }
                    });
                    var patternIdxToClass = utils_1.map(analyzeResult.patternIdxToConfig, function (currConfig) { return currConfig.tokenType; });
                    expect(utils_1.keys(patternIdxToClass).length).to.equal(8);
                    expect(patternIdxToClass[0]).to.equal(If);
                    expect(patternIdxToClass[1]).to.equal(Else);
                    expect(patternIdxToClass[2]).to.equal(Return);
                    expect(patternIdxToClass[3]).to.equal(Integer);
                    expect(patternIdxToClass[4]).to.equal(LParen);
                    expect(patternIdxToClass[5]).to.equal(RParen);
                    expect(patternIdxToClass[6]).to.equal(Whitespace);
                    expect(patternIdxToClass[7]).to.equal(NewLine);
                });
            }
            it("can count the number of line terminators in a string", function () {
                var ltCounter = new lexer_public_1.Lexer([
                    createToken({
                        name: "lt",
                        pattern: /\s+/
                    }),
                    createToken({
                        name: "num",
                        pattern: /\d+/
                    })
                ]);
                var lastToken = utils_1.last(ltCounter.tokenize("1\r\n1\r1").tokens);
                expect(lastToken.startLine).to.equal(3);
                var lastToken2 = utils_1.last(ltCounter.tokenize("\r\r\r1234\r\n1").tokens);
                expect(lastToken2.startLine).to.equal(5);
                expect(lastToken2.startColumn).to.equal(1);
                var lastToken3 = utils_1.last(ltCounter.tokenize("2\r3\n\r4\n5").tokens);
                expect(lastToken3.startLine).to.equal(5);
            });
            it("can count the number of line terminators in a string - with lookahead", function () {
                var ltCounter = new lexer_public_1.Lexer([
                    createToken({
                        name: "lt",
                        pattern: /\s+/
                    }),
                    createToken({
                        name: "num",
                        // meaningless lookahead for coverage
                        pattern: /\d+(?=|\n)/
                    })
                ]);
                var lastToken = utils_1.last(ltCounter.tokenize("1\r\n1\r1").tokens);
                expect(lastToken.startLine).to.equal(3);
                var lastToken2 = utils_1.last(ltCounter.tokenize("\r\r\r1234\r\n1").tokens);
                expect(lastToken2.startLine).to.equal(5);
                expect(lastToken2.startColumn).to.equal(1);
                var lastToken3 = utils_1.last(ltCounter.tokenize("2\r3\n\r4\n5").tokens);
                expect(lastToken3.startLine).to.equal(5);
            });
            it("can count the number of line terminators in a string - with negative lookahead", function () {
                var ltCounter = new lexer_public_1.Lexer([
                    createToken({
                        name: "lt",
                        pattern: /\s+/
                    }),
                    createToken({
                        name: "num",
                        // including the newline lookahead to assure it is being ignored
                        // while figuring out if this pattern can include a line terminator.
                        pattern: /\d+(?!a\n)/
                    })
                ]);
                var lastToken = utils_1.last(ltCounter.tokenize("1\r\n1\r1").tokens);
                expect(lastToken.startLine).to.equal(3);
                var lastToken2 = utils_1.last(ltCounter.tokenize("\r\r\r1234\r\n1").tokens);
                expect(lastToken2.startLine).to.equal(5);
                expect(lastToken2.startColumn).to.equal(1);
                var lastToken3 = utils_1.last(ltCounter.tokenize("2\r3\n\r4\n5").tokens);
                expect(lastToken3.startLine).to.equal(5);
            });
            it("can count the number of line terminators in a string - string literal patterns", function () {
                var ltCounter = new lexer_public_1.Lexer([
                    createToken({
                        name: "lt",
                        pattern: "\n",
                        line_breaks: true
                    }),
                    createToken({
                        name: "num",
                        pattern: /\d+/
                    })
                ]);
                var lastToken = utils_1.last(ltCounter.tokenize("1\n1\n1").tokens);
                expect(lastToken.startLine).to.equal(3);
            });
            it("can count the number of line terminators in a string - string literal patterns - implicit <line_breaks> prop", function () {
                var ltCounter = new lexer_public_1.Lexer([
                    createToken({
                        name: "lt",
                        pattern: "\n"
                    }),
                    createToken({
                        name: "num",
                        pattern: /\d+/
                    })
                ]);
                var lastToken = utils_1.last(ltCounter.tokenize("1\n1\n1").tokens);
                expect(lastToken.startLine).to.equal(3);
            });
            it("Supports custom Line Terminators", function () {
                var WS = createToken({
                    name: "WS",
                    pattern: /\u2028/,
                    line_breaks: true,
                    group: lexer_public_1.Lexer.SKIPPED
                });
                var ifElseLexer = new lexer_public_1.Lexer([WS, If, Else], {
                    lineTerminatorsPattern: /\u2028/g,
                    lineTerminatorCharacters: ["\u2028"]
                });
                var input = "if\u2028elseif";
                var lexResult = ifElseLexer.tokenize(input);
                var tokens = lexResult.tokens;
                expect(tokens[0].image).to.equal("if");
                expect(tokens[0].startLine).to.equal(1);
                expect(tokens[0].startColumn).to.equal(1);
                expect(tokens[1].image).to.equal("else");
                expect(tokens[1].startLine).to.equal(2);
                expect(tokens[1].startColumn).to.equal(1);
                expect(tokens[2].image).to.equal("if");
                expect(tokens[2].startLine).to.equal(2);
                expect(tokens[2].startColumn).to.equal(5);
            });
            it("Supports custom Line Terminators with numerical lineTerminatorCharacters", function () {
                var WS = createToken({
                    name: "WS",
                    pattern: /\u2028/,
                    line_breaks: true,
                    group: lexer_public_1.Lexer.SKIPPED
                });
                var ifElseLexer = new lexer_public_1.Lexer([WS, If, Else], {
                    lineTerminatorsPattern: /\u2028/g,
                    // "\u2028".charCodeAt(0) === 8232
                    lineTerminatorCharacters: [8232]
                });
                var input = "if\u2028elseif";
                var lexResult = ifElseLexer.tokenize(input);
                var tokens = lexResult.tokens;
                expect(tokens[0].image).to.equal("if");
                expect(tokens[0].startLine).to.equal(1);
                expect(tokens[0].startColumn).to.equal(1);
                expect(tokens[1].image).to.equal("else");
                expect(tokens[1].startLine).to.equal(2);
                expect(tokens[1].startColumn).to.equal(1);
                expect(tokens[2].image).to.equal("if");
                expect(tokens[2].startLine).to.equal(2);
                expect(tokens[2].startColumn).to.equal(5);
            });
        });
        describe("The Simple Lexer Full flow", function () {
            it("Can lex case insensitive patterns", function () {
                var workflow = createToken({
                    name: "workflow",
                    pattern: /WORKFLOW/i
                });
                var input = "worKFloW";
                var lexer = new lexer_public_1.Lexer([workflow], {
                    positionTracking: "onlyOffset"
                });
                var lexResult = lexer.tokenize(input);
                var tokens = lexResult.tokens;
                expect(tokens[0].image).to.equal("worKFloW");
                expect(tokens[0].tokenType).to.equal(workflow);
            });
            it("can run a simpleLexer without optimizing meta chars", function () {
                var Tab = createToken({
                    name: "Tab",
                    pattern: /\t/,
                    group: "spaces"
                });
                var ifElseLexer = new lexer_public_1.Lexer([Tab, If, Else], {
                    positionTracking: "onlyOffset"
                });
                var input = "if\telse";
                var lexResult = ifElseLexer.tokenize(input);
                var tokens = lexResult.tokens;
                expect(tokens[0].image).to.equal("if");
                expect(tokens[1].image).to.equal("else");
                var spacesGroups = lexResult.groups.spaces;
                expect(spacesGroups[0].image).to.equal("\t");
            });
            it("can accept start char code hints from the user", function () {
                var IfOrElse = createToken({
                    name: "IfOrElse",
                    pattern: /if|else/,
                    start_chars_hint: ["i", "e".charCodeAt(0)]
                });
                var ifElseLexer = new lexer_public_1.Lexer([IfOrElse], {
                    positionTracking: "onlyOffset"
                });
                var input = "ifelse";
                var lexResult = ifElseLexer.tokenize(input);
                var tokens = lexResult.tokens;
                expect(tokens[0].image).to.equal("if");
                expect(tokens[1].image).to.equal("else");
            });
            var EndOfInputAnchor = createToken({
                name: "EndOfInputAnchor",
                pattern: /BAMBA$/
            });
            it("can create a simple Lexer from a List of Token Typees", function () {
                var ifElseLexer = new lexer_public_1.Lexer([
                    Keyword,
                    If,
                    Else,
                    Return,
                    Integer,
                    Punctuation,
                    LParen,
                    RParen,
                    Whitespace,
                    NewLine
                ], lexerConfig);
                //noinspection BadExpressionStatementJS
                expect(ifElseLexer.lexerDefinitionErrors).to.be.empty;
                var input = "if (666) reTurn 1\n" + "\telse return 2";
                var lexResult = ifElseLexer.tokenize(input);
                expect(lexResult.groups).to.be.empty;
                expect(lexResult.tokens[0].image).to.equal("if");
                expect(lexResult.tokens[0].startOffset).to.equal(0);
                if (testStart) {
                    expect(lexResult.tokens[0].startLine).to.equal(1);
                    expect(lexResult.tokens[0].startColumn).to.equal(1);
                }
                if (testFull) {
                    expect(lexResult.tokens[0].endOffset).to.equal(1);
                }
                expect(tokenMatcher(lexResult.tokens[0], If)).to.be.true;
                expect(lexResult.tokens[1].image).to.equal("(");
                expect(lexResult.tokens[1].startOffset).to.equal(3);
                if (testStart) {
                    expect(lexResult.tokens[1].startLine).to.equal(1);
                    expect(lexResult.tokens[1].startColumn).to.equal(4);
                }
                if (testFull) {
                    expect(lexResult.tokens[1].endOffset).to.equal(3);
                }
                expect(tokenMatcher(lexResult.tokens[1], LParen)).to.be.true;
                expect(lexResult.tokens[2].image).to.equal("666");
                expect(lexResult.tokens[2].startOffset).to.equal(4);
                if (testStart) {
                    expect(lexResult.tokens[2].startLine).to.equal(1);
                    expect(lexResult.tokens[2].startColumn).to.equal(5);
                }
                if (testFull) {
                    expect(lexResult.tokens[2].endOffset).to.equal(6);
                }
                expect(tokenMatcher(lexResult.tokens[2], Integer)).to.be.true;
                expect(lexResult.tokens[3].image).to.equal(")");
                expect(lexResult.tokens[3].startOffset).to.equal(7);
                if (testStart) {
                    if (testStart) {
                        expect(lexResult.tokens[3].startLine).to.equal(1);
                        expect(lexResult.tokens[3].startColumn).to.equal(8);
                    }
                }
                if (testFull) {
                    expect(lexResult.tokens[3].endOffset).to.equal(7);
                }
                expect(tokenMatcher(lexResult.tokens[3], RParen)).to.be.true;
                expect(lexResult.tokens[4].image).to.equal("reTurn");
                expect(lexResult.tokens[4].startOffset).to.equal(9);
                if (testStart) {
                    expect(lexResult.tokens[4].startLine).to.equal(1);
                    expect(lexResult.tokens[4].startColumn).to.equal(10);
                }
                if (testFull) {
                    expect(lexResult.tokens[4].endOffset).to.equal(14);
                }
                expect(tokenMatcher(lexResult.tokens[4], Return)).to.be.true;
                expect(lexResult.tokens[5].image).to.equal("1");
                expect(lexResult.tokens[5].startOffset).to.equal(16);
                if (testStart) {
                    expect(lexResult.tokens[5].startLine).to.equal(1);
                    expect(lexResult.tokens[5].startColumn).to.equal(17);
                }
                if (testFull) {
                    expect(lexResult.tokens[5].endOffset).to.equal(16);
                }
                expect(tokenMatcher(lexResult.tokens[5], Integer)).to.be.true;
                expect(lexResult.tokens[6].image).to.equal("else");
                expect(lexResult.tokens[6].startOffset).to.equal(19);
                if (testStart) {
                    expect(lexResult.tokens[6].startLine).to.equal(2);
                    expect(lexResult.tokens[6].startColumn).to.equal(2);
                }
                if (testFull) {
                    expect(lexResult.tokens[6].endOffset).to.equal(22);
                }
                expect(tokenMatcher(lexResult.tokens[6], Else)).to.be.true;
                expect(lexResult.tokens[7].image).to.equal("return");
                expect(lexResult.tokens[7].startOffset).to.equal(24);
                if (testStart) {
                    expect(lexResult.tokens[7].startLine).to.equal(2);
                    expect(lexResult.tokens[7].startColumn).to.equal(7);
                }
                if (testFull) {
                    expect(lexResult.tokens[7].endOffset).to.equal(29);
                }
                expect(tokenMatcher(lexResult.tokens[7], Return)).to.be.true;
                expect(lexResult.tokens[8].image).to.equal("2");
                expect(lexResult.tokens[8].startOffset).to.equal(31);
                if (testStart) {
                    expect(lexResult.tokens[8].startLine).to.equal(2);
                    expect(lexResult.tokens[8].startColumn).to.equal(14);
                }
                if (testFull) {
                    expect(lexResult.tokens[8].endOffset).to.equal(31);
                }
                expect(tokenMatcher(lexResult.tokens[8], Integer)).to.be.true;
            });
            // when testing custom patterns the EOI anchor will not exist and thus no error will be thrown
            if (!skipValidationChecks) {
                // This test must not be performed in custom mode
                it("can count the number of line terminators in a string - complement <line_breaks> prop", function () {
                    var ltCounter = new lexer_public_1.Lexer([
                        createToken({
                            name: "lt",
                            pattern: /[^\d]+/
                        }),
                        createToken({
                            name: "num",
                            pattern: /\d+/
                        })
                    ]);
                    var lastToken = utils_1.last(ltCounter.tokenize("1\n1\n1").tokens);
                    expect(lastToken.startLine).to.equal(3);
                });
                it("can build error message for failing to identify potential line_breaks", function () {
                    var One = createToken({ name: "One", pattern: "1" });
                    var actualMsg = lexer_1.buildLineBreakIssueMessage(One, {
                        issue: lexer_public_1.LexerDefinitionErrorType.IDENTIFY_TERMINATOR,
                        errMsg: "oops"
                    });
                    expect(actualMsg).to.contain("oops");
                });
                it("Will throw an error during the creation of a Lexer if the lexer config argument is a boolean", function () {
                    expect(function () {
                        return new lexer_public_1.Lexer([], {
                            positionTracking: "oops"
                        });
                    }).to.throw("Invalid <positionTracking> config option:" + ' "oops"');
                });
                it("Will throw an error during the creation of a Lexer if the lexer config argument is a boolean", function () {
                    expect(function () { return new lexer_public_1.Lexer([], false); }).to.throw("The second argument to the Lexer constructor is now an ILexerConfig");
                });
                it("Will throw an error during the creation of a Lexer if the is using custom " +
                    "line terminators without specifying the lineTerminatorCharacters", function () {
                    expect(function () {
                        return new lexer_public_1.Lexer([], { lineTerminatorsPattern: /\n/g });
                    }).to.throw("Error: Missing <lineTerminatorCharacters> property on the Lexer config.");
                });
                it("Will throw an error during the creation of a Lexer if the Lexer's definition is invalid", function () {
                    expect(function () { return new lexer_public_1.Lexer([EndOfInputAnchor, If, Else]); }, lexerConfig).to.throw(/Errors detected in definition of Lexer/);
                    expect(function () { return new lexer_public_1.Lexer([EndOfInputAnchor, If, Else]); }, lexerConfig).to.throw(/EndOfInputAnchor/);
                });
                it("can defer the throwing of errors during the creation of a Lexer if the Lexer's definition is invalid", function () {
                    expect(function () {
                        return new lexer_public_1.Lexer([EndOfInputAnchor, If, Else], {
                            positionTracking: "onlyOffset",
                            deferDefinitionErrorsHandling: true
                        });
                    }).to.not.throw(/Errors detected in definition of Lexer/);
                    expect(function () {
                        return new lexer_public_1.Lexer([EndOfInputAnchor, If, Else], {
                            positionTracking: "onlyOffset",
                            deferDefinitionErrorsHandling: true
                        });
                    }).to.not.throw(/EndOfInputAnchor/);
                    var lexerWithErrs = new lexer_public_1.Lexer([EndOfInputAnchor, If, Else], {
                        positionTracking: "onlyOffset",
                        deferDefinitionErrorsHandling: true
                    });
                    //noinspection BadExpressionStatementJS
                    expect(lexerWithErrs.lexerDefinitionErrors).to.not.be.empty;
                    // even when the Error handling is deferred, actual usage of an invalid lexer is not permitted!
                    expect(function () { return lexerWithErrs.tokenize("else"); }).to.throw(/Unable to Tokenize because Errors detected in definition of Lexer/);
                    expect(function () { return lexerWithErrs.tokenize("else"); }).to.throw(/EndOfInputAnchor/);
                });
            }
            it("can skip invalid character inputs and only report one error per sequence of characters skipped", function () {
                var ifElseLexer = new lexer_public_1.Lexer([
                    Keyword,
                    If,
                    Else,
                    Return,
                    Integer,
                    Punctuation,
                    LParen,
                    RParen,
                    Whitespace,
                    NewLine
                ], lexerConfig);
                var input = "if (666) return 1@#$@#$\n" + "\telse return 2";
                var lexResult = ifElseLexer.tokenize(input);
                expect(lexResult.errors.length).to.equal(1);
                expect(lexResult.errors[0].message).to.contain("@");
                expect(lexResult.errors[0].length).to.equal(6);
                if (testStart) {
                    expect(lexResult.errors[0].line).to.equal(1);
                    expect(lexResult.errors[0].column).to.equal(18);
                }
                else {
                    expect(lexResult.errors[0].line).to.be.undefined;
                    expect(lexResult.errors[0].column).to.be.undefined;
                }
                expect(lexResult.tokens[0].image).to.equal("if");
                expect(lexResult.tokens[0].startOffset).to.equal(0);
                if (testStart) {
                    expect(lexResult.tokens[0].startLine).to.equal(1);
                    expect(lexResult.tokens[0].startColumn).to.equal(1);
                }
                expect(tokenMatcher(lexResult.tokens[0], If)).to.be.true;
                expect(lexResult.tokens[1].image).to.equal("(");
                expect(lexResult.tokens[1].startOffset).to.equal(3);
                if (testStart) {
                    expect(lexResult.tokens[1].startLine).to.equal(1);
                    expect(lexResult.tokens[1].startColumn).to.equal(4);
                }
                expect(tokenMatcher(lexResult.tokens[1], LParen)).to.be.true;
                expect(lexResult.tokens[2].image).to.equal("666");
                expect(lexResult.tokens[2].startOffset).to.equal(4);
                if (testStart) {
                    expect(lexResult.tokens[2].startLine).to.equal(1);
                    expect(lexResult.tokens[2].startColumn).to.equal(5);
                }
                expect(tokenMatcher(lexResult.tokens[2], Integer)).to.be.true;
                expect(lexResult.tokens[3].image).to.equal(")");
                expect(lexResult.tokens[3].startOffset).to.equal(7);
                if (testStart) {
                    expect(lexResult.tokens[3].startLine).to.equal(1);
                    expect(lexResult.tokens[3].startColumn).to.equal(8);
                }
                expect(tokenMatcher(lexResult.tokens[3], RParen)).to.be.true;
                expect(lexResult.tokens[4].image).to.equal("return");
                expect(lexResult.tokens[4].startOffset).to.equal(9);
                if (testStart) {
                    expect(lexResult.tokens[4].startLine).to.equal(1);
                    expect(lexResult.tokens[4].startColumn).to.equal(10);
                }
                expect(tokenMatcher(lexResult.tokens[4], Return)).to.be.true;
                expect(lexResult.tokens[5].image).to.equal("1");
                expect(lexResult.tokens[5].startOffset).to.equal(16);
                if (testStart) {
                    expect(lexResult.tokens[5].startLine).to.equal(1);
                    expect(lexResult.tokens[5].startColumn).to.equal(17);
                }
                expect(tokenMatcher(lexResult.tokens[5], Integer)).to.be.true;
                expect(lexResult.tokens[6].image).to.equal("else");
                expect(lexResult.tokens[6].startOffset).to.equal(25);
                if (testStart) {
                    expect(lexResult.tokens[6].startLine).to.equal(2);
                    expect(lexResult.tokens[6].startColumn).to.equal(2);
                }
                expect(tokenMatcher(lexResult.tokens[6], Else)).to.be.true;
                expect(lexResult.tokens[7].image).to.equal("return");
                expect(lexResult.tokens[7].startOffset).to.equal(30);
                if (testStart) {
                    expect(lexResult.tokens[7].startLine).to.equal(2);
                    expect(lexResult.tokens[7].startColumn).to.equal(7);
                }
                expect(tokenMatcher(lexResult.tokens[7], Return)).to.be.true;
                expect(lexResult.tokens[8].image).to.equal("2");
                expect(lexResult.tokens[8].startOffset).to.equal(37);
                if (testStart) {
                    expect(lexResult.tokens[8].startLine).to.equal(2);
                    expect(lexResult.tokens[8].startColumn).to.equal(14);
                }
                expect(tokenMatcher(lexResult.tokens[8], Integer)).to.be.true;
            });
            it("won't go into infinite loops when skipping at end of input", function () {
                var ifElseLexer = new lexer_public_1.Lexer([
                    Keyword,
                    If,
                    Else,
                    Return,
                    Integer,
                    Punctuation,
                    LParen,
                    RParen,
                    Whitespace,
                    NewLine
                ], lexerConfig);
                var input = "if&&&&&&&&&&&&&&&&&&&&&&&&&&&&";
                var lexResult = ifElseLexer.tokenize(input);
                expect(lexResult.errors.length).to.equal(1);
                expect(lexResult.errors[0].message).to.contain("&");
                if (testStart) {
                    expect(lexResult.errors[0].line).to.equal(1);
                    expect(lexResult.errors[0].column).to.equal(3);
                }
                else {
                    expect(lexResult.errors[0].line).to.be.undefined;
                    expect(lexResult.errors[0].column).to.be.undefined;
                }
                expect(lexResult.errors[0].length).to.equal(28);
                expect(lexResult.tokens[0].image).to.equal("if");
                expect(lexResult.tokens[0].startOffset).to.equal(0);
                if (testStart) {
                    expect(lexResult.tokens[0].startLine).to.equal(1);
                    expect(lexResult.tokens[0].startColumn).to.equal(1);
                }
                expect(tokenMatcher(lexResult.tokens[0], If)).to.be.true;
            });
            it("can deal with line terminators inside multi-line Tokens", function () {
                var ifElseLexer = new lexer_public_1.Lexer([If, Else, WhitespaceNotSkipped], lexerConfig);
                var input = "if\r\r\telse\rif\n";
                var lexResult = ifElseLexer.tokenize(input);
                expect(lexResult.tokens[0].image).to.equal("if");
                expect(lexResult.tokens[0].startOffset).to.equal(0);
                if (testStart) {
                    expect(lexResult.tokens[0].startLine).to.equal(1);
                    expect(lexResult.tokens[0].startColumn).to.equal(1);
                }
                if (testFull) {
                    expect(lexResult.tokens[0].endLine).to.equal(1);
                    expect(lexResult.tokens[0].endColumn).to.equal(2);
                }
                expect(tokenMatcher(lexResult.tokens[0], If)).to.be.true;
                expect(lexResult.tokens[1].image).to.equal("\r\r\t");
                expect(lexResult.tokens[1].startOffset).to.equal(2);
                if (testStart) {
                    expect(lexResult.tokens[1].startLine).to.equal(1);
                    expect(lexResult.tokens[1].startColumn).to.equal(3);
                }
                if (testFull) {
                    expect(lexResult.tokens[1].endLine).to.equal(3);
                    expect(lexResult.tokens[1].endColumn).to.equal(1);
                }
                expect(tokenMatcher(lexResult.tokens[1], WhitespaceNotSkipped))
                    .to.be.true;
                expect(lexResult.tokens[2].image).to.equal("else");
                expect(lexResult.tokens[2].startOffset).to.equal(5);
                if (testStart) {
                    expect(lexResult.tokens[2].startLine).to.equal(3);
                    expect(lexResult.tokens[2].startColumn).to.equal(2);
                }
                if (testFull) {
                    expect(lexResult.tokens[2].endLine).to.equal(3);
                    expect(lexResult.tokens[2].endColumn).to.equal(5);
                }
                expect(tokenMatcher(lexResult.tokens[2], Else)).to.be.true;
                expect(lexResult.tokens[3].image).to.equal("\r");
                expect(lexResult.tokens[3].startOffset).to.equal(9);
                if (testStart) {
                    expect(lexResult.tokens[3].startLine).to.equal(3);
                    expect(lexResult.tokens[3].startColumn).to.equal(6);
                }
                if (testFull) {
                    expect(lexResult.tokens[3].endLine).to.equal(3);
                    expect(lexResult.tokens[3].endColumn).to.equal(6);
                }
                expect(tokenMatcher(lexResult.tokens[3], WhitespaceNotSkipped))
                    .to.be.true;
                expect(lexResult.tokens[4].image).to.equal("if");
                expect(lexResult.tokens[4].startOffset).to.equal(10);
                if (testStart) {
                    expect(lexResult.tokens[4].startLine).to.equal(4);
                    expect(lexResult.tokens[4].startColumn).to.equal(1);
                }
                if (testFull) {
                    expect(lexResult.tokens[4].endLine).to.equal(4);
                    expect(lexResult.tokens[4].endColumn).to.equal(2);
                }
                expect(tokenMatcher(lexResult.tokens[4], If)).to.be.true;
                expect(lexResult.tokens[5].image).to.equal("\n");
                expect(lexResult.tokens[5].startOffset).to.equal(12);
                if (testStart) {
                    expect(lexResult.tokens[5].startLine).to.equal(4);
                    expect(lexResult.tokens[5].startColumn).to.equal(3);
                }
                if (testFull) {
                    expect(lexResult.tokens[5].endLine).to.equal(4);
                    expect(lexResult.tokens[5].endColumn).to.equal(3);
                }
                expect(tokenMatcher(lexResult.tokens[5], WhitespaceNotSkipped))
                    .to.be.true;
            });
            it("can deal with Tokens which may or may not be a lineTerminator", function () {
                var ifElseLexer = new lexer_public_1.Lexer([If, Else, WhitespaceOrAmp], lexerConfig);
                var input = "if\r\r\telse&if";
                var lexResult = ifElseLexer.tokenize(input);
                expect(lexResult.tokens[0].image).to.equal("if");
                expect(lexResult.tokens[0].startOffset).to.equal(0);
                if (testStart) {
                    expect(lexResult.tokens[0].startLine).to.equal(1);
                    expect(lexResult.tokens[0].startColumn).to.equal(1);
                }
                if (testFull) {
                    expect(lexResult.tokens[0].endLine).to.equal(1);
                    expect(lexResult.tokens[0].endColumn).to.equal(2);
                }
                expect(tokenMatcher(lexResult.tokens[0], If)).to.be.true;
                expect(lexResult.tokens[1].image).to.equal("\r\r\t");
                expect(lexResult.tokens[1].startOffset).to.equal(2);
                if (testStart) {
                    expect(lexResult.tokens[1].startLine).to.equal(1);
                    expect(lexResult.tokens[1].startColumn).to.equal(3);
                }
                if (testFull) {
                    expect(lexResult.tokens[1].endLine).to.equal(3);
                    expect(lexResult.tokens[1].endColumn).to.equal(1);
                }
                expect(tokenMatcher(lexResult.tokens[1], WhitespaceOrAmp)).to.be
                    .true;
                expect(lexResult.tokens[2].image).to.equal("else");
                expect(lexResult.tokens[2].startOffset).to.equal(5);
                if (testStart) {
                    expect(lexResult.tokens[2].startLine).to.equal(3);
                    expect(lexResult.tokens[2].startColumn).to.equal(2);
                }
                if (testFull) {
                    expect(lexResult.tokens[2].endLine).to.equal(3);
                    expect(lexResult.tokens[2].endColumn).to.equal(5);
                }
                expect(tokenMatcher(lexResult.tokens[2], Else)).to.be.true;
                expect(lexResult.tokens[3].image).to.equal("&");
                expect(lexResult.tokens[3].startOffset).to.equal(9);
                if (testStart) {
                    expect(lexResult.tokens[3].startLine).to.equal(3);
                    expect(lexResult.tokens[3].startColumn).to.equal(6);
                }
                if (testFull) {
                    expect(lexResult.tokens[3].endLine).to.equal(3);
                    expect(lexResult.tokens[3].endColumn).to.equal(6);
                }
                expect(tokenMatcher(lexResult.tokens[3], WhitespaceOrAmp)).to.be
                    .true;
                expect(lexResult.tokens[4].image).to.equal("if");
                expect(lexResult.tokens[4].startOffset).to.equal(10);
                if (testStart) {
                    expect(lexResult.tokens[4].startLine).to.equal(3);
                    expect(lexResult.tokens[4].startColumn).to.equal(7);
                }
                if (testFull) {
                    expect(lexResult.tokens[4].endLine).to.equal(3);
                    expect(lexResult.tokens[4].endColumn).to.equal(8);
                }
                expect(tokenMatcher(lexResult.tokens[4], If)).to.be.true;
            });
            it("supports Token groups", function () {
                var ifElseLexer = new lexer_public_1.Lexer([If, Else, Comment, NewLine], lexerConfig);
                var input = "if//else";
                var lexResult = ifElseLexer.tokenize(input);
                expect(lexResult.tokens[0].image).to.equal("if");
                expect(lexResult.tokens[0].startOffset).to.equal(0);
                if (testStart) {
                    expect(lexResult.tokens[0].startLine).to.equal(1);
                    expect(lexResult.tokens[0].startColumn).to.equal(1);
                }
                if (testFull) {
                    expect(lexResult.tokens[0].endLine).to.equal(1);
                    expect(lexResult.tokens[0].endColumn).to.equal(2);
                }
                expect(tokenMatcher(lexResult.tokens[0], If)).to.be.true;
                expect(lexResult.groups).to.have.property("comments");
                // tslint:disable
                expect(lexResult.groups["comments"]).to.have.length(1);
                var comment = lexResult.groups["comments"][0];
                // tslint:enable
                expect(comment.image).to.equal("//else");
                expect(comment.startOffset).to.equal(2);
                if (testStart) {
                    expect(comment.startLine).to.equal(1);
                    expect(comment.startColumn).to.equal(3);
                }
                if (testFull) {
                    expect(comment.endLine).to.equal(1);
                    expect(comment.endColumn).to.equal(8);
                }
                expect(tokenMatcher(comment, Comment)).to.be.true;
            });
            it("won't have leftover state when using token groups", function () {
                var ifElseLexer = new lexer_public_1.Lexer([If, Else, Comment, NewLine], lexerConfig);
                var input = "if//else";
                var lexResult = ifElseLexer.tokenize(input);
                expect(lexResult.groups).to.have.property("comments");
                // tslint:disable
                expect(lexResult.groups["comments"]).to.have.length(1);
                // tslint:enable
                // 2th time
                lexResult = ifElseLexer.tokenize(input);
                expect(lexResult.groups).to.have.property("comments");
                // tslint:disable
                expect(lexResult.groups["comments"]).to.have.length(1);
                // tslint:enable
            });
            it("can lex a pile of poo", function () {
                var ifElseLexer = new lexer_public_1.Lexer([If, PileOfPoo, NewLine], lexerConfig);
                var input = "if💩";
                var lexResult = ifElseLexer.tokenize(input);
                expect(lexResult.tokens[0].image).to.equal("if");
                expect(lexResult.tokens[0].tokenType).to.equal(If);
                expect(lexResult.tokens[1].image).to.equal("💩");
                expect(lexResult.tokens[1].tokenType).to.equal(PileOfPoo);
            });
            context("lexer modes", function () {
                var One = createToken({ name: "One", pattern: "1" });
                var Two = createToken({ name: "Two", pattern: /2/ });
                var Three = createToken({ name: "Three", pattern: /3/ });
                var Alpha = createToken({ name: "Alpha", pattern: "A" });
                var Beta = createToken({ name: "Beta", pattern: /B/ });
                var Gamma = createToken({ name: "Gamma", pattern: /G/ });
                var Hash = createToken({ name: "Hash", pattern: /#/ });
                var Caret = createToken({ name: "Caret", pattern: /\^/ });
                var Amp = createToken({ name: "Amp", pattern: /&/ });
                var NUMBERS = createToken({
                    name: "NUMBERS",
                    pattern: /NUMBERS/
                });
                NUMBERS.PUSH_MODE = "numbers";
                var LETTERS = createToken({
                    name: "LETTERS",
                    pattern: /LETTERS/
                });
                LETTERS.PUSH_MODE = "letters";
                var SIGNS = createToken({ name: "SIGNS", pattern: /SIGNS/ });
                SIGNS.PUSH_MODE = "signs";
                var SIGNS_AND_EXIT_LETTERS = createToken({
                    name: "SIGNS_AND_EXIT_LETTERS",
                    pattern: /SIGNS_AND_EXIT_LETTERS/
                });
                SIGNS_AND_EXIT_LETTERS.PUSH_MODE = "signs";
                SIGNS_AND_EXIT_LETTERS.POP_MODE = true;
                var ExitNumbers = createToken({
                    name: "ExitNumbers",
                    pattern: /EXIT_NUMBERS/
                });
                ExitNumbers.POP_MODE = true;
                var ExitLetters = createToken({
                    name: "ExitLetters",
                    pattern: /EXIT_LETTERS/
                });
                ExitLetters.POP_MODE = true;
                var ExitSigns = createToken({
                    name: "ExitSigns",
                    pattern: /EXIT_SIGNS/
                });
                ExitSigns.POP_MODE = true;
                var Whitespace = createToken({
                    name: "Whitespace",
                    pattern: /(\t| )/
                });
                Whitespace.GROUP = lexer_public_1.Lexer.SKIPPED;
                var modeLexerDefinition = {
                    modes: {
                        numbers: [
                            One,
                            Two,
                            Three,
                            ExitNumbers,
                            LETTERS,
                            Whitespace
                        ],
                        letters: [
                            Alpha,
                            Beta,
                            Gamma,
                            ExitLetters,
                            SIGNS_AND_EXIT_LETTERS,
                            SIGNS,
                            Whitespace
                        ],
                        signs: [
                            Hash,
                            Caret,
                            Amp,
                            ExitSigns,
                            NUMBERS,
                            Whitespace,
                            NewLine
                        ]
                    },
                    defaultMode: "numbers"
                };
                var ModeLexer = new lexer_public_1.Lexer(modeLexerDefinition, lexerConfig);
                it("supports 'context' lexer modes full flow", function () {
                    var input = "1 LETTERS G A G SIGNS & EXIT_SIGNS B EXIT_LETTERS 3";
                    var lexResult = ModeLexer.tokenize(input);
                    expect(lexResult.errors).to.be.empty;
                    var images = utils_1.map(lexResult.tokens, function (currTok) { return currTok.image; });
                    expect(images).to.deep.equal([
                        "1",
                        "LETTERS",
                        "G",
                        "A",
                        "G",
                        "SIGNS",
                        "&",
                        "EXIT_SIGNS",
                        "B",
                        "EXIT_LETTERS",
                        "3" // back in numbers mode
                    ]);
                });
                it("supports lexer error reporting with modes", function () {
                    var input = "1 LETTERS EXIT_LETTERS +";
                    var lexResult = ModeLexer.tokenize(input);
                    expect(lexResult.errors).to.have.lengthOf(1);
                    expect(lexResult.errors[0].message).to.equal("unexpected character: ->+<- at offset: 23, skipped 1 characters.");
                });
                it("allows choosing the initial Mode", function () {
                    var input = "A G SIGNS ^";
                    var lexResult = ModeLexer.tokenize(input, "letters");
                    expect(lexResult.errors).to.be.empty;
                    var images = utils_1.map(lexResult.tokens, function (currTok) { return currTok.image; });
                    expect(images).to.deep.equal(["A", "G", "SIGNS", "^"]);
                });
                it("won't allow lexing tokens that are not in the current mode's set", function () {
                    var input = "1 LETTERS 1A";
                    var lexResult = ModeLexer.tokenize(input);
                    expect(lexResult.errors).to.have.lengthOf(1);
                    expect(lexResult.errors[0].message).to.include("skipped 1");
                    expect(lexResult.errors[0].message).to.include(">1<");
                    var images = utils_1.map(lexResult.tokens, function (currTok) { return currTok.image; });
                    expect(images).to.deep.equal([
                        "1",
                        "LETTERS",
                        "A" // the second "1" is missing because its not allowed in the "letters" mode
                    ]);
                });
                it("Will create a lexer error and skip the mode popping when there is no lexer mode to pop", function () {
                    var input = "1 EXIT_NUMBERS 2";
                    var lexResult = ModeLexer.tokenize(input);
                    expect(lexResult.errors).to.have.lengthOf(1);
                    expect(lexResult.errors[0].message).to.include(">EXIT_NUMBERS<");
                    expect(lexResult.errors[0].message).to.include("Unable to pop");
                    if (testStart) {
                        expect(lexResult.errors[0].line).to.equal(1);
                        expect(lexResult.errors[0].column).to.equal(3);
                    }
                    else {
                        expect(lexResult.errors[0].line).to.equal(undefined);
                        expect(lexResult.errors[0].column).to.equal(undefined);
                    }
                    expect(lexResult.errors[0].length).to.equal(12);
                    var images = utils_1.map(lexResult.tokens, function (currTok) { return currTok.image; });
                    expect(images).to.deep.equal(["1", "EXIT_NUMBERS", "2"]);
                });
                it("Will pop the lexer mode and push a new one if both are defined on the token", function () {
                    var input = "LETTERS SIGNS_AND_EXIT_LETTERS &";
                    var lexResult = ModeLexer.tokenize(input);
                    expect(lexResult.errors).to.be.empty;
                    var images = utils_1.map(lexResult.tokens, function (currTok) { return currTok.image; });
                    expect(images).to.deep.equal([
                        "LETTERS",
                        "SIGNS_AND_EXIT_LETTERS",
                        "&"
                    ]);
                });
                it("Will detect Token definitions with push modes values that does not exist", function () {
                    var One = createToken({ name: "One", pattern: /1/ });
                    var Two = createToken({ name: "Two", pattern: /2/ });
                    var Alpha = createToken({ name: "Alpha", pattern: /A/ });
                    var Beta = createToken({ name: "Beta", pattern: /B/ });
                    var Gamma = createToken({ name: "Gamma", pattern: /G/ });
                    var EnterNumbers = createToken({
                        name: "EnterNumbers",
                        pattern: /NUMBERS/
                    });
                    EnterNumbers.PUSH_MODE = "numbers";
                    var lexerDef = {
                        modes: {
                            letters: [
                                Alpha,
                                Beta,
                                Gamma,
                                Whitespace,
                                EnterNumbers
                            ],
                            // the numbers mode has a typo! so the PUSH_MODE in the 'EnterNumbers' is invalid
                            nuMbers_TYPO: [One, Two, Whitespace, NewLine]
                        },
                        defaultMode: "letters"
                    };
                    var badLexer = new lexer_public_1.Lexer(lexerDef, {
                        deferDefinitionErrorsHandling: true
                    });
                    expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(1);
                    expect(badLexer.lexerDefinitionErrors[0].tokenTypes).to.deep.equal([EnterNumbers]);
                    expect(badLexer.lexerDefinitionErrors[0].type).to.equal(lexer_public_1.LexerDefinitionErrorType.PUSH_MODE_DOES_NOT_EXIST);
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("PUSH_MODE");
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("EnterNumbers");
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("which does not exist");
                });
                it("Will detect a multiMode Lexer definition which is missing the <modes> property", function () {
                    var lexerDef = {
                        modes___: {
                        //  typo in 'modes' property name
                        },
                        defaultMode: ""
                    };
                    var badLexer = new lexer_public_1.Lexer(lexerDef, {
                        deferDefinitionErrorsHandling: true,
                        positionTracking: "onlyOffset"
                    });
                    expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(1);
                    expect(badLexer.lexerDefinitionErrors[0].type).to.equal(lexer_public_1.LexerDefinitionErrorType.MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY);
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("MultiMode Lexer cannot be initialized");
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("without a <modes> property");
                });
                it("Will detect a multiMode Lexer definition which is missing the <defaultMode> property", function () {
                    var lexerDef = {
                        modes: {},
                        defaultMode___: "" //  typo in 'defaultMode' property name
                    };
                    var badLexer = new lexer_public_1.Lexer(lexerDef, {
                        deferDefinitionErrorsHandling: true,
                        positionTracking: "onlyOffset"
                    });
                    expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(1);
                    expect(badLexer.lexerDefinitionErrors[0].type).to.equal(lexer_public_1.LexerDefinitionErrorType.MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE);
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("MultiMode Lexer cannot be initialized");
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("without a <defaultMode> property");
                });
                it("Will detect a multiMode Lexer definition " +
                    "which has an invalid (missing the value) of the <defaultMode> property", function () {
                    var lexerDef = {
                        modes: {
                            bamba: []
                        },
                        defaultMode: "bisli"
                    };
                    var badLexer = new lexer_public_1.Lexer(lexerDef, {
                        deferDefinitionErrorsHandling: true,
                        positionTracking: "onlyOffset"
                    });
                    expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(1);
                    expect(badLexer.lexerDefinitionErrors[0].type).to.equal(lexer_public_1.LexerDefinitionErrorType.MULTI_MODE_LEXER_DEFAULT_MODE_VALUE_DOES_NOT_EXIST);
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("MultiMode Lexer cannot be initialized");
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("which does not exist");
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("bisli");
                });
                it("Will detect a Lexer definition which has undefined Token Typees", function () {
                    var lexerDef = [
                        Alpha,
                        Beta /* this is undefined */,
                        ,
                        Gamma
                    ];
                    var badLexer = new lexer_public_1.Lexer(lexerDef, {
                        deferDefinitionErrorsHandling: true,
                        positionTracking: "onlyOffset"
                    });
                    expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(1);
                    expect(badLexer.lexerDefinitionErrors[0].type).to.equal(lexer_public_1.LexerDefinitionErrorType.LEXER_DEFINITION_CANNOT_CONTAIN_UNDEFINED);
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("A Lexer cannot be initialized using an undefined Token Type");
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("2");
                });
                describe("custom lexer error provider", function () {
                    var customErrorProvider = {
                        buildUnableToPopLexerModeMessage: function (token) {
                            return "No pop for you " + token.image;
                        },
                        buildUnexpectedCharactersMessage: function (fullText, startOffset, length, line, column) {
                            return "[" + line + ", " + column + "] Unknown character " + fullText.charAt(startOffset) + " at position " + startOffset + " skipped " + length;
                        }
                    };
                    var ModeLexerWithCustomErrors = new lexer_public_1.Lexer(modeLexerDefinition, {
                        errorMessageProvider: customErrorProvider
                    });
                    it("supports custom unexpected characters lexer error message", function () {
                        var input = "1 LETTERS EXIT_LETTERS +";
                        var lexResult = ModeLexerWithCustomErrors.tokenize(input);
                        expect(lexResult.errors).to.have.lengthOf(1);
                        expect(lexResult.errors[0].message).to.equal("[1, 24] Unknown character + at position 23 skipped 1");
                    });
                    it("supports custom unable to pop lexer mode error message", function () {
                        var input = "1 EXIT_NUMBERS 2";
                        var lexResult = ModeLexerWithCustomErrors.tokenize(input);
                        expect(lexResult.errors).to.have.lengthOf(1);
                        expect(lexResult.errors[0].message).to.equal("No pop for you EXIT_NUMBERS");
                    });
                });
                context("custom pattern", function () {
                    function defineCustomPatternSpec(variant, customPattern) {
                        it(variant, function () {
                            var time = 1;
                            function extraContextValidator(text, offset, tokens, groups) {
                                var result = utils_1.isFunction(customPattern)
                                    ? customPattern(text, offset)
                                    : customPattern.exec(text, offset);
                                if (result !== null) {
                                    if (time === 1) {
                                        expect(tokens).to.be.empty;
                                        time++;
                                    }
                                    else if (time === 2) {
                                        expect(tokens).to.have.lengthOf(2);
                                        expect(groups.whitespace).to.have.lengthOf(2);
                                        time++;
                                    }
                                    else {
                                        throw Error("Issue with Custom Token pattern context");
                                    }
                                }
                                return result;
                            }
                            var A = createToken({
                                name: "A",
                                pattern: "A"
                            });
                            var B = createToken({
                                name: "B",
                                pattern: extraContextValidator,
                                line_breaks: false
                            });
                            var WS = createToken({
                                name: "WS",
                                pattern: {
                                    exec: function (text, offset) {
                                        return /^\s+/.exec(text.substring(offset));
                                    }
                                },
                                group: "whitespace",
                                line_breaks: true
                            });
                            var lexerDef = [WS, A, B];
                            var myLexer = new lexer_public_1.Lexer(lexerDef, lexerConfig);
                            var lexResult = myLexer.tokenize("B A\n B ");
                            expect(lexResult.tokens).to.have.length(3);
                            expect(tokenMatcher(lexResult.tokens[0], B)).to.be
                                .true;
                            expect(tokenMatcher(lexResult.tokens[1], A)).to.be
                                .true;
                            expect(tokenMatcher(lexResult.tokens[2], B)).to.be
                                .true;
                            var lastToken = lexResult.tokens[2];
                            expect(lastToken.startOffset).to.equal(5);
                            if (testStart) {
                                expect(lastToken.startLine).to.equal(2);
                                expect(lastToken.startColumn).to.equal(2);
                            }
                            if (testFull) {
                                expect(lastToken.endLine).to.equal(2);
                                expect(lastToken.endColumn).to.equal(2);
                                expect(lastToken.endOffset).to.equal(5);
                            }
                        });
                    }
                    defineCustomPatternSpec("With short function syntax", function (text, offset) { return /^B/.exec(text.substring(offset)); });
                    defineCustomPatternSpec("verbose syntax", {
                        exec: function (text, offset) {
                            return /^B/.exec(text.substring(offset));
                        }
                    });
                });
            });
        });
    }
    context(contextName, lexerSpecs);
    if (lexer_1.SUPPORT_STICKY === true) {
        context(contextName + " NO STICKY", function () {
            before(lexer_1.disableSticky);
            lexerSpecs();
            after(lexer_1.enableSticky);
        });
    }
}
var skipOnBrowser = describe;
if (typeof window !== "undefined") {
    skipOnBrowser = describe.skip;
}
skipOnBrowser("debugging and messages and optimizations", function () {
    var consoleErrorSpy, consoleWarnSpy;
    beforeEach(function () {
        // @ts-ignore
        consoleErrorSpy = sinon.spy(console, "error");
        // @ts-ignore
        consoleWarnSpy = sinon.spy(console, "warn");
    });
    afterEach(function () {
        // @ts-ignore
        console.error.restore();
        // @ts-ignore
        console.warn.restore();
    });
    it("not report unicode flag", function () {
        // using new RegExp() to avoid IE 11 syntax errors
        var One = tokens_public_1.createToken({ name: "One", pattern: new RegExp("1", "u") });
        new lexer_public_1.Lexer([One], { positionTracking: "onlyOffset" });
        expect(console.error).to.have.not.been.called;
    });
    it("report unicode flag with ensureOptimizations enabled", function () {
        // using new RegExp() to avoid IE 11 syntax errors
        var One = tokens_public_1.createToken({ name: "One", pattern: new RegExp("1", "u") });
        expect(function () {
            return new lexer_public_1.Lexer([One], {
                ensureOptimizations: true,
                positionTracking: "onlyOffset"
            });
        }).to.throw("Lexer Modes: < defaultMode > cannot be optimized.");
        expect(console.error).to.have.been.called;
        expect(consoleErrorSpy.args[0][0]).to.include("The regexp unicode flag is not currently supported by the regexp-to-ast library");
    });
    it("report warning for not specifying line_breaks with custom tokens", function () {
        var NewLine = tokens_public_1.createToken({
            name: "NewLine",
            pattern: /(\n|\r|\r\n)/
        });
        var Five = tokens_public_1.createToken({
            name: "Five",
            pattern: function (text, offset) {
                return /5/.exec(text);
            }
        });
        expect(function () { return new lexer_public_1.Lexer([Five, NewLine]); }).to.not.throw();
        expect(console.warn).to.have.been.called;
        expect(consoleWarnSpy.args[0][0]).to.include("Warning: A Custom Token Pattern should specify the <line_breaks> option");
    });
    it("report custom patterns without 'start_chars_hint'", function () {
        var One = tokens_public_1.createToken({
            name: "One",
            pattern: function (text, offset) {
                return /1/.exec(text);
            }
        });
        expect(function () {
            return new lexer_public_1.Lexer([One], {
                ensureOptimizations: true,
                positionTracking: "onlyOffset"
            });
        }).to.throw("Lexer Modes: < defaultMode > cannot be optimized.");
        expect(console.error).to.have.been.called;
        expect(consoleErrorSpy.args[0][0]).to.include("TokenType: <One> is using a custom token pattern without providing <start_chars_hint>");
    });
    it("Will report mutually exclusive safeMode and ensureOptimizations flags", function () {
        // using new RegExp() to avoid IE 11 syntax errors
        var One = tokens_public_1.createToken({ name: "One", pattern: new RegExp("1", "u") });
        expect(function () {
            return new lexer_public_1.Lexer([One], {
                safeMode: true,
                ensureOptimizations: true,
                positionTracking: "onlyOffset"
            });
        }).to.throw('"safeMode" and "ensureOptimizations" flags are mutually exclusive.');
    });
    it("won't pack first char optimizations array for too large arrays", function () {
        // without hints we expect the lexer
        var PileOfPooNoHints = tokens_public_1.createToken({
            name: "PileOfPoo",
            pattern: /💩/
        });
        var pooLexerNoHints = new lexer_public_1.Lexer([PileOfPooNoHints], {
            positionTracking: "onlyOffset"
        });
        expect(utils_1.keys(pooLexerNoHints.charCodeToPatternIdxToConfig.defaultMode).length).to.equal("💩".charCodeAt(0) + 1);
        var PileOfPoo = tokens_public_1.createToken({
            name: "PileOfPoo",
            pattern: /💩/,
            start_chars_hint: [100000]
        });
        var pooLexer = new lexer_public_1.Lexer([PileOfPoo], {
            positionTracking: "onlyOffset"
        });
        expect(utils_1.keys(pooLexer.charCodeToPatternIdxToConfig.defaultMode)
            .length).to.equal(1);
    });
    it("won't optimize with safe mode enabled", function () {
        var Alpha = tokens_public_1.createToken({
            name: "A",
            pattern: /a/
        });
        var alphaLexerSafeMode = new lexer_public_1.Lexer([Alpha], {
            positionTracking: "onlyOffset",
            safeMode: true
        });
        expect(alphaLexerSafeMode.charCodeToPatternIdxToConfig.defaultMode).to.be.empty;
        // compare to safeMode disabled
        var alphaLexerNoSafeMode = new lexer_public_1.Lexer([Alpha], {
            positionTracking: "onlyOffset"
        });
        expect(alphaLexerNoSafeMode.charCodeToPatternIdxToConfig
            .defaultMode[97][0].tokenType).to.equal(Alpha);
    });
});
function wrapWithCustom(baseExtendToken) {
    return function () {
        var newToken = baseExtendToken.apply(null, arguments);
        var pattern = newToken.PATTERN;
        if (utils_1.isRegExp(pattern) &&
            !/\\n|\\r|\\s/g.test(pattern.source) &&
            pattern !== lexer_public_1.Lexer.NA) {
            newToken.PATTERN = function (text, offset) {
                // can't use sticky here because tests on node.js version 4 won't pass.
                var withStart = lexer_1.addStartOfInput(pattern);
                var execResult = withStart.exec(text.substring(offset));
                return execResult;
            };
            newToken.LINE_BREAKS = newToken.LINE_BREAKS === true;
        }
        return newToken;
    };
}
defineLexerSpecs("Regular Tokens Mode", tokens_public_1.createToken, tokens_1.tokenStructuredMatcher, false, { positionTracking: "full" });
defineLexerSpecs("Regular Tokens Mode (custom mode)", wrapWithCustom(tokens_public_1.createToken), tokens_1.tokenStructuredMatcher, true, { positionTracking: "full" });
defineLexerSpecs("Regular Tokens Mode - only start", tokens_public_1.createToken, tokens_1.tokenStructuredMatcher, false, { positionTracking: "onlyStart" });
defineLexerSpecs("Regular Tokens Mode (custom mode) - only start", wrapWithCustom(tokens_public_1.createToken), tokens_1.tokenStructuredMatcher, true, { positionTracking: "onlyStart" });
defineLexerSpecs("Regular Tokens Mode - onlyOffset", tokens_public_1.createToken, tokens_1.tokenStructuredMatcher, false, { positionTracking: "onlyOffset" });
defineLexerSpecs("Regular Tokens Mode (custom mode)", wrapWithCustom(tokens_public_1.createToken), tokens_1.tokenStructuredMatcher, true, { positionTracking: "onlyOffset" });
//# sourceMappingURL=lexer_spec.js.map