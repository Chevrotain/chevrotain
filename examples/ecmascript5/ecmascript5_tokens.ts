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
    export class Whitespace extends tok.Token {}

    // Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.3
    export class LineTerminator extends Whitespace {}

    // Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.4
    export class AbsComment extends tok.Token {

        static IGNORE = true
    }
    export class SingleLineComment extends AbsComment { /*(?:\/\/(?:.*))*/}
    /*
     * The following two classes exist due to the following reason:
     * Quoting the spec: "Comments behave like white space and are discarded except that, if a MultiLineComment contains a
     * line terminator character, then the entire comment is considered to be a LineTerminator for purposes of parsing
     * by the syntactic grammar."
     */
    export class MultipleLineCommentWithTerminator extends AbsComment { }
    export class MultipleLineCommentWithoutTerminator extends AbsComment { }

    // Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.6
    export class IdentifierName extends tok.Token { }

    export class AbsAnyKeyword extends IdentifierName { }

    export class AbsKeyword extends AbsAnyKeyword { }
    export class BreakTok extends AbsKeyword { }
    export class DoTok extends AbsKeyword { }
    export class InstanceOfTok extends AbsKeyword { }
    export class TypeOfTok extends AbsKeyword { }
    export class CaseTok extends AbsKeyword { }
    export class ElseTok extends AbsKeyword { }
    export class NewTok extends AbsKeyword { }
    export class VarTok extends AbsKeyword { }
    export class CatchTok extends AbsKeyword { }
    export class FinallyTok extends AbsKeyword { }
    export class ReturnTok extends AbsKeyword { }
    export class VoidTok extends AbsKeyword { }
    export class ContinueTok extends AbsKeyword { }
    export class ForTok extends AbsKeyword { }
    export class SwitchTok extends AbsKeyword { }
    export class WhileTok extends AbsKeyword { }
    export class DebuggerTok extends AbsKeyword { }
    export class FunctionTok extends AbsKeyword { }
    export class ThisTok extends AbsKeyword { }
    export class WithTok extends AbsKeyword { }
    export class DefaultTok extends AbsKeyword { }
    export class IfTok extends AbsKeyword { }
    export class ThrowTok extends AbsKeyword { }
    export class DeleteTok extends AbsKeyword { }
    export class InTok extends AbsKeyword { }
    export class TryTok extends AbsKeyword { }

    export class AbsAnyFutureReservedWords extends AbsAnyKeyword { }

    export class AbsFutureReservedWord extends AbsAnyFutureReservedWords { }
    export class ClassTok extends AbsFutureReservedWord { }
    export class EnumTok extends AbsFutureReservedWord { }
    export class ExtendsTok extends AbsFutureReservedWord { }
    export class SuperTok extends AbsFutureReservedWord { }
    export class ConstTok extends AbsFutureReservedWord { }
    export class ExportTok extends AbsFutureReservedWord { }
    export class ImportTok extends AbsFutureReservedWord { }

    export class AbsFutureReservedWordStrictMode extends AbsAnyFutureReservedWords { }
    export class ImplementsTok extends AbsFutureReservedWordStrictMode { }
    export class LetTok extends AbsFutureReservedWordStrictMode { }
    export class PrivateTok extends AbsFutureReservedWordStrictMode { }
    export class PublicTok extends AbsFutureReservedWordStrictMode { }
    export class YieldTok extends AbsFutureReservedWordStrictMode { }
    export class InterfaceTok extends AbsFutureReservedWordStrictMode { }
    export class PackageTok extends AbsFutureReservedWordStrictMode { }
    export class ProtectedTok extends AbsFutureReservedWordStrictMode { }
    export class StaticTok extends AbsFutureReservedWordStrictMode { }

    // TODO-SS this pattern is a subset of JS Identifier without the unicode mess, need the full pattern
    export class Identifier extends IdentifierName { } // [_A-Za-z\$][_A-Za-z\d]*

    // The 'get' and 'set' identifiers require a Token class as they have special handling in the grammar
    // @link http://www.ecma-international.org/ecma-262/5.1/#sec-11.1.5
    export class GetTok extends Identifier { }
    export class SetTok extends Identifier { }

    // Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.7
    export class AbsPunctuator extends tok.Token { }
    export class LCurly extends AbsPunctuator { } // {
    export class RCurly extends AbsPunctuator { } // }
    export class LParen extends AbsPunctuator { } // (
    export class RParen extends AbsPunctuator { } // )
    export class LBracket extends AbsPunctuator { } // [
    export class RBracket extends AbsPunctuator { } // ]
    export class Dot extends AbsPunctuator { } // .

    export class Semicolon extends AbsPunctuator {
        constructor(startLine:number, startColumn:number, image:string,
                    public isAutomaticSemiColonInsertion = false) {
            super(startLine, startColumn, image)
        }
    }

    export class Comma extends AbsPunctuator { } // ,

    export class PlusPlus extends AbsPunctuator { } // ++
    export class MinusMinus extends AbsPunctuator { } // --

    export class Ampersand extends AbsPunctuator { } // &
    export class VerticalBar extends AbsPunctuator { } // |
    export class Circumflex extends AbsPunctuator { } // ^
    export class Exclamation extends AbsPunctuator { } // !
    export class Tilde extends AbsPunctuator { } // ~

    export class AmpersandAmpersand extends AbsPunctuator { } // &&
    export class VerticalBarVerticalBar extends AbsPunctuator { } // ||

    export class Question extends AbsPunctuator { } // ?
    export class Colon extends AbsPunctuator { } // :

    export class AbsMultiplicativeOperator extends AbsPunctuator { }
    export class Asterisk extends AbsMultiplicativeOperator { } // *
    export class Slash extends AbsMultiplicativeOperator { } // /
    export class Percent extends AbsMultiplicativeOperator { } // %

    export class AbsAdditiveOperator extends AbsPunctuator { }
    export class Plus extends AbsAdditiveOperator { } // +
    export class Minus extends AbsAdditiveOperator { } // -

    export class AbsShiftOperator extends AbsPunctuator { }
    export class LessLess extends AbsShiftOperator { } // <<
    export class MoreMore extends AbsShiftOperator { } // >>
    export class MoreMoreMore extends AbsShiftOperator { } // >>>

    export class AbsRelationalOperator extends AbsPunctuator { }
    export class Less extends AbsRelationalOperator { } // <
    export class Greater extends AbsRelationalOperator { } // >
    export class LessEq extends AbsRelationalOperator { } // <=
    export class GreaterEq extends AbsRelationalOperator { } // >=

    export class AbsEqualityOperator extends AbsPunctuator { }
    export class EqEq extends AbsEqualityOperator { } // ==
    export class NotEq extends AbsEqualityOperator { } // !=
    export class EqEqEq extends AbsEqualityOperator { } // ===
    export class NotEqEq extends AbsEqualityOperator { } // !==

    export class AbsAssignmentOperator extends AbsPunctuator { }
    export class Eq extends AbsAssignmentOperator { } // =
    export class PlusEq extends AbsAssignmentOperator { } // +=
    export class MinusEq extends AbsAssignmentOperator { } // -=
    export class AsteriskEq extends AbsAssignmentOperator { } // *=
    export class PercentEq extends AbsAssignmentOperator { } // %=
    export class LessLessEq extends AbsAssignmentOperator { } // <<=
    export class MoreMoreEq extends AbsAssignmentOperator { } // >>=
    export class MoreMoreMoreEq extends AbsAssignmentOperator { } // >>>=
    export class AmpersandEq extends AbsAssignmentOperator { } // &=
    export class VerticalBarEq extends AbsAssignmentOperator { } // |=
    export class CircumflexEq extends AbsAssignmentOperator { } // ^=
    export class SlashEq extends AbsAssignmentOperator { } // /=

    // Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.8
    export class AbsLiteral extends tok.Token { }

    export class NullTok extends AbsLiteral { }

    export class AbsBooleanLiteral extends AbsLiteral { }
    export class TrueTok extends AbsBooleanLiteral { }
    export class FalseTok extends AbsBooleanLiteral { }

    export class AbsNumericLiteral extends AbsLiteral { }
    export class DecimalLiteral extends AbsNumericLiteral { } // -?(0|[1-9]\d*)(\.\D+)?([eE][+-]?\d+)?
    export class HexIntegerLiteral extends AbsNumericLiteral { } // 0(x|X)[0-9a-fA-F]+

    export class AbsStringLiteral extends AbsLiteral { }
    export class DoubleQuotationStringLiteral extends AbsStringLiteral { }
    export class SingleQuotationStringLiteral extends AbsStringLiteral { }

    export class RegularExpressionLiteral extends AbsLiteral { }

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
