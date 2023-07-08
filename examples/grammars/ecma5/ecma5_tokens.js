/*
 * Spec: https://www.ecma-international.org/ecma-262/5.1/#sec-7
 * important notes:
 * *  The Tokens class hierarchy in this module is based upon, but does not precisely match the spec's hierarchy.
 *    Instead the hierarchy is meant to provide easy categorization/classification of the tokens for "future phases"
 *    such as: parsing/syntax highlighting/refactoring
 */
import { createToken } from "chevrotain";

// Link: https://www.ecma-international.org/ecma-262/5.1/#sec-7.2
export const Whitespace = createToken({ name: "Whitespace" });

// Link: https://www.ecma-international.org/ecma-262/5.1/#sec-7.3
export const LineTerminator = createToken({
  name: "LineTerminator",
  categories: Whitespace,
});

// Link: https://www.ecma-international.org/ecma-262/5.1/#sec-7.4
export const SingleLineComment = createToken({
  name: "SingleLineComment",
});

/*
 * Note that: "Comments behave like white space and are discarded except that, if a MultiLineComment contains a
 * line terminator character, then the entire comment is considered to be a LineTerminator for purposes of parsing
 * by the syntactic grammar."
 */
export const MultipleLineComment = createToken({
  name: "MultipleLineComment",
});

// Link: https://www.ecma-international.org/ecma-262/5.1/#sec-7.6
export const IdentifierName = createToken({ name: "IdentifierName" });

export const AbsAnyKeyword = createToken({
  name: "AbsAnyKeyword",
  categories: IdentifierName,
});

export const AbsKeyword = createToken({
  name: "AbsKeyword",
  categories: AbsAnyKeyword,
});

export const BreakTok = createToken({
  name: "BreakTok",
  categories: AbsKeyword,
});

export const DoTok = createToken({ name: "DoTok", categories: AbsKeyword });

export const InstanceOfTok = createToken({
  name: "InstanceOfTok",
  categories: AbsKeyword,
});

export const TypeOfTok = createToken({
  name: "TypeOfTok",
  categories: AbsKeyword,
});

export const CaseTok = createToken({ name: "CaseTok", categories: AbsKeyword });

export const ElseTok = createToken({ name: "ElseTok", categories: AbsKeyword });

export const NewTok = createToken({ name: "NewTok", categories: AbsKeyword });

export const VarTok = createToken({ name: "VarTok", categories: AbsKeyword });

export const CatchTok = createToken({
  name: "CatchTok",
  categories: AbsKeyword,
});

export const FinallyTok = createToken({
  name: "FinallyTok",
  categories: AbsKeyword,
});

export const ReturnTok = createToken({
  name: "ReturnTok",
  categories: AbsKeyword,
});

export const VoidTok = createToken({ name: "VoidTok", categories: AbsKeyword });

export const ContinueTok = createToken({
  name: "ContinueTok",
  categories: AbsKeyword,
});

export const ForTok = createToken({ name: "ForTok", categories: AbsKeyword });

export const SwitchTok = createToken({
  name: "SwitchTok",
  categories: AbsKeyword,
});

export const WhileTok = createToken({
  name: "WhileTok",
  categories: AbsKeyword,
});

export const DebuggerTok = createToken({
  name: "DebuggerTok",
  categories: AbsKeyword,
});

export const FunctionTok = createToken({
  name: "FunctionTok",
  categories: AbsKeyword,
});

export const ThisTok = createToken({ name: "ThisTok", categories: AbsKeyword });

export const WithTok = createToken({ name: "WithTok", categories: AbsKeyword });

export const DefaultTok = createToken({
  name: "DefaultTok",
  categories: AbsKeyword,
});

export const IfTok = createToken({ name: "IfTok", categories: AbsKeyword });

export const ThrowTok = createToken({
  name: "ThrowTok",
  categories: AbsKeyword,
});

export const DeleteTok = createToken({
  name: "DeleteTok",
  categories: AbsKeyword,
});

export const InTok = createToken({ name: "InTok", categories: AbsKeyword });

export const TryTok = createToken({ name: "TryTok", categories: AbsKeyword });

// An IdentifierName, but not a reservedKeyword
export const Identifier = createToken({
  name: "Identifier",
  categories: IdentifierName,
});

// Set/Get are not reservedKeywords so they are modeled as a TypeOf Identifier.
export const SetTok = createToken({ name: "SetTok", categories: Identifier });
export const GetTok = createToken({ name: "SetTok", categories: Identifier });

// TODO: Missing the future reservedKeywords here.

// Link: https://www.ecma-international.org/ecma-262/5.1/#sec-7.7
export const AbsPunctuator = createToken({ name: "AbsPunctuator" });

export const LCurly = createToken({
  name: "LCurly",
  categories: AbsPunctuator,
});
export const RCurly = createToken({
  name: "RCurly",
  categories: AbsPunctuator,
});
export const LParen = createToken({
  name: "LParen",
  categories: AbsPunctuator,
});
export const RParen = createToken({
  name: "RParen",
  categories: AbsPunctuator,
});
export const LBracket = createToken({
  name: "LBracket",
  categories: AbsPunctuator,
});
export const RBracket = createToken({
  name: "RBracket",
  categories: AbsPunctuator,
});
export const Dot = createToken({ name: "Dot", categories: AbsPunctuator });

export const Semicolon = createToken({
  name: "Semicolon",
  categories: AbsPunctuator,
});

export const Comma = createToken({ name: "Comma", categories: AbsPunctuator });

export const PlusPlus = createToken({
  name: "PlusPlus",
  categories: AbsPunctuator,
});
export const MinusMinus = createToken({
  name: "MinusMinus",
  categories: AbsPunctuator,
});

