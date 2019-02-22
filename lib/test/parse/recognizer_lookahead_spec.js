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
var parser_traits_1 = require("../../src/parse/parser/traits/parser_traits");
var matchers_1 = require("../utils/matchers");
var utils_1 = require("../../src/utils/utils");
describe("lookahead Regular Tokens Mode", function () {
    var OneTok = tokens_public_1.createToken({ name: "OneTok" });
    var TwoTok = tokens_public_1.createToken({ name: "TwoTok" });
    var ThreeTok = tokens_public_1.createToken({ name: "ThreeTok" });
    var FourTok = tokens_public_1.createToken({ name: "FourTok" });
    var FiveTok = tokens_public_1.createToken({ name: "FiveTok" });
    var SixTok = tokens_public_1.createToken({ name: "SixTok" });
    var SevenTok = tokens_public_1.createToken({ name: "SevenTok" });
    var EightTok = tokens_public_1.createToken({ name: "EightTok" });
    var NineTok = tokens_public_1.createToken({ name: "NineTok" });
    var Comma = tokens_public_1.createToken({ name: "Comma" });
    var ALL_TOKENS = [
        OneTok,
        TwoTok,
        ThreeTok,
        FourTok,
        FiveTok,
        SixTok,
        SevenTok,
        EightTok,
        NineTok,
        Comma
    ];
    describe("The implicit lookahead calculation functionality of the Recognizer For OPTION", function () {
        var OptionsImplicitLookAheadParser = /** @class */ (function (_super) {
            __extends(OptionsImplicitLookAheadParser, _super);
            function OptionsImplicitLookAheadParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                _this.manyOptionsRule = _this.RULE("manyOptionsRule", _this.parseManyOptionsRule);
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            OptionsImplicitLookAheadParser.prototype.getLookAheadCacheSize = function () {
                if (utils_1.isES2015MapSupported()) {
                    // @ts-ignore
                    return this.lookAheadFuncsCache.size;
                }
                else {
                    // @ts-ignore
                    return Object.keys(this.lookAheadFuncsCache).length;
                }
            };
            OptionsImplicitLookAheadParser.prototype.parseManyOptionsRule = function () {
                var _this = this;
                var total = "";
                this.OPTION8(function () {
                    _this.CONSUME1(OneTok);
                    total += "1";
                });
                this.OPTION9(function () {
                    _this.CONSUME1(TwoTok);
                    total += "2";
                });
                this.OPTION3(function () {
                    _this.CONSUME1(ThreeTok);
                    total += "3";
                });
                this.OPTION4(function () {
                    _this.CONSUME1(FourTok);
                    total += "4";
                });
                this.OPTION5(function () {
                    _this.CONSUME1(FiveTok);
                    total += "5";
                });
                return total;
            };
            return OptionsImplicitLookAheadParser;
        }(parser_traits_1.Parser));
        it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", function () {
            var parser = new OptionsImplicitLookAheadParser([]);
            expect(parser.getLookAheadCacheSize()).to.equal(0);
        });
        it("can automatically compute lookahead for OPTION1", function () {
            var input = [matchers_1.createRegularToken(OneTok)];
            var parser = new OptionsImplicitLookAheadParser(input);
            expect(parser.manyOptionsRule()).to.equal("1");
        });
        it("can automatically compute lookahead for OPTION2", function () {
            var input = [matchers_1.createRegularToken(TwoTok)];
            var parser = new OptionsImplicitLookAheadParser(input);
            expect(parser.manyOptionsRule()).to.equal("2");
        });
        it("can automatically compute lookahead for OPTION3", function () {
            var input = [matchers_1.createRegularToken(ThreeTok)];
            var parser = new OptionsImplicitLookAheadParser(input);
            expect(parser.manyOptionsRule()).to.equal("3");
        });
        it("can automatically compute lookahead for OPTION4", function () {
            var input = [matchers_1.createRegularToken(FourTok)];
            var parser = new OptionsImplicitLookAheadParser(input);
            expect(parser.manyOptionsRule()).to.equal("4");
        });
        it("can automatically compute lookahead for OPTION5", function () {
            var input = [matchers_1.createRegularToken(FiveTok)];
            var parser = new OptionsImplicitLookAheadParser(input);
            expect(parser.manyOptionsRule()).to.equal("5");
        });
    });
    describe("The implicit lookahead calculation functionality of the Recognizer For MANY", function () {
        var ManyImplicitLookAheadParser = /** @class */ (function (_super) {
            __extends(ManyImplicitLookAheadParser, _super);
            function ManyImplicitLookAheadParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                _this.manyRule = _this.RULE("manyRule", _this.parseManyRule);
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            ManyImplicitLookAheadParser.prototype.getLookAheadCacheSize = function () {
                if (utils_1.isES2015MapSupported()) {
                    // @ts-ignore
                    return this.lookAheadFuncsCache.size;
                }
                else {
                    // @ts-ignore
                    return Object.keys(this.lookAheadFuncsCache).length;
                }
            };
            ManyImplicitLookAheadParser.prototype.parseManyRule = function () {
                var _this = this;
                var total = "";
                this.MANY1(function () {
                    _this.CONSUME1(OneTok);
                    total += "1";
                });
                this.MANY2(function () {
                    _this.CONSUME1(TwoTok);
                    total += "2";
                });
                this.MANY3(function () {
                    _this.CONSUME1(ThreeTok);
                    total += "3";
                });
                this.MANY4(function () {
                    _this.CONSUME1(FourTok);
                    total += "4";
                });
                this.MANY5(function () {
                    _this.CONSUME1(FiveTok);
                    total += "5";
                });
                this.MANY6(function () {
                    _this.CONSUME1(SixTok);
                    total += "6";
                });
                this.MANY7(function () {
                    _this.CONSUME1(SevenTok);
                    total += "7";
                });
                this.MANY8(function () {
                    _this.CONSUME1(EightTok);
                    total += "8";
                });
                this.MANY9(function () {
                    _this.CONSUME1(NineTok);
                    total += "9";
                });
                return total;
            };
            return ManyImplicitLookAheadParser;
        }(parser_traits_1.Parser));
        it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", function () {
            var parser = new ManyImplicitLookAheadParser();
            expect(parser.getLookAheadCacheSize()).to.equal(0);
        });
        it("can automatically compute lookahead for MANY1", function () {
            var input = [matchers_1.createRegularToken(OneTok)];
            var parser = new ManyImplicitLookAheadParser(input);
            expect(parser.manyRule()).to.equal("1");
        });
        it("can automatically compute lookahead for MANY2", function () {
            var input = [matchers_1.createRegularToken(TwoTok)];
            var parser = new ManyImplicitLookAheadParser(input);
            expect(parser.manyRule()).to.equal("2");
        });
        it("can automatically compute lookahead for MANY3", function () {
            var input = [matchers_1.createRegularToken(ThreeTok)];
            var parser = new ManyImplicitLookAheadParser(input);
            expect(parser.manyRule()).to.equal("3");
        });
        it("can automatically compute lookahead for MANY4", function () {
            var input = [matchers_1.createRegularToken(FourTok)];
            var parser = new ManyImplicitLookAheadParser(input);
            expect(parser.manyRule()).to.equal("4");
        });
        it("can automatically compute lookahead for MANY5", function () {
            var input = [matchers_1.createRegularToken(FiveTok)];
            var parser = new ManyImplicitLookAheadParser(input);
            expect(parser.manyRule()).to.equal("5");
        });
        it("can automatically compute lookahead for MANY6", function () {
            var input = [matchers_1.createRegularToken(SixTok)];
            var parser = new ManyImplicitLookAheadParser(input);
            expect(parser.manyRule()).to.equal("6");
        });
        it("can automatically compute lookahead for MANY7", function () {
            var input = [matchers_1.createRegularToken(SevenTok)];
            var parser = new ManyImplicitLookAheadParser(input);
            expect(parser.manyRule()).to.equal("7");
        });
        it("can automatically compute lookahead for MANY8", function () {
            var input = [matchers_1.createRegularToken(EightTok)];
            var parser = new ManyImplicitLookAheadParser(input);
            expect(parser.manyRule()).to.equal("8");
        });
        it("can automatically compute lookahead for MANY9", function () {
            var input = [matchers_1.createRegularToken(NineTok)];
            var parser = new ManyImplicitLookAheadParser(input);
            expect(parser.manyRule()).to.equal("9");
        });
        it("can accept lookahead function param for flow mixing several MANYs", function () {
            var input = [
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(FiveTok)
            ];
            var parser = new ManyImplicitLookAheadParser(input);
            expect(parser.manyRule()).to.equal("113335");
        });
    });
    describe("The implicit lookahead calculation functionality of the Recognizer For MANY_SEP", function () {
        var ManySepImplicitLookAheadParser = /** @class */ (function (_super) {
            __extends(ManySepImplicitLookAheadParser, _super);
            function ManySepImplicitLookAheadParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                _this.manySepRule = _this.RULE("manySepRule", _this.parseManyRule);
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            ManySepImplicitLookAheadParser.prototype.getLookAheadCacheSize = function () {
                if (utils_1.isES2015MapSupported()) {
                    // @ts-ignore
                    return this.lookAheadFuncsCache.size;
                }
                else {
                    // @ts-ignore
                    return Object.keys(this.lookAheadFuncsCache).length;
                }
            };
            ManySepImplicitLookAheadParser.prototype.parseManyRule = function () {
                var _this = this;
                var total = "";
                var separators = [];
                this.MANY_SEP1({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(OneTok);
                        total += "1";
                    }
                });
                this.MANY_SEP2({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(TwoTok);
                        total += "2";
                    }
                });
                this.MANY_SEP3({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(ThreeTok);
                        total += "3";
                    }
                });
                this.MANY_SEP4({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(FourTok);
                        total += "4";
                    }
                });
                this.MANY_SEP5({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(FiveTok);
                        total += "5";
                    }
                });
                this.MANY_SEP6({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(SixTok);
                        total += "6";
                    }
                });
                this.MANY_SEP7({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(SevenTok);
                        total += "7";
                    }
                });
                this.MANY_SEP8({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(EightTok);
                        total += "8";
                    }
                });
                this.MANY_SEP9({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(NineTok);
                        total += "9";
                    }
                });
                return {
                    total: total,
                    separators: separators
                };
            };
            return ManySepImplicitLookAheadParser;
        }(parser_traits_1.Parser));
        it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", function () {
            var parser = new ManySepImplicitLookAheadParser();
            expect(parser.getLookAheadCacheSize()).to.equal(0);
        });
        it("can automatically compute lookahead for MANY_SEP1", function () {
            var input = [matchers_1.createRegularToken(OneTok)];
            var parser = new ManySepImplicitLookAheadParser(input);
            expect(parser.manySepRule().total).to.equal("1");
        });
        it("can automatically compute lookahead for MANY_SEP2", function () {
            var input = [matchers_1.createRegularToken(TwoTok)];
            var parser = new ManySepImplicitLookAheadParser(input);
            expect(parser.manySepRule().total).to.equal("2");
        });
        it("can automatically compute lookahead for MANY_SEP3", function () {
            var input = [matchers_1.createRegularToken(ThreeTok)];
            var parser = new ManySepImplicitLookAheadParser(input);
            expect(parser.manySepRule().total).to.equal("3");
        });
        it("can automatically compute lookahead for MANY_SEP4", function () {
            var input = [matchers_1.createRegularToken(FourTok)];
            var parser = new ManySepImplicitLookAheadParser(input);
            expect(parser.manySepRule().total).to.equal("4");
        });
        it("can automatically compute lookahead for MANY_SEP5", function () {
            var input = [matchers_1.createRegularToken(FiveTok)];
            var parser = new ManySepImplicitLookAheadParser(input);
            expect(parser.manySepRule().total).to.equal("5");
        });
        it("can automatically compute lookahead for MANY_SEP6", function () {
            var input = [matchers_1.createRegularToken(SixTok)];
            var parser = new ManySepImplicitLookAheadParser(input);
            expect(parser.manySepRule().total).to.equal("6");
        });
        it("can automatically compute lookahead for MANY_SEP7", function () {
            var input = [matchers_1.createRegularToken(SevenTok)];
            var parser = new ManySepImplicitLookAheadParser(input);
            expect(parser.manySepRule().total).to.equal("7");
        });
        it("can automatically compute lookahead for MANY_SEP8", function () {
            var input = [matchers_1.createRegularToken(EightTok)];
            var parser = new ManySepImplicitLookAheadParser(input);
            expect(parser.manySepRule().total).to.equal("8");
        });
        it("can automatically compute lookahead for MANY_SEP9", function () {
            var input = [matchers_1.createRegularToken(NineTok)];
            var parser = new ManySepImplicitLookAheadParser(input);
            expect(parser.manySepRule().total).to.equal("9");
        });
        it("can accept lookahead function param for flow mixing several MANY_SEPs", function () {
            var input = [
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(Comma),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(Comma),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(Comma),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(FiveTok)
            ];
            var parser = new ManySepImplicitLookAheadParser(input);
            var result = parser.manySepRule();
            expect(result.total).to.equal("113335");
        });
    });
    describe("The implicit lookahead calculation functionality of the Recognizer For AT_LEAST_ONE", function () {
        var AtLeastOneImplicitLookAheadParser = /** @class */ (function (_super) {
            __extends(AtLeastOneImplicitLookAheadParser, _super);
            function AtLeastOneImplicitLookAheadParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                _this.atLeastOneRule = _this.RULE("atLeastOneRule", _this.parseAtLeastOneRule, {
                    recoveryValueFunc: function () {
                        return "-666";
                    }
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            AtLeastOneImplicitLookAheadParser.prototype.getLookAheadCacheSize = function () {
                if (utils_1.isES2015MapSupported()) {
                    // @ts-ignore
                    return this.lookAheadFuncsCache.size;
                }
                else {
                    // @ts-ignore
                    return Object.keys(this.lookAheadFuncsCache).length;
                }
            };
            AtLeastOneImplicitLookAheadParser.prototype.parseAtLeastOneRule = function () {
                var _this = this;
                var total = "";
                this.AT_LEAST_ONE1(function () {
                    _this.CONSUME1(OneTok);
                    total += "1";
                });
                this.AT_LEAST_ONE2(function () {
                    _this.CONSUME1(TwoTok);
                    total += "2";
                });
                this.AT_LEAST_ONE3(function () {
                    _this.CONSUME1(ThreeTok);
                    total += "3";
                });
                this.AT_LEAST_ONE4(function () {
                    _this.CONSUME1(FourTok);
                    total += "4";
                });
                this.AT_LEAST_ONE5(function () {
                    _this.CONSUME1(FiveTok);
                    total += "5";
                });
                this.AT_LEAST_ONE6(function () {
                    _this.CONSUME1(SixTok);
                    total += "6";
                });
                this.AT_LEAST_ONE7(function () {
                    _this.CONSUME1(SevenTok);
                    total += "7";
                });
                this.AT_LEAST_ONE8(function () {
                    _this.CONSUME1(EightTok);
                    total += "8";
                });
                this.AT_LEAST_ONE9(function () {
                    _this.CONSUME1(NineTok);
                    total += "9";
                });
                return total;
            };
            return AtLeastOneImplicitLookAheadParser;
        }(parser_traits_1.Parser));
        it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", function () {
            var parser = new AtLeastOneImplicitLookAheadParser();
            expect(parser.getLookAheadCacheSize()).to.equal(0);
        });
        it("can accept lookahead function param for AT_LEAST_ONE", function () {
            var input = [
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(FourTok),
                matchers_1.createRegularToken(FourTok),
                matchers_1.createRegularToken(FiveTok),
                matchers_1.createRegularToken(SixTok),
                matchers_1.createRegularToken(SevenTok),
                matchers_1.createRegularToken(EightTok),
                matchers_1.createRegularToken(EightTok),
                matchers_1.createRegularToken(EightTok),
                matchers_1.createRegularToken(NineTok)
            ];
            var parser = new AtLeastOneImplicitLookAheadParser(input);
            expect(parser.atLeastOneRule()).to.equal("1223445678889");
        });
        it("will fail when zero occurrences of AT_LEAST_ONE in input", function () {
            var input = [
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok) /*createToken(ThreeTok),*/,
                matchers_1.createRegularToken(FourTok),
                matchers_1.createRegularToken(FiveTok)
            ];
            var parser = new AtLeastOneImplicitLookAheadParser(input);
            expect(parser.atLeastOneRule()).to.equal("-666");
        });
    });
    describe("The implicit lookahead calculation functionality of the Recognizer For AT_LEAST_ONE_SEP", function () {
        var AtLeastOneSepImplicitLookAheadParser = /** @class */ (function (_super) {
            __extends(AtLeastOneSepImplicitLookAheadParser, _super);
            function AtLeastOneSepImplicitLookAheadParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                _this.atLeastOneSepRule = _this.RULE("atLeastOneSepRule", _this.parseAtLeastOneRule, {
                    recoveryValueFunc: function () {
                        return {
                            total: "-666",
                            separators: []
                        };
                    }
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            AtLeastOneSepImplicitLookAheadParser.prototype.getLookAheadCacheSize = function () {
                if (utils_1.isES2015MapSupported()) {
                    // @ts-ignore
                    return this.lookAheadFuncsCache.size;
                }
                else {
                    // @ts-ignore
                    return Object.keys(this.lookAheadFuncsCache).length;
                }
            };
            AtLeastOneSepImplicitLookAheadParser.prototype.parseAtLeastOneRule = function () {
                var _this = this;
                var total = "";
                var separators = [];
                this.AT_LEAST_ONE_SEP1({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(OneTok);
                        total += "1";
                    }
                });
                this.AT_LEAST_ONE_SEP2({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(TwoTok);
                        total += "2";
                    }
                });
                this.AT_LEAST_ONE_SEP3({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(ThreeTok);
                        total += "3";
                    }
                });
                this.AT_LEAST_ONE_SEP4({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(FourTok);
                        total += "4";
                    }
                });
                this.AT_LEAST_ONE_SEP5({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(FiveTok);
                        total += "5";
                    }
                });
                this.AT_LEAST_ONE_SEP6({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(SixTok);
                        total += "6";
                    }
                });
                this.AT_LEAST_ONE_SEP7({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(SevenTok);
                        total += "7";
                    }
                });
                this.AT_LEAST_ONE_SEP8({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(EightTok);
                        total += "8";
                    }
                });
                this.AT_LEAST_ONE_SEP9({
                    SEP: Comma,
                    DEF: function () {
                        _this.CONSUME1(NineTok);
                        total += "9";
                    }
                });
                return {
                    total: total,
                    separators: separators
                };
            };
            return AtLeastOneSepImplicitLookAheadParser;
        }(parser_traits_1.Parser));
        it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", function () {
            var parser = new AtLeastOneSepImplicitLookAheadParser();
            expect(parser.getLookAheadCacheSize()).to.equal(0);
        });
        it("can accept lookahead function param for AT_LEAST_ONE_SEP", function () {
            var input = [
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(Comma),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(FourTok),
                matchers_1.createRegularToken(Comma),
                matchers_1.createRegularToken(FourTok),
                matchers_1.createRegularToken(FiveTok),
                matchers_1.createRegularToken(SixTok),
                matchers_1.createRegularToken(SevenTok),
                matchers_1.createRegularToken(Comma),
                matchers_1.createRegularToken(SevenTok),
                matchers_1.createRegularToken(Comma),
                matchers_1.createRegularToken(SevenTok),
                matchers_1.createRegularToken(EightTok),
                matchers_1.createRegularToken(NineTok)
            ];
            var parser = new AtLeastOneSepImplicitLookAheadParser(input);
            var parseResult = parser.atLeastOneSepRule();
            expect(parseResult.total).to.equal("1223445677789");
        });
        it("will fail when zero occurrences of AT_LEAST_ONE_SEP in input", function () {
            var input = [
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                /*createToken(ThreeTok),*/ matchers_1.createRegularToken(FourTok),
                matchers_1.createRegularToken(FiveTok)
            ];
            var parser = new AtLeastOneSepImplicitLookAheadParser(input);
            expect(parser.atLeastOneSepRule().total).to.equal("-666");
        });
    });
    describe("The implicit lookahead calculation functionality of the Recognizer For OR", function () {
        var OrImplicitLookAheadParser = /** @class */ (function (_super) {
            __extends(OrImplicitLookAheadParser, _super);
            function OrImplicitLookAheadParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                _this.orRule = _this.RULE("orRule", _this.parseOrRule, {
                    recoveryValueFunc: function () { return "-666"; }
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            OrImplicitLookAheadParser.prototype.getLookAheadCacheSize = function () {
                if (utils_1.isES2015MapSupported()) {
                    // @ts-ignore
                    return this.lookAheadFuncsCache.size;
                }
                else {
                    // @ts-ignore
                    return Object.keys(this.lookAheadFuncsCache).length;
                }
            };
            OrImplicitLookAheadParser.prototype.parseOrRule = function () {
                var _this = this;
                var total = "";
                this.OR8([
                    {
                        ALT: function () {
                            _this.CONSUME1(OneTok);
                            total += "A1";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME1(TwoTok);
                            total += "A2";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME1(ThreeTok);
                            total += "A3";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME1(FourTok);
                            total += "A4";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME1(FiveTok);
                            total += "A5";
                        }
                    }
                ]);
                this.OR2([
                    {
                        ALT: function () {
                            _this.CONSUME2(OneTok);
                            total += "B1";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME2(FourTok);
                            total += "B4";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME2(ThreeTok);
                            total += "B3";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME2(TwoTok);
                            total += "B2";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME2(FiveTok);
                            total += "B5";
                        }
                    }
                ]);
                this.OR3([
                    {
                        ALT: function () {
                            _this.CONSUME3(TwoTok);
                            total += "C2";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME3(FourTok);
                            total += "C4";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME3(ThreeTok);
                            total += "C3";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME3(FiveTok);
                            total += "C5";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME3(OneTok);
                            total += "C1";
                        }
                    }
                ]);
                this.OR4([
                    {
                        ALT: function () {
                            _this.CONSUME4(OneTok);
                            total += "D1";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME4(ThreeTok);
                            total += "D3";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME4(FourTok);
                            total += "D4";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME4(TwoTok);
                            total += "D2";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME4(FiveTok);
                            total += "D5";
                        }
                    }
                ]);
                this.OR5([
                    {
                        ALT: function () {
                            _this.CONSUME5(TwoTok);
                            total += "E2";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME5(OneTok);
                            total += "E1";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME5(FourTok);
                            total += "E4";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME5(ThreeTok);
                            total += "E3";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME5(FiveTok);
                            total += "E5";
                        }
                    }
                ]);
                return total;
            };
            return OrImplicitLookAheadParser;
        }(parser_traits_1.Parser));
        it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", function () {
            var parser = new OrImplicitLookAheadParser();
            expect(parser.getLookAheadCacheSize()).to.equal(0);
        });
        it("can compute the lookahead automatically for OR", function () {
            var input = [
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(FourTok),
                matchers_1.createRegularToken(FiveTok)
            ];
            var parser = new OrImplicitLookAheadParser(input);
            expect(parser.orRule()).to.equal("A1B2C3D4E5");
        });
        it("will fail when none of the alternatives match", function () {
            var input = [matchers_1.createRegularToken(SixTok)];
            var parser = new OrImplicitLookAheadParser(input);
            expect(parser.orRule()).to.equal("-666");
        });
    });
    describe("OR production ambiguity detection when using implicit lookahead calculation", function () {
        it("will throw an error when two alternatives have the same single token (lookahead 1) prefix", function () {
            var OrAmbiguityLookAheadParser = /** @class */ (function (_super) {
                __extends(OrAmbiguityLookAheadParser, _super);
                function OrAmbiguityLookAheadParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                    _this.ambiguityRule = _this.RULE("ambiguityRule", _this.parseAmbiguityRule);
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                OrAmbiguityLookAheadParser.prototype.parseAmbiguityRule = function () {
                    var _this = this;
                    this.OR1([
                        {
                            ALT: function () {
                                _this.CONSUME1(OneTok);
                            }
                        },
                        // <-- this alternative starts with the same token as the previous one, ambiguity!
                        {
                            ALT: function () {
                                _this.CONSUME2(OneTok);
                            }
                        },
                        {
                            ALT: function () {
                                _this.CONSUME2(TwoTok);
                            }
                        },
                        {
                            ALT: function () {
                                _this.CONSUME2(ThreeTok);
                            }
                        }
                    ]);
                };
                return OrAmbiguityLookAheadParser;
            }(parser_traits_1.Parser));
            expect(function () { return new OrAmbiguityLookAheadParser(); }).to.throw("Ambiguous alternatives");
            expect(function () { return new OrAmbiguityLookAheadParser(); }).to.throw("OneTok");
        });
        it("will throw an error when two alternatives have the same multi token (lookahead > 1) prefix", function () {
            var OrAmbiguityMultiTokenLookAheadParser = /** @class */ (function (_super) {
                __extends(OrAmbiguityMultiTokenLookAheadParser, _super);
                function OrAmbiguityMultiTokenLookAheadParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                    _this.ambiguityRule = _this.RULE("ambiguityRule", _this.parseAmbiguityRule);
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                OrAmbiguityMultiTokenLookAheadParser.prototype.parseAmbiguityRule = function () {
                    var _this = this;
                    this.OR1([
                        {
                            ALT: function () {
                                _this.CONSUME1(OneTok);
                            }
                        },
                        {
                            ALT: function () {
                                _this.CONSUME1(TwoTok);
                                _this.CONSUME1(ThreeTok);
                                _this.CONSUME1(FourTok);
                            }
                        },
                        {
                            ALT: function () {
                                _this.CONSUME2(TwoTok);
                                _this.CONSUME2(ThreeTok);
                                _this.CONSUME2(FourTok);
                            }
                        }
                    ]);
                };
                return OrAmbiguityMultiTokenLookAheadParser;
            }(parser_traits_1.Parser));
            expect(function () { return new OrAmbiguityMultiTokenLookAheadParser(); }).to.throw("Ambiguous alternatives");
            expect(function () { return new OrAmbiguityMultiTokenLookAheadParser(); }).to.throw("TwoTok, ThreeTok, FourTok");
        });
    });
    describe("The implicit lookahead calculation functionality of the Recognizer For OR (with IGNORE_AMBIGUITIES)", function () {
        var OrImplicitLookAheadParserIgnoreAmbiguities = /** @class */ (function (_super) {
            __extends(OrImplicitLookAheadParserIgnoreAmbiguities, _super);
            function OrImplicitLookAheadParserIgnoreAmbiguities(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, {
                    outputCst: false,
                    ignoredIssues: {
                        orRule: {
                            OR: true,
                            OR2: true,
                            OR3: true,
                            OR4: true,
                            OR5: true
                        }
                    }
                }) || this;
                _this.orRule = _this.RULE("orRule", _this.parseOrRule, {
                    recoveryValueFunc: function () { return "-666"; }
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            OrImplicitLookAheadParserIgnoreAmbiguities.prototype.getLookAheadCacheSize = function () {
                if (utils_1.isES2015MapSupported()) {
                    // @ts-ignore
                    return this.lookAheadFuncsCache.size;
                }
                else {
                    // @ts-ignore
                    return Object.keys(this.lookAheadFuncsCache).length;
                }
            };
            OrImplicitLookAheadParserIgnoreAmbiguities.prototype.parseOrRule = function () {
                var _this = this;
                var total = "";
                this.OR([
                    {
                        ALT: function () {
                            _this.CONSUME1(OneTok);
                            total += "A1";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME2(OneTok);
                            total += "OOPS!";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME1(ThreeTok);
                            total += "A3";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME1(FourTok);
                            total += "A4";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME1(FiveTok);
                            total += "A5";
                        }
                    }
                ]);
                this.OR2([
                    {
                        ALT: function () {
                            _this.CONSUME2(FourTok);
                            total += "B4";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME2(ThreeTok);
                            total += "B3";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME2(TwoTok);
                            total += "B2";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME3(TwoTok);
                            total += "OOPS!";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME2(FiveTok);
                            total += "B5";
                        }
                    }
                ]);
                this.OR3([
                    {
                        ALT: function () {
                            _this.CONSUME3(FourTok);
                            total += "C4";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME3(ThreeTok);
                            total += "C3";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME4(ThreeTok);
                            total += "OOPS!";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME3(FiveTok);
                            total += "C5";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME3(OneTok);
                            total += "C1";
                        }
                    }
                ]);
                this.OR4([
                    {
                        ALT: function () {
                            _this.CONSUME4(OneTok);
                            total += "D1";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME4(FourTok);
                            total += "D4";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME5(FourTok);
                            total += "OOPS!";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME4(TwoTok);
                            total += "D2";
                        }
                    }
                ]);
                this.OR5([
                    {
                        ALT: function () {
                            _this.CONSUME5(TwoTok);
                            total += "E2";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME5(OneTok);
                            total += "E1";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME4(FiveTok);
                            total += "E5";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME5(ThreeTok);
                            total += "E3";
                        }
                    },
                    {
                        ALT: function () {
                            _this.CONSUME5(FiveTok);
                            total += "OOPS!";
                        }
                    }
                ]);
                return total;
            };
            return OrImplicitLookAheadParserIgnoreAmbiguities;
        }(parser_traits_1.Parser));
        it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", function () {
            var parser = new OrImplicitLookAheadParserIgnoreAmbiguities();
            expect(parser.getLookAheadCacheSize()).to.equal(0);
        });
        it("can compute the lookahead automatically for OR", function () {
            var input = [
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(FourTok),
                matchers_1.createRegularToken(FiveTok)
            ];
            var parser = new OrImplicitLookAheadParserIgnoreAmbiguities(input);
            expect(parser.orRule()).to.equal("A1B2C3D4E5");
        });
        it("will fail when none of the alternatives match", function () {
            var input = [matchers_1.createRegularToken(SixTok)];
            var parser = new OrImplicitLookAheadParserIgnoreAmbiguities(input);
            expect(parser.orRule()).to.equal("-666");
        });
    });
    describe("The support for MultiToken (K>1) implicit lookahead capabilities in DSL Production:", function () {
        it("OPTION", function () {
            var MultiTokenLookAheadForOptionParser = /** @class */ (function (_super) {
                __extends(MultiTokenLookAheadForOptionParser, _super);
                function MultiTokenLookAheadForOptionParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                    _this.rule = _this.RULE("rule", function () {
                        var result = "OPTION Not Taken";
                        _this.OPTION2(function () {
                            _this.CONSUME1(OneTok);
                            _this.CONSUME1(TwoTok);
                            _this.CONSUME1(ThreeTok);
                            result = "OPTION Taken";
                        });
                        _this.CONSUME2(OneTok);
                        _this.CONSUME2(TwoTok);
                        return result;
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return MultiTokenLookAheadForOptionParser;
            }(parser_traits_1.Parser));
            var parser = new MultiTokenLookAheadForOptionParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok)
            ]);
            expect(parser.rule()).to.equal("OPTION Not Taken");
            var parser2 = new MultiTokenLookAheadForOptionParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok)
            ]);
            expect(parser2.rule()).to.equal("OPTION Taken");
        });
        it("MANY", function () {
            var MultiTokenLookAheadForManyParser = /** @class */ (function (_super) {
                __extends(MultiTokenLookAheadForManyParser, _super);
                function MultiTokenLookAheadForManyParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                    _this.rule = _this.RULE("orRule", function () {
                        var numOfIterations = 0;
                        _this.MANY(function () {
                            _this.CONSUME1(OneTok);
                            _this.CONSUME1(TwoTok);
                            _this.CONSUME1(ThreeTok);
                            numOfIterations++;
                        });
                        _this.CONSUME2(OneTok);
                        _this.CONSUME2(TwoTok);
                        return numOfIterations;
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return MultiTokenLookAheadForManyParser;
            }(parser_traits_1.Parser));
            var parser = new MultiTokenLookAheadForManyParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok)
            ]);
            expect(parser.rule()).to.equal(0);
            var oneIterationParser = new MultiTokenLookAheadForManyParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok)
            ]);
            expect(oneIterationParser.rule()).to.equal(1);
            var twoIterationsParser = new MultiTokenLookAheadForManyParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok)
            ]);
            expect(twoIterationsParser.rule()).to.equal(2);
        });
        it("MANY_SEP", function () {
            var MultiTokenLookAheadForManySepParser = /** @class */ (function (_super) {
                __extends(MultiTokenLookAheadForManySepParser, _super);
                function MultiTokenLookAheadForManySepParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                    _this.rule = _this.RULE("orRule", function () {
                        var numOfIterations = 0;
                        _this.MANY_SEP({
                            SEP: Comma,
                            DEF: function () {
                                _this.CONSUME1(OneTok);
                                _this.CONSUME1(TwoTok);
                                _this.CONSUME1(ThreeTok);
                                numOfIterations++;
                            }
                        });
                        _this.CONSUME2(OneTok);
                        _this.CONSUME2(TwoTok);
                        return numOfIterations;
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return MultiTokenLookAheadForManySepParser;
            }(parser_traits_1.Parser));
            var parser = new MultiTokenLookAheadForManySepParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok)
            ]);
            expect(parser.rule()).to.equal(0);
            var oneIterationParser = new MultiTokenLookAheadForManySepParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok)
            ]);
            expect(oneIterationParser.rule()).to.equal(1);
            var twoIterationsParser = new MultiTokenLookAheadForManySepParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(Comma),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok)
            ]);
            expect(twoIterationsParser.rule()).to.equal(2);
        });
        it("OR", function () {
            var MultiTokenLookAheadForOrParser = /** @class */ (function (_super) {
                __extends(MultiTokenLookAheadForOrParser, _super);
                function MultiTokenLookAheadForOrParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                    _this.orRule = _this.RULE("orRule", function () {
                        return _this.OR([
                            {
                                ALT: function () {
                                    _this.CONSUME1(OneTok);
                                    _this.CONSUME2(OneTok);
                                    return "alt1 Taken";
                                }
                            },
                            {
                                ALT: function () {
                                    _this.CONSUME3(OneTok);
                                    _this.CONSUME1(TwoTok);
                                    _this.CONSUME1(ThreeTok);
                                    return "alt2 Taken";
                                }
                            },
                            {
                                ALT: function () {
                                    _this.CONSUME4(OneTok);
                                    _this.CONSUME2(TwoTok);
                                    return "alt3 Taken";
                                }
                            },
                            {
                                ALT: function () {
                                    _this.CONSUME1(FourTok);
                                    return "alt4 Taken";
                                }
                            }
                        ]);
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return MultiTokenLookAheadForOrParser;
            }(parser_traits_1.Parser));
            var alt1Parser = new MultiTokenLookAheadForOrParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(OneTok)
            ]);
            expect(alt1Parser.orRule()).to.equal("alt1 Taken");
            var alt2Parser = new MultiTokenLookAheadForOrParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok)
            ]);
            expect(alt2Parser.orRule()).to.equal("alt2 Taken");
            var alt3Parser = new MultiTokenLookAheadForOrParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok)
            ]);
            expect(alt3Parser.orRule()).to.equal("alt3 Taken");
            var alt4Parser = new MultiTokenLookAheadForOrParser([
                matchers_1.createRegularToken(FourTok)
            ]);
            expect(alt4Parser.orRule()).to.equal("alt4 Taken");
        });
        it("AT_LEAST_ONE", function () {
            var MultiTokenLookAheadForAtLeastOneParser = /** @class */ (function (_super) {
                __extends(MultiTokenLookAheadForAtLeastOneParser, _super);
                function MultiTokenLookAheadForAtLeastOneParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                    _this.rule = _this.RULE("orRule", function () {
                        var numOfIterations = 0;
                        _this.AT_LEAST_ONE(function () {
                            _this.CONSUME1(OneTok);
                            _this.CONSUME1(TwoTok);
                            _this.CONSUME1(ThreeTok);
                            numOfIterations++;
                        });
                        _this.CONSUME2(OneTok);
                        _this.CONSUME2(TwoTok);
                        return numOfIterations;
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return MultiTokenLookAheadForAtLeastOneParser;
            }(parser_traits_1.Parser));
            var oneIterationParser = new MultiTokenLookAheadForAtLeastOneParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok)
            ]);
            expect(oneIterationParser.rule()).to.equal(1);
            var twoIterationsParser = new MultiTokenLookAheadForAtLeastOneParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok)
            ]);
            expect(twoIterationsParser.rule()).to.equal(2);
            var threeIterationsParser = new MultiTokenLookAheadForAtLeastOneParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok)
            ]);
            expect(threeIterationsParser.rule()).to.equal(3);
        });
        it("AT_LEAST_ONE_SEP", function () {
            var MultiTokenLookAheadForAtLeastOneSepParser = /** @class */ (function (_super) {
                __extends(MultiTokenLookAheadForAtLeastOneSepParser, _super);
                function MultiTokenLookAheadForAtLeastOneSepParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                    _this.rule = _this.RULE("orRule", function () {
                        var numOfIterations = 0;
                        _this.AT_LEAST_ONE_SEP({
                            SEP: Comma,
                            DEF: function () {
                                _this.CONSUME1(OneTok);
                                _this.CONSUME1(TwoTok);
                                _this.CONSUME1(ThreeTok);
                                numOfIterations++;
                            }
                        });
                        _this.CONSUME2(OneTok);
                        _this.CONSUME2(TwoTok);
                        return numOfIterations;
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return MultiTokenLookAheadForAtLeastOneSepParser;
            }(parser_traits_1.Parser));
            var oneIterationParser = new MultiTokenLookAheadForAtLeastOneSepParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok)
            ]);
            expect(oneIterationParser.rule()).to.equal(1);
            var twoIterationsParser = new MultiTokenLookAheadForAtLeastOneSepParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(Comma),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok)
            ]);
            expect(twoIterationsParser.rule()).to.equal(2);
            var threeIterationsParser = new MultiTokenLookAheadForAtLeastOneSepParser([
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(Comma),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(Comma),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok),
                matchers_1.createRegularToken(ThreeTok),
                matchers_1.createRegularToken(OneTok),
                matchers_1.createRegularToken(TwoTok)
            ]);
            expect(threeIterationsParser.rule()).to.equal(3);
        });
    });
    describe("Lookahead bug: MANY in OR", function () {
        var ManyInOrBugParser = /** @class */ (function (_super) {
            __extends(ManyInOrBugParser, _super);
            function ManyInOrBugParser() {
                var _this = _super.call(this, ALL_TOKENS, {
                    outputCst: false,
                    ignoredIssues: {
                        main: {
                            OR: true
                        }
                    }
                }) || this;
                _this.main = _this.RULE("main", function () {
                    _this.OR([
                        { ALT: function () { return _this.SUBRULE(_this.alt1); } },
                        { ALT: function () { return _this.SUBRULE(_this.alt2); } }
                    ]);
                });
                _this.alt1 = _this.RULE("alt1", function () {
                    _this.MANY(function () {
                        _this.CONSUME(Comma);
                    });
                    _this.CONSUME(OneTok);
                });
                _this.alt2 = _this.RULE("alt2", function () {
                    _this.MANY(function () {
                        _this.CONSUME(Comma);
                    });
                    _this.CONSUME(TwoTok);
                });
                _this.performSelfAnalysis();
                return _this;
            }
            return ManyInOrBugParser;
        }(parser_traits_1.Parser));
        var manyInOrBugParser;
        before(function () {
            manyInOrBugParser = new ManyInOrBugParser();
        });
        it("Won't throw NoViableAltException when the repetition appears twice", function () {
            var input = [
                matchers_1.createRegularToken(Comma),
                matchers_1.createRegularToken(Comma),
                matchers_1.createRegularToken(TwoTok)
            ];
            manyInOrBugParser.input = input;
            manyInOrBugParser.main();
            expect(manyInOrBugParser.errors).to.be.empty;
        });
    });
});
//# sourceMappingURL=recognizer_lookahead_spec.js.map