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
    parent: Whitespace
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
    parent: IdentifierName
})

const AbsKeyword = createToken({ name: "AbsKeyword", parent: AbsAnyKeyword })

const BreakTok = createToken({ name: "BreakTok", parent: AbsKeyword })

const DoTok = createToken({ name: "DoTok", parent: AbsKeyword })

const InstanceOfTok = createToken({ name: "InstanceOfTok", parent: AbsKeyword })

const TypeOfTok = createToken({ name: "TypeOfTok", parent: AbsKeyword })

const CaseTok = createToken({ name: "CaseTok", parent: AbsKeyword })

const ElseTok = createToken({ name: "ElseTok", parent: AbsKeyword })

const NewTok = createToken({ name: "NewTok", parent: AbsKeyword })

const VarTok = createToken({ name: "VarTok", parent: AbsKeyword })

const CatchTok = createToken({ name: "CatchTok", parent: AbsKeyword })

const FinallyTok = createToken({ name: "FinallyTok", parent: AbsKeyword })

const ReturnTok = createToken({ name: "ReturnTok", parent: AbsKeyword })

const VoidTok = createToken({ name: "VoidTok", parent: AbsKeyword })

const ContinueTok = createToken({ name: "ContinueTok", parent: AbsKeyword })

const ForTok = createToken({ name: "ForTok", parent: AbsKeyword })

const SwitchTok = createToken({ name: "SwitchTok", parent: AbsKeyword })

const WhileTok = createToken({ name: "WhileTok", parent: AbsKeyword })

const DebuggerTok = createToken({ name: "DebuggerTok", parent: AbsKeyword })

const FunctionTok = createToken({ name: "FunctionTok", parent: AbsKeyword })

const ThisTok = createToken({ name: "ThisTok", parent: AbsKeyword })

const WithTok = createToken({ name: "WithTok", parent: AbsKeyword })

const DefaultTok = createToken({ name: "DefaultTok", parent: AbsKeyword })

const IfTok = createToken({ name: "IfTok", parent: AbsKeyword })

const ThrowTok = createToken({ name: "ThrowTok", parent: AbsKeyword })

const DeleteTok = createToken({ name: "DeleteTok", parent: AbsKeyword })

const InTok = createToken({ name: "InTok", parent: AbsKeyword })

const TryTok = createToken({ name: "TryTok", parent: AbsKeyword })

// An IdentifierName, but not a reservedKeyword
const Identifier = createToken({ name: "Identifier", parent: IdentifierName })

// Set/Get are not reservedKeywords so they are modeled as a TypeOf Identifier.
const SetTok = createToken({ name: "SetTok", parent: Identifier })
const GetTok = createToken({ name: "SetTok", parent: Identifier })

// TODO: Missing the future reservedKeywords here.

// Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.7
const AbsPunctuator = createToken({ name: "AbsPunctuator" })

const LCurly = createToken({ name: "LCurly", parent: AbsPunctuator })
const RCurly = createToken({ name: "RCurly", parent: AbsPunctuator })
const LParen = createToken({ name: "LParen", parent: AbsPunctuator })
const RParen = createToken({ name: "RParen", parent: AbsPunctuator })
const LBracket = createToken({ name: "LBracket", parent: AbsPunctuator })
const RBracket = createToken({ name: "RBracket", parent: AbsPunctuator })
const Dot = createToken({ name: "Dot", parent: AbsPunctuator })

const Semicolon = createToken({ name: "Semicolon", parent: AbsPunctuator })

const Comma = createToken({ name: "Comma", parent: AbsPunctuator })

const PlusPlus = createToken({ name: "PlusPlus", parent: AbsPunctuator })
const MinusMinus = createToken({ name: "MinusMinus", parent: AbsPunctuator })

const Ampersand = createToken({ name: "Ampersand", parent: AbsPunctuator })
const VerticalBar = createToken({ name: "VerticalBar", parent: AbsPunctuator })
const Circumflex = createToken({ name: "Circumflex", parent: AbsPunctuator })
const Exclamation = createToken({ name: "Exclamation", parent: AbsPunctuator })
const Tilde = createToken({ name: "Tilde", parent: AbsPunctuator })

const AmpersandAmpersand = createToken({
    name: "AmpersandAmpersand",
    parent: AbsPunctuator
})
const VerticalBarVerticalBar = createToken({
    name: "VerticalBarVerticalBar",
    parent: AbsPunctuator
})

const Question = createToken({ name: "Question", parent: AbsPunctuator })
const Colon = createToken({ name: "Colon", parent: AbsPunctuator })

