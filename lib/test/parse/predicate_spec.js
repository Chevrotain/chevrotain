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
var parser_traits_1 = require("../../src/parse/parser/traits/parser_traits");
var exceptions_public_1 = require("../../src/parse/exceptions_public");
var tokens_1 = require("../../src/scan/tokens");
var matchers_1 = require("../utils/matchers");
describe("The chevrotain support for custom gates/predicates on DSL production:", function () {
    var A = /** @class */ (function () {
        function A() {
        }
        A.PATTERN = /a/;
        return A;
    }());
    var B = /** @class */ (function () {
        function B() {
        }
        B.PATTERN = /a/;
        return B;
    }());
    var C = /** @class */ (function () {
        function C() {
        }
        C.PATTERN = /a/;
        return C;
    }());
    var ALL_TOKENS = [A, B, C];
    tokens_1.augmentTokenTypes(ALL_TOKENS);
    it("OPTION", function () {
        function gateFunc() {
            return this.gate;
        }
        var PredicateOptionParser = /** @class */ (function (_super) {
            __extends(PredicateOptionParser, _super);
            function PredicateOptionParser(input, gate) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                _this.gate = gate;
                _this.optionRule = _this.RULE("optionRule", function () {
                    var result = "not entered!";
                    _this.OPTION({
                        GATE: gateFunc,
                        DEF: function () {
                            _this.CONSUME(A);
                            result = "entered!";
                        }
                    });
                    return result;
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return PredicateOptionParser;
        }(parser_traits_1.Parser));
        var gateOpenInputGood = new PredicateOptionParser([matchers_1.createRegularToken(A)], true).optionRule();
        expect(gateOpenInputGood).to.equal("entered!");
        var gateOpenInputBad = new PredicateOptionParser([matchers_1.createRegularToken(B)], true).optionRule();
        expect(gateOpenInputBad).to.equal("not entered!");
        var gateClosedInputGood = new PredicateOptionParser([matchers_1.createRegularToken(A)], false).optionRule();
        expect(gateClosedInputGood).to.equal("not entered!");
        var gateClosedInputBad = new PredicateOptionParser([matchers_1.createRegularToken(B)], false).optionRule();
        expect(gateClosedInputBad).to.equal("not entered!");
    });
    it("MANY", function () {
        function gateFunc() {
            return this.gate;
        }
        var PredicateManyParser = /** @class */ (function (_super) {
            __extends(PredicateManyParser, _super);
            function PredicateManyParser(input, gate) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                _this.gate = gate;
                _this.manyRule = _this.RULE("manyRule", function () {
                    var result = "not entered!";
                    _this.MANY({
                        GATE: gateFunc,
                        DEF: function () {
                            _this.CONSUME(A);
                            result = "entered!";
                        }
                    });
                    return result;
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return PredicateManyParser;
        }(parser_traits_1.Parser));
        var gateOpenInputGood = new PredicateManyParser([matchers_1.createRegularToken(A), matchers_1.createRegularToken(A)], true).manyRule();
        expect(gateOpenInputGood).to.equal("entered!");
        var gateOpenInputBad = new PredicateManyParser([matchers_1.createRegularToken(B)], true).manyRule();
        expect(gateOpenInputBad).to.equal("not entered!");
        var gateClosedInputGood = new PredicateManyParser([matchers_1.createRegularToken(A), matchers_1.createRegularToken(A)], false).manyRule();
        expect(gateClosedInputGood).to.equal("not entered!");
        var gateClosedInputBad = new PredicateManyParser([matchers_1.createRegularToken(B)], false).manyRule();
        expect(gateClosedInputBad).to.equal("not entered!");
    });
    it("AT_LEAST_ONE", function () {
        function gateFunc() {
            return this.gate;
        }
        var PredicateAtLeastOneParser = /** @class */ (function (_super) {
            __extends(PredicateAtLeastOneParser, _super);
            function PredicateAtLeastOneParser(input, gate) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                _this.gate = gate;
                _this.atLeastOneRule = _this.RULE("atLeastOneRule", function () {
                    var result = "not entered!";
                    _this.AT_LEAST_ONE({
                        GATE: gateFunc,
                        DEF: function () {
                            _this.CONSUME(A);
                            result = "entered!";
                        }
                    });
                    return result;
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return PredicateAtLeastOneParser;
        }(parser_traits_1.Parser));
        var gateOpenInputGood = new PredicateAtLeastOneParser([matchers_1.createRegularToken(A), matchers_1.createRegularToken(A)], true).atLeastOneRule();
        expect(gateOpenInputGood).to.equal("entered!");
        var gateOpenInputBadParser = new PredicateAtLeastOneParser([matchers_1.createRegularToken(B)], true);
        gateOpenInputBadParser.atLeastOneRule();
        expect(gateOpenInputBadParser.errors).to.have.lengthOf(1);
        expect(gateOpenInputBadParser.errors[0]).to.be.an.instanceOf(exceptions_public_1.EarlyExitException);
        var gateClosedInputGood = new PredicateAtLeastOneParser([matchers_1.createRegularToken(A), matchers_1.createRegularToken(A)], false);
        gateClosedInputGood.atLeastOneRule();
        expect(gateClosedInputGood.errors).to.have.lengthOf(1);
        expect(gateClosedInputGood.errors[0]).to.be.an.instanceOf(exceptions_public_1.EarlyExitException);
        var gateClosedInputBad = new PredicateAtLeastOneParser([matchers_1.createRegularToken(B)], false);
        gateClosedInputBad.atLeastOneRule();
        expect(gateClosedInputBad.errors).to.have.lengthOf(1);
        expect(gateClosedInputBad.errors[0]).to.be.an.instanceOf(exceptions_public_1.EarlyExitException);
    });
    it("OR", function () {
        function gateFunc() {
            return this.gate;
        }
        var PredicateOrParser = /** @class */ (function (_super) {
            __extends(PredicateOrParser, _super);
            function PredicateOrParser(input, gate) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                _this.gate = gate;
                _this.orRule = _this.RULE("orRule", function () {
                    return _this.OR7([
                        // no predicate
                        {
                            ALT: function () {
                                _this.CONSUME1(A);
                                return "A";
                            }
                        },
                        {
                            GATE: gateFunc,
                            ALT: function () {
                                _this.CONSUME1(B);
                                return "B";
                            }
                        },
                        // No predicate
                        {
                            ALT: function () {
                                _this.CONSUME1(C);
                                return "C";
                            }
                        }
                    ]);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return PredicateOrParser;
        }(parser_traits_1.Parser));
        var gateOpenInputA = new PredicateOrParser([matchers_1.createRegularToken(A)], true).orRule();
        expect(gateOpenInputA).to.equal("A");
        var gateOpenInputB = new PredicateOrParser([matchers_1.createRegularToken(B)], true).orRule();
        expect(gateOpenInputB).to.equal("B");
        var gateOpenInputC = new PredicateOrParser([matchers_1.createRegularToken(C)], true).orRule();
        expect(gateOpenInputC).to.equal("C");
        var gateClosedInputA = new PredicateOrParser([matchers_1.createRegularToken(A)], false).orRule();
        expect(gateClosedInputA).to.equal("A");
        var gateClosedInputBad = new PredicateOrParser([matchers_1.createRegularToken(B)], false);
        gateClosedInputBad.orRule();
        expect(gateClosedInputBad.errors).to.have.lengthOf(1);
        expect(gateClosedInputBad.errors[0]).to.be.an.instanceOf(exceptions_public_1.NoViableAltException);
        var gateClosedInputC = new PredicateOrParser([matchers_1.createRegularToken(C)], false).orRule();
        expect(gateClosedInputC).to.equal("C");
    });
    describe("Predicates shall work with parametrized rules (issue #221)", function () {
        it("predicates in OR", function () {
            var PredicateWithRuleOrParser = /** @class */ (function (_super) {
                __extends(PredicateWithRuleOrParser, _super);
                function PredicateWithRuleOrParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                    _this.topRule = _this.RULE("topRule", function (param) {
                        return _this.OR1([
                            {
                                GATE: function () { return param; },
                                ALT: function () { return _this.CONSUME1(A).image; }
                            },
                            {
                                GATE: function () { return !param; },
                                ALT: function () { return _this.CONSUME1(B).image; }
                            }
                        ]);
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return PredicateWithRuleOrParser;
            }(parser_traits_1.Parser));
            var gateOpenInputA = new PredicateWithRuleOrParser([
                matchers_1.createRegularToken(A, "a")
            ]).topRule(1, [true]);
            expect(gateOpenInputA).to.equal("a");
            // if the predicate function still kept a reference via a closure to the original param this will not work.
            var gateOpenInputB = new PredicateWithRuleOrParser([
                matchers_1.createRegularToken(B, "b")
            ]).topRule(1, [false]);
            expect(gateOpenInputB).to.equal("b");
        });
        it("predicates in OPTION", function () {
            var PredicateWithRuleOptionParser = /** @class */ (function (_super) {
                __extends(PredicateWithRuleOptionParser, _super);
                function PredicateWithRuleOptionParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                    _this.topRule = _this.RULE("topRule", function (param) {
                        var result = "";
                        result += _this.CONSUME1(B).image;
                        return result;
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return PredicateWithRuleOptionParser;
            }(parser_traits_1.Parser));
            var parser = new PredicateWithRuleOptionParser([
                matchers_1.createRegularToken(B, "b")
            ]);
            var gateOpenInputB = parser.topRule(1, [false]);
            expect(gateOpenInputB).to.equal("b");
            // // if the predicate function still kept a reference via a closure to the original param this will not work.
            // // because the <() => param> in the OPTION will ALWAYS return false (the original param)
            // let gateOpenInputA = new PredicateWithRuleOptionParser([
            //     createRegularToken(A, "a"),
            //     createRegularToken(B, "b")
            // ]).topRule(1, [true])
            // expect(gateOpenInputA).to.equal("ab")
        });
        it("predicates in MANY", function () {
            var PredicateWithRuleManyParser = /** @class */ (function (_super) {
                __extends(PredicateWithRuleManyParser, _super);
                function PredicateWithRuleManyParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                    _this.topRule = _this.RULE("topRule", function (param) {
                        var result = "";
                        _this.MANY({
                            GATE: function () { return param; },
                            DEF: function () {
                                result += _this.CONSUME1(A).image;
                            }
                        });
                        result += _this.CONSUME1(B).image;
                        return result;
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return PredicateWithRuleManyParser;
            }(parser_traits_1.Parser));
            var gateOpenInputB = new PredicateWithRuleManyParser([
                matchers_1.createRegularToken(B, "b")
            ]).topRule(1, [false]);
            expect(gateOpenInputB).to.equal("b");
            // if the predicate function still kept a reference via a closure to the original param this will not work.
            // because the <() => param> in the MANY will ALWAYS return false (the original param)
            var gateOpenInputA = new PredicateWithRuleManyParser([
                matchers_1.createRegularToken(A, "a"),
                matchers_1.createRegularToken(A, "a"),
                matchers_1.createRegularToken(A, "a"),
                matchers_1.createRegularToken(B, "b")
            ]).topRule(1, [true]);
            expect(gateOpenInputA).to.equal("aaab");
        });
        it("predicates in AT_LEAST_ONE", function () {
            var PredicateWithRuleAtLeastOneParser = /** @class */ (function (_super) {
                __extends(PredicateWithRuleAtLeastOneParser, _super);
                function PredicateWithRuleAtLeastOneParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, { outputCst: false }) || this;
                    _this.topRule = _this.RULE("topRule", function (param) {
                        var times = 0;
                        function gateFunc() {
                            // got to enter at least once...
                            if (times === 0) {
                                times++;
                                return true;
                            }
                            else {
                                return param;
                            }
                        }
                        var result = "";
                        _this.AT_LEAST_ONE({
                            GATE: gateFunc,
                            DEF: function () {
                                result += _this.CONSUME1(A).image;
                            }
                        });
                        result += _this.CONSUME1(B).image;
                        return result;
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return PredicateWithRuleAtLeastOneParser;
            }(parser_traits_1.Parser));
            var gateOpenInputB = new PredicateWithRuleAtLeastOneParser([
                matchers_1.createRegularToken(A, "a"),
                matchers_1.createRegularToken(B, "b")
            ]).topRule(1, [false]);
            expect(gateOpenInputB).to.equal("ab");
            // if the predicate function still kept a reference via a closure to the original param this will not work.
            // because the <() => param> in the AT_LEAST_ONE will ALWAYS return false (the original param)
            var gateOpenInputA = new PredicateWithRuleAtLeastOneParser([
                matchers_1.createRegularToken(A, "a"),
                matchers_1.createRegularToken(A, "a"),
                matchers_1.createRegularToken(A, "a"),
                matchers_1.createRegularToken(B, "b")
            ]).topRule(1, [true]);
            expect(gateOpenInputA).to.equal("aaab");
        });
    });
});
//# sourceMappingURL=predicate_spec.js.map