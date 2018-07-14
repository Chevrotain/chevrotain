const { Parser, Lexer, createToken: orgCreateToken } = require("chevrotain")
const XRegExp = require("xregexp")

// ----------------- lexer -----------------
// Based on the specs in:
// https://www.w3.org/TR/CSS21/grammar.html

// A little mini DSL for easier lexer definition using xRegExp.
const fragments = {}

function FRAGMENT(name, def) {
    fragments[name] = XRegExp.build(def, fragments)
}

function MAKE_PATTERN(def, flags) {
    return XRegExp.build(def, fragments, flags)
}

const allTokens = []

const createToken = function() {
    const newToken = orgCreateToken.apply(null, arguments)
    allTokens.push(newToken)
    return newToken
}
// ----------------- lexer -----------------

// B1 - Ignored-Tokens
// http://facebook.github.io/graphql/June2018/#sec-Appendix-Grammar-Summary.Ignored-Tokens
const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /[ \t]+/,
    group: Lexer.SKIPPED
})

const UnicodeBOM = createToken({
    name: "UnicodeBOM",
    pattern: "\uFFFE",
    group: Lexer.SKIPPED
})

const LineTerminator = createToken({
    name: "LineTerminator",
    pattern: /\n\r|\r|\n/,
    group: Lexer.SKIPPED
})

const Comment = createToken({
    name: "Comment",
    pattern: /#[^\n\r]+/,
    group: Lexer.SKIPPED
})

const Comma = createToken({
    name: "Comma",
    pattern: ",",
    group: Lexer.SKIPPED
})

// B2 - Lexical Tokens
// http://facebook.github.io/graphql/June2018/#sec-Appendix-Grammar-Summary.Lexical-Tokens
// Punctuator
const Exclamation = createToken({ name: "Exclamation", pattern: "!" })
const Dollar = createToken({ name: "Dollar", pattern: "$" })
const LParen = createToken({ name: "LParen", pattern: "(" })
const RParen = createToken({ name: "RParen", pattern: ")" })
const DotDotDot = createToken({ name: "DotDotDot", pattern: "..." })
const Colon = createToken({ name: "Colon", pattern: ":" })
const Equals = createToken({ name: "Equals", pattern: "=" })
const At = createToken({ name: "At", pattern: "@" })
const LSquare = createToken({ name: "LSquare", pattern: "[" })
const RSquare = createToken({ name: "RSquare", pattern: "]" })
const LCurly = createToken({ name: "LCurly", pattern: "{" })
const VerticalLine = createToken({ name: "Vertical Line", pattern: "|" })
const RCurly = createToken({ name: "RCurly", pattern: "}" })

// keywords
// TODO: are keywords reserved?, keywords vs Identifiers?
const Query = createToken({ name: "Query", pattern: "query" })
const Mutation = createToken({ name: "Mutation", pattern: "mutation" })
const Subscription = createToken({ name: "Subscription", pattern: "Subscription" })
const Fragment = createToken({ name: "Fragment", pattern: "fragment" })
const On = createToken({ name: "On", pattern: "on" })
const True = createToken({ name: "True", pattern: "true" })
const False = createToken({ name: "False", pattern: "false" })
const Null = createToken({ name: "Null", pattern: "null" })


// Token
const Name = createToken({ name: "Name", pattern: /[_A-Za-z][_0-9A-Za-z]*/ })
FRAGMENT("IntegerPart", "-?(0|[1-9][0-9]*)")
FRAGMENT("FractionalPart", "\\.[0-9]+")
FRAGMENT("ExponentPart", "[eE][+-]?[0-9]+")
const IntValue = createToken({
    name: "IntValue",
    pattern: MAKE_PATTERN("{{IntegerPart}}")
})
const FloatValue = createToken({
    name: "IntValue",
    pattern: MAKE_PATTERN(
        "{{IntegerPart}}{{FractionalPart}}({{ExponentPart}})?|{{IntegerPart}}{{ExponentPart}}"
    )
})
FRAGMENT("EscapedCharacter", '[\\\\/"bfnrt]')
FRAGMENT("EscapedUnicode", "[0-9a-fA-F]{4}")
FRAGMENT(
    "StringCharacter",
    '(?:[^\\\\"\\n\\r]|\\\\(?:{{EscapedUnicode}}|u{{EscapedCharacter}}))'
)
FRAGMENT("BlockStringCharacter", '[^"]|"(?!"")|\\\\"""')
const StringValue = createToken({
    name: "StringValue",
    pattern: MAKE_PATTERN(
        '"(?:{{StringCharacter}})*"|"""(?:{{BlockStringCharacter}})*"""'
    )
})

const GraphQLLexer = new Lexer([LineTerminator])

