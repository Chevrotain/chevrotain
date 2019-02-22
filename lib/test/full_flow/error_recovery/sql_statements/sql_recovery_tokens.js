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
var VirtualToken = /** @class */ (function () {
    function VirtualToken() {
    }
    VirtualToken.PATTERN = /NA/;
    return VirtualToken;
}());
exports.VirtualToken = VirtualToken;
var IdentTok = /** @class */ (function () {
    function IdentTok() {
    }
    IdentTok.PATTERN = /NA/;
    return IdentTok;
}());
exports.IdentTok = IdentTok;
// DOCS: once again an example of Token types hierarchies
var LiteralTok = /** @class */ (function () {
    function LiteralTok() {
    }
    LiteralTok.PATTERN = /NA/;
    return LiteralTok;
}());
exports.LiteralTok = LiteralTok;
var StringTok = /** @class */ (function (_super) {
    __extends(StringTok, _super);
    function StringTok() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return StringTok;
}(LiteralTok));
exports.StringTok = StringTok;
var IntTok = /** @class */ (function (_super) {
    __extends(IntTok, _super);
    function IntTok() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return IntTok;
}(LiteralTok));
exports.IntTok = IntTok;
var BigIntTok = /** @class */ (function (_super) {
    __extends(BigIntTok, _super);
    function BigIntTok() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return BigIntTok;
}(IntTok));
exports.BigIntTok = BigIntTok;
var Keyword = /** @class */ (function () {
    function Keyword() {
    }
    Keyword.PATTERN = /NA/;
    return Keyword;
}());
exports.Keyword = Keyword;
var CreateTok = /** @class */ (function (_super) {
    __extends(CreateTok, _super);
    function CreateTok() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return CreateTok;
}(Keyword));
exports.CreateTok = CreateTok;
var TableTok = /** @class */ (function (_super) {
    __extends(TableTok, _super);
    function TableTok() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TableTok;
}(Keyword));
exports.TableTok = TableTok;
var InsertTok = /** @class */ (function (_super) {
    __extends(InsertTok, _super);
    function InsertTok() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return InsertTok;
}(Keyword));
exports.InsertTok = InsertTok;
var IntoTok = /** @class */ (function (_super) {
    __extends(IntoTok, _super);
    function IntoTok() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return IntoTok;
}(Keyword));
exports.IntoTok = IntoTok;
var DeleteTok = /** @class */ (function (_super) {
    __extends(DeleteTok, _super);
    function DeleteTok() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return DeleteTok;
}(Keyword));
exports.DeleteTok = DeleteTok;
var FromTok = /** @class */ (function (_super) {
    __extends(FromTok, _super);
    function FromTok() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FromTok;
}(Keyword));
exports.FromTok = FromTok;
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
var CommaTok = /** @class */ (function () {
    function CommaTok() {
    }
    CommaTok.PATTERN = /NA/;
    return CommaTok;
}());
exports.CommaTok = CommaTok;
var SemiColonTok = /** @class */ (function () {
    function SemiColonTok() {
    }
    SemiColonTok.PATTERN = /NA/;
    return SemiColonTok;
}());
exports.SemiColonTok = SemiColonTok;
var DotTok = /** @class */ (function () {
    function DotTok() {
    }
    DotTok.PATTERN = /NA/;
    return DotTok;
}());
exports.DotTok = DotTok;
/* tslint:disable:class-name */
// virtual tokens for Building the parseTree, these just give a "type/specification/categorization" to a ParseTree
var STATEMENTS = /** @class */ (function (_super) {
    __extends(STATEMENTS, _super);
    function STATEMENTS() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return STATEMENTS;
}(VirtualToken));
exports.STATEMENTS = STATEMENTS;
var CREATE_STMT = /** @class */ (function (_super) {
    __extends(CREATE_STMT, _super);
    function CREATE_STMT() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return CREATE_STMT;
}(VirtualToken));
exports.CREATE_STMT = CREATE_STMT;
var INSERT_STMT = /** @class */ (function (_super) {
    __extends(INSERT_STMT, _super);
    function INSERT_STMT() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return INSERT_STMT;
}(VirtualToken));
exports.INSERT_STMT = INSERT_STMT;
var DELETE_STMT = /** @class */ (function (_super) {
    __extends(DELETE_STMT, _super);
    function DELETE_STMT() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return DELETE_STMT;
}(VirtualToken));
exports.DELETE_STMT = DELETE_STMT;
var QUALIFIED_NAME = /** @class */ (function (_super) {
    __extends(QUALIFIED_NAME, _super);
    function QUALIFIED_NAME() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return QUALIFIED_NAME;
}(VirtualToken));
exports.QUALIFIED_NAME = QUALIFIED_NAME;
var DOTS = /** @class */ (function (_super) {
    __extends(DOTS, _super);
    function DOTS() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return DOTS;
}(VirtualToken));
exports.DOTS = DOTS;
var COMMAS = /** @class */ (function (_super) {
    __extends(COMMAS, _super);
    function COMMAS() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return COMMAS;
}(VirtualToken));
exports.COMMAS = COMMAS;
// some "INVALID" virtual tokens can be defined to output a more "precise" ParseTree in case of an re-sync error
// defining them as subclasses of the "valid" virtual tokens can making handling of invalid input easier in whatever
// component which consumes the output ParseTree in order to build some Ast or other data structure.
var INVALID_DDL = /** @class */ (function (_super) {
    __extends(INVALID_DDL, _super);
    function INVALID_DDL() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return INVALID_DDL;
}(VirtualToken));
exports.INVALID_DDL = INVALID_DDL;
var INVALID_CREATE_STMT = /** @class */ (function (_super) {
    __extends(INVALID_CREATE_STMT, _super);
    function INVALID_CREATE_STMT() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return INVALID_CREATE_STMT;
}(CREATE_STMT));
exports.INVALID_CREATE_STMT = INVALID_CREATE_STMT;
var INVALID_INSERT_STMT = /** @class */ (function (_super) {
    __extends(INVALID_INSERT_STMT, _super);
    function INVALID_INSERT_STMT() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return INVALID_INSERT_STMT;
}(INSERT_STMT));
exports.INVALID_INSERT_STMT = INVALID_INSERT_STMT;
var INVALID_DELETE_STMT = /** @class */ (function (_super) {
    __extends(INVALID_DELETE_STMT, _super);
    function INVALID_DELETE_STMT() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return INVALID_DELETE_STMT;
}(DELETE_STMT));
exports.INVALID_DELETE_STMT = INVALID_DELETE_STMT;
var INVALID_QUALIFIED_NAME = /** @class */ (function (_super) {
    __extends(INVALID_QUALIFIED_NAME, _super);
    function INVALID_QUALIFIED_NAME() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return INVALID_QUALIFIED_NAME;
}(QUALIFIED_NAME));
exports.INVALID_QUALIFIED_NAME = INVALID_QUALIFIED_NAME;
/* tslint:enable:class-name */
//# sourceMappingURL=sql_recovery_tokens.js.map