export const Ampersand = createToken({
  name: "Ampersand",
  categories: AbsPunctuator,
});
export const VerticalBar = createToken({
  name: "VerticalBar",
  categories: AbsPunctuator,
});
export const Circumflex = createToken({
  name: "Circumflex",
  categories: AbsPunctuator,
});
export const Exclamation = createToken({
  name: "Exclamation",
  categories: AbsPunctuator,
});
export const Tilde = createToken({ name: "Tilde", categories: AbsPunctuator });

export const AmpersandAmpersand = createToken({
  name: "AmpersandAmpersand",
  categories: AbsPunctuator,
});
export const VerticalBarVerticalBar = createToken({
  name: "VerticalBarVerticalBar",
  categories: AbsPunctuator,
});

export const Question = createToken({
  name: "Question",
  categories: AbsPunctuator,
});
export const Colon = createToken({ name: "Colon", categories: AbsPunctuator });

export const AbsMultiplicativeOperator = createToken({
  name: "AbsMultiplicativeOperator",
  categories: AbsPunctuator,
});

export const Asterisk = createToken({
  name: "Asterisk",
  categories: AbsMultiplicativeOperator,
});
export const Slash = createToken({
  name: "Slash",
  categories: AbsMultiplicativeOperator,
});
export const Percent = createToken({
  name: "Percent",
  categories: AbsMultiplicativeOperator,
});

export const AbsAdditiveOperator = createToken({
  name: "AbsAdditiveOperator",
  categories: AbsPunctuator,
});

export const Plus = createToken({
  name: "Plus",
  categories: AbsAdditiveOperator,
});
export const Minus = createToken({
  name: "Minus",
  categories: AbsAdditiveOperator,
});

export const AbsShiftOperator = createToken({
  name: "AbsShiftOperator",
  categories: AbsPunctuator,
});

export const LessLess = createToken({
  name: "LessLess",
  categories: AbsShiftOperator,
});
export const MoreMore = createToken({
  name: "MoreMore",
  categories: AbsShiftOperator,
});
export const MoreMoreMore = createToken({
  name: "MoreMoreMore",
  categories: AbsShiftOperator,
});

export const AbsRelationalOperator = createToken({
  name: "AbsRelationalOperator",
  categories: AbsPunctuator,
});

export const Less = createToken({
  name: "Less",
  categories: AbsRelationalOperator,
});
export const Greater = createToken({
  name: "Greater",
  categories: AbsRelationalOperator,
});
export const LessEq = createToken({
  name: "LessEq",
  categories: AbsRelationalOperator,
});
export const GreaterEq = createToken({
  name: "GreaterEq",
  categories: AbsRelationalOperator,
});

export const AbsEqualityOperator = createToken({
  name: "AbsEqualityOperator",
  categories: AbsPunctuator,
});

export const EqEq = createToken({
  name: "EqEq",
  categories: AbsEqualityOperator,
});
export const NotEq = createToken({
  name: "NotEq",
  categories: AbsEqualityOperator,
});
export const EqEqEq = createToken({
  name: "EqEqEq",
  categories: AbsEqualityOperator,
});
export const NotEqEq = createToken({
  name: "NotEqEq",
  categories: AbsEqualityOperator,
});

export const AbsAssignmentOperator = createToken({
  name: "AbsAssignmentOperator",
  categories: AbsPunctuator,
});

export const Eq = createToken({
  name: "Eq",
  categories: AbsAssignmentOperator,
});
export const PlusEq = createToken({
  name: "PlusEq",
  categories: AbsAssignmentOperator,
});
export const MinusEq = createToken({
  name: "MinusEq",
  categories: AbsAssignmentOperator,
});
export const AsteriskEq = createToken({
  name: "AsteriskEq",
  categories: AbsAssignmentOperator,
});
export const PercentEq = createToken({
  name: "PercentEq",
  categories: AbsAssignmentOperator,
});
export const LessLessEq = createToken({
  name: "LessLessEq",
  categories: AbsAssignmentOperator,
});
export const MoreMoreEq = createToken({
  name: "MoreMoreEq",
  categories: AbsAssignmentOperator,
});
export const MoreMoreMoreEq = createToken({
  name: "MoreMoreMoreEq",
  categories: AbsAssignmentOperator,
});
export const AmpersandEq = createToken({
  name: "AmpersandEq",
  categories: AbsAssignmentOperator,
});
export const VerticalBarEq = createToken({
  name: "VerticalBarEq",
  categories: AbsAssignmentOperator,
});
export const CircumflexEq = createToken({
  name: "CircumflexEq",
  categories: AbsAssignmentOperator,
});
export const SlashEq = createToken({
  name: "SlashEq",
  categories: AbsAssignmentOperator,
});

// Link: https://www.ecma-international.org/ecma-262/5.1/#sec-7.8
export const AbsLiteral = createToken({ name: "AbsLiteral" });

export const NullTok = createToken({
  name: "NullTok",
  categories: [AbsLiteral],
});

export const AbsBooleanLiteral = createToken({
  name: "AbsBooleanLiteral",
  categories: AbsLiteral,
});

export const TrueTok = createToken({
  name: "TrueTok",
  categories: [AbsBooleanLiteral, AbsKeyword],
});

export const FalseTok = createToken({
  name: "FalseTok",
  categories: [AbsBooleanLiteral, AbsKeyword],
});

export const NumericLiteral = createToken({
  name: "NumericLiteral",
  categories: AbsLiteral,
});

export const StringLiteral = createToken({
  name: "StringLiteral",
  categories: AbsLiteral,
});

export const RegularExpressionLiteral = createToken({
  name: "RegularExpressionLiteral",
  categories: AbsLiteral,
});
