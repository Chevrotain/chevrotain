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
var IdentTok = /** @class */ (function () {
    function IdentTok() {
    }
    IdentTok.PATTERN = /NA/;
    return IdentTok;
}());
exports.IdentTok = IdentTok;
var LiteralTok = /** @class */ (function () {
    function LiteralTok() {
    }
    LiteralTok.PATTERN = /NA/;
    return LiteralTok;
}());
exports.LiteralTok = LiteralTok;
var IntTok = /** @class */ (function (_super) {
    __extends(IntTok, _super);
    function IntTok() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return IntTok;
}(LiteralTok));
exports.IntTok = IntTok;
var StringTok = /** @class */ (function (_super) {
    __extends(StringTok, _super);
    function StringTok() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return StringTok;
}(LiteralTok));
exports.StringTok = StringTok;
var Keyword = /** @class */ (function () {
    function Keyword() {
    }
    Keyword.PATTERN = /NA/;
    return Keyword;
}());
exports.Keyword = Keyword;
var SwitchTok = /** @class */ (function (_super) {
    __extends(SwitchTok, _super);
    function SwitchTok() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return SwitchTok;
}(Keyword));
exports.SwitchTok = SwitchTok;
var CaseTok = /** @class */ (function (_super) {
    __extends(CaseTok, _super);
    function CaseTok() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return CaseTok;
}(Keyword));
exports.CaseTok = CaseTok;
var ReturnTok = /** @class */ (function (_super) {
    __extends(ReturnTok, _super);
    function ReturnTok() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ReturnTok;
}(Keyword));
exports.ReturnTok = ReturnTok;
var LParenTok = /** @class */ (function () {
    function LParenTok() {
    }
    LParenTok.PATTERN = /NA/;
    return LParenTok;
}());
exports.LParenTok = LParenTok;
var RParenTok = /** @class */ (function () {
    function RParenTok() {
    }
    RParenTok.PATTERN = /NA/;
    return RParenTok;
}());
exports.RParenTok = RParenTok;
var LCurlyTok = /** @class */ (function () {
    function LCurlyTok() {
    }
    LCurlyTok.PATTERN = /NA/;
    return LCurlyTok;
}());
exports.LCurlyTok = LCurlyTok;
var RCurlyTok = /** @class */ (function () {
    function RCurlyTok() {
    }
    RCurlyTok.PATTERN = /NA/;
    return RCurlyTok;
}());
exports.RCurlyTok = RCurlyTok;
var ColonTok = /** @class */ (function () {
    function ColonTok() {
    }
    ColonTok.PATTERN = /NA/;
    return ColonTok;
}());
exports.ColonTok = ColonTok;
var SemiColonTok = /** @class */ (function () {
    function SemiColonTok() {
    }
    SemiColonTok.PATTERN = /NA/;
    return SemiColonTok;
}());
exports.SemiColonTok = SemiColonTok;
// to force some branches for coverage
var DoubleSemiColonTok = /** @class */ (function (_super) {
    __extends(DoubleSemiColonTok, _super);
    function DoubleSemiColonTok() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return DoubleSemiColonTok;
}(SemiColonTok));
exports.DoubleSemiColonTok = DoubleSemiColonTok;
//# sourceMappingURL=Switchcase_recovery_tokens.js.map