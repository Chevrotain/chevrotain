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


    // Virtual Tokens for defining the ParseTree

    export class InvalidPrimaryExpression extends tok.VirtualToken {}

    export class ParenthesisExpression extends tok.VirtualToken {}
    export class InvalidParenthesisExpression extends ParenthesisExpression {}

    export class ArrayLiteral extends tok.VirtualToken {}
    export class InvalidArrayLiteral extends ArrayLiteral {}

    export class ElementList extends tok.VirtualToken {}
    export class InvalidElementList extends ElementList {}

    export class Elision extends tok.VirtualToken {}
    export class InvalidElision extends Elision {}

    export class ObjectLiteral extends tok.VirtualToken {}
    export class InvalidObjectLiteral extends ObjectLiteral {}

    export class PropertyAssignment extends tok.VirtualToken {}
    export class InvalidPropertyAssignment extends PropertyAssignment {}

    export class RegularPropertyAssignment extends tok.VirtualToken {}
    export class InvalidRegularPropertyAssignment extends RegularPropertyAssignment {}
    export class GetPropertyAssignment extends tok.VirtualToken {}
    export class InvalidGetPropertyAssignment extends GetPropertyAssignment {}
    export class SetPropertyAssignment extends tok.VirtualToken {}
    export class InvalidSetPropertyAssignment extends SetPropertyAssignment {}

    export class PropertyName extends tok.VirtualToken {}
    export class InvalidPropertyName extends PropertyName {}

    export class MemberCallNewExpression extends tok.VirtualToken {}
    export class InvalidMemberCallNewExpression extends MemberCallNewExpression {}

    export class BoxMemberExpression extends tok.VirtualToken {}
    export class InvalidBoxMemberExpression extends BoxMemberExpression {}

    export class DotMemberExpression extends tok.VirtualToken {}
    export class InvalidDotMemberExpression extends DotMemberExpression {}

    export class Arguments extends tok.VirtualToken {}
    export class InvalidArguments extends Arguments {}

    export class PostfixExpression extends tok.VirtualToken {}
    export class InvalidPostfixExpression extends PostfixExpression {}

    export class UnaryExpression extends tok.VirtualToken {}
    export class InvalidUnaryExpression extends UnaryExpression {}

    export class MultiplicativeExpression extends tok.VirtualToken {}
    export class InvalidMultiplicativeExpression extends MultiplicativeExpression {}

    export class AdditiveExpression extends tok.VirtualToken {}
    export class InvalidAdditiveExpression extends AdditiveExpression {}

    export class ShiftExpression extends tok.VirtualToken {}
    export class InvalidShiftExpression extends ShiftExpression {}

    export class RelationalExpression extends tok.VirtualToken {}
    export class InvalidRelationalExpression extends RelationalExpression {}
    export class InvalidRelationalExpressionNoIn extends InvalidRelationalExpression {}

    export class EqualityExpression extends tok.VirtualToken {}
    export class InvalidEqualityExpression extends EqualityExpression {}
    export class InvalidEqualityExpressionNoIn extends InvalidEqualityExpression {}

    export class BitwiseANDExpression extends tok.VirtualToken {}
    export class InvalidBitwiseANDExpression extends BitwiseANDExpression {}
    export class InvalidBitwiseANDExpressionNoIn extends InvalidBitwiseANDExpression {}

    export class BitwiseXORExpression extends tok.VirtualToken {}
    export class InvalidBitwiseXORExpression extends BitwiseXORExpression {}
    export class InvalidBitwiseXORExpressionNoIn extends InvalidBitwiseXORExpression {}

    export class BitwiseORExpression extends tok.VirtualToken {}
    export class InvalidBitwiseORExpression extends BitwiseORExpression {}
    export class InvalidBitwiseORExpressionNoIn extends InvalidBitwiseORExpression {}

    export class LogicalANDExpression extends tok.VirtualToken {}
    export class InvalidLogicalANDExpression extends LogicalANDExpression {}
    export class InvalidLogicalANDExpressionNoIn extends InvalidLogicalANDExpression {}

    export class LogicalORExpression extends tok.VirtualToken {}
    export class InvalidLogicalORExpression extends LogicalORExpression {}
    export class InvalidLogicalORExpressionNoIn extends InvalidLogicalORExpression {}

    export class ConditionalExpression extends tok.VirtualToken {}
    export class InvalidConditionalExpression extends ConditionalExpression {}
    export class InvalidConditionalExpressionNoIn extends InvalidConditionalExpression {}

    export class AssignmentExpression extends tok.VirtualToken {}
    export class InvalidAssignmentExpression extends AssignmentExpression {}
    export class InvalidAssignmentExpressionNoIn extends InvalidAssignmentExpression {}

    export class Expression extends tok.VirtualToken {}
    export class InvalidExpression extends Expression {}
    export class InvalidExpressionNoIn extends InvalidExpression {}

    export class Statement extends tok.VirtualToken {}
    export class InvalidStatement extends Statement {}

    export class Block extends tok.VirtualToken {}
    export class InvalidBlock extends Block {}

    export class StatementList extends tok.VirtualToken {}
    export class InvalidStatementList extends StatementList {}

    export class VariableStatement extends tok.VirtualToken {}
    export class InvalidVariableStatement extends VariableStatement {}

    export class VariableDeclarationList extends tok.VirtualToken {}
    export class InvalidVariableDeclarationList extends VariableDeclarationList {}
    export class InvalidVariableDeclarationListNoIn extends InvalidVariableDeclarationList {}

    export class VariableDeclaration extends tok.VirtualToken {}
    export class InvalidVariableDeclaration extends VariableDeclaration {}
    export class InvalidVariableDeclarationNoIn extends InvalidVariableDeclaration {}

    export class Initialiser extends tok.VirtualToken {}
    export class InvalidInitialiser extends Initialiser {}
    export class InvalidInitialiserNoIn extends InvalidInitialiser {}

    export class EmptyStatement extends tok.VirtualToken {}
    export class InvalidEmptyStatement extends EmptyStatement {}

    export class ExpressionStatement extends tok.VirtualToken {}
    export class InvalidExpressionStatement extends ExpressionStatement {}

    export class IfStatement extends tok.VirtualToken {}
    export class InvalidIfStatement extends IfStatement {}

    export class IterationStatement extends tok.VirtualToken {}
    export class InvalidIterationStatement extends IterationStatement {}

    export class DoIteration extends IterationStatement {}
    export class InvalidDoIteration extends DoIteration {}

    export class WhileIteration extends IterationStatement {}
    export class InvalidWhileIteration extends WhileIteration {}

    export class ForIteration extends IterationStatement {}
    export class InvalidForIteration extends ForIteration {}

    export class ForHeader extends tok.VirtualToken {}
    export class ForVarHeader extends ForHeader {}
    export class ForNoVarHeader extends ForHeader {}

    export class ForHeaderPart extends tok.VirtualToken {}
    export class ForHeaderInPart extends ForHeaderPart {}
    export class ForHeaderRegularPart extends ForHeaderPart {}
    export class InvalidForHeaderPart extends ForHeaderInPart {}

    export class LabeledStatement extends tok.VirtualToken {}

    export class ContinueStatement extends tok.VirtualToken {}
    export class InvalidContinueStatement extends ContinueStatement {}

    export class BreakStatement extends tok.VirtualToken {}
    export class InvalidBreakStatement extends BreakStatement {}

    export class ReturnStatement extends tok.VirtualToken {}
    export class InvalidReturnStatement extends ReturnStatement {}

    export class WithStatement extends tok.VirtualToken {}
    export class InvalidWithStatement extends WithStatement {}

    export class SwitchStatement extends tok.VirtualToken {}
    export class InvalidSwitchStatement extends SwitchStatement {}

    export class CaseBlock extends tok.VirtualToken {}
    export class InvalidCaseBlock extends CaseBlock {}

    export class CaseClauses extends tok.VirtualToken {}
    export class InvalidCaseClauses extends CaseClauses {}

    export class CaseClause extends tok.VirtualToken {}
    export class InvalidCaseClause extends CaseClause {}

    export class DefaultClause extends tok.VirtualToken {}
    export class InvalidDefaultClause extends DefaultClause {}

    export class ThrowStatement extends tok.VirtualToken {}
    export class InvalidThrowStatement extends ThrowStatement {}

    export class TryStatement extends tok.VirtualToken {}
    export class InvalidTryStatement extends TryStatement {}

    export class Catch extends tok.VirtualToken {}
    export class InvalidCatch extends Catch {}

    export class Finally extends tok.VirtualToken {}
    export class InvalidFinally extends Finally {}

    export class DebuggerStatement extends tok.VirtualToken {}
    export class InvalidDebuggerStatement extends DebuggerStatement {}

    export class FunctionDeclaration extends tok.VirtualToken {}
    export class InvalidFunctionDeclaration extends FunctionDeclaration {}

    export class FunctionExpression extends tok.VirtualToken {}
    export class InvalidFunctionExpression extends FunctionExpression {}

    export class FormalParameterList extends tok.VirtualToken {}
    export class InvalidFormalParameterList extends FormalParameterList {}

    export class Program extends tok.VirtualToken {}
    export class InvalidProgram extends Program {}

    export class SourceElements extends tok.VirtualToken {}
    export class InvalidSourceElements extends SourceElements {}

}