const AbsMultiplicativeOperator = createToken({
    name: "AbsMultiplicativeOperator",
    parent: AbsPunctuator
})

const Asterisk = createToken({
    name: "Asterisk",
    parent: AbsMultiplicativeOperator
})
const Slash = createToken({ name: "Slash", parent: AbsMultiplicativeOperator })
const Percent = createToken({
    name: "Percent",
    parent: AbsMultiplicativeOperator
})

const AbsAdditiveOperator = createToken({
    name: "AbsAdditiveOperator",
    parent: AbsPunctuator
})

const Plus = createToken({ name: "Plus", parent: AbsAdditiveOperator })
const Minus = createToken({ name: "Minus", parent: AbsAdditiveOperator })

const AbsShiftOperator = createToken({
    name: "AbsShiftOperator",
    parent: AbsPunctuator
})

const LessLess = createToken({ name: "LessLess", parent: AbsShiftOperator })
const MoreMore = createToken({ name: "MoreMore", parent: AbsShiftOperator })
const MoreMoreMore = createToken({
    name: "MoreMoreMore",
    parent: AbsShiftOperator
})

const AbsRelationalOperator = createToken({
    name: "AbsRelationalOperator",
    parent: AbsPunctuator
})

const Less = createToken({ name: "Less", parent: AbsRelationalOperator })
const Greater = createToken({ name: "Greater", parent: AbsRelationalOperator })
const LessEq = createToken({ name: "LessEq", parent: AbsRelationalOperator })
const GreaterEq = createToken({
    name: "GreaterEq",
    parent: AbsRelationalOperator
})

const AbsEqualityOperator = createToken({
    name: "AbsEqualityOperator",
    parent: AbsPunctuator
})

const EqEq = createToken({ name: "EqEq", parent: AbsEqualityOperator })
const NotEq = createToken({ name: "NotEq", parent: AbsEqualityOperator })
const EqEqEq = createToken({ name: "EqEqEq", parent: AbsEqualityOperator })
const NotEqEq = createToken({ name: "NotEqEq", parent: AbsEqualityOperator })

const AbsAssignmentOperator = createToken({
    name: "AbsAssignmentOperator",
    parent: AbsPunctuator
})

const Eq = createToken({ name: "Eq", parent: AbsAssignmentOperator })
const PlusEq = createToken({ name: "PlusEq", parent: AbsAssignmentOperator })
const MinusEq = createToken({ name: "MinusEq", parent: AbsAssignmentOperator })
const AsteriskEq = createToken({
    name: "AsteriskEq",
    parent: AbsAssignmentOperator
})
const PercentEq = createToken({
    name: "PercentEq",
    parent: AbsAssignmentOperator
})
const LessLessEq = createToken({
    name: "LessLessEq",
    parent: AbsAssignmentOperator
})
const MoreMoreEq = createToken({
    name: "MoreMoreEq",
    parent: AbsAssignmentOperator
})
const MoreMoreMoreEq = createToken({
    name: "MoreMoreMoreEq",
    parent: AbsAssignmentOperator
})
const AmpersandEq = createToken({
    name: "AmpersandEq",
    parent: AbsAssignmentOperator
})
const VerticalBarEq = createToken({
    name: "VerticalBarEq",
    parent: AbsAssignmentOperator
})
const CircumflexEq = createToken({
    name: "CircumflexEq",
    parent: AbsAssignmentOperator
})
const SlashEq = createToken({ name: "SlashEq", parent: AbsAssignmentOperator })

// Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.8
const AbsLiteral = createToken({ name: "AbsLiteral" })

// TODO: "true" and "false" should extend Identifier and act like reservedKeywords
const NullTok = createToken({ name: "NullTok", parent: AbsLiteral })

const AbsBooleanLiteral = createToken({
    name: "AbsBooleanLiteral",
    parent: AbsLiteral
})

// TODO: "true" and "false" should extend Identifier and act like reservedKeywords
const TrueTok = createToken({ name: "TrueTok", parent: AbsBooleanLiteral })

const FalseTok = createToken({ name: "FalseTok", parent: AbsBooleanLiteral })

const NumericLiteral = createToken({
    name: "NumericLiteral",
    parent: AbsLiteral
})

const StringLiteral = createToken({
    name: "StringLiteral",
    parent: AbsLiteral
})

const RegularExpressionLiteral = createToken({
    name: "RegularExpressionLiteral",
    parent: AbsLiteral
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
