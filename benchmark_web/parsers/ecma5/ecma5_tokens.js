"use strict"

/*
 * Spec: http://www.ecma-international.org/ecma-262/5.1/#sec-7
 * important notes:
 * *  The Tokens class hierarchy in this module is based upon, but does not precisely match the spec's hierarchy.
 *    Instead the hierarchy is meant to provide easy categorization/classification of the tokens for "future phases"
 *    such as: parsing/syntax highlighting/refactoring
 */

const createToken = self.chevrotain.createToken

// Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.2
const Whitespace = createToken({ name: "Whitespace" })

// Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.3
const LineTerminator = createToken({
    name: "LineTerminator",
    categories: Whitespace
})

// Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.4
const SingleLineComment = createToken({
    name: "SingleLineComment"
})

/*
 * Note that: "Comments behave like white space and are discarded except that, if a MultiLineComment contains a
 * line terminator character, then the entire comment is considered to be a LineTerminator for purposes of parsing
 * by the syntactic grammar."
 */
const MultipleLineComment = createToken({
    name: "MultipleLineComment"
})

// Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.6
const IdentifierName = createToken({ name: "IdentifierName" })

const AbsAnyKeyword = createToken({
    name: "AbsAnyKeyword",
    categories: IdentifierName
})

const AbsKeyword = createToken({
    name: "AbsKeyword",
    categories: AbsAnyKeyword
})

const BreakTok = createToken({ name: "BreakTok", categories: AbsKeyword })

const DoTok = createToken({ name: "DoTok", categories: AbsKeyword })

const InstanceOfTok = createToken({
    name: "InstanceOfTok",
    categories: AbsKeyword
})

const TypeOfTok = createToken({ name: "TypeOfTok", categories: AbsKeyword })

const CaseTok = createToken({ name: "CaseTok", categories: AbsKeyword })

const ElseTok = createToken({ name: "ElseTok", categories: AbsKeyword })

const NewTok = createToken({ name: "NewTok", categories: AbsKeyword })

const VarTok = createToken({ name: "VarTok", categories: AbsKeyword })

const CatchTok = createToken({ name: "CatchTok", categories: AbsKeyword })

const FinallyTok = createToken({ name: "FinallyTok", categories: AbsKeyword })

const ReturnTok = createToken({ name: "ReturnTok", categories: AbsKeyword })

const VoidTok = createToken({ name: "VoidTok", categories: AbsKeyword })

const ContinueTok = createToken({ name: "ContinueTok", categories: AbsKeyword })

const ForTok = createToken({ name: "ForTok", categories: AbsKeyword })

const SwitchTok = createToken({ name: "SwitchTok", categories: AbsKeyword })

const WhileTok = createToken({ name: "WhileTok", categories: AbsKeyword })

const DebuggerTok = createToken({ name: "DebuggerTok", categories: AbsKeyword })

const FunctionTok = createToken({ name: "FunctionTok", categories: AbsKeyword })

const ThisTok = createToken({ name: "ThisTok", categories: AbsKeyword })

const WithTok = createToken({ name: "WithTok", categories: AbsKeyword })

const DefaultTok = createToken({ name: "DefaultTok", categories: AbsKeyword })

const IfTok = createToken({ name: "IfTok", categories: AbsKeyword })

const ThrowTok = createToken({ name: "ThrowTok", categories: AbsKeyword })

const DeleteTok = createToken({ name: "DeleteTok", categories: AbsKeyword })

const InTok = createToken({ name: "InTok", categories: AbsKeyword })

const TryTok = createToken({ name: "TryTok", categories: AbsKeyword })

// An IdentifierName, but not a reservedKeyword
const Identifier = createToken({
    name: "Identifier",
    categories: IdentifierName
})

// Set/Get are not reservedKeywords so they are modeled as a TypeOf Identifier.
const SetTok = createToken({ name: "SetTok", categories: Identifier })
const GetTok = createToken({ name: "SetTok", categories: Identifier })

// TODO: Missing the future reservedKeywords here.

// Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.7
const AbsPunctuator = createToken({ name: "AbsPunctuator" })

