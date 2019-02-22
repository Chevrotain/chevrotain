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
var parser_traits_1 = require("../../../src/parse/parser/traits/parser_traits");
var matchers_1 = require("../../utils/matchers");
var tokens_1 = require("../../../src/scan/tokens");
describe("The Recognizer's capabilities for overriding grammar productions", function () {
    var PlusTok = /** @class */ (function () {
        function PlusTok() {
        }
        PlusTok.PATTERN = /\+/;
        return PlusTok;
    }());
    var MinusTok = /** @class */ (function () {
        function MinusTok() {
        }
        MinusTok.PATTERN = /-/;
        return MinusTok;
    }());
    tokens_1.augmentTokenTypes([PlusTok, MinusTok]);
    it("Can override an existing rule", function () {
        var SuperOverrideParser = /** @class */ (function (_super) {
            __extends(SuperOverrideParser, _super);
            function SuperOverrideParser(input, isInvokedByChildConstructor) {
                if (input === void 0) { input = []; }
                if (isInvokedByChildConstructor === void 0) { isInvokedByChildConstructor = false; }
                var _this = _super.call(this, [PlusTok, MinusTok], { outputCst: false }) || this;
                _this.topRule = _this.RULE("topRule", function () {
                    var result;
                    _this.OPTION(function () {
                        result = _this.SUBRULE(_this.nestedRule);
                    });
                    return result;
                });
                _this.nestedRule = _this.RULE("nestedRule", function () {
                    _this.CONSUME(PlusTok);
                    return "yey";
                });
                _this.input = input;
                // performSelfAnalysis should only be invoked once.
                if (!isInvokedByChildConstructor) {
                    _this.performSelfAnalysis();
                }
                return _this;
            }
            return SuperOverrideParser;
        }(parser_traits_1.Parser));
        var ChildOverrideParser = /** @class */ (function (_super) {
            __extends(ChildOverrideParser, _super);
            function ChildOverrideParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, input, true) || this;
                // nestedRule is overridden with a new implementation
                _this.nestedRule = _this.OVERRIDE_RULE("nestedRule", function () {
                    _this.AT_LEAST_ONE(function () {
                        _this.CONSUME(MinusTok);
                    });
                    return "ney";
                });
                _this.performSelfAnalysis();
                return _this;
            }
            return ChildOverrideParser;
        }(SuperOverrideParser));
        var superParser = new SuperOverrideParser([matchers_1.createRegularToken(PlusTok)]);
        var superResult = superParser.topRule();
        expect(superResult).to.equal("yey");
        expect(superParser.errors).to.be.empty;
        var childParser = new ChildOverrideParser([
            matchers_1.createRegularToken(MinusTok),
            matchers_1.createRegularToken(MinusTok),
            matchers_1.createRegularToken(MinusTok)
        ]);
        var childResult = childParser.topRule();
        expect(childResult).to.equal("ney");
        expect(superParser.errors).to.be.empty;
    });
    it("Can not override a rule which does not exist", function () {
        var InvalidOverrideParser = /** @class */ (function (_super) {
            __extends(InvalidOverrideParser, _super);
            function InvalidOverrideParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, [PlusTok, MinusTok]) || this;
                // nothing to override, oops does not exist in any of the super grammars
                _this.oops = _this.OVERRIDE_RULE("oops", function () {
                    _this.CONSUME(PlusTok);
                    return "poof";
                }, { recoveryValueFunc: function () { return "boom"; } });
                _this.performSelfAnalysis();
                return _this;
            }
            return InvalidOverrideParser;
        }(parser_traits_1.Parser));
        expect(function () { return new InvalidOverrideParser([]); }).to.throw("Parser Definition Errors detected");
        expect(function () { return new InvalidOverrideParser([]); }).to.throw("Invalid rule override");
        expect(function () { return new InvalidOverrideParser([]); }).to.throw("->oops<-");
    });
});
//# sourceMappingURL=rules_override_spec.js.map