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
var tokens_public_1 = require("../../../src/scan/tokens_public");
describe("The Recognizer's Configuration", function () {
    it("default config values - empty config", function () {
        var A = tokens_public_1.createToken({ name: "A" });
        var EmptyConfigParser = /** @class */ (function (_super) {
            __extends(EmptyConfigParser, _super);
            function EmptyConfigParser() {
                return _super.call(this, [A], {}) || this;
            }
            return EmptyConfigParser;
        }(parser_traits_1.Parser));
        var parser = new EmptyConfigParser();
        expect(parser.recoveryEnabled).to.be.false;
        expect(parser.maxLookahead).to.equal(4);
    });
    it("default config values - no config", function () {
        var A = tokens_public_1.createToken({ name: "A" });
        var NoConfigParser = /** @class */ (function (_super) {
            __extends(NoConfigParser, _super);
            function NoConfigParser() {
                return _super.call(this, [A]) || this;
            }
            return NoConfigParser;
        }(parser_traits_1.Parser));
        var parser = new NoConfigParser();
        expect(parser.recoveryEnabled).to.be.false;
        expect(parser.maxLookahead).to.equal(4);
    });
});
//# sourceMappingURL=recognizer_config_spec.js.map