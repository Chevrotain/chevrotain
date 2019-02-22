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
var tokens_public_1 = require("../../src/scan/tokens_public");
var lexer_public_1 = require("../../src/scan/lexer_public");
var parser_traits_1 = require("../../src/parse/parser/traits/parser_traits");
var parser_1 = require("../../src/parse/parser/parser");
var exceptions_public_1 = require("../../src/parse/exceptions_public");
var tokens_1 = require("../../src/scan/tokens");
var matchers_1 = require("../utils/matchers");
function defineRecognizerSpecs(contextName, createToken, createTokenInstance, tokenMatcher) {
    context("Recognizer  " + contextName, function () {
        var PlusTok = createToken({ name: "PlusTok" });
        PlusTok.LABEL = "+";
        var MinusTok = createToken({ name: "MinusTok" });
        var IntTok = createToken({ name: "IntTok" });
        var DotTok = createToken({ name: "DotTok" });
        var IdentTok = createToken({ name: "IdentTok" });
        var ALL_TOKENS = [PlusTok, MinusTok, IntTok, IdentTok, DotTok];
        tokens_1.augmentTokenTypes(ALL_TOKENS);
        describe("The Parsing DSL", function () {
            it("provides a production SUBRULE1-5 that invokes another rule", function () {
                var SubRuleTestParser = /** @class */ (function (_super) {
                    __extends(SubRuleTestParser, _super);
                    function SubRuleTestParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                        _this.result = "";
                        _this.index = 1;
                        _this.topRule = _this.RULE("topRule", function () {
                            _this.SUBRULE1(_this.subRule);
                            _this.SUBRULE2(_this.subRule);
                            _this.SUBRULE3(_this.subRule);
                            _this.SUBRULE4(_this.subRule);
                            _this.SUBRULE5(_this.subRule);
                            return _this.result;
                        });
                        _this.subRule = _this.RULE("subRule", function () {
                            _this.CONSUME(PlusTok);
                            _this.result += _this.index++;
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return SubRuleTestParser;
                }(parser_traits_1.Parser));
                var input = [
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok)
                ];
                var parser = new SubRuleTestParser(input);
                var result = parser.topRule();
                expect(result).to.equal("12345");
            });
            it("provides a production SUBRULE1-5 that can accept arguments from its caller", function () {
                var SubRuleArgsParser = /** @class */ (function (_super) {
                    __extends(SubRuleArgsParser, _super);
                    function SubRuleArgsParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                        _this.numbers = "";
                        _this.letters = "";
                        _this.topRule = _this.RULE("topRule", function () {
                            _this.SUBRULE(_this.subRule, { ARGS: [6, "a"] });
                            _this.SUBRULE1(_this.subRule2, { ARGS: [5, "b"] });
                            _this.SUBRULE2(_this.subRule, { ARGS: [4, "c"] });
                            _this.SUBRULE3(_this.subRule, { ARGS: [3, "d"] });
                            _this.SUBRULE4(_this.subRule, { ARGS: [2, "e"] });
                            _this.SUBRULE5(_this.subRule, { ARGS: [1, "f"] });
                            return {
                                numbers: _this.numbers,
                                letters: _this.letters
                            };
                        });
                        _this.subRule = _this.RULE("subRule", function (numFromCaller, charFromCaller) {
                            _this.CONSUME(PlusTok);
                            _this.numbers += numFromCaller;
                            _this.letters += charFromCaller;
                        });
                        _this.subRule2 = _this.RULE("subRule2", function (numFromCaller, charFromCaller) {
                            _this.CONSUME(PlusTok);
                            _this.numbers += numFromCaller;
                            _this.letters += charFromCaller;
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return SubRuleArgsParser;
                }(parser_traits_1.Parser));
                var input = [
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok)
                ];
                var parser = new SubRuleArgsParser(input);
                var result = parser.topRule();
                expect(result.letters).to.equal("abcdef");
                expect(result.numbers).to.equal("654321");
            });
            describe("supports EMPTY(...) alternative convenience function", function () {
                var EmptyAltParser = /** @class */ (function (_super) {
                    __extends(EmptyAltParser, _super);
                    function EmptyAltParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                        _this.orRule = _this.RULE("orRule", _this.parseOrRule);
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    EmptyAltParser.prototype.parseOrRule = function () {
                        var _this = this;
                        return this.OR7([
                            {
                                ALT: function () {
                                    _this.CONSUME1(PlusTok);
                                    return "+";
                                }
                            },
                            {
                                ALT: function () {
                                    _this.CONSUME1(MinusTok);
                                    return "-";
                                }
                            },
                            {
                                ALT: parser_1.EMPTY_ALT("EMPTY_ALT")
                            }
                        ]);
                    };
                    return EmptyAltParser;
                }(parser_traits_1.Parser));
                it("can match an non-empty alternative in an OR with an empty alternative", function () {
                    var input = [createTokenInstance(PlusTok)];
                    var parser = new EmptyAltParser(input);
                    expect(parser.orRule()).to.equal("+");
                });
                it("can match an empty alternative", function () {
                    var input = [];
                    var parser = new EmptyAltParser(input);
                    expect(parser.orRule()).to.equal("EMPTY_ALT");
                });
                it("has a utility function for defining EMPTY ALTERNATIVES", function () {
                    var noArgsEmptyAlt = parser_1.EMPTY_ALT();
                    expect(noArgsEmptyAlt()).to.be.undefined;
                    var valueEmptyAlt = parser_1.EMPTY_ALT(666);
                    expect(valueEmptyAlt()).to.equal(666);
                });
            });
        });
        describe("Token categories support", function () {
            it("Can consume a Token that belongs to multiple categories", function () {
                var Keyword = createToken({ name: "Keyword" });
                var Literal = createToken({ name: "Literal" });
                var TrueLiteral = createToken({
                    name: "TrueLiteral",
                    categories: [Keyword, Literal]
                });
                var CategoriesParser = /** @class */ (function (_super) {
                    __extends(CategoriesParser, _super);
                    function CategoriesParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, [Keyword, Literal], {}) || this;
                        _this.keyRule = _this.RULE("keyRule", function () {
                            _this.CONSUME(Keyword);
                        });
                        _this.litRule = _this.RULE("litRule", function () {
                            _this.CONSUME(Literal);
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return CategoriesParser;
                }(parser_traits_1.Parser));
                var parser = new CategoriesParser([]);
                parser.input = [createTokenInstance(TrueLiteral)];
                parser.keyRule();
                expect(parser.errors).to.be.empty;
                parser.input = [createTokenInstance(TrueLiteral)];
                parser.litRule();
                expect(parser.errors).to.be.empty;
            });
        });
        describe("The Error Recovery functionality of the Chevrotain Parser", function () {
            var ManyRepetitionRecovery = /** @class */ (function (_super) {
                __extends(ManyRepetitionRecovery, _super);
                function ManyRepetitionRecovery(input, isErrorRecoveryEnabled) {
                    if (input === void 0) { input = []; }
                    if (isErrorRecoveryEnabled === void 0) { isErrorRecoveryEnabled = true; }
                    var _this = _super.call(this, ALL_TOKENS, {
                        outputCst: false,
                        recoveryEnabled: isErrorRecoveryEnabled
                    }) || this;
                    _this.qualifiedName = _this.RULE("qualifiedName", _this.parseQualifiedName, {
                        recoveryValueFunc: function () { return ["666"]; }
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                ManyRepetitionRecovery.prototype.parseQualifiedName = function () {
                    var _this = this;
                    var idents = [];
                    idents.push(this.CONSUME1(IdentTok).image);
                    this.MANY({
                        DEF: function () {
                            _this.CONSUME1(DotTok);
                            idents.push(_this.CONSUME2(IdentTok).image);
                        }
                    });
                    this.CONSUME1(tokens_public_1.EOF);
                    return idents;
                };
                return ManyRepetitionRecovery;
            }(parser_traits_1.Parser));
            var ManySepRepetitionRecovery = /** @class */ (function (_super) {
                __extends(ManySepRepetitionRecovery, _super);
                function ManySepRepetitionRecovery(input, isErrorRecoveryEnabled) {
                    if (input === void 0) { input = []; }
                    if (isErrorRecoveryEnabled === void 0) { isErrorRecoveryEnabled = true; }
                    var _this = _super.call(this, ALL_TOKENS, {
                        outputCst: false,
                        recoveryEnabled: isErrorRecoveryEnabled
                    }) || this;
                    _this.qualifiedName = _this.RULE("qualifiedName", _this.parseQualifiedName, {
                        recoveryValueFunc: function () { return ["333"]; }
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                ManySepRepetitionRecovery.prototype.parseQualifiedName = function () {
                    var _this = this;
                    var idents = [];
                    idents.push(this.CONSUME1(IdentTok).image);
                    this.CONSUME1(DotTok);
                    this.MANY_SEP({
                        SEP: DotTok,
                        DEF: function () {
                            idents.push(_this.CONSUME2(IdentTok).image);
                        }
                    });
                    this.CONSUME1(tokens_public_1.EOF);
                    return idents;
                };
                return ManySepRepetitionRecovery;
            }(parser_traits_1.Parser));
            var ManySepSubRuleRepetitionRecovery = /** @class */ (function (_super) {
                __extends(ManySepSubRuleRepetitionRecovery, _super);
                function ManySepSubRuleRepetitionRecovery(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, {
                        outputCst: false,
                        recoveryEnabled: true
                    }) || this;
                    _this.qualifiedName = _this.RULE("qualifiedName", _this.parseQualifiedName);
                    _this.identifier = _this.RULE("identifier", _this.parseIdentifier);
                    _this.idents = [];
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                ManySepSubRuleRepetitionRecovery.prototype.parseQualifiedName = function () {
                    var _this = this;
                    this.idents = [];
                    this.MANY_SEP({
                        SEP: DotTok,
                        DEF: function () {
                            _this.SUBRULE(_this.identifier);
                        }
                    });
                    this.CONSUME1(tokens_public_1.EOF);
                    return this.idents;
                };
                ManySepSubRuleRepetitionRecovery.prototype.parseIdentifier = function () {
                    this.idents.push(this.CONSUME1(IdentTok).image);
                };
                ManySepSubRuleRepetitionRecovery.prototype.canTokenTypeBeInsertedInRecovery = function (tokClass) {
                    // this parser is meant to test a scenario with re-sync recovery and MANY_SEP --> disable TokenInsertion
                    return false;
                };
                return ManySepSubRuleRepetitionRecovery;
            }(parser_traits_1.Parser));
            var AtLeastOneRepetitionRecovery = /** @class */ (function (_super) {
                __extends(AtLeastOneRepetitionRecovery, _super);
                function AtLeastOneRepetitionRecovery(input, isErrorRecoveryEnabled) {
                    if (input === void 0) { input = []; }
                    if (isErrorRecoveryEnabled === void 0) { isErrorRecoveryEnabled = true; }
                    var _this = _super.call(this, ALL_TOKENS, {
                        outputCst: false,
                        recoveryEnabled: isErrorRecoveryEnabled
                    }) || this;
                    _this.qualifiedName = _this.RULE("qualifiedName", _this.parseQualifiedName, {
                        recoveryValueFunc: function () { return ["777"]; }
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                AtLeastOneRepetitionRecovery.prototype.parseQualifiedName = function () {
                    var _this = this;
                    var idents = [];
                    idents.push(this.CONSUME1(IdentTok).image);
                    this.AT_LEAST_ONE({
                        DEF: function () {
                            _this.CONSUME1(DotTok);
                            idents.push(_this.CONSUME2(IdentTok).image);
                        },
                        ERR_MSG: "bamba"
                    });
                    this.CONSUME1(tokens_public_1.EOF);
                    return idents;
                };
                return AtLeastOneRepetitionRecovery;
            }(parser_traits_1.Parser));
            var AtLeastOneSepRepetitionRecovery = /** @class */ (function (_super) {
                __extends(AtLeastOneSepRepetitionRecovery, _super);
                function AtLeastOneSepRepetitionRecovery(input, isErrorRecoveryEnabled) {
                    if (input === void 0) { input = []; }
                    if (isErrorRecoveryEnabled === void 0) { isErrorRecoveryEnabled = true; }
                    var _this = _super.call(this, ALL_TOKENS, {
                        outputCst: false,
                        recoveryEnabled: isErrorRecoveryEnabled
                    }) || this;
                    _this.qualifiedName = _this.RULE("qualifiedName", _this.parseQualifiedName, {
                        recoveryValueFunc: function () { return ["999"]; }
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                AtLeastOneSepRepetitionRecovery.prototype.parseQualifiedName = function () {
                    var _this = this;
                    var idents = [];
                    this.AT_LEAST_ONE_SEP({
                        SEP: DotTok,
                        DEF: function () {
                            idents.push(_this.CONSUME1(IdentTok).image);
                        }
                    });
                    this.CONSUME1(tokens_public_1.EOF);
                    return idents;
                };
                return AtLeastOneSepRepetitionRecovery;
            }(parser_traits_1.Parser));
            it("can CONSUME tokens with an index specifying the occurrence for the specific token in the current rule", function () {
                var parser = new parser_traits_1.Parser(ALL_TOKENS, {
                    outputCst: false,
                    recoveryEnabled: true
                });
                parser.reset();
                var testInput = [
                    createTokenInstance(IntTok, "1"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(IntTok, "2"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(IntTok, "3")
                ];
                parser.input = testInput;
                expect(parser.CONSUME4(IntTok)).to.equal(testInput[0]);
                expect(parser.CONSUME2(PlusTok)).to.equal(testInput[1]);
                expect(parser.CONSUME1(IntTok)).to.equal(testInput[2]);
                expect(parser.CONSUME3(PlusTok)).to.equal(testInput[3]);
                expect(parser.CONSUME1(IntTok)).to.equal(testInput[4]);
                expect(tokenMatcher(parser.LA(1), tokens_public_1.EOF));
            });
            it("will not perform inRepetition recovery while in backtracking mode", function () {
                var parser = new parser_traits_1.Parser([PlusTok], {});
                parser.isBackTrackingStack.push(1);
                expect(parser.shouldInRepetitionRecoveryBeTried(MinusTok, 1)).to.equal(false);
            });
            it("can perform in-repetition recovery for MANY grammar rule", function () {
                // a.b+.c
                var input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "c")
                ];
                var parser = new ManyRepetitionRecovery(input);
                expect(parser.qualifiedName()).to.deep.equal(["a", "b", "c"]);
                expect(parser.errors.length).to.equal(1);
            });
            it("can disable in-repetition recovery for MANY grammar rule", function () {
                // a.b+.c
                var input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "c")
                ];
                var parser = new ManyRepetitionRecovery(input, false);
                expect(parser.qualifiedName()).to.deep.equal(["666"]);
                expect(parser.errors.length).to.equal(1);
            });
            it("can perform in-repetition recovery for MANY_SEP grammar rule", function () {
                // a.b+.c
                var input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "c")
                ];
                var parser = new ManySepRepetitionRecovery(input);
                expect(parser.qualifiedName()).to.deep.equal(["a", "b", "c"]);
                expect(parser.errors.length).to.equal(1);
            });
            it("can disable in-repetition recovery for MANY_SEP grammar rule", function () {
                // a.b+.c
                var input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "c")
                ];
                var parser = new ManySepRepetitionRecovery(input, false);
                expect(parser.qualifiedName()).to.deep.equal(["333"]);
                expect(parser.errors.length).to.equal(1);
            });
            it("can perform in-repetition recovery for MANY_SEP grammar rule #2", function () {
                // a.b..c...d
                var input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b")
                ];
                var parser = new ManySepSubRuleRepetitionRecovery(input);
                expect(parser.qualifiedName()).to.deep.equal(["a", "b"]);
                expect(parser.errors.length).to.equal(2);
            });
            it("can perform in-repetition recovery for AT_LEAST_ONE grammar rule", function () {
                // a.b+.c
                var input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "c")
                ];
                var parser = new AtLeastOneRepetitionRecovery(input);
                expect(parser.qualifiedName()).to.deep.equal(["a", "b", "c"]);
                expect(parser.errors.length).to.equal(1);
            });
            it("can disable in-repetition recovery for AT_LEAST_ONE grammar rule", function () {
                // a.b+.c
                var input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "c")
                ];
                var parser = new AtLeastOneRepetitionRecovery(input, false);
                expect(parser.qualifiedName()).to.deep.equal(["777"]);
                expect(parser.errors.length).to.equal(1);
            });
            it("can perform in-repetition recovery for AT_LEAST_ONE_SEP grammar rule", function () {
                // a.b+.c
                var input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "c")
                ];
                var parser = new AtLeastOneSepRepetitionRecovery(input);
                expect(parser.qualifiedName()).to.deep.equal(["a", "b", "c"]);
                expect(parser.errors.length).to.equal(1);
            });
            it("can disable in-repetition recovery for AT_LEAST_ONE_SEP grammar rule", function () {
                // a.b+.c
                var input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "c")
                ];
                var parser = new AtLeastOneSepRepetitionRecovery(input, false);
                expect(parser.qualifiedName()).to.deep.equal(["999"]);
                expect(parser.errors.length).to.equal(1);
            });
            it("can perform single Token insertion", function () {
                var A = createToken({ name: "A", pattern: /A/ });
                var B = createToken({ name: "B", pattern: /B/ });
                var C = createToken({ name: "C", pattern: /C/ });
                var allTokens = [A, B, C];
                var lexer = new lexer_public_1.Lexer(allTokens, {
                    positionTracking: "onlyOffset"
                });
                var SingleTokenInsertRegular = /** @class */ (function (_super) {
                    __extends(SingleTokenInsertRegular, _super);
                    function SingleTokenInsertRegular(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, allTokens, {
                            outputCst: false,
                            recoveryEnabled: true
                        }) || this;
                        _this.topRule = _this.RULE("topRule", function () {
                            _this.CONSUME(A);
                            var insertedToken = _this.CONSUME(B);
                            _this.CONSUME(C);
                            return insertedToken;
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return SingleTokenInsertRegular;
                }(parser_traits_1.Parser));
                var lexResult = lexer.tokenize("AC");
                var parser = new SingleTokenInsertRegular(lexResult.tokens);
                var insertedToken = parser.topRule();
                expect(insertedToken.isInsertedInRecovery).to.be.true;
                expect(insertedToken.image).to.equal("");
                expect(insertedToken.startOffset).to.be.NaN;
                expect(insertedToken.endOffset).to.be.NaN;
                expect(insertedToken.startLine).to.be.NaN;
                expect(insertedToken.endLine).to.be.NaN;
                expect(insertedToken.startColumn).to.be.NaN;
                expect(insertedToken.endColumn).to.be.NaN;
            });
        });
        describe("The Parsing DSL methods are expressions", function () {
            it("OR will return the chosen alternative's grammar action's returned value", function () {
                var OrExpressionParser = /** @class */ (function (_super) {
                    __extends(OrExpressionParser, _super);
                    function OrExpressionParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                        _this.or = _this.RULE("or", function () {
                            return _this.OR([
                                {
                                    ALT: function () {
                                        _this.CONSUME1(MinusTok);
                                        return 666;
                                    }
                                },
                                {
                                    ALT: function () {
                                        _this.CONSUME1(PlusTok);
                                        return "bamba";
                                    }
                                }
                            ]);
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return OrExpressionParser;
                }(parser_traits_1.Parser));
                var parser = new OrExpressionParser([]);
                parser.input = [createTokenInstance(MinusTok)];
                expect(parser.or()).to.equal(666);
                parser.input = [createTokenInstance(PlusTok)];
                expect(parser.or()).to.equal("bamba");
            });
            it("OPTION will return the grammar action value or undefined if the option was not taken", function () {
                var OptionExpressionParser = /** @class */ (function (_super) {
                    __extends(OptionExpressionParser, _super);
                    function OptionExpressionParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                        _this.option = _this.RULE("option", function () {
                            return _this.OPTION(function () {
                                _this.CONSUME(IdentTok);
                                return "bamba";
                            });
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return OptionExpressionParser;
                }(parser_traits_1.Parser));
                var parser = new OptionExpressionParser([]);
                parser.input = [createTokenInstance(IdentTok)];
                expect(parser.option()).to.equal("bamba");
                parser.input = [createTokenInstance(IntTok)];
                expect(parser.option()).to.be.undefined;
            });
        });
        describe("The BaseRecognizer", function () {
            it("Cannot be initialized with a token vector (pre v4.0 API) ", function () {
                expect(function () { return new parser_traits_1.Parser([createTokenInstance(PlusTok)]); }).to.throw("The Parser constructor no longer accepts a token vector as the first argument");
            });
            it("Cannot be initialized with an empty Token vocabulary", function () {
                expect(function () { return new parser_traits_1.Parser([]); }).to.throw("A Token Vocabulary cannot be empty");
            });
            it("can only SAVE_ERROR for recognition exceptions", function () {
                var parser = new parser_traits_1.Parser([IntTok]);
                expect(function () {
                    return parser.SAVE_ERROR(new Error("I am some random Error"));
                }).to.throw("Trying to save an Error which is not a RecognitionException");
                expect(parser.input).to.be.an.instanceof(Array);
            });
            it("when it runs out of input EOF will be returned", function () {
                var parser = new parser_traits_1.Parser([IntTok, PlusTok], {
                    outputCst: false
                });
                parser.input = [
                    createTokenInstance(IntTok, "1"),
                    createTokenInstance(PlusTok)
                ];
                parser.CONSUME(IntTok);
                parser.CONSUME(PlusTok);
                expect(tokenMatcher(parser.LA(1), tokens_public_1.EOF));
                expect(tokenMatcher(parser.LA(1), tokens_public_1.EOF));
                expect(tokenMatcher(parser.SKIP_TOKEN(), tokens_public_1.EOF));
                expect(tokenMatcher(parser.SKIP_TOKEN(), tokens_public_1.EOF));
                // and we can go on and on and on... this avoid returning null/undefined
                // see: https://en.wikipedia.org/wiki/Tony_Hoare#Apologies_and_retractions
            });
            it("invoking an OPTION will return the inner grammar action's value or undefined", function () {
                var OptionsReturnValueParser = /** @class */ (function (_super) {
                    __extends(OptionsReturnValueParser, _super);
                    function OptionsReturnValueParser(input) {
                        if (input === void 0) { input = [createTokenInstance(IntTok, "666")]; }
                        var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                        _this.trueOptionRule = _this.RULE("trueOptionRule", function () {
                            return _this.OPTION({
                                GATE: function () { return true; },
                                DEF: function () {
                                    _this.CONSUME(IntTok);
                                    return true;
                                }
                            });
                        });
                        _this.falseOptionRule = _this.RULE("falseOptionRule", function () {
                            return _this.OPTION({
                                GATE: function () { return false; },
                                DEF: function () {
                                    _this.CONSUME(IntTok);
                                    return false;
                                }
                            });
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return OptionsReturnValueParser;
                }(parser_traits_1.Parser));
                var successfulOption = new OptionsReturnValueParser().trueOptionRule();
                expect(successfulOption).to.equal(true);
                var failedOption = new OptionsReturnValueParser().falseOptionRule();
                expect(failedOption).to.equal(undefined);
            });
            it("will return false if a RecognitionException is thrown during backtracking and rethrow any other kind of Exception", function () {
                var parser = new parser_traits_1.Parser([IntTok]);
                var backTrackingThrows = parser.BACKTRACK(function () {
                    throw new Error("division by zero, boom");
                }, function () {
                    return true;
                });
                expect(function () { return backTrackingThrows.call(parser); }).to.throw("division by zero, boom");
                var throwsRecogError = function () {
                    throw new exceptions_public_1.NotAllInputParsedException("sad sad panda", createTokenInstance(PlusTok));
                };
                var backTrackingFalse = parser.BACKTRACK(throwsRecogError, function () {
                    return true;
                });
                expect(backTrackingFalse.call(parser)).to.equal(false);
            });
        });
        describe("The BaseRecognizer", function () {
            it("Will throw an error is performSelfAnalysis is called before all the rules have been defined", function () {
                var WrongOrderOfSelfAnalysisParser = /** @class */ (function (_super) {
                    __extends(WrongOrderOfSelfAnalysisParser, _super);
                    function WrongOrderOfSelfAnalysisParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, ALL_TOKENS) || this;
                        _this.input = input;
                        _this.RULE("goodRule", function () {
                            _this.CONSUME(IntTok);
                        });
                        _this.performSelfAnalysis();
                        _this.RULE("badRule", function () {
                            _this.CONSUME(IntTok);
                        });
                        return _this;
                    }
                    return WrongOrderOfSelfAnalysisParser;
                }(parser_traits_1.Parser));
                expect(function () { return new WrongOrderOfSelfAnalysisParser(); }).to.throw("Grammar rule <badRule> may not be defined after the 'performSelfAnalysis' method has been called");
            });
            it("Will throw an error is performSelfAnalysis is called before all the rules have been defined - static invocation", function () {
                var WrongOrderOfSelfAnalysisParser = /** @class */ (function (_super) {
                    __extends(WrongOrderOfSelfAnalysisParser, _super);
                    function WrongOrderOfSelfAnalysisParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, ALL_TOKENS) || this;
                        _this.input = input;
                        _this.RULE("goodRule", function () {
                            _this.CONSUME(IntTok);
                        });
                        parser_traits_1.Parser.performSelfAnalysis(_this);
                        _this.RULE("badRule", function () {
                            _this.CONSUME(IntTok);
                        });
                        return _this;
                    }
                    return WrongOrderOfSelfAnalysisParser;
                }(parser_traits_1.Parser));
                expect(function () { return new WrongOrderOfSelfAnalysisParser(); }).to.throw("Grammar rule <badRule> may not be defined after the 'performSelfAnalysis' method has been called");
            });
            describe("Parser Level Validations", function () {
                before(function () {
                    var MyNoneUniqueSpecialParser = /** @class */ (function (_super) {
                        __extends(MyNoneUniqueSpecialParser, _super);
                        function MyNoneUniqueSpecialParser(input) {
                            if (input === void 0) { input = []; }
                            var _this = _super.call(this, ALL_TOKENS) || this;
                            _this.input = input;
                            _this.performSelfAnalysis();
                            return _this;
                        }
                        return MyNoneUniqueSpecialParser;
                    }(parser_traits_1.Parser));
                    // init the first parser
                    new MyNoneUniqueSpecialParser([]);
                });
            });
            it("can be initialized with a vector of Tokens", function () {
                var parser = new parser_traits_1.Parser([PlusTok, MinusTok, IntTok]);
                var tokensMap = parser.tokensMap;
                expect(tokensMap.PlusTok).to.equal(PlusTok);
                expect(tokensMap.MinusTok).to.equal(MinusTok);
                expect(tokensMap.IntTok).to.equal(IntTok);
            });
            it("can be initialized with a Dictionary of Tokens", function () {
                var initTokenDictionary = {
                    PlusTok: PlusTok,
                    MinusTok: MinusTok,
                    IntToken: IntTok
                };
                var parser = new parser_traits_1.Parser({
                    PlusTok: PlusTok,
                    MinusTok: MinusTok,
                    IntToken: IntTok
                });
                var tokensMap = parser.tokensMap;
                // the implementation should clone the dictionary to avoid bugs caused by mutability
                expect(tokensMap).not.to.equal(initTokenDictionary);
                expect(tokensMap.PlusTok).to.equal(PlusTok);
                expect(tokensMap.MinusTok).to.equal(MinusTok);
                expect(tokensMap.IntToken).to.equal(IntTok);
            });
            it("can be initialized with a IMultiModeLexerDefinition of Tokens", function () {
                var multiModeLexerDef = {
                    modes: {
                        bamba: [PlusTok],
                        bisli: [MinusTok, IntTok]
                    },
                    defaultMode: "bisli"
                };
                var parser = new parser_traits_1.Parser(multiModeLexerDef);
                var tokensMap = parser.tokensMap;
                // the implementation should clone the dictionary to avoid bugs caused by mutability
                expect(tokensMap).not.to.equal(multiModeLexerDef);
                expect(tokensMap.PlusTok).to.equal(PlusTok);
                expect(tokensMap.MinusTok).to.equal(MinusTok);
                expect(tokensMap.IntTok).to.equal(IntTok);
            });
            it("cannot be initialized with other parameters", function () {
                expect(function () {
                    return new parser_traits_1.Parser(null);
                }).to.throw();
                expect(function () {
                    return new parser_traits_1.Parser(666);
                }).to.throw();
                expect(function () {
                    return new parser_traits_1.Parser("woof woof");
                }).to.throw();
            });
            it("will not swallow none Recognizer errors when attempting 'in rule error recovery'", function () {
                var NotSwallowInRuleParser = /** @class */ (function (_super) {
                    __extends(NotSwallowInRuleParser, _super);
                    function NotSwallowInRuleParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, ALL_TOKENS, {
                            recoveryEnabled: true
                        }) || this;
                        _this.someRule = _this.RULE("someRule", function () {
                            _this.CONSUME1(DotTok);
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return NotSwallowInRuleParser;
                }(parser_traits_1.Parser));
                var parser = new NotSwallowInRuleParser([
                    createTokenInstance(IntTok, "1")
                ]);
                parser.tryInRuleRecovery = function () {
                    throw Error("oops");
                };
                expect(function () { return parser.someRule(); }).to.throw("oops");
            });
            it("will not swallow none Recognizer errors during Token consumption", function () {
                var NotSwallowInTokenConsumption = /** @class */ (function (_super) {
                    __extends(NotSwallowInTokenConsumption, _super);
                    function NotSwallowInTokenConsumption(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, ALL_TOKENS, {
                            recoveryEnabled: true
                        }) || this;
                        _this.someRule = _this.RULE("someRule", function () {
                            _this.CONSUME1(DotTok);
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return NotSwallowInTokenConsumption;
                }(parser_traits_1.Parser));
                var parser = new NotSwallowInTokenConsumption([
                    createTokenInstance(IntTok, "1")
                ]);
                parser.consumeInternal = function () {
                    throw Error("oops");
                };
                expect(function () { return parser.someRule(); }).to.throw("oops");
            });
            it("will rethrow none Recognizer errors during Token consumption - recovery disabled + nested rule", function () {
                var RethrowOtherErrors = /** @class */ (function (_super) {
                    __extends(RethrowOtherErrors, _super);
                    function RethrowOtherErrors(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, ALL_TOKENS, {
                            recoveryEnabled: true
                        }) || this;
                        _this.someRule = _this.RULE("someRule", function () {
                            expect(function () {
                                return _this.SUBRULE(_this.someNestedRule);
                            }).to.throw("Expecting token of type --> DotTok <--");
                        });
                        _this.someNestedRule = _this.RULE("someNestedRule", function () {
                            _this.CONSUME1(DotTok);
                            _this.CONSUME1(IdentTok);
                        }, {
                            resyncEnabled: false
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return RethrowOtherErrors;
                }(parser_traits_1.Parser));
                var parser = new RethrowOtherErrors([
                    createTokenInstance(IntTok, "1")
                ]);
                parser.someRule();
            });
            it("Will use Token LABELS for mismatch error messages when available", function () {
                var LabelTokParser = /** @class */ (function (_super) {
                    __extends(LabelTokParser, _super);
                    function LabelTokParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, [PlusTok, MinusTok]) || this;
                        _this.rule = _this.RULE("rule", function () {
                            _this.CONSUME1(PlusTok);
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return LabelTokParser;
                }(parser_traits_1.Parser));
                var parser = new LabelTokParser([createTokenInstance(MinusTok)]);
                parser.rule();
                expect(parser.errors[0]).to.be.an.instanceof(exceptions_public_1.MismatchedTokenException);
                expect(parser.errors[0].message).to.include("+");
                expect(parser.errors[0].message).to.not.include("token of type");
            });
            it("Will not use Token LABELS for mismatch error messages when unavailable", function () {
                var NoLabelTokParser = /** @class */ (function (_super) {
                    __extends(NoLabelTokParser, _super);
                    function NoLabelTokParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, [PlusTok, MinusTok]) || this;
                        _this.rule = _this.RULE("rule", function () {
                            _this.CONSUME1(MinusTok);
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return NoLabelTokParser;
                }(parser_traits_1.Parser));
                var parser = new NoLabelTokParser([
                    createTokenInstance(PlusTok)
                ]);
                parser.rule();
                expect(parser.errors[0]).to.be.an.instanceof(exceptions_public_1.MismatchedTokenException);
                expect(parser.errors[0].message).to.include("MinusTok");
                expect(parser.errors[0].message).to.include("token of type");
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule"
                ]);
            });
            it("Supports custom overriding of the mismatch token error message", function () {
                var SemiColon = createToken({ name: "SemiColon" });
                var CustomConsumeErrorParser = /** @class */ (function (_super) {
                    __extends(CustomConsumeErrorParser, _super);
                    function CustomConsumeErrorParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, [SemiColon]) || this;
                        _this.myStatement = _this.RULE("myStatement", function () {
                            _this.CONSUME1(SemiColon, {
                                ERR_MSG: "expecting semiColon at end of myStatement"
                            });
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return CustomConsumeErrorParser;
                }(parser_traits_1.Parser));
                var parser = new CustomConsumeErrorParser([
                    createTokenInstance(PlusTok)
                ]);
                parser.myStatement();
                expect(parser.errors[0]).to.be.an.instanceof(exceptions_public_1.MismatchedTokenException);
                expect(parser.errors[0].message).to.equal("expecting semiColon at end of myStatement");
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "myStatement"
                ]);
            });
            it("Will use Token LABELS for noViableAlt error messages when unavailable", function () {
                var LabelAltParser = /** @class */ (function (_super) {
                    __extends(LabelAltParser, _super);
                    function LabelAltParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, [PlusTok, MinusTok]) || this;
                        _this.rule = _this.RULE("rule", function () {
                            _this.OR([
                                {
                                    ALT: function () {
                                        _this.CONSUME1(PlusTok);
                                    }
                                },
                                {
                                    ALT: function () {
                                        _this.CONSUME1(MinusTok);
                                    }
                                }
                            ]);
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return LabelAltParser;
                }(parser_traits_1.Parser));
                var parser = new LabelAltParser([]);
                parser.rule();
                expect(parser.errors[0]).to.be.an.instanceof(exceptions_public_1.NoViableAltException);
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule"
                ]);
                expect(parser.errors[0].message).to.include("MinusTok");
                expect(parser.errors[0].message).to.include("+");
                expect(parser.errors[0].message).to.not.include("PlusTok");
            });
            it("Will use Token LABELS for noViableAlt error messages when unavailable - nestedRuleNames", function () {
                var LabelAltParserNested = /** @class */ (function (_super) {
                    __extends(LabelAltParserNested, _super);
                    function LabelAltParserNested(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, [PlusTok, MinusTok], {
                            outputCst: true
                        }) || this;
                        _this.rule = _this.RULE("rule", function () {
                            _this.OR({
                                NAME: "$bamba",
                                DEF: [
                                    {
                                        ALT: function () {
                                            _this.CONSUME1(PlusTok);
                                        }
                                    },
                                    {
                                        ALT: function () {
                                            _this.CONSUME1(MinusTok);
                                        }
                                    }
                                ]
                            });
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return LabelAltParserNested;
                }(parser_traits_1.Parser));
                var parser = new LabelAltParserNested([]);
                parser.rule();
                expect(parser.errors[0]).to.be.an.instanceof(exceptions_public_1.NoViableAltException);
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule"
                ]);
                expect(parser.errors[0].message).to.include("MinusTok");
                expect(parser.errors[0].message).to.include("+");
                expect(parser.errors[0].message).to.not.include("PlusTok");
            });
            it("Will not throw a JS runtime exception on noViableAlt - issue #887", function () {
                var MaxlookaheadOneAlt = /** @class */ (function (_super) {
                    __extends(MaxlookaheadOneAlt, _super);
                    function MaxlookaheadOneAlt(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, [PlusTok, MinusTok], { maxLookahead: 1 }) || this;
                        _this.rule = _this.RULE("rule", function () {
                            _this.OR([
                                {
                                    ALT: function () {
                                        _this.CONSUME1(PlusTok);
                                    }
                                },
                                {
                                    ALT: function () {
                                        _this.CONSUME1(MinusTok);
                                    }
                                }
                            ]);
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return MaxlookaheadOneAlt;
                }(parser_traits_1.Parser));
                var parser = new MaxlookaheadOneAlt([]);
                parser.rule();
                expect(parser.errors[0]).to.be.an.instanceof(exceptions_public_1.NoViableAltException);
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule"
                ]);
                expect(parser.errors[0].message).to.include("MinusTok");
                expect(parser.errors[0].message).to.include("+");
                expect(parser.errors[0].message).to.not.include("PlusTok");
            });
            it("Supports custom error messages for OR", function () {
                var LabelAltParser2 = /** @class */ (function (_super) {
                    __extends(LabelAltParser2, _super);
                    function LabelAltParser2(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, [PlusTok, MinusTok], { outputCst: false }) || this;
                        _this.rule = _this.RULE("rule", function () {
                            _this.OR({
                                DEF: [
                                    {
                                        ALT: function () {
                                            _this.CONSUME1(PlusTok);
                                        }
                                    },
                                    {
                                        ALT: function () {
                                            _this.CONSUME1(MinusTok);
                                        }
                                    }
                                ],
                                ERR_MSG: "bisli"
                            });
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return LabelAltParser2;
                }(parser_traits_1.Parser));
                var parser = new LabelAltParser2([]);
                parser.rule();
                expect(parser.errors[0]).to.be.an.instanceof(exceptions_public_1.NoViableAltException);
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule"
                ]);
                expect(parser.errors[0].message).to.include("bisli");
            });
            it("Will include the ruleStack in a recognition Exception", function () {
                var NestedRulesParser = /** @class */ (function (_super) {
                    __extends(NestedRulesParser, _super);
                    function NestedRulesParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, [PlusTok, MinusTok]) || this;
                        _this.rule = _this.RULE("rule", function () {
                            _this.OPTION({
                                DEF: function () {
                                    _this.SUBRULE1(_this.rule2);
                                }
                            });
                        });
                        _this.rule2 = _this.RULE("rule2", function () {
                            _this.OPTION(function () {
                                _this.SUBRULE5(_this.rule3);
                            });
                        });
                        _this.rule3 = _this.RULE("rule3", function () {
                            _this.CONSUME1(MinusTok);
                            _this.CONSUME1(PlusTok);
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return NestedRulesParser;
                }(parser_traits_1.Parser));
                var parser = new NestedRulesParser([
                    createTokenInstance(MinusTok),
                    createTokenInstance(MinusTok)
                ]);
                parser.rule();
                expect(parser.errors[0]).to.be.an.instanceof(exceptions_public_1.MismatchedTokenException);
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule",
                    "rule2",
                    "rule3"
                ]);
                expect(parser.errors[0].context.ruleOccurrenceStack).to.deep.equal([0, 1, 5]);
            });
            it("Will build an error message for AT_LEAST_ONE automatically", function () {
                var ImplicitAtLeastOneErrParser = /** @class */ (function (_super) {
                    __extends(ImplicitAtLeastOneErrParser, _super);
                    function ImplicitAtLeastOneErrParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, [PlusTok, MinusTok]) || this;
                        _this.rule = _this.RULE("rule", function () {
                            _this.AT_LEAST_ONE(function () {
                                _this.SUBRULE(_this.rule2);
                            });
                        });
                        _this.rule2 = _this.RULE("rule2", function () {
                            _this.OR([
                                {
                                    ALT: function () {
                                        _this.CONSUME1(MinusTok);
                                    }
                                },
                                {
                                    ALT: function () {
                                        _this.CONSUME1(PlusTok);
                                    }
                                }
                            ]);
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return ImplicitAtLeastOneErrParser;
                }(parser_traits_1.Parser));
                var parser = new ImplicitAtLeastOneErrParser([
                    createTokenInstance(IntTok, "666"),
                    createTokenInstance(MinusTok),
                    createTokenInstance(MinusTok)
                ]);
                parser.rule();
                expect(parser.errors[0]).to.be.an.instanceof(exceptions_public_1.EarlyExitException);
                expect(parser.errors[0].message).to.contain("expecting at least one iteration");
                expect(parser.errors[0].message).to.contain("MinusTok");
                expect(parser.errors[0].message).to.contain("+");
                expect(parser.errors[0].message).to.contain("but found: '666'");
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule"
                ]);
            });
            it("supports custom error messages for AT_LEAST_ONE", function () {
                var ExplicitAtLeastOneErrParser = /** @class */ (function (_super) {
                    __extends(ExplicitAtLeastOneErrParser, _super);
                    function ExplicitAtLeastOneErrParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, [PlusTok, MinusTok]) || this;
                        _this.rule = _this.RULE("rule", function () {
                            _this.AT_LEAST_ONE({
                                DEF: function () {
                                    _this.SUBRULE(_this.rule2);
                                },
                                ERR_MSG: "bamba"
                            });
                        });
                        _this.rule2 = _this.RULE("rule2", function () {
                            _this.OR([
                                {
                                    ALT: function () {
                                        _this.CONSUME1(MinusTok);
                                    }
                                },
                                {
                                    ALT: function () {
                                        _this.CONSUME1(PlusTok);
                                    }
                                }
                            ]);
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return ExplicitAtLeastOneErrParser;
                }(parser_traits_1.Parser));
                var parser = new ExplicitAtLeastOneErrParser([
                    createTokenInstance(IntTok, "666"),
                    createTokenInstance(MinusTok),
                    createTokenInstance(MinusTok)
                ]);
                parser.rule();
                expect(parser.errors[0]).to.be.an.instanceof(exceptions_public_1.EarlyExitException);
                expect(parser.errors[0].message).to.contain("bamba");
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule"
                ]);
            });
            it("Will build an error message for AT_LEAST_ONE_SEP automatically", function () {
                var ImplicitAtLeastOneSepErrParser = /** @class */ (function (_super) {
                    __extends(ImplicitAtLeastOneSepErrParser, _super);
                    function ImplicitAtLeastOneSepErrParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, [PlusTok, MinusTok, IdentTok]) || this;
                        _this.rule = _this.RULE("rule", function () {
                            _this.AT_LEAST_ONE_SEP({
                                SEP: IdentTok,
                                DEF: function () {
                                    _this.SUBRULE(_this.rule2);
                                }
                            });
                        });
                        _this.rule2 = _this.RULE("rule2", function () {
                            _this.OR([
                                {
                                    ALT: function () {
                                        _this.CONSUME1(MinusTok);
                                    }
                                },
                                {
                                    ALT: function () {
                                        _this.CONSUME1(PlusTok);
                                    }
                                }
                            ]);
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return ImplicitAtLeastOneSepErrParser;
                }(parser_traits_1.Parser));
                var parser = new ImplicitAtLeastOneSepErrParser([
                    createTokenInstance(IntTok, "666"),
                    createTokenInstance(MinusTok),
                    createTokenInstance(MinusTok)
                ]);
                parser.rule();
                expect(parser.errors[0]).to.be.an.instanceof(exceptions_public_1.EarlyExitException);
                expect(parser.errors[0].message).to.contain("expecting at least one iteration");
                expect(parser.errors[0].message).to.contain("MinusTok");
                expect(parser.errors[0].message).to.contain("+");
                expect(parser.errors[0].message).to.contain("but found: '666'");
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule"
                ]);
                expect(parser.errors[0].context.ruleOccurrenceStack).to.deep.equal([0]);
            });
            it("can serialize a Grammar's Structure", function () {
                var SomeParser = /** @class */ (function (_super) {
                    __extends(SomeParser, _super);
                    function SomeParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, [PlusTok, MinusTok, IdentTok]) || this;
                        _this.rule = _this.RULE("rule", function () {
                            _this.AT_LEAST_ONE_SEP({
                                SEP: IdentTok,
                                DEF: function () {
                                    _this.SUBRULE(_this.rule2);
                                }
                            });
                        });
                        _this.rule2 = _this.RULE("rule2", function () {
                            _this.OR([
                                {
                                    ALT: function () {
                                        _this.CONSUME1(MinusTok);
                                    }
                                },
                                {
                                    ALT: function () {
                                        _this.CONSUME1(PlusTok);
                                    }
                                }
                            ]);
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return SomeParser;
                }(parser_traits_1.Parser));
                var parser = new SomeParser([]);
                var serializedGrammar = parser.getSerializedGastProductions();
                // not bothering with more in-depth checks as those unit tests exist elsewhere
                expect(serializedGrammar).to.have.lengthOf(2);
                expect(serializedGrammar[0].type).to.equal("Rule");
                expect(serializedGrammar[1].type).to.equal("Rule");
            });
            it("can use serialized grammar in performSelfAnalysis", function () {
                var serializedGrammar = null;
                var SerializingParser = /** @class */ (function (_super) {
                    __extends(SerializingParser, _super);
                    function SerializingParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, [PlusTok, MinusTok, IdentTok], {
                            serializedGrammar: serializedGrammar
                        }) || this;
                        _this.rule = _this.RULE("rule", function () {
                            _this.AT_LEAST_ONE_SEP({
                                SEP: IdentTok,
                                DEF: function () {
                                    _this.SUBRULE(_this.rule2);
                                }
                            });
                        });
                        _this.rule2 = _this.RULE("rule2", function () {
                            _this.OR([
                                {
                                    ALT: function () {
                                        _this.CONSUME1(MinusTok);
                                    }
                                },
                                {
                                    ALT: function () {
                                        _this.CONSUME1(PlusTok);
                                    }
                                }
                            ]);
                        });
                        // @ts-ignore - To check serialization with overrides
                        _this.rule2 = _this.OVERRIDE_RULE("rule2", function () {
                            _this.OR([
                                {
                                    ALT: function () {
                                        _this.CONSUME1(MinusTok);
                                    }
                                },
                                {
                                    ALT: function () {
                                        _this.CONSUME1(PlusTok);
                                    }
                                }
                            ]);
                        });
                        // a rule to exercise certain cases in deserializeGrammar
                        _this.rule3 = _this.RULE("rule3", function () {
                            _this.AT_LEAST_ONE(function () {
                                _this.CONSUME1(IdentTok);
                            });
                            _this.MANY_SEP({
                                SEP: PlusTok,
                                DEF: function () {
                                    _this.CONSUME2(IdentTok);
                                }
                            });
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return SerializingParser;
                }(parser_traits_1.Parser));
                var parser = new SerializingParser([]);
                var expected = parser.getGAstProductions();
                serializedGrammar = parser.getSerializedGastProductions();
                var parser1 = new SerializingParser([]);
                var actual = parser1.getGAstProductions();
                expect(expected).to.deep.equal(actual);
            });
            it("can provide syntactic content assist suggestions", function () {
                var ContentAssistParser = /** @class */ (function (_super) {
                    __extends(ContentAssistParser, _super);
                    function ContentAssistParser(input) {
                        if (input === void 0) { input = []; }
                        var _this = _super.call(this, [PlusTok, MinusTok, IdentTok]) || this;
                        _this.topRule = _this.RULE("topRule", function () {
                            _this.MANY(function () {
                                _this.SUBRULE4(_this.rule2);
                            });
                        });
                        _this.rule2 = _this.RULE("rule2", function () {
                            _this.OR([
                                {
                                    ALT: function () {
                                        _this.CONSUME1(MinusTok);
                                    }
                                },
                                {
                                    ALT: function () {
                                        _this.CONSUME3(PlusTok);
                                    }
                                }
                            ]);
                        });
                        _this.input = input;
                        _this.performSelfAnalysis();
                        return _this;
                    }
                    return ContentAssistParser;
                }(parser_traits_1.Parser));
                var parser = new ContentAssistParser([]);
                matchers_1.setEquality(parser.computeContentAssist("topRule", []), [
                    {
                        nextTokenType: MinusTok,
                        nextTokenOccurrence: 1,
                        ruleStack: ["topRule", "rule2"],
                        occurrenceStack: [1, 4]
                    },
                    {
                        nextTokenType: PlusTok,
                        nextTokenOccurrence: 3,
                        ruleStack: ["topRule", "rule2"],
                        occurrenceStack: [1, 4]
                    }
                ]);
                matchers_1.setEquality(parser.computeContentAssist("topRule", [
                    createTokenInstance(MinusTok)
                ]), [
                    {
                        nextTokenType: MinusTok,
                        nextTokenOccurrence: 1,
                        ruleStack: ["topRule", "rule2"],
                        occurrenceStack: [1, 4]
                    },
                    {
                        nextTokenType: PlusTok,
                        nextTokenOccurrence: 3,
                        ruleStack: ["topRule", "rule2"],
                        occurrenceStack: [1, 4]
                    }
                ]);
                expect(function () {
                    return parser.computeContentAssist("invalid_rule_name", []);
                }).to.throw("does not exist in this grammar");
            });
        });
    });
}
defineRecognizerSpecs("Regular Tokens Mode", tokens_public_1.createToken, matchers_1.createRegularToken, tokens_1.tokenStructuredMatcher);
//# sourceMappingURL=recognizer_spec.js.map