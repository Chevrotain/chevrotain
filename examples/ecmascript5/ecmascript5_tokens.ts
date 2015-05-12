/// <reference path="../../src/scan/tokens.ts" />

/**
 * @author firasnajjar
 */
module chevrotain.examples.ecma5 {

    import tok = chevrotain.tokens
    import lex = chevrotain.lexer

    /*
     * Spec: http://www.ecma-international.org/ecma-262/5.1/
     * Conventions:
     * 0. The spec defines input elements in: http://www.ecma-international.org/ecma-262/5.1/#sec-7
     * 1. The class hierarchy in this file does not follow the grammar like definition of the input elements in the spec.
     *    The hierarchy is based to be useful in the rest of the parsing process.
     * 2. The classes of the input elements that appear in this file describe the terminal tokens of the input elements
     * 3. Each sub-section under section 7 is described in an "abstract" class in this file. Terminal tokens of the section
     *    are described by classes that extend directly or indirectly the base class of the section.
     * 4. In some cases additional abstract classes are added under the abstract base class of a a section. These classes
     *    usually describe special cases that should be handled specially in the rest of the parsing process.
     * 5. The prefix "Abs" in the name of a class means "abstract" class. Although there is no abstract classes in
     *    TypeScript. These classes are not to be instantiated.
     */

    // Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7
    // The following is the base class of all chevrotain ECMAScript5 tokens/input elements
    // TODO: this category may not be relevant from the parser's or tool builders perspective
    export class AbsInputElement extends tok.Token { static PATTERN = lex.NA }

    /*
     * Unicode Format-Control Characters
     * Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.1
     */
    export class AbsFormatControlCharacters extends AbsInputElement { static PATTERN = lex.NA }
    // TODO: It seems these the following two special characters can only be used in identifiers
    //       so their existence as a separate unique token class may have no use.
    export class ZeroWidthNonJoiner extends AbsFormatControlCharacters { static PATTERN = lex.NA } // \u200c
    export class ZeroWidthJoiner extends AbsFormatControlCharacters { static PATTERN = lex.NA } // \u200D
    // TODO: this seems to be treated as a type of whitespace according to the spec, consider having it extend AbsWhiteSpace?
    export class ByteOrderMarkUFCC extends AbsFormatControlCharacters {static PATTERN = lex.NA } // \uFEFF

    // Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.2
    export class AbsWhiteSpace extends AbsInputElement {
        static PATTERN = lex.NA
        static IGNORE = true
    }
    export class Tab extends AbsWhiteSpace { static PATTERN = /\u0009/ }
    export class Vertical extends AbsWhiteSpace { static PATTERN = /\u000B/ }
    export class FormFeed extends AbsWhiteSpace { static PATTERN = /\u000C/ }
    export class Space extends AbsWhiteSpace { static PATTERN = /\u0020/ }
    export class NoBreakSpace extends AbsWhiteSpace { static PATTERN = /\u00A0/ }

    //TODO-FN what is the difference between ByteOrderMarkWSTok and ByteOrderMarkUFCCTok
    // TODO-SS I don't think there is, Table 1 in section 7.1 only seems to assign certain chars
    // to certain token.
    export class ByteOrderMarkWS extends AbsWhiteSpace { static PATTERN = /\uFEFF/ }

    // TODO-SS does this need to exist? what happens in other implementations?
    export class UnicodeSpaceSeparator extends AbsWhiteSpace { static PATTERN = lex.NA } // Other category "Zs"

    // Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.3
    export class AbsLineTerminator extends AbsInputElement {
        static PATTERN = lex.NA
        static IGNORE = true
    }
    export class LineFeed extends AbsLineTerminator { static PATTERN = /\u000A/ }
    export class CarriageReturn extends AbsLineTerminator { static PATTERN = /\u000D/ }
    export class LineSeparator extends AbsLineTerminator { static PATTERN = /\u2028/ }
    export class ParagraphSeparator extends AbsLineTerminator { static PATTERN = /\u2029/ }
    // The line terminator sequence <CR><LF> is handled in the grammar
    // TODO-SS: why? the parser only needs to know a line Terminator exists at a certain input idx, nothing less, nothing more.
    // have to check for a certain sequence of tokens to detect a line terminator during parsing just copmlicates things...

    // Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.4
    export class AbsComment extends AbsInputElement {
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
    // TODO-SS: this variation may not be relevant if the automatic semicolon insertion will be performed
    //          "on the fly" during scanning
    export class MultipleLineCommentWithoutTerminator extends AbsComment { static PATTERN = lex.NA }

    /*
     * Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.5
     * The word Token is confusing since it is used in the spec in a different way that is used by chevrotain. The
     * following classes follow the same conventions in the beginning of this file. The AbsToken is the class that
     * describes all the "chevrotain terminal tokens" that exist in the Tokens section of the spec.
     * No terminal tokens are defined in this section. Terminal tokens that extend this class exist in the following sections
     */
    // TODO: this category may not be relevant from the parser's or tool builders perspective
    export class AbsToken extends AbsInputElement { static PATTERN = lex.NA }

    // Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.6
    export class IdentifierName extends AbsToken { static PATTERN = lex.NA }

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

    // TODO-SS this is a subset of JS Identifier without the unicode mess
    export class Identifier extends IdentifierName { static PATTERN = /[_A-Za-z][_A-Za-z\d]*/ }

    // These special identifiers have special handling in the parser
    // and thus require a Token class.
    // @link http://www.ecma-international.org/ecma-262/5.1/#sec-11.1.5
    export class GetTok extends Identifier { static PATTERN = /get/}
    export class SetTok extends Identifier { static PATTERN = /set/}

    /*
     * Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.7
     * In this case we don't follow the convention and we don't have a single abstract base class for the section
     * since all punctuators under "Punctuator" production are tokens and therefore will extend the AbsToken, and all
     * punctuators unde "DivPunctuator" production are not tokens.
     * For more info check the Tokens section the spec.
     */
    export class AbsPunctuator extends AbsToken {}
    export class LCurly extends AbsPunctuator { static PATTERN = /{/ }
    export class RCurly extends AbsPunctuator { static PATTERN = /}/ }
    export class LParen extends AbsPunctuator { static PATTERN = /\(/ }
    export class RParen extends AbsPunctuator { static PATTERN = /\)/ }
    export class LBracket extends AbsPunctuator { static PATTERN = /\[/ }
    export class RBracket extends AbsPunctuator { static PATTERN = /]/ }
    export class Dot extends AbsPunctuator { static PATTERN = /\./ }
    export class Semicolon extends AbsPunctuator { static PATTERN = /;/ }
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
    export class AbsLiteral extends AbsInputElement { static PATTERN = lex.NA }

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

    export class AbsRegularExpressionLiteral extends AbsLiteral { static PATTERN = lex.NA }
    // TODO-SS: is this EmptyRegExp relevant for parser/tooling? maybe it is only relevant inside the lexer
    //          as a special rule how to identify "emptyRegExp"
    export class EmptyRegularExpression extends AbsRegularExpressionLiteral { static PATTERN = lex.NA }// /(?:)/
    export class RegularExpression extends AbsRegularExpressionLiteral {
        static PATTERN = lex.NA // TODO-SS: pattern
        // Any regex that's not empty
    }

    // the Identifer Token must appear last in the array of Token passed to
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
