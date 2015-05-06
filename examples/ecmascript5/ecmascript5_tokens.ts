/// <reference path="../../src/scan/tokens.ts" />

/**
 * @author firasnajjar
 */
module chevrotain.examples.ecma5 {

    import tok = chevrotain.tokens

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

    /*
     * Section 7 of the spec
     * Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7
     */
    //The following is the base class of all chevrotain ECMAScript5 tokens/input elements
    export class AbsInputElement extends tok.Token {}

    /*
     * Section 7.1 of the spec
     * Unicode Format-Control Characters
     * Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.1
     */
    export class AbsFormatControlCharacters extends AbsInputElement {}
    export class ZeroWidthNonJoiner extends AbsFormatControlCharacters {} // \u200c
    export class ZeroWidthJoiner extends AbsFormatControlCharacters {} // \u200D
    export class ByteOrderMarkUFCC extends AbsFormatControlCharacters {} // \uFEFF

    /*
     * Section 7.2 of the spec
     * White Space
     * Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.2
     */
    export class AbsWhiteSpace extends AbsInputElement {}
    export class Tab extends AbsWhiteSpace {} // \u0009
    export class Vertical extends AbsWhiteSpace {} // \u000B
    export class FormFeed extends AbsWhiteSpace {} // \u000C
    export class Space extends AbsWhiteSpace {} // \u0020
    export class NoBreakSpace extends AbsWhiteSpace {} // \u00A0
    //TODO-FN what is the difference between ByteOrderMarkWSTok and ByteOrderMarkUFCCTok
    export class ByteOrderMarkWS extends AbsWhiteSpace {} // \uFEFF
    export class UnicodeSpaceSeparator extends  AbsWhiteSpace {} // Other category "Zs"

    /*
     * Section 7.3 of the spec
     * Line Terminators
     * Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.3
     */
    export class AbsLineTerminator extends AbsInputElement {}
    export class LineFeed extends AbsInputElement {} // \u000A
    export class CarriageReturn extends AbsInputElement {} // \u000D
    export class LineSeparator extends AbsInputElement {} // \u2028
    export class ParagraphSeparator extends AbsInputElement {} // \u2029
    // The line terminator sequence <CR><LF> is handled in the grammar

    /*
     * Section 7.4 of the spec
     * Comments
     * Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.4
     */
    export class AbsComment extends AbsInputElement {}
    export class SingleLineComment extends AbsComment {}
    //The following two classes exist for the following reason:
    /*
     * The following two classes exist for the following reason:
     * Quoting the spec: "Comments behave like white space and are discarded except that, if a MultiLineComment contains a
     * line terminator character, then the entire comment is considered to be a LineTerminator for purposes of parsing
     * by the syntactic grammar."
     */
    export class MultipleLineCommentWithTerminator extends AbsComment {}
    export class MultipleLineCommentWithoutTerminator extends AbsComment {}

    /*
     * Section 7.5 of the spec
     * Tokens
     * Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.5
     * The word Token is confusing since it is used in the spec in a different way that is used by chevrotain. The
     * following classes follow the same conventions in the beginning of this file. The AbsToken is the class that
     * describes all the "chevrotain terminal tokens" that exist in the Tokens section of the spec.
     * No terminal tokens are defined in this section. Terminal tokens that extend this class exist in the following sections
     */
    export class AbsToken extends AbsInputElement {}

    /*
     * Section 7.6 of the spec
     * Identifier Names and Identifiers
     * Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.6
     */
    export class AbsIdentifierNamesAndIdentifiers extends AbsToken {}
    export class Identifier extends AbsIdentifierNamesAndIdentifiers {}

    //All keyword and future reserved keyword classes extend the following class
    export class AbsAnyKeyword extends AbsIdentifierNamesAndIdentifiers {}

    //Keywords
    export class AbsKeyword extends AbsAnyKeyword {}
    export class BreakTok extends AbsKeyword {}
    export class DoTok extends AbsKeyword {}
    export class InstanceOfTok extends AbsKeyword {}
    export class TypeOfTok extends AbsKeyword {}
    export class CaseTok extends AbsKeyword {}
    export class ElseTok extends AbsKeyword {}
    export class NewTok extends AbsKeyword {}
    export class VarTok extends AbsKeyword {}
    export class CatchTok extends AbsKeyword {}
    export class FinallyTok extends AbsKeyword {}
    export class ReturnTok extends AbsKeyword {}
    export class VoidTok extends AbsKeyword {}
    export class ContinueTok extends AbsKeyword {}
    export class ForTok extends AbsKeyword {}
    export class SwitchTok extends AbsKeyword {}
    export class WhileTok extends AbsKeyword {}
    export class DebuggerTok extends AbsKeyword {}
    export class FunctionTok extends AbsKeyword {}
    export class ThisTok extends AbsKeyword {}
    export class WithTok extends AbsKeyword {}
    export class DefaultTok extends AbsKeyword {}
    export class IfTok extends AbsKeyword {}
    export class ThrowTok extends AbsKeyword {}
    export class DeleteTok extends AbsKeyword {}
    export class InTok extends AbsKeyword {}
    export class TryTok extends AbsKeyword {}

    //All future reserved keyword classes and future reserved strict mode keywords extend the following class
    export class AbsAnyFutureReservedWords extends AbsAnyKeyword {}

    //Future Reserved Words
    export class AbsFutureReservedWord extends AbsAnyFutureReservedWords {}
    export class ClassTok extends AbsFutureReservedWord {}
    export class EnumTok extends AbsFutureReservedWord {}
    export class ExtendsTok extends AbsFutureReservedWord {}
    export class SuperTok extends AbsFutureReservedWord {}
    export class ConstTok extends AbsFutureReservedWord {}
    export class ExportTok extends AbsFutureReservedWord {}
    export class ImportTok extends AbsFutureReservedWord {}