const LCurly = createToken({ name: "LCurly", categories: AbsPunctuator })
const RCurly = createToken({ name: "RCurly", categories: AbsPunctuator })
const LParen = createToken({ name: "LParen", categories: AbsPunctuator })
const RParen = createToken({ name: "RParen", categories: AbsPunctuator })
const LBracket = createToken({ name: "LBracket", categories: AbsPunctuator })
const RBracket = createToken({ name: "RBracket", categories: AbsPunctuator })
const Dot = createToken({ name: "Dot", categories: AbsPunctuator })

const Semicolon = createToken({ name: "Semicolon", categories: AbsPunctuator })

const Comma = createToken({ name: "Comma", categories: AbsPunctuator })

const PlusPlus = createToken({ name: "PlusPlus", categories: AbsPunctuator })
const MinusMinus = createToken({
    name: "MinusMinus",
    categories: AbsPunctuator
})

const Ampersand = createToken({ name: "Ampersand", categories: AbsPunctuator })
const VerticalBar = createToken({
    name: "VerticalBar",
    categories: AbsPunctuator
})
const Circumflex = createToken({
    name: "Circumflex",
    categories: AbsPunctuator
})
const Exclamation = createToken({
    name: "Exclamation",
    categories: AbsPunctuator
})
const Tilde = createToken({ name: "Tilde", categories: AbsPunctuator })

const AmpersandAmpersand = createToken({
    name: "AmpersandAmpersand",
    categories: AbsPunctuator
})
const VerticalBarVerticalBar = createToken({
    name: "VerticalBarVerticalBar",
    categories: AbsPunctuator
})

const Question = createToken({ name: "Question", categories: AbsPunctuator })
const Colon = createToken({ name: "Colon", categories: AbsPunctuator })

const AbsMultiplicativeOperator = createToken({
    name: "AbsMultiplicativeOperator",
    categories: AbsPunctuator
})

const Asterisk = createToken({
    name: "Asterisk",
    categories: AbsMultiplicativeOperator
})
const Slash = createToken({
    name: "Slash",
    categories: AbsMultiplicativeOperator
})
const Percent = createToken({
    name: "Percent",
    categories: AbsMultiplicativeOperator
})

const AbsAdditiveOperator = createToken({
    name: "AbsAdditiveOperator",
    categories: AbsPunctuator
})

const Plus = createToken({ name: "Plus", categories: AbsAdditiveOperator })
const Minus = createToken({ name: "Minus", categories: AbsAdditiveOperator })

const AbsShiftOperator = createToken({
    name: "AbsShiftOperator",
    categories: AbsPunctuator
})

const LessLess = createToken({ name: "LessLess", categories: AbsShiftOperator })
const MoreMore = createToken({ name: "MoreMore", categories: AbsShiftOperator })
const MoreMoreMore = createToken({
    name: "MoreMoreMore",
    categories: AbsShiftOperator
})

const AbsRelationalOperator = createToken({
    name: "AbsRelationalOperator",
    categories: AbsPunctuator
})

const Less = createToken({ name: "Less", categories: AbsRelationalOperator })
const Greater = createToken({
    name: "Greater",
    categories: AbsRelationalOperator
})
const LessEq = createToken({
    name: "LessEq",
    categories: AbsRelationalOperator
})
const GreaterEq = createToken({
    name: "GreaterEq",
    categories: AbsRelationalOperator
})

const AbsEqualityOperator = createToken({
    name: "AbsEqualityOperator",
    categories: AbsPunctuator
})

const EqEq = createToken({ name: "EqEq", categories: AbsEqualityOperator })
const NotEq = createToken({ name: "NotEq", categories: AbsEqualityOperator })
const EqEqEq = createToken({ name: "EqEqEq", categories: AbsEqualityOperator })
const NotEqEq = createToken({
    name: "NotEqEq",
    categories: AbsEqualityOperator
})

const AbsAssignmentOperator = createToken({
    name: "AbsAssignmentOperator",
    categories: AbsPunctuator
})

