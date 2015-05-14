/// <reference path="../../src/scan/tokens.ts" />

/**
 * @author firasnajjar
 */
module chevrotain.examples.ecma5 {

    import tok = chevrotain.tokens
    import lex = chevrotain.lexer

    /*
     * Spec: http://www.ecma-international.org/ecma-262/5.1/#sec-7
     * important notes:
     * 1. The Tokens class hierarchy in this module is based upon, but does not precisely match the spec's hierarchy.
     *    Instead the hierarchy is meant to provide easy categorization/classification of the tokens for "future phases"
     *    such as: parsing/syntax highlighting/refactoring
     *
     * 2. Classes with the prefix 'Abs' are used to define the hierarchy. These are meant to be Abstract classes
     *    even though TypeScript does not have Abstract classes. The naive approach would be to use Interfaces,
     *    however, in TypeScript 1.4 Interfaces "disappear" in the runtime and thus they can not be used for categorization/classification
     *    as its not possible to do: XXX instanceof ISomeInterface.
     *
     *    TODO: Check the possibility of using decorators in typescript 1.5 instead
     */

    // Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.2
    export class AbsWhiteSpace extends tok.Token {
        static PATTERN = lex.NA
        static IGNORE = true
    }

    export class Tab extends AbsWhiteSpace { static PATTERN = /\u0009/ }
    export class Vertical extends AbsWhiteSpace { static PATTERN = /\u000B/ }
    export class FormFeed extends AbsWhiteSpace { static PATTERN = /\u000C/ }
    export class Space extends AbsWhiteSpace { static PATTERN = /\u0020/ }
    export class NoBreakSpace extends AbsWhiteSpace { static PATTERN = /\u00A0/ }
    export class ByteOrderMarkWS extends AbsWhiteSpace { static PATTERN = /\uFEFF/ }

    // TODO-SS does this need to exist? what happens in other implementations?
    export class UnicodeSpaceSeparator extends AbsWhiteSpace { static PATTERN = lex.NA } // Other category "Zs"

    // Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.3
    export class AbsLineTerminator extends AbsWhiteSpace {
        static PATTERN = lex.NA
        static IGNORE = true
    }
    export class LineFeed extends AbsLineTerminator { static PATTERN = /\u000A/ }
    export class CarriageReturn extends AbsLineTerminator { static PATTERN = /\u000D/ }
    export class LineSeparator extends AbsLineTerminator { static PATTERN = /\u2028/ }
    export class ParagraphSeparator extends AbsLineTerminator { static PATTERN = /\u2029/ }
    export class CarriageReturnLineFeed extends AbsLineTerminator { static PATTERN = /\u000D\u000A/ }

    // Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.4
    export class AbsComment extends tok.Token {
        static PATTERN = lex.NA
        static IGNORE = true
    }
    export class SingleLineComment extends AbsComment { static PATTERN = /(?:\/\/(?:.*))/}
    /*
     * The following two classes exist for the following reason:
     * Quoting the spec: "Comments behave like white space and are discarded except that, if a MultiLineComment contains a
     * line terminator character, then the entire comment is considered to be a LineTerminator for purposes of parsing
     * by the syntactic grammar."
     */
    // TODO-SS: pattern? simpleLexer does not support multi-line?
    export class MultipleLineCommentWithTerminator extends AbsComment { static PATTERN = lex.NA }
    export class MultipleLineCommentWithoutTerminator extends AbsComment { static PATTERN = lex.NA }

    // Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.6
    export class IdentifierName extends tok.Token { static PATTERN = lex.NA }

    export class AbsAnyKeyword extends IdentifierName { static PATTERN = lex.NA }

    export class AbsKeyword extends AbsAnyKeyword { static PATTERN = lex.NA }
    export class BreakTok extends AbsKeyword { static PATTERN = /break/}
    export class DoTok extends AbsKeyword { static PATTERN = /do/}
    export class InstanceOfTok extends AbsKeyword { static PATTERN = /instanceof/}
    export class TypeOfTok extends AbsKeyword { static PATTERN = /typeof/}
    export class CaseTok extends AbsKeyword { static PATTERN = /case/}
    export class ElseTok extends AbsKeyword { static PATTERN = /else/}
    export class NewTok extends AbsKeyword { static PATTERN = /new/}
    export class VarTok extends AbsKeyword { static PATTERN = /var/}
    export class CatchTok extends AbsKeyword { static PATTERN = /catch/}
    export class FinallyTok extends AbsKeyword { static PATTERN = /finally/}
    export class ReturnTok extends AbsKeyword { static PATTERN = /return/}
    export class VoidTok extends AbsKeyword { static PATTERN = /void/}
    export class ContinueTok extends AbsKeyword { static PATTERN = /continue/}
    export class ForTok extends AbsKeyword { static PATTERN = /for/}
    export class SwitchTok extends AbsKeyword { static PATTERN = /switch/}
    export class WhileTok extends AbsKeyword { static PATTERN = /while/}
    export class DebuggerTok extends AbsKeyword { static PATTERN = /debugger/}
    export class FunctionTok extends AbsKeyword { static PATTERN = /function/}
    export class ThisTok extends AbsKeyword { static PATTERN = /this/}
    export class WithTok extends AbsKeyword { static PATTERN = /with/}
    export class DefaultTok extends AbsKeyword { static PATTERN = /default/}
    export class IfTok extends AbsKeyword { static PATTERN = /if/}
    export class ThrowTok extends AbsKeyword { static PATTERN = /throw/}
    export class DeleteTok extends AbsKeyword { static PATTERN = /delete/}
    export class InTok extends AbsKeyword { static PATTERN = /in/}
    export class TryTok extends AbsKeyword { static PATTERN = /try/}