    //Future Reserved Words in strict mode only
    export class AbsFutureReservedWordStrictMode extends AbsAnyFutureReservedWords {}
    export class ImplementsTok extends  AbsFutureReservedWordStrictMode {}
    export class LetTok extends  AbsFutureReservedWordStrictMode {}
    export class PrivateTok extends  AbsFutureReservedWordStrictMode {}
    export class PublicTok extends  AbsFutureReservedWordStrictMode {}
    export class YieldTok extends  AbsFutureReservedWordStrictMode {}
    export class InterfaceTok extends  AbsFutureReservedWordStrictMode {}
    export class PackageTok extends  AbsFutureReservedWordStrictMode {}
    export class ProtectedTok extends  AbsFutureReservedWordStrictMode {}
    export class StaticTok extends  AbsFutureReservedWordStrictMode {}

    /*
     * Section 7.7 of the spec
     * Punctuators
     * Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.7
     * In this case we don't follow the convention and we don't have a single abstract base class for the section
     * since all punctuators under "Punctuator" production are tokens and therefore will extend the AbsToken, and all
     * punctuators unde "DivPunctuator" production are not tokens.
     * For more info check the Tokens section the spec.
     */
    //Punctuator Category:
    export class AbsPunctuator extends  AbsToken {}
    export class LCurly extends AbsPunctuator {} //{
    export class RCurly extends AbsPunctuator {} //}
    export class LParen extends AbsPunctuator {} //(
    export class RParen extends AbsPunctuator {} //)
    export class LBracket extends AbsPunctuator {} //[
    export class RBracket extends AbsPunctuator {} //]
    export class Dot extends AbsPunctuator {} //.
    export class Semicolon extends AbsPunctuator {} //;
    export class Comma extends AbsPunctuator {} //,
    export class Less extends AbsPunctuator {} //<
    export class Greater extends AbsPunctuator {} //>
    export class LessEq extends AbsPunctuator {} //<=
    export class GreaterEq extends AbsPunctuator {} //>=
    export class EqEq extends AbsPunctuator {} //==
    export class NotEq extends AbsPunctuator {} //!=
    export class EqEqEq extends AbsPunctuator {} //===
    export class NotEqEq extends AbsPunctuator {} //!==
    export class Plus extends AbsPunctuator {} //+
    export class Minus extends AbsPunctuator {} //-
    export class Asterisk extends AbsPunctuator {} //*
    export class Percent extends AbsPunctuator {} //%
    export class PlusPlus extends AbsPunctuator {} //++
    export class MinusMinus extends AbsPunctuator {} //--
    export class LessLess extends AbsPunctuator {} //<<
    export class MoreMore extends AbsPunctuator {} //>>
    export class MoreMoreMore extends AbsPunctuator {} //>>>
    export class Ampersand extends AbsPunctuator {} //&
    export class VerticalBar extends AbsPunctuator {} //|
    export class Circumflex extends AbsPunctuator {} //^
    export class Exclamation extends AbsPunctuator {} //!
    export class Tilde extends AbsPunctuator {} //~
    export class AmpersandAmpersand extends AbsPunctuator {} //&&
    export class VerticalBarVerticalBar extends AbsPunctuator {} //||
    export class Question extends AbsPunctuator {} //?
    export class Colon extends AbsPunctuator {} //:
    export class Eq extends AbsPunctuator {} //=
    export class PlusEq extends AbsPunctuator {} //+=
    export class MinusEq extends AbsPunctuator {} //-=
    export class AsteriskEq extends AbsPunctuator {} //*=
    export class PercentEq extends AbsPunctuator {} //%=
    export class LessLessEq extends AbsPunctuator {} //<<=
    export class MoreMoreEq extends AbsPunctuator {} //>>=
    export class MoreMoreMoreEq extends AbsPunctuator {} //>>>=
    export class AmpersandEq extends AbsPunctuator {} //&=
    export class VerticalBarEq extends AbsPunctuator {} //|=
    export class CircumflexEq extends AbsPunctuator {} //^=

    export class AbsDivPunctuator extends AbsInputElement {}
    export class Slash extends AbsDivPunctuator {} // /
    export class SlashEq extends AbsDivPunctuator {} // /=

    /*
     * Section 7.8 of the spec
     * Literals
     * Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.8
     */
    export class AbsLiteral extends AbsInputElement {}
    //Null Literal
    export class NullTok extends AbsLiteral {}
    //Boolean Literal
    export class AbsBooleanLiteral extends AbsLiteral {}
    export class TrueTok extends AbsBooleanLiteral {}
    export class FalseTok extends AbsBooleanLiteral {}
    //Numeric Literal
    export class AbsNumericLiteral extends AbsLiteral {}
    export class DecimalLiteral extends AbsNumericLiteral {}
    export class HexIntegerLiteral extends AbsNumericLiteral {}
    //String Literal
    export class AbsStringLiteral extends AbsLiteral {}
    export class DoubleQuotationStringLiteral extends AbsStringLiteral {}
    export class SingleQuotationStringLiteral extends AbsStringLiteral {}
    //Regular Expression Literal
    export class AbsRegularExpressionLiteral extends AbsLiteral {}
    export class EmptyRegularExpression extends AbsRegularExpressionLiteral {}// /(?:)/
    export class RegularExpression extends AbsRegularExpressionLiteral {} // Any regex that's not empty

}
