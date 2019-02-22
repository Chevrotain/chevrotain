"use strict";
/**
 * a simple language made up of only
 * switch/case/return identifiers strings and integers
 *
 * example:
 * switch (name) {
 *    case "Terry" : return 2;
 *    case "Robert" : return 4;
 *    case "Brandon" : return 6;
 * }
 *
 * In this case the parser result is a "JSON" object representing the switch case:
 * for the above example the result would be:
 *
 * {
 *    "Terry"    : 2,
 *    "Robert"   : 4,
 *    "Brandon"   : 6
 * }
 *
 * forEach invalid case statement an invalidN property will be added
 * with an undefined value. for example :
 *
 * {
 *    "Terry"    : 2,
 *    "invalid1  : undefined
 *    "Brandon"   : 6
 * }
 */
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
var parser_traits_1 = require("../../../../src/parse/parser/traits/parser_traits");
var allTokens = require("./Switchcase_recovery_tokens");
var Switchcase_recovery_tokens_1 = require("./Switchcase_recovery_tokens");
var utils_1 = require("../../../../src/utils/utils");
// DOCS: to enable error recovery functionality one must extend BaseErrorRecoveryRecognizer
var SwitchCaseRecoveryParser = /** @class */ (function (_super) {
    __extends(SwitchCaseRecoveryParser, _super);
    function SwitchCaseRecoveryParser(input) {
        if (input === void 0) { input = []; }
        var _this = 
        // DOCS: note the second parameter in the super class. this is the namespace in which the token constructors are defined.
        //       it is mandatory to provide this map to be able to perform self analysis
        //       and allow the framework to "understand" the implemented grammar.
        _super.call(this, allTokens, {
            recoveryEnabled: true,
            outputCst: false
        }) || this;
        _this.switchStmt = _this.RULE("switchStmt", _this.parseSwitchStmt, {
            recoveryValueFunc: function () {
                return {};
            }
        });
        _this.caseStmt = _this.RULE("caseStmt", _this.parseCaseStmt, {
            recoveryValueFunc: _this.INVALID()
        });
        // DOCS: in this example we avoid automatic missing token insertion for tokens that have additional semantic meaning.
        //       to understand this first consider the positive case, which tokens can we safely insert?
        //       a missing colon / semicolon ? yes a missing parenthesis ? yes
        //       but what about a missing StringToken? if we insert one, what will be its string value?
        //       an empty string? in the grammar this could lead to an empty key in the created object...
        //       what about a string with some random value? this could still lead to duplicate keys in the returned parse result
        _this.tokTypesThatCannotBeInsertedInRecovery = [
            Switchcase_recovery_tokens_1.IdentTok,
            Switchcase_recovery_tokens_1.StringTok,
            Switchcase_recovery_tokens_1.IntTok
        ];
        // because we are building a javascript object we must not have any duplications
        // in the name of the keys, the index below is used to solve this.
        _this.invalidIdx = 1;
        // DOCS: The call to performSelfAnalysis needs to happen after all the RULEs have been defined
        //       The typescript compiler places the constructor body last after initializations in the class's body
        //       which is why place the call here meets the criteria.
        _this.performSelfAnalysis();
        return _this;
    }
    // DOCS: overriding this method allows us to customize the logic for which tokens may not be automaticaly inserted
    // during error recovery.
    SwitchCaseRecoveryParser.prototype.canTokenTypeBeInsertedInRecovery = function (tokType) {
        return !utils_1.contains(this.tokTypesThatCannotBeInsertedInRecovery, tokType);
    };
    SwitchCaseRecoveryParser.prototype.parseSwitchStmt = function () {
        var _this = this;
        // house keeping so the invalid property names will not be dependent on
        // previous grammar rule invocations.
        this.invalidIdx = 1;
        var retObj = {};
        this.CONSUME(Switchcase_recovery_tokens_1.SwitchTok);
        this.CONSUME(Switchcase_recovery_tokens_1.LParenTok);
        this.CONSUME(Switchcase_recovery_tokens_1.IdentTok);
        this.CONSUME(Switchcase_recovery_tokens_1.RParenTok);
        this.CONSUME(Switchcase_recovery_tokens_1.LCurlyTok);
        this.AT_LEAST_ONE(function () {
            utils_1.assign(retObj, _this.SUBRULE(_this.caseStmt));
        });
        this.CONSUME(Switchcase_recovery_tokens_1.RCurlyTok);
        return retObj;
    };
    SwitchCaseRecoveryParser.prototype.parseCaseStmt = function () {
        var _this = this;
        var keyTok, valueTok, key, value;
        this.CONSUME(Switchcase_recovery_tokens_1.CaseTok);
        keyTok = this.CONSUME(Switchcase_recovery_tokens_1.StringTok);
        this.CONSUME(Switchcase_recovery_tokens_1.ColonTok);
        this.CONSUME(Switchcase_recovery_tokens_1.ReturnTok);
        valueTok = this.CONSUME(Switchcase_recovery_tokens_1.IntTok);
        this.OPTION6(function () {
            _this.CONSUME(Switchcase_recovery_tokens_1.SemiColonTok);
        });
        key = keyTok.image;
        value = parseInt(valueTok.image, 10);
        var caseKeyValue = {};
        caseKeyValue[key] = value;
        return caseKeyValue;
    };
    SwitchCaseRecoveryParser.prototype.INVALID = function () {
        var _this = this;
        return function () {
            var retObj = {};
            retObj["invalid" + _this.invalidIdx++] = undefined;
            return retObj;
        };
    };
    return SwitchCaseRecoveryParser;
}(parser_traits_1.Parser));
exports.SwitchCaseRecoveryParser = SwitchCaseRecoveryParser;
//# sourceMappingURL=switchcase_recovery_parser.js.map