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
var tokens_1 = require("../../src/scan/tokens");
var matchers_1 = require("../utils/matchers");
var utils_1 = require("../../src/utils/utils");
function createTokenVector(tokTypes) {
    return utils_1.map(tokTypes, function (curTokType) {
        return matchers_1.createRegularToken(curTokType);
    });
}
context("CST", function () {
    var A = tokens_public_1.createToken({ name: "A" });
    var B = tokens_public_1.createToken({ name: "B" });
    var C = tokens_public_1.createToken({ name: "C" });
    var D = tokens_public_1.createToken({ name: "D" });
    var E = tokens_public_1.createToken({ name: "E" });
    var ALL_TOKENS = [A, B, C, D, E];
    it("Can output a CST for a flat structure", function () {
        var CstTerminalParser = /** @class */ (function (_super) {
            __extends(CstTerminalParser, _super);
            function CstTerminalParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS) || this;
                _this.testRule = _this.RULE("testRule", function () {
                    _this.CONSUME(A);
                    _this.CONSUME(B);
                    _this.SUBRULE(_this.bamba);
                });
                _this.bamba = _this.RULE("bamba", function () {
                    _this.CONSUME(C);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return CstTerminalParser;
        }(parser_traits_1.Parser));
        var input = [
            matchers_1.createRegularToken(A),
            matchers_1.createRegularToken(B),
            matchers_1.createRegularToken(C)
        ];
        var parser = new CstTerminalParser(input);
        var cst = parser.testRule();
        expect(cst.name).to.equal("testRule");
        expect(cst.children).to.have.keys("A", "B", "bamba");
        expect(tokens_1.tokenStructuredMatcher(cst.children.A[0], A)).to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
        expect(cst.children.bamba[0].name).to.equal("bamba");
        expect(tokens_1.tokenStructuredMatcher(cst.children.bamba[0].children.C[0], C))
            .to.be.true;
    });
    it("Can output a CST with labels", function () {
        var CstTerminalParser2 = /** @class */ (function (_super) {
            __extends(CstTerminalParser2, _super);
            function CstTerminalParser2(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, {
                    outputCst: true
                }) || this;
                _this.testRule = _this.RULE("testRule", function () {
                    _this.CONSUME(A, { LABEL: "myLabel" });
                    _this.CONSUME(B);
                    _this.SUBRULE(_this.bamba, { LABEL: "myOtherLabel" });
                });
                _this.bamba = _this.RULE("bamba", function () {
                    _this.CONSUME(C);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return CstTerminalParser2;
        }(parser_traits_1.Parser));
        var input = [
            matchers_1.createRegularToken(A),
            matchers_1.createRegularToken(B),
            matchers_1.createRegularToken(C)
        ];
        var parser = new CstTerminalParser2(input);
        var cst = parser.testRule();
        expect(cst.name).to.equal("testRule");
        expect(cst.children).to.have.keys("myLabel", "B", "myOtherLabel");
        expect(tokens_1.tokenStructuredMatcher(cst.children.myLabel[0], A)).to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
        expect(cst.children.myOtherLabel[0].name).to.equal("bamba");
        expect(tokens_1.tokenStructuredMatcher(cst.children.myOtherLabel[0].children.C[0], C)).to.be.true;
    });
    it("Can output a CST with labels in recovery", function () {
        var CstTerminalParserWithLabels = /** @class */ (function (_super) {
            __extends(CstTerminalParserWithLabels, _super);
            function CstTerminalParserWithLabels(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, {
                    outputCst: true,
                    recoveryEnabled: true
                }) || this;
                _this.testRule = _this.RULE("testRule", function () {
                    _this.CONSUME(A, { LABEL: "myLabel" });
                    _this.CONSUME(B);
                    _this.SUBRULE(_this.bamba, { LABEL: "myOtherLabel" });
                });
                _this.bamba = _this.RULE("bamba", function () {
                    _this.CONSUME(C);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return CstTerminalParserWithLabels;
        }(parser_traits_1.Parser));
        var input = [matchers_1.createRegularToken(A), matchers_1.createRegularToken(B)];
        var parser = new CstTerminalParserWithLabels(input);
        var cst = parser.testRule();
        expect(cst.name).to.equal("testRule");
        expect(cst.children).to.have.keys("myLabel", "B", "myOtherLabel");
        expect(tokens_1.tokenStructuredMatcher(cst.children.myLabel[0], A)).to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
        expect(cst.children.myOtherLabel[0].name).to.equal("bamba");
        expect(cst.children.myOtherLabel[0].recoveredNode).to.be.true;
    });
    it("Can output a CST for a Terminal - alternations", function () {
        var CstTerminalAlternationParser = /** @class */ (function (_super) {
            __extends(CstTerminalAlternationParser, _super);
            function CstTerminalAlternationParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, {
                    outputCst: true
                }) || this;
                _this.testRule = _this.RULE("testRule", function () {
                    _this.OR([
                        {
                            ALT: function () {
                                _this.CONSUME(A);
                            }
                        },
                        {
                            ALT: function () {
                                _this.CONSUME(B);
                                _this.SUBRULE(_this.bamba);
                            }
                        }
                    ]);
                });
                _this.bamba = _this.RULE("bamba", function () {
                    _this.CONSUME(C);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return CstTerminalAlternationParser;
        }(parser_traits_1.Parser));
        var input = [matchers_1.createRegularToken(A)];
        var parser = new CstTerminalAlternationParser(input);
        var cst = parser.testRule();
        expect(cst.name).to.equal("testRule");
        expect(cst.children).to.have.keys("A");
        expect(tokens_1.tokenStructuredMatcher(cst.children.A[0], A)).to.be.true;
        expect(cst.children.bamba).to.be.undefined;
    });
    it("Can output a CST for a Terminal - alternations - single", function () {
        var CstTerminalAlternationSingleAltParser = /** @class */ (function (_super) {
            __extends(CstTerminalAlternationSingleAltParser, _super);
            function CstTerminalAlternationSingleAltParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, {
                    outputCst: true
                }) || this;
                _this.testRule = _this.RULE("testRule", function () {
                    _this.OR([
                        {
                            ALT: function () {
                                _this.CONSUME(A);
                                _this.CONSUME(B);
                            }
                        }
                    ]);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return CstTerminalAlternationSingleAltParser;
        }(parser_traits_1.Parser));
        var input = [matchers_1.createRegularToken(A), matchers_1.createRegularToken(B)];
        var parser = new CstTerminalAlternationSingleAltParser(input);
        var cst = parser.testRule();
        expect(cst.name).to.equal("testRule");
        expect(cst.children).to.have.keys("A", "B");
        expect(tokens_1.tokenStructuredMatcher(cst.children.A[0], A)).to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
    });
    it("Can output a CST for a Terminal with multiple occurrences", function () {
        var CstMultiTerminalParser = /** @class */ (function (_super) {
            __extends(CstMultiTerminalParser, _super);
            function CstMultiTerminalParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, {
                    outputCst: true
                }) || this;
                _this.testRule = _this.RULE("testRule", function () {
                    _this.CONSUME(A);
                    _this.CONSUME(B);
                    _this.CONSUME2(A);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return CstMultiTerminalParser;
        }(parser_traits_1.Parser));
        var input = [
            matchers_1.createRegularToken(A),
            matchers_1.createRegularToken(B),
            matchers_1.createRegularToken(A)
        ];
        var parser = new CstMultiTerminalParser(input);
        var cst = parser.testRule();
        expect(cst.name).to.equal("testRule");
        expect(cst.children).to.have.keys("A", "B");
        expect(cst.children.A).to.have.length(2);
        expect(tokens_1.tokenStructuredMatcher(cst.children.A[0], A)).to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.A[1], A)).to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
    });
    it("Can output a CST for a Terminal with multiple occurrences - iteration", function () {
        var CstMultiTerminalWithManyParser = /** @class */ (function (_super) {
            __extends(CstMultiTerminalWithManyParser, _super);
            function CstMultiTerminalWithManyParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, {
                    outputCst: true
                }) || this;
                _this.testRule = _this.RULE("testRule", function () {
                    _this.MANY(function () {
                        _this.CONSUME(A);
                        _this.SUBRULE(_this.bamba);
                    });
                    _this.CONSUME(B);
                });
                _this.bamba = _this.RULE("bamba", function () {
                    _this.CONSUME(C);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return CstMultiTerminalWithManyParser;
        }(parser_traits_1.Parser));
        var input = [
            matchers_1.createRegularToken(A),
            matchers_1.createRegularToken(C),
            matchers_1.createRegularToken(A),
            matchers_1.createRegularToken(C),
            matchers_1.createRegularToken(A),
            matchers_1.createRegularToken(C),
            matchers_1.createRegularToken(B)
        ];
        var parser = new CstMultiTerminalWithManyParser(input);
        var cst = parser.testRule();
        expect(cst.name).to.equal("testRule");
        expect(cst.children).to.have.keys("A", "B", "bamba");
        expect(cst.children.A).to.have.length(3);
        expect(tokens_1.tokenStructuredMatcher(cst.children.A[0], A)).to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.A[1], A)).to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.A[2], A)).to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
        expect(cst.children.bamba).to.have.length(3);
        expect(tokens_1.tokenStructuredMatcher(cst.children.bamba[0].children.C[0], C))
            .to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.bamba[1].children.C[0], C))
            .to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.bamba[2].children.C[0], C))
            .to.be.true;
    });
    context("Can output a CST for an optional terminal", function () {
        var CstOptionalTerminalParser = /** @class */ (function (_super) {
            __extends(CstOptionalTerminalParser, _super);
            function CstOptionalTerminalParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, {
                    outputCst: true
                }) || this;
                _this.ruleWithOptional = _this.RULE("ruleWithOptional", function () {
                    _this.OPTION(function () {
                        _this.CONSUME(A);
                        _this.SUBRULE(_this.bamba);
                    });
                    _this.CONSUME(B);
                });
                _this.bamba = _this.RULE("bamba", function () {
                    _this.CONSUME(C);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return CstOptionalTerminalParser;
        }(parser_traits_1.Parser));
        it("path taken", function () {
            var input = [
                matchers_1.createRegularToken(A),
                matchers_1.createRegularToken(C),
                matchers_1.createRegularToken(B)
            ];
            var parser = new CstOptionalTerminalParser(input);
            var cst = parser.ruleWithOptional();
            expect(cst.name).to.equal("ruleWithOptional");
            expect(cst.children).to.have.keys("A", "B", "bamba");
            expect(tokens_1.tokenStructuredMatcher(cst.children.A[0], A)).to.be.true;
            expect(cst.children.bamba[0].name).to.equal("bamba");
            expect(tokens_1.tokenStructuredMatcher(cst.children.bamba[0].children.C[0], C)).to.be.true;
            expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
        });
        it("path NOT taken", function () {
            var input = [matchers_1.createRegularToken(B)];
            var parser = new CstOptionalTerminalParser(input);
            var cst = parser.ruleWithOptional();
            expect(cst.name).to.equal("ruleWithOptional");
            expect(cst.children).to.have.keys("B");
            expect(cst.children.A).to.be.undefined;
            expect(cst.children.bamba).to.be.undefined;
            expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
        });
    });
    it("Can output a CST for a Terminal with multiple occurrences - iteration mandatory", function () {
        var CstMultiTerminalWithAtLeastOneParser = /** @class */ (function (_super) {
            __extends(CstMultiTerminalWithAtLeastOneParser, _super);
            function CstMultiTerminalWithAtLeastOneParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, {
                    outputCst: true
                }) || this;
                _this.testRule = _this.RULE("testRule", function () {
                    _this.AT_LEAST_ONE(function () {
                        _this.CONSUME(A);
                    });
                    _this.CONSUME(B);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return CstMultiTerminalWithAtLeastOneParser;
        }(parser_traits_1.Parser));
        var input = [
            matchers_1.createRegularToken(A),
            matchers_1.createRegularToken(A),
            matchers_1.createRegularToken(A),
            matchers_1.createRegularToken(B)
        ];
        var parser = new CstMultiTerminalWithAtLeastOneParser(input);
        var cst = parser.testRule();
        expect(cst.name).to.equal("testRule");
        expect(cst.children).to.have.keys("A", "B");
        expect(cst.children.A).to.have.length(3);
        expect(tokens_1.tokenStructuredMatcher(cst.children.A[0], A)).to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.A[1], A)).to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.A[2], A)).to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
    });
    it("Can output a CST for a Terminal with multiple occurrences - iteration SEP", function () {
        var CstMultiTerminalWithManySepParser = /** @class */ (function (_super) {
            __extends(CstMultiTerminalWithManySepParser, _super);
            function CstMultiTerminalWithManySepParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, {
                    outputCst: true
                }) || this;
                _this.testRule = _this.RULE("testRule", function () {
                    _this.MANY_SEP({
                        SEP: C,
                        DEF: function () {
                            _this.CONSUME(A);
                        }
                    });
                    _this.CONSUME(B);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return CstMultiTerminalWithManySepParser;
        }(parser_traits_1.Parser));
        var input = [
            matchers_1.createRegularToken(A),
            matchers_1.createRegularToken(C),
            matchers_1.createRegularToken(A),
            matchers_1.createRegularToken(B)
        ];
        var parser = new CstMultiTerminalWithManySepParser(input);
        var cst = parser.testRule();
        expect(cst.name).to.equal("testRule");
        expect(cst.children).to.have.keys("A", "B", "C");
        expect(cst.children.A).to.have.length(2);
        expect(tokens_1.tokenStructuredMatcher(cst.children.A[0], A)).to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.A[1], A)).to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
        expect(cst.children.C).to.have.length(1);
        expect(tokens_1.tokenStructuredMatcher(cst.children.C[0], C)).to.be.true;
    });
    it("Can output a CST for a Terminal with multiple occurrences - iteration SEP mandatory", function () {
        var CstMultiTerminalWithAtLeastOneSepParser = /** @class */ (function (_super) {
            __extends(CstMultiTerminalWithAtLeastOneSepParser, _super);
            function CstMultiTerminalWithAtLeastOneSepParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, ALL_TOKENS, {
                    outputCst: true
                }) || this;
                _this.testRule = _this.RULE("testRule", function () {
                    _this.AT_LEAST_ONE_SEP({
                        SEP: C,
                        DEF: function () {
                            _this.CONSUME(A);
                        }
                    });
                    _this.CONSUME(B);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return CstMultiTerminalWithAtLeastOneSepParser;
        }(parser_traits_1.Parser));
        var input = [
            matchers_1.createRegularToken(A),
            matchers_1.createRegularToken(C),
            matchers_1.createRegularToken(A),
            matchers_1.createRegularToken(B)
        ];
        var parser = new CstMultiTerminalWithAtLeastOneSepParser(input);
        var cst = parser.testRule();
        expect(cst.name).to.equal("testRule");
        expect(cst.children).to.have.keys("A", "B", "C");
        expect(cst.children.A).to.have.length(2);
        expect(tokens_1.tokenStructuredMatcher(cst.children.A[0], A)).to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.A[1], A)).to.be.true;
        expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
        expect(cst.children.C).to.have.length(1);
        expect(tokens_1.tokenStructuredMatcher(cst.children.C[0], C)).to.be.true;
    });
    context("nested rules", function () {
        context("Can output cst when using OPTION", function () {
            var CstOptionalNestedTerminalParser = /** @class */ (function (_super) {
                __extends(CstOptionalNestedTerminalParser, _super);
                function CstOptionalNestedTerminalParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, {
                        outputCst: true
                    }) || this;
                    _this.ruleWithOptional = _this.RULE("ruleWithOptional", function () {
                        _this.OPTION({
                            NAME: "$nestedOption",
                            DEF: function () {
                                _this.CONSUME(A);
                                _this.SUBRULE(_this.bamba);
                            }
                        });
                        _this.CONSUME(B);
                    });
                    _this.bamba = _this.RULE("bamba", function () {
                        _this.CONSUME(C);
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return CstOptionalNestedTerminalParser;
            }(parser_traits_1.Parser));
            it("path taken", function () {
                var input = [
                    matchers_1.createRegularToken(A),
                    matchers_1.createRegularToken(C),
                    matchers_1.createRegularToken(B)
                ];
                var parser = new CstOptionalNestedTerminalParser(input);
                var cst = parser.ruleWithOptional();
                expect(cst.name).to.equal("ruleWithOptional");
                expect(cst.children).to.have.keys("$nestedOption", "B");
                var $nestedOptionCst = cst.children.$nestedOption[0];
                expect(tokens_1.tokenStructuredMatcher($nestedOptionCst.children.A[0], A)).to.be.true;
                expect($nestedOptionCst.children.bamba[0].name).to.equal("bamba");
                expect(tokens_1.tokenStructuredMatcher($nestedOptionCst.children.bamba[0].children.C[0], C)).to.be.true;
                expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
            });
            it("path NOT taken", function () {
                var input = [matchers_1.createRegularToken(B)];
                var parser = new CstOptionalNestedTerminalParser(input);
                var cst = parser.ruleWithOptional();
                expect(cst.name).to.equal("ruleWithOptional");
                // nested rule is equivalent to an optionally empty rule call
                expect(cst.children).to.have.keys("B", "$nestedOption");
                var $nestedOptionCst = cst.children.$nestedOption[0];
                expect($nestedOptionCst.children.A).to.be.undefined;
                expect($nestedOptionCst.children.bamba).to.be.undefined;
                expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
            });
        });
        it("Can output a CST when using OR with nested named Alternatives", function () {
            var CstAlternationNestedAltParser = /** @class */ (function (_super) {
                __extends(CstAlternationNestedAltParser, _super);
                function CstAlternationNestedAltParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, {
                        outputCst: true
                    }) || this;
                    _this.testRule = _this.RULE("testRule", function () {
                        _this.OR([
                            {
                                NAME: "$first_alternative",
                                ALT: function () {
                                    _this.CONSUME(A);
                                }
                            },
                            {
                                ALT: function () {
                                    _this.CONSUME(B);
                                    _this.SUBRULE(_this.bamba);
                                }
                            }
                        ]);
                    });
                    _this.bamba = _this.RULE("bamba", function () {
                        _this.CONSUME(C);
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return CstAlternationNestedAltParser;
            }(parser_traits_1.Parser));
            var input = [matchers_1.createRegularToken(A)];
            var parser = new CstAlternationNestedAltParser(input);
            var cst = parser.testRule();
            expect(cst.name).to.equal("testRule");
            expect(cst.children).to.have.keys("$first_alternative");
            var firstAltCst = cst.children.$first_alternative[0];
            expect(tokens_1.tokenStructuredMatcher(firstAltCst.children.A[0], A)).to.be
                .true;
            expect(cst.children.bamba).to.be.undefined;
            expect(cst.children.B).to.be.undefined;
        });
        it("Can output a CST when using OR", function () {
            var CstAlternationNestedParser = /** @class */ (function (_super) {
                __extends(CstAlternationNestedParser, _super);
                function CstAlternationNestedParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, {
                        outputCst: true
                    }) || this;
                    _this.testRule = _this.RULE("testRule", function () {
                        _this.OR({
                            NAME: "$nestedOr",
                            DEF: [
                                {
                                    ALT: function () {
                                        _this.CONSUME(A);
                                    }
                                },
                                {
                                    ALT: function () {
                                        _this.CONSUME(B);
                                        _this.SUBRULE(_this.bamba);
                                    }
                                }
                            ]
                        });
                    });
                    _this.bamba = _this.RULE("bamba", function () {
                        _this.CONSUME(C);
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return CstAlternationNestedParser;
            }(parser_traits_1.Parser));
            var input = [matchers_1.createRegularToken(A)];
            var parser = new CstAlternationNestedParser(input);
            var cst = parser.testRule();
            expect(cst.name).to.equal("testRule");
            expect(cst.children).to.have.keys("$nestedOr");
            var orCst = cst.children.$nestedOr[0];
            expect(orCst.children).to.have.keys("A");
            expect(tokens_1.tokenStructuredMatcher(orCst.children.A[0], A)).to.be.true;
            expect(orCst.children.bamba).to.be.undefined;
            expect(orCst.children.B).to.be.undefined;
        });
        it("Can output a CST when using OR - single Alt", function () {
            var CstAlternationNestedAltSingleParser = /** @class */ (function (_super) {
                __extends(CstAlternationNestedAltSingleParser, _super);
                function CstAlternationNestedAltSingleParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, {
                        outputCst: true
                    }) || this;
                    _this.testRule = _this.RULE("testRule", function () {
                        _this.OR([
                            {
                                NAME: "$nestedAlt",
                                ALT: function () {
                                    _this.CONSUME(B);
                                    _this.SUBRULE(_this.bamba);
                                }
                            }
                        ]);
                    });
                    _this.bamba = _this.RULE("bamba", function () {
                        _this.CONSUME(C);
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return CstAlternationNestedAltSingleParser;
            }(parser_traits_1.Parser));
            var input = [matchers_1.createRegularToken(B), matchers_1.createRegularToken(C)];
            var parser = new CstAlternationNestedAltSingleParser(input);
            var cst = parser.testRule();
            expect(cst.name).to.equal("testRule");
            expect(cst.children).to.have.keys("$nestedAlt");
            var altCst = cst.children.$nestedAlt[0];
            expect(altCst.children).to.have.keys("B", "bamba");
            expect(tokens_1.tokenStructuredMatcher(altCst.children.B[0], B)).to.be.true;
            expect(altCst.children.bamba[0].children).to.have.keys("C");
        });
        it("Can output a CST using Repetitions", function () {
            var CstMultiTerminalWithManyNestedParser = /** @class */ (function (_super) {
                __extends(CstMultiTerminalWithManyNestedParser, _super);
                function CstMultiTerminalWithManyNestedParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, {
                        outputCst: true
                    }) || this;
                    _this.testRule = _this.RULE("testRule", function () {
                        _this.MANY({
                            NAME: "$nestedMany",
                            DEF: function () {
                                _this.CONSUME(A);
                                _this.SUBRULE(_this.bamba);
                            }
                        });
                        _this.CONSUME(B);
                    });
                    _this.bamba = _this.RULE("bamba", function () {
                        _this.CONSUME(C);
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return CstMultiTerminalWithManyNestedParser;
            }(parser_traits_1.Parser));
            var input = [
                matchers_1.createRegularToken(A),
                matchers_1.createRegularToken(C),
                matchers_1.createRegularToken(A),
                matchers_1.createRegularToken(C),
                matchers_1.createRegularToken(A),
                matchers_1.createRegularToken(C),
                matchers_1.createRegularToken(B)
            ];
            var parser = new CstMultiTerminalWithManyNestedParser(input);
            var cst = parser.testRule();
            expect(cst.name).to.equal("testRule");
            expect(cst.children).to.have.keys("B", "$nestedMany");
            expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
            var nestedManyCst = cst.children.$nestedMany[0];
            expect(nestedManyCst.children).to.have.keys("A", "bamba");
            expect(nestedManyCst.children.A).to.have.length(3);
            expect(tokens_1.tokenStructuredMatcher(nestedManyCst.children.A[0], A)).to.be
                .true;
            expect(tokens_1.tokenStructuredMatcher(nestedManyCst.children.A[1], A)).to.be
                .true;
            expect(tokens_1.tokenStructuredMatcher(nestedManyCst.children.A[2], A)).to.be
                .true;
            expect(nestedManyCst.children.bamba).to.have.length(3);
            expect(tokens_1.tokenStructuredMatcher(nestedManyCst.children.bamba[0].children.C[0], C)).to.be.true;
            expect(tokens_1.tokenStructuredMatcher(nestedManyCst.children.bamba[1].children.C[0], C)).to.be.true;
            expect(tokens_1.tokenStructuredMatcher(nestedManyCst.children.bamba[2].children.C[0], C)).to.be.true;
        });
        it("Can output a CST using mandatory Repetitions", function () {
            var CstAtLeastOneNestedParser = /** @class */ (function (_super) {
                __extends(CstAtLeastOneNestedParser, _super);
                function CstAtLeastOneNestedParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, {
                        outputCst: true
                    }) || this;
                    _this.testRule = _this.RULE("testRule", function () {
                        _this.AT_LEAST_ONE({
                            NAME: "$oops",
                            DEF: function () {
                                _this.CONSUME(A);
                            }
                        });
                        _this.CONSUME(B);
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return CstAtLeastOneNestedParser;
            }(parser_traits_1.Parser));
            var input = [
                matchers_1.createRegularToken(A),
                matchers_1.createRegularToken(A),
                matchers_1.createRegularToken(A),
                matchers_1.createRegularToken(B)
            ];
            var parser = new CstAtLeastOneNestedParser(input);
            var cst = parser.testRule();
            expect(cst.name).to.equal("testRule");
            expect(cst.children).to.have.keys("$oops", "B");
            expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
            var oopsCst = cst.children.$oops[0];
            expect(oopsCst.children).to.have.keys("A");
            expect(oopsCst.children.A).to.have.length(3);
            expect(tokens_1.tokenStructuredMatcher(oopsCst.children.A[0], A)).to.be.true;
            expect(tokens_1.tokenStructuredMatcher(oopsCst.children.A[1], A)).to.be.true;
            expect(tokens_1.tokenStructuredMatcher(oopsCst.children.A[2], A)).to.be.true;
        });
        it("Can output a CST using Repetitions with separator", function () {
            var CstNestedRuleWithManySepParser = /** @class */ (function (_super) {
                __extends(CstNestedRuleWithManySepParser, _super);
                function CstNestedRuleWithManySepParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, {
                        outputCst: true
                    }) || this;
                    _this.testRule = _this.RULE("testRule", function () {
                        _this.MANY_SEP({
                            NAME: "$pizza",
                            SEP: C,
                            DEF: function () {
                                _this.CONSUME(A);
                            }
                        });
                        _this.CONSUME(B);
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return CstNestedRuleWithManySepParser;
            }(parser_traits_1.Parser));
            var input = [
                matchers_1.createRegularToken(A),
                matchers_1.createRegularToken(C),
                matchers_1.createRegularToken(A),
                matchers_1.createRegularToken(B)
            ];
            var parser = new CstNestedRuleWithManySepParser(input);
            var cst = parser.testRule();
            expect(cst.name).to.equal("testRule");
            expect(cst.children).to.have.keys("$pizza", "B");
            expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
            var pizzaCst = cst.children.$pizza[0];
            expect(pizzaCst.children.A).to.have.length(2);
            expect(tokens_1.tokenStructuredMatcher(pizzaCst.children.A[0], A)).to.be.true;
            expect(tokens_1.tokenStructuredMatcher(pizzaCst.children.A[1], A)).to.be.true;
            expect(pizzaCst.children.C).to.have.length(1);
            expect(tokens_1.tokenStructuredMatcher(pizzaCst.children.C[0], C)).to.be.true;
        });
        it("Can output a CST using Repetitions with separator - mandatory", function () {
            var CstAtLeastOneSepNestedParser = /** @class */ (function (_super) {
                __extends(CstAtLeastOneSepNestedParser, _super);
                function CstAtLeastOneSepNestedParser(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, {
                        outputCst: true
                    }) || this;
                    _this.testRule = _this.RULE("testRule", function () {
                        _this.AT_LEAST_ONE_SEP({
                            NAME: "$nestedName",
                            SEP: C,
                            DEF: function () {
                                _this.CONSUME(A);
                            }
                        });
                        _this.CONSUME(B);
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                return CstAtLeastOneSepNestedParser;
            }(parser_traits_1.Parser));
            var input = [
                matchers_1.createRegularToken(A),
                matchers_1.createRegularToken(C),
                matchers_1.createRegularToken(A),
                matchers_1.createRegularToken(B)
            ];
            var parser = new CstAtLeastOneSepNestedParser(input);
            var cst = parser.testRule();
            expect(cst.name).to.equal("testRule");
            expect(cst.children).to.have.keys("$nestedName", "B");
            expect(tokens_1.tokenStructuredMatcher(cst.children.B[0], B)).to.be.true;
            var nestedCst = cst.children.$nestedName[0];
            expect(nestedCst.children.A).to.have.length(2);
            expect(tokens_1.tokenStructuredMatcher(nestedCst.children.A[0], A)).to.be
                .true;
            expect(tokens_1.tokenStructuredMatcher(nestedCst.children.A[1], A)).to.be
                .true;
            expect(nestedCst.children.C).to.have.length(1);
            expect(tokens_1.tokenStructuredMatcher(nestedCst.children.C[0], C)).to.be
                .true;
        });
    });
    context("Error Recovery", function () {
        it("re-sync recovery", function () {
            var CstRecoveryParserReSync = /** @class */ (function (_super) {
                __extends(CstRecoveryParserReSync, _super);
                function CstRecoveryParserReSync(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, {
                        outputCst: true,
                        recoveryEnabled: true
                    }) || this;
                    _this.root = _this.RULE("root", function () {
                        _this.MANY(function () {
                            _this.OR([
                                {
                                    ALT: function () {
                                        _this.SUBRULE(_this.first);
                                    }
                                },
                                {
                                    ALT: function () {
                                        _this.SUBRULE(_this.second);
                                    }
                                }
                            ]);
                        });
                    });
                    _this.first = _this.RULE("first", function () {
                        _this.CONSUME(A);
                        _this.CONSUME(B);
                    });
                    _this.second = _this.RULE("second", function () {
                        _this.CONSUME(C);
                        _this.CONSUME(D);
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                CstRecoveryParserReSync.prototype.canTokenTypeBeInsertedInRecovery = function (tokType) {
                    // we want to force re-sync recovery
                    return false;
                };
                return CstRecoveryParserReSync;
            }(parser_traits_1.Parser));
            var input = createTokenVector([A, E, E, C, D]);
            var parser = new CstRecoveryParserReSync(input);
            var cst = parser.root();
            expect(parser.errors).to.have.lengthOf(1);
            expect(parser.errors[0].message).to.include("Expecting token of type --> B <--");
            expect(parser.errors[0].resyncedTokens).to.have.lengthOf(1);
            expect(tokens_1.tokenStructuredMatcher(parser.errors[0].resyncedTokens[0], E)).to.be.true;
            // expect(parser.errors[0]).
            expect(cst.name).to.equal("root");
            expect(cst.children).to.have.keys("first", "second");
            var firstCollection = cst.children.first;
            expect(firstCollection).to.have.lengthOf(1);
            var first = firstCollection[0];
            expect(first.recoveredNode).to.be.true;
            expect(first.children).to.have.keys("A");
            expect(tokens_1.tokenStructuredMatcher(first.children.A[0], A)).to.be.true;
            expect(first.children.B).to.be.undefined;
            var secondCollection = cst.children.second;
            expect(secondCollection).to.have.lengthOf(1);
            var second = secondCollection[0];
            expect(second.recoveredNode).to.be.undefined;
            expect(second.children).to.have.keys("C", "D");
            expect(tokens_1.tokenStructuredMatcher(second.children.C[0], C)).to.be.true;
            expect(tokens_1.tokenStructuredMatcher(second.children.D[0], D)).to.be.true;
        });
        it("re-sync recovery nested", function () {
            var CstRecoveryParserReSyncNested = /** @class */ (function (_super) {
                __extends(CstRecoveryParserReSyncNested, _super);
                function CstRecoveryParserReSyncNested(input) {
                    if (input === void 0) { input = []; }
                    var _this = _super.call(this, ALL_TOKENS, {
                        outputCst: true,
                        recoveryEnabled: true
                    }) || this;
                    _this.root = _this.RULE("root", function () {
                        _this.MANY(function () {
                            _this.OR([
                                {
                                    ALT: function () {
                                        _this.SUBRULE(_this.first_root);
                                    }
                                },
                                {
                                    ALT: function () {
                                        _this.SUBRULE(_this.second);
                                    }
                                }
                            ]);
                        });
                    });
                    _this.first_root = _this.RULE("first_root", function () {
                        _this.SUBRULE(_this.first);
                    });
                    _this.first = _this.RULE("first", function () {
                        _this.CONSUME(A);
                        _this.CONSUME(B);
                    });
                    _this.second = _this.RULE("second", function () {
                        _this.CONSUME(C);
                        _this.CONSUME(D);
                    });
                    _this.input = input;
                    _this.performSelfAnalysis();
                    return _this;
                }
                CstRecoveryParserReSyncNested.prototype.canTokenTypeBeInsertedInRecovery = function (tokType) {
                    // we want to force re-sync recovery
                    return false;
                };
                return CstRecoveryParserReSyncNested;
            }(parser_traits_1.Parser));
            var input = createTokenVector([A, E, E, C, D]);
            var parser = new CstRecoveryParserReSyncNested(input);
            var cst = parser.root();
            expect(parser.errors).to.have.lengthOf(1);
            expect(parser.errors[0].message).to.include("Expecting token of type --> B <--");
            expect(parser.errors[0].resyncedTokens).to.have.lengthOf(1);
            expect(tokens_1.tokenStructuredMatcher(parser.errors[0].resyncedTokens[0], E)).to.be.true;
            expect(cst.name).to.equal("root");
            expect(cst.children).to.have.keys("first_root", "second");
            var firstRootCollection = cst.children.first_root;
            expect(firstRootCollection).to.have.lengthOf(1);
            var firstRoot = firstRootCollection[0];
            expect(firstRoot.children).to.have.keys("first");
            var first = firstRoot.children.first[0];
            expect(first.recoveredNode).to.be.true;
            expect(first.children).to.have.keys("A");
            expect(tokens_1.tokenStructuredMatcher(first.children.A[0], A)).to.be.true;
            expect(first.children.B).to.be.undefined;
            var secondCollection = cst.children.second;
            expect(secondCollection).to.have.lengthOf(1);
            var second = secondCollection[0];
            expect(second.recoveredNode).to.be.undefined;
            expect(second.children).to.have.keys("C", "D");
            expect(tokens_1.tokenStructuredMatcher(second.children.C[0], C)).to.be.true;
            expect(tokens_1.tokenStructuredMatcher(second.children.D[0], D)).to.be.true;
        });
    });
});
//# sourceMappingURL=cst_spec.js.map