class GraphQLParser extends Parser {
    // Unfortunately no support for class fields with initializer in ES2015, only in esNext...
    // so the parsing rules are defined inside the constructor, as each parsing rule must be initialized by
    // invoking RULE(...)
    // see: https://github.com/jeffmo/es-class-fields-and-static-properties
    constructor(input, config) {
        super(input, allTokens, config)

        // not mandatory, using $ (or any other sign) to reduce verbosity (this. this. this. this. .......)
        const $ = this

        // the parsing methods
        $.RULE("Document", () => {
            $.MANY(() => {
                $.SUBRULE($.Definition)
            })
        })

        $.RULE("definition", () => {
            $.OR([
                { ALT: () => $.SUBRULE($.ExecutableDefinition) },
                { ALT: () => $.SUBRULE($.TypeSystemDefinition) },
                { ALT: () => $.SUBRULE($.TypeSystemExtension) }
            ])
        })

        $.RULE("ExecutableDefinition", () => {
            $.OR([
                { ALT: () => $.SUBRULE($.OperationDefinition) },
                { ALT: () => $.SUBRULE($.FragmentDefinition) }
            ])
        })

        $.RULE("OperationDefinition", () => {
            $.OR([
                { ALT: () => $.SUBRULE($.SelectionSet) },
                {
                    ALT: () => {
                        $.SUBRULE($.OperationType)
                        $.OPTION(() => {
                            $.CONSUME(Name)
                        })

                        $.OPTION2(() => {
                            $.SUBRULE($.VariableDefinitions)
                        })

                        $.OPTION3(() => {
                            $.SUBRULE($.Directives)
                        })

                        $.SUBRULE($.SelectionSet)
                    }
                }
            ])
        })

        $.RULE("OperationType", () => {
            $.OR([
                { ALT: () => $.CONSUME(Query) },
                { ALT: () => $.CONSUME(Mutation) },
                { ALT: () => $.CONSUME(Subscription) }
            ])
        })

        $.RULE("SelectionSet", () => {
            $.CONSUME(LCurly)
            $.AT_LEAST_ONE(() => {
                $.SUBRULE($.Selection)
            })
            $.CONSUME(RCurly)
        })

        $.RULE("Selection", () => {
            $.OR([
                { ALT: () => $.SUBRULE($.Field) },
                { ALT: () => $.SUBRULE($.FragmentSpread) },
                { ALT: () => $.SUBRULE($.InlineFragment) }
            ])
        })

        $.RULE("Field", () => {
            $.OPTION(() => {
                $.SUBRULE($.Alias)
            })

            $.CONSUME(Name)

            $.OPTION2(() => {
                $.SUBRULE($.FieldArguments)
            })

            $.OPTION3(() => {
                $.SUBRULE($.Directives)
            })

            $.OPTION4(() => {
                $.SUBRULE($.SelectionSet)
            })
        })

        $.RULE("Alias", () => {
            $.CONSUME(Name)
        })

        $.RULE("arguments", () => {
            $.CONSUME(LCurly)
            $.AT_LEAST_ONE(() => {
                $.SUBRULE($.FieldArgument)
            })
            $.CONSUME(RCurly)
        })

        $.RULE("arguments_const", () => {
            $.CONSUME(LCurly)
            $.AT_LEAST_ONE(() => {
                $.SUBRULE($.FieldArgument)
            })
            $.CONSUME(RCurly)
        })

        $.RULE("argument", () => {
            $.CONSUME(Name)
            $.CONSUME(Colon)
            $.SUBRULE($.Value)
        })

        $.RULE("argument_const", () => {
            $.CONSUME(Name)
            $.CONSUME(Colon)
            $.SUBRULE($.Value_const)
        })

        $.RULE("FragmentSpread", () => {
            $.CONSUME(DotDotDot)
            $.SUBRULE($.FragmentName)
            $.OPTION(() => {
                $.SUBRULE($.Directives)
            })
        })

        $.RULE("InlineFragment", () => {
            $.CONSUME(DotDotDot)
            $.OPTION(() => {
                $.SUBRULE($.TypeCondition)
            })
            $.OPTION2(() => {
                $.SUBRULE($.Directives)
            })
            $.SUBRULE($.SelectionSet)
        })

        $.RULE("FragmentDefinition", () => {
            $.CONSUME(Fragment)
            $.SUBRULE($.FragmentName)
            $.SUBRULE($.TypeCondition)
            $.OPTION(() => {
                $.SUBRULE($.Directives)
            })
            $.SUBRULE($.SelectionSet)
        })

        $.RULE("FragmentName", () => {
            // TODO: "Name but not on"
            $.CONSUME(Name)
        })

        $.RULE("TypeCondition", () => {
            $.CONSUME(On)
            $.SUBRULE($.NamedType)
        })

        $.RULE("Value", () => {
            $.OR([
                { ALT: () => $.SUBRULE($.Variable) },
                { ALT: () => $.CONSUME(IntValue) },
                { ALT: () => $.CONSUME(FloatValue) },
                { ALT: () => $.CONSUME(StringValue) },
                { ALT: () => $.SUBRULE($.BooleanValue) },
                { ALT: () => $.SUBRULE($.NullValue) },
                { ALT: () => $.SUBRULE($.EnumValue) },
                { ALT: () => $.SUBRULE($.ListValue) },
                { ALT: () => $.SUBRULE($.ObjectValue) }

            ])
        })

        $.RULE("BooleanValue", () => {
            $.OR([
                { ALT: () => $.CONSUME(True) },
                { ALT: () => $.CONSUME(False) }
            ])
        })

        $.RULE("NullValue", () => {
            $.CONSUME(Null)
        })

        $.RULE("EnumValue", () => {
            // TODO: Name but not "true" or "false" or null
            $.CONSUME(name)
        })


        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        this.performSelfAnalysis()
    }
}
