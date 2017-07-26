/*
 * Spec: http://www.ecma-international.org/ecma-262/5.1/#sec-7
 * important notes:
 * *  The Tokens class hierarchy in this module is based upon, but does not precisely match the spec's hierarchy.
 *    Instead the hierarchy is meant to provide easy categorization/classification of the tokens for "future phases"
 *    such as: parsing/syntax highlighting/refactoring
 */

const createToken = require("chevrotain").createToken

// Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.2
const Whitespace = createToken({ name: "Whitespace" })

// Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.3
const LineTerminator = createToken({
    name: "LineTerminator",
    parent: Whitespace
})

// Link: http://www.ecma-international.org/ecma-262/5.1/#sec-7.4
const AbsComment = createToken({ name: "AbsComment" })

const SingleLineComment = createToken({
    name: "SingleLineComment",
    parent: AbsComment
})

/*
 * The following two classes exist due to the following reason:
 * Quoting the spec: "Comments behave like white space and are discarded except that, if a MultiLineComment contains a
 * line terminator character, then the entire comment is considered to be a LineTerminator for purposes of parsing
 * by the syntactic grammar."
 */
const MultipleLineCommentWithTerminator = createToken({
    name: "MultipleLineCommentWithTerminator",
    parent: AbsComment
})

const MultipleLineCommentWithoutTerminator = createToken({
    name: "MultipleLineCommentWithoutTerminator",
    parent: AbsComment
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

const AbsAnyFutureReservedWords = createToken({
    name: "AbsAnyFutureReservedWords",
    parent: AbsAnyKeyword
})

const AbsFutureReservedWord = createToken({
    name: "AbsFutureReservedWord",
    parent: AbsAnyFutureReservedWords
})

const ClassTok = createToken({
    name: "ClassTok",
    parent: AbsFutureReservedWord
})

const EnumTok = createToken({ name: "EnumTok", parent: AbsFutureReservedWord })

const ExtendsTok = createToken({
    name: "ExtendsTok",
    parent: AbsFutureReservedWord
})

const SuperTok = createToken({
    name: "SuperTok",
    parent: AbsFutureReservedWord
})

const ConstTok = createToken({
    name: "ConstTok",
    parent: AbsFutureReservedWord
})

const Tok = createToken({ name: "Tok", parent: AbsFutureReservedWord })

const ImportTok = createToken({
    name: "ImportTok",
    parent: AbsFutureReservedWord
})

const AbsFutureReservedWordStrictMode = createToken({
    name: "AbsFutureReservedWordStrictMode",
    parent: AbsAnyFutureReservedWords
})

const ImplementsTok = createToken({
    name: "ImplementsTok",
    parent: AbsFutureReservedWordStrictMode
})

const LetTok = createToken({
    name: "LetTok",
    parent: AbsFutureReservedWordStrictMode
})

const PrivateTok = createToken({
    name: "PrivateTok",
    parent: AbsFutureReservedWordStrictMode
})

const PublicTok = createToken({
    name: "PublicTok",
    parent: AbsFutureReservedWordStrictMode
})

const YieldTok = createToken({
    name: "YieldTok",
    parent: AbsFutureReservedWordStrictMode
})

const InterfaceTok = createToken({
    name: "InterfaceTok",
    parent: AbsFutureReservedWordStrictMode
})

const PackageTok = createToken({
    name: "PackageTok",
    parent: AbsFutureReservedWordStrictMode
})

const ProtectedTok = createToken({
    name: "ProtectedTok",
    parent: AbsFutureReservedWordStrictMode
})

const StaticTok = createToken({
    name: "StaticTok",
    parent: AbsFutureReservedWordStrictMode
})

const Identifier = createToken({ name: "Identifier", parent: IdentifierName })

// The 'get' and 'set' identifiers require a Token class as they have special handling in the grammar
// @link http://www.ecma-international.org/ecma-262/5.1/#sec-11.1.5
const GetTok = createToken({ name: "GetTok", parent: Identifier })

const SetTok = createToken({ name: "SetTok", parent: Identifier })

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

const NullTok = createToken({ name: "NullTok", parent: AbsLiteral })

const AbsBooleanLiteral = createToken({
    name: "AbsBooleanLiteral",
    parent: AbsLiteral
})

const TrueTok = createToken({ name: "TrueTok", parent: AbsBooleanLiteral })

const FalseTok = createToken({ name: "FalseTok", parent: AbsBooleanLiteral })

const AbsNumericLiteral = createToken({
    name: "AbsNumericLiteral",
    parent: AbsLiteral
})

const DecimalLiteral = createToken({
    name: "DecimalLiteral",
    parent: AbsNumericLiteral
})
const HexIntegerLiteral = createToken({
    name: "HexIntegerLiteral",
    parent: AbsNumericLiteral
})

const AbsStringLiteral = createToken({
    name: "AbsStringLiteral",
    parent: AbsLiteral
})

const DoubleQuotationStringLiteral = createToken({
    name: "DoubleQuotationStringLiteral",
    parent: AbsStringLiteral
})

const SingleQuotationStringLiteral = createToken({
    name: "SingleQuotationStringLiteral",
    parent: AbsStringLiteral
})

const RegularExpressionLiteral = createToken({
    name: "RegularExpressionLiteral",
    parent: AbsLiteral
})

module.exports = {
    Whitespace,
    LineTerminator,
    AbsComment,
    SingleLineComment,
    MultipleLineCommentWithTerminator,
    MultipleLineCommentWithoutTerminator,
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
    AbsAnyFutureReservedWords,
    AbsFutureReservedWord,
    ClassTok,
    EnumTok,
    ExtendsTok,
    SuperTok,
    ConstTok,
    Tok,
    ImportTok,
    AbsFutureReservedWordStrictMode,
    ImplementsTok,
    LetTok,
    PrivateTok,
    PublicTok,
    YieldTok,
    InterfaceTok,
    PackageTok,
    ProtectedTok,
    StaticTok,
    Identifier,
    GetTok,
    SetTok,
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
    AbsNumericLiteral,
    DecimalLiteral,
    HexIntegerLiteral,
    AbsStringLiteral,
    DoubleQuotationStringLiteral,
    SingleQuotationStringLiteral,
    RegularExpressionLiteral
}