const Eq = createToken({ name: "Eq", categories: AbsAssignmentOperator })
const PlusEq = createToken({
    name: "PlusEq",
    categories: AbsAssignmentOperator
})
const MinusEq = createToken({
    name: "MinusEq",
    categories: AbsAssignmentOperator
})
const AsteriskEq = createToken({
    name: "AsteriskEq",
    categories: AbsAssignmentOperator
})
const PercentEq = createToken({
    name: "PercentEq",
    categories: AbsAssignmentOperator
})
const LessLessEq = createToken({
    name: "LessLessEq",
    categories: AbsAssignmentOperator
})
const MoreMoreEq = createToken({
    name: "MoreMoreEq",
    categories: AbsAssignmentOperator
})
const MoreMoreMoreEq = createToken({
    name: "MoreMoreMoreEq",
    categories: AbsAssignmentOperator
})
const AmpersandEq = createToken({
    name: "AmpersandEq",
    categories: AbsAssignmentOperator
})
const VerticalBarEq = createToken({
    name: "VerticalBarEq",
    categories: AbsAssignmentOperator
})
const CircumflexEq = createToken({
    name: "CircumflexEq",
    categories: AbsAssignmentOperator
})
const SlashEq = createToken({
    name: "SlashEq",
    categories: AbsAssignmentOperator
})

// Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.8
const AbsLiteral = createToken({ name: "AbsLiteral" })

// TODO: "true" and "false" should extend Identifier and act like reservedKeywords
const NullTok = createToken({ name: "NullTok", categories: AbsLiteral })

const AbsBooleanLiteral = createToken({
    name: "AbsBooleanLiteral",
    categories: AbsLiteral
})

// TODO: "true" and "false" should extend Identifier and act like reservedKeywords
const TrueTok = createToken({ name: "TrueTok", categories: AbsBooleanLiteral })

const FalseTok = createToken({
    name: "FalseTok",
    categories: AbsBooleanLiteral
})

const NumericLiteral = createToken({
    name: "NumericLiteral",
    categories: AbsLiteral
})

const StringLiteral = createToken({
    name: "StringLiteral",
    categories: AbsLiteral
})

const RegularExpressionLiteral = createToken({
    name: "RegularExpressionLiteral",
    categories: AbsLiteral
})

self.tokens = {
    Whitespace,
    LineTerminator,
    SingleLineComment,
    MultipleLineComment,
    IdentifierName,
    AbsAnyKeyword,
    AbsKeyword,
    BreakTok,
    DoTok,
    InstanceOfTok,
    TypeOfTok,
    CaseTok,
    ElseTok,
    NewTok,
    VarTok,
    CatchTok,
    FinallyTok,
    ReturnTok,
    VoidTok,
    ContinueTok,
    ForTok,
    SwitchTok,
    WhileTok,
    DebuggerTok,
    FunctionTok,
    ThisTok,
    WithTok,
    DefaultTok,
    IfTok,
    ThrowTok,
    DeleteTok,
    InTok,
    TryTok,
    Identifier,
    SetTok,
    GetTok,
    AbsPunctuator,
    LCurly,
    RCurly,
    LParen,
    RParen,
    LBracket,
    RBracket,
    Dot,
    Semicolon,
    Comma,
    PlusPlus,
    MinusMinus,
    Ampersand,
    VerticalBar,
    Circumflex,
    Exclamation,
    Tilde,
    AmpersandAmpersand,
    VerticalBarVerticalBar,
    Question,
    Colon,
    AbsMultiplicativeOperator,
    Asterisk,
    Slash,
    Percent,
    AbsAdditiveOperator,
    Plus,
    Minus,
    AbsShiftOperator,
    LessLess,
    MoreMore,
    MoreMoreMore,
    AbsRelationalOperator,
    Less,
    Greater,
    LessEq,
    GreaterEq,
    AbsEqualityOperator,
    EqEq,
    NotEq,
    EqEqEq,
    NotEqEq,
    AbsAssignmentOperator,
    Eq,
    PlusEq,
    MinusEq,
    AsteriskEq,
    PercentEq,
    LessLessEq,
    MoreMoreEq,
    MoreMoreMoreEq,
    AmpersandEq,
    VerticalBarEq,
    CircumflexEq,
    SlashEq,
    AbsLiteral,
    NullTok,
    AbsBooleanLiteral,
    TrueTok,
    FalseTok,
    NumericLiteral,
    StringLiteral,
    RegularExpressionLiteral
}
