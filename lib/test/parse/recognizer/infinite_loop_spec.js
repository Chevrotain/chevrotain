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
describe("The Recognizer's capabilities for detecting infinite loops", function () {
    var PlusTok = /** @class */ (function () {
        function PlusTok() {
        }
        PlusTok.PATTERN = /\+/;
        return PlusTok;
    }());
    tokens_1.augmentTokenTypes([PlusTok]);
    it("Will detect an infinite loop with an early return", function () {
        var InifiniteLoopParser = /** @class */ (function (_super) {
            __extends(InifiniteLoopParser, _super);
            function InifiniteLoopParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, [PlusTok]) || this;
                _this.loop = _this.RULE("loop", function () {
                    _this.MANY(function () {
                        return;
                        // noinspection UnreachableCodeJS
                        _this.CONSUME(PlusTok);
                    });
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return InifiniteLoopParser;
        }(parser_traits_1.Parser));
        var parser = new InifiniteLoopParser();
        parser.input = [matchers_1.createRegularToken(PlusTok)];
        expect(function () { return parser.loop(); }).to.throw("Infinite loop detected");
    });
});
//# sourceMappingURL=infinite_loop_spec.js.map