    export class AbsAnyFutureReservedWords extends AbsAnyKeyword { static PATTERN = lex.NA }

    export class AbsFutureReservedWord extends AbsAnyFutureReservedWords { static PATTERN = lex.NA }
    export class ClassTok extends AbsFutureReservedWord { static PATTERN = /class/}
    export class EnumTok extends AbsFutureReservedWord { static PATTERN = /enum/}
    export class ExtendsTok extends AbsFutureReservedWord { static PATTERN = /extends/}
    export class SuperTok extends AbsFutureReservedWord { static PATTERN = /super/}
    export class ConstTok extends AbsFutureReservedWord { static PATTERN = /const/}
    export class ExportTok extends AbsFutureReservedWord { static PATTERN = /export/}
    export class ImportTok extends AbsFutureReservedWord { static PATTERN = /import/}

    export class AbsFutureReservedWordStrictMode extends AbsAnyFutureReservedWords { static PATTERN = lex.NA }
    export class ImplementsTok extends AbsFutureReservedWordStrictMode { static PATTERN = /implements/}
    export class LetTok extends AbsFutureReservedWordStrictMode { static PATTERN = /let/}
    export class PrivateTok extends AbsFutureReservedWordStrictMode { static PATTERN = /private/}
    export class PublicTok extends AbsFutureReservedWordStrictMode { static PATTERN = /public/}
    export class YieldTok extends AbsFutureReservedWordStrictMode { static PATTERN = /yield/}
    export class InterfaceTok extends AbsFutureReservedWordStrictMode { static PATTERN = /interface/}
    export class PackageTok extends AbsFutureReservedWordStrictMode { static PATTERN = /package/}
    export class ProtectedTok extends AbsFutureReservedWordStrictMode { static PATTERN = /protected/}
    export class StaticTok extends AbsFutureReservedWordStrictMode { static PATTERN = /static/}

    // TODO-SS this pattern is a subset of JS Identifier without the unicode mess, need the full pattern
    export class Identifier extends IdentifierName { static PATTERN = /[_A-Za-z\$][_A-Za-z\d]*/ }

    // The 'get' and 'set' identifiers require a Token class as they have special handling in the grammar
    // @link http://www.ecma-international.org/ecma-262/5.1/#sec-11.1.5
    export class GetTok extends Identifier { static PATTERN = /get/}
    export class SetTok extends Identifier { static PATTERN = /set/}

    // Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.7
    export class AbsPunctuator extends tok.Token { static PATTERN = lex.NA }
    export class LCurly extends AbsPunctuator { static PATTERN = /{/ }
    export class RCurly extends AbsPunctuator { static PATTERN = /}/ }
    export class LParen extends AbsPunctuator { static PATTERN = /\(/ }
    export class RParen extends AbsPunctuator { static PATTERN = /\)/ }
    export class LBracket extends AbsPunctuator { static PATTERN = /\[/ }
    export class RBracket extends AbsPunctuator { static PATTERN = /]/ }
    export class Dot extends AbsPunctuator { static PATTERN = /\./ }

    export class Semicolon extends AbsPunctuator {
        constructor(startLine:number, startColumn:number, image:string,
                    public isAutomaticSemiColonInsertion = false) {
            super(startLine, startColumn, image)
        }

        static PATTERN = /;/
    }

    export class Comma extends AbsPunctuator { static PATTERN = /,/ }

    export class PlusPlus extends AbsPunctuator { static PATTERN = /\+\+/ }
    export class MinusMinus extends AbsPunctuator { static PATTERN = /\-\-/ }

    export class Ampersand extends AbsPunctuator { static PATTERN = /&/ }
    export class VerticalBar extends AbsPunctuator { static PATTERN = /\|/ }
    export class Circumflex extends AbsPunctuator { static PATTERN = /\^/ }
    export class Exclamation extends AbsPunctuator { static PATTERN = /!/ }
    export class Tilde extends AbsPunctuator { static PATTERN = /~/ }

    export class AmpersandAmpersand extends AbsPunctuator { static PATTERN = /&&/ }
    export class VerticalBarVerticalBar extends AbsPunctuator { static PATTERN = /\|\|/ }

    export class Question extends AbsPunctuator { static PATTERN = /\?/ }
    export class Colon extends AbsPunctuator { static PATTERN = /:/ }

    export class AbsMultiplicativeOperator extends AbsPunctuator { static PATTERN = lex.NA }
    export class Asterisk extends AbsMultiplicativeOperator { static PATTERN = /\*/ }
    export class Slash extends AbsMultiplicativeOperator { static PATTERN = /\// }
    export class Percent extends AbsMultiplicativeOperator { static PATTERN = /%/ }

