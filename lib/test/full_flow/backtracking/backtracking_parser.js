"use strict";
// DOCS: simple language with two statements which require backtracking to differentiate during parse time
//       element A:ns1.ns2...nsN = 5;
//       element B:ns1.ns2...nsN default 5;
// generally one should avoid having to use backtracking, and this specific example can be resolved by parsing
// both statements in a single rule and only distinguishing between them later, but lets see an example of using backtracking :)
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
var RET_TYPE;
(function (RET_TYPE) {
    RET_TYPE[RET_TYPE["WITH_DEFAULT"] = 0] = "WITH_DEFAULT";
    RET_TYPE[RET_TYPE["WITH_EQUALS"] = 1] = "WITH_EQUALS";
    RET_TYPE[RET_TYPE["QUALIFED_NAME"] = 2] = "QUALIFED_NAME";
    RET_TYPE[RET_TYPE["INVALID_WITH_DEFAULT"] = 3] = "INVALID_WITH_DEFAULT";
    RET_TYPE[RET_TYPE["INVALID_WITH_EQUALS"] = 4] = "INVALID_WITH_EQUALS";
    RET_TYPE[RET_TYPE["INVALID_STATEMENT"] = 5] = "INVALID_STATEMENT";
    RET_TYPE[RET_TYPE["INVALID_FQN"] = 6] = "INVALID_FQN";
})(RET_TYPE = exports.RET_TYPE || (exports.RET_TYPE = {}));
var NumberTok = /** @class */ (function () {
    function NumberTok() {
    }
    NumberTok.PATTERN = /NA/;
    return NumberTok;
}());
exports.NumberTok = NumberTok;
var ElementTok = /** @class */ (function () {
    function ElementTok() {
    }
    ElementTok.PATTERN = /NA/;
    return ElementTok;
}());
exports.ElementTok = ElementTok;
var DefaultTok = /** @class */ (function () {
    function DefaultTok() {
    }
    DefaultTok.PATTERN = /NA/;
    return DefaultTok;
}());
exports.DefaultTok = DefaultTok;
var DotTok = /** @class */ (function () {
    function DotTok() {
    }
    DotTok.PATTERN = /NA/;
    return DotTok;
}());
exports.DotTok = DotTok;
var ColonTok = /** @class */ (function () {
    function ColonTok() {
    }
    ColonTok.PATTERN = /NA/;
    return ColonTok;
}());
exports.ColonTok = ColonTok;
var EqualsTok = /** @class */ (function () {
    function EqualsTok() {
    }
    EqualsTok.PATTERN = /NA/;
    return EqualsTok;
}());
exports.EqualsTok = EqualsTok;
var SemiColonTok = /** @class */ (function () {
    function SemiColonTok() {
    }
    SemiColonTok.PATTERN = /NA/;
    return SemiColonTok;
}());
exports.SemiColonTok = SemiColonTok;
var IdentTok = /** @class */ (function () {
    function IdentTok() {
    }
    IdentTok.PATTERN = /NA/;
    return IdentTok;
}());
exports.IdentTok = IdentTok;
var configuration = {
    outputCst: false,
    ignoredIssues: {
        statement: { OR: true }
    }
};
// extending the BaseErrorRecoveryRecognizer in this example because it too has logic related to backtracking
// that needs to be tested too.
var BackTrackingParser = /** @class */ (function (_super) {
    __extends(BackTrackingParser, _super);
    function BackTrackingParser() {
        var _this = 
        // DOCS: note the second parameter in the super class. this is the namespace in which the token constructors are defined.
        //       it is mandatory to provide this map to be able to perform self analysis
        //       and allow the framework to "understand" the implemented grammar.
        _super.call(this, [
            NumberTok,
            ElementTok,
            DefaultTok,
            DotTok,
            ColonTok,
            EqualsTok,
            SemiColonTok,
            IdentTok
        ], configuration) || this;
        _this.statement = _this.RULE("statement", _this.parseStatement, {
            recoveryValueFunc: INVALID(RET_TYPE.INVALID_STATEMENT)
        });
        _this.withEqualsStatement = _this.RULE("withEqualsStatement", _this.parseWithEqualsStatement, { recoveryValueFunc: INVALID(RET_TYPE.INVALID_WITH_EQUALS) });
        _this.withDefaultStatement = _this.RULE("withDefaultStatement", _this.parseWithDefaultStatement, {
            recoveryValueFunc: INVALID(RET_TYPE.INVALID_WITH_DEFAULT)
        });
        _this.qualifiedName = _this.RULE("qualifiedName", _this.parseQualifiedName, {
            recoveryValueFunc: INVALID(RET_TYPE.INVALID_FQN),
            resyncEnabled: false
        });
        // DOCS: The call to performSelfAnalysis needs to happen after all the RULEs have been defined
        //       The typescript compiler places the constructor body last after initializations in the class's body
        //       which is why place the call here meets the criteria.
        _this.performSelfAnalysis();
        return _this;
    }
    BackTrackingParser.prototype.parseStatement = function () {
        var _this = this;
        var statementTypeFound = undefined;
        this.OR([
            // both statements have the same prefix which may be of "infinite" length, this means there is no K for which
            // we can build an LL(K) parser that can distinguish the two alternatives as a negative example
            // would be to simply create a qualifiedName with a length of k+1.
            {
                GATE: this.BACKTRACK(this.withEqualsStatement),
                ALT: function () {
                    statementTypeFound = _this.SUBRULE8(_this.withEqualsStatement);
                }
            },
            {
                GATE: this.BACKTRACK(this.withDefaultStatement),
                ALT: function () {
                    statementTypeFound = _this.SUBRULE9(_this.withDefaultStatement);
                }
            }
        ]);
        return statementTypeFound;
    };
    BackTrackingParser.prototype.parseWithEqualsStatement = function () {
        this.CONSUME(ElementTok);
        this.CONSUME6(IdentTok);
        this.CONSUME7(ColonTok);
        this.SUBRULE7(this.qualifiedName); // this rule creates the no fixed look ahead issue
        this.CONSUME8(EqualsTok);
        this.CONSUME9(NumberTok);
        this.CONSUME(SemiColonTok);
        return RET_TYPE.WITH_EQUALS;
    };
    BackTrackingParser.prototype.parseWithDefaultStatement = function () {
        this.CONSUME(ElementTok);
        this.CONSUME(IdentTok);
        this.CONSUME(ColonTok);
        this.SUBRULE6(this.qualifiedName); // this rule creates the no fixed look ahead issue
        this.CONSUME(DefaultTok);
        this.CONSUME(NumberTok);
        this.CONSUME(SemiColonTok);
        return RET_TYPE.WITH_DEFAULT;
    };
    BackTrackingParser.prototype.parseQualifiedName = function () {
        var _this = this;
        this.CONSUME(IdentTok);
        this.MANY(function () {
            _this.CONSUME(DotTok);
            _this.CONSUME2(IdentTok);
        });
        return RET_TYPE.QUALIFED_NAME;
    };
    return BackTrackingParser;
}(parser_traits_1.Parser));
exports.BackTrackingParser = BackTrackingParser;
function INVALID(stmtType) {
    return function () {
        return stmtType;
    };
}
exports.INVALID = INVALID;
//# sourceMappingURL=backtracking_parser.js.map