    export class AbsAdditiveOperator extends AbsPunctuator { static PATTERN = lex.NA }
    export class Plus extends AbsAdditiveOperator { static PATTERN = /\+/ }
    export class Minus extends AbsAdditiveOperator { static PATTERN = /-/ }

    export class AbsShiftOperator extends AbsPunctuator { static PATTERN = lex.NA }
    export class LessLess extends AbsShiftOperator { static PATTERN = /<</ }
    export class MoreMore extends AbsShiftOperator { static PATTERN = />>/ }
    export class MoreMoreMore extends AbsShiftOperator { static PATTERN = />>>/ }

    export class AbsRelationalOperator extends AbsPunctuator { static PATTERN = lex.NA }
    export class Less extends AbsRelationalOperator { static PATTERN = /</ }
    export class Greater extends AbsRelationalOperator { static PATTERN = />/ }
    export class LessEq extends AbsRelationalOperator { static PATTERN = /<=/ }
    export class GreaterEq extends AbsRelationalOperator { static PATTERN = />=/ }

    export class AbsEqualityOperator extends AbsPunctuator { static PATTERN = lex.NA }
    export class EqEq extends AbsEqualityOperator { static PATTERN = /==/ }
    export class NotEq extends AbsEqualityOperator { static PATTERN = /!=/ }
    export class EqEqEq extends AbsEqualityOperator { static PATTERN = /===/ }
    export class NotEqEq extends AbsEqualityOperator { static PATTERN = /!==/ }

    export class AbsAssignmentOperator extends AbsPunctuator { static PATTERN = lex.NA }
    export class Eq extends AbsAssignmentOperator { static PATTERN = /=/ }
    export class PlusEq extends AbsAssignmentOperator { static PATTERN = /\+=/ }
    export class MinusEq extends AbsAssignmentOperator { static PATTERN = /-=/ }
    export class AsteriskEq extends AbsAssignmentOperator { static PATTERN = /\*=/ }
    export class PercentEq extends AbsAssignmentOperator { static PATTERN = /%=/ }
    export class LessLessEq extends AbsAssignmentOperator { static PATTERN = /<<=/ }
    export class MoreMoreEq extends AbsAssignmentOperator { static PATTERN = />>=/ }
    export class MoreMoreMoreEq extends AbsAssignmentOperator { static PATTERN = />>>=/ }
    export class AmpersandEq extends AbsAssignmentOperator { static PATTERN = /&=/ }
    export class VerticalBarEq extends AbsAssignmentOperator { static PATTERN = /|=/ }
    export class CircumflexEq extends AbsAssignmentOperator { static PATTERN = /^=/ }
    export class SlashEq extends AbsAssignmentOperator { static PATTERN = /\/=/ }

    // Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.8
    export class AbsLiteral extends tok.Token { static PATTERN = lex.NA }

    export class NullTok extends AbsLiteral { static PATTERN = /null/}

    export class AbsBooleanLiteral extends AbsLiteral { static PATTERN = lex.NA }
    export class TrueTok extends AbsBooleanLiteral { static PATTERN = /true/}
    export class FalseTok extends AbsBooleanLiteral { static PATTERN = /false/}

    export class AbsNumericLiteral extends AbsLiteral { static PATTERN = lex.NA }
    export class DecimalLiteral extends AbsNumericLiteral { static PATTERN = /-?(0|[1-9]\d*)(\.\D+)?([eE][+-]?\d+)?/ }
    export class HexIntegerLiteral extends AbsNumericLiteral { static PATTERN = /0(x|X)[0-9a-fA-F]+/ }

    export class AbsStringLiteral extends AbsLiteral { static PATTERN = lex.NA }
    export class DoubleQuotationStringLiteral extends AbsStringLiteral {
        static PATTERN = /"([^\\"]+|\\([bfnrtv'"\\]|[0-3]?[0-7]{1,2}|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}))*"/
    }
    export class SingleQuotationStringLiteral extends AbsStringLiteral {
        static PATTERN = /'([^\\']+|\\([bfnrtv'"\\]|[0-3]?[0-7]{1,2}|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}))*'/
    }

    // TODO: pattern?
    export class RegularExpressionLiteral extends AbsLiteral { static PATTERN = lex.NA }

    // the Identifier Token must appear last in the array of Token passed to
    // the simpleLexer, otherwise keywords may be lexed as Identifiers
    var sortedTokens = _.sortBy(_.values(ecma5), (tokClass) => {
        return tokClass === Identifier ? 666 : 1
    })

    // TODO: temp hack while using the SimplerLexer, remove the hack + SimplerLexer once a hand built lexer has been built
    var onlySortedTokens = _.filter(sortedTokens, (prop) => {
        return prop !== chevrotain.examples.ecma5.spec && prop !== chevrotain.examples.ecma5.ECMAScript5Parser
    })

    export var ECMA5Lexer = new lex.SimpleLexer(onlySortedTokens)

}
