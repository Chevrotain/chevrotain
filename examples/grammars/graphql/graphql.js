/**
 * GraphQL grammar based on the specifications
 * http://facebook.github.io/graphql/June2018/#sec-Appendix-Grammar-Summary.Document
 *
 * The implementations follows the specs as directly as possible.
 * This means:
 * - Same rule names.
 * - Same Token names.
 *
 * Some things had to be refactored, for example to be an LL(K) grammar.
 * Or to extract repeating code in a rule.
 * But the refactored code is equivalent.
 */
// wrapping in UMD to allow code to work both in node.js
// and in the browser
;(function(root, factory) {
    if (typeof module === "object" && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require("chevrotain"), require("xregexp"))
    } else {
        // Browser globals (root is window)
        root["graphQlGrammar"] = factory(root.chevrotain, root.XRegExp)
    }
})(this, function(chevrotain, XRegExp) {
    const { Parser, Lexer, createToken: orgCreateToken } = chevrotain

    // ----------------- lexer -----------------
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

    const keywordTokens = []
    const createKeywordToken = function(config) {
        config.longer_alt = Name
        const newToken = createToken(config)
        keywordTokens.push(newToken)
        newToken.CATEGORIES.push(Keyword)
        return newToken
    }

    const createNotToken = function(config) {
        const newNotTokenCategory = orgCreateToken({
            name: config.name,
            pattern: Lexer.NA
        })
        const notMatch = config.not
        const matchingKeywords = keywordTokens.filter(keywordTokType => {
            let found = false
            notMatch.forEach(notTokType => {
                if (notTokType === keywordTokType) {
                    found = true
                }
            })
            return found
        })

        // All matching keywords now match the category of the NOT token.
        matchingKeywords.forEach(keywordTokType =>
            keywordTokType.CATEGORIES.push(newNotTokenCategory)
        )

        // Name always matches the Not token
        Name.CATEGORIES.push(newNotTokenCategory)

        allTokens.push(newNotTokenCategory)
        return newNotTokenCategory
    }

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
        pattern: /#[^\n\r]*/,
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
    const VerticalLine = createToken({ name: "VerticalLine", pattern: "|" })
    const RCurly = createToken({ name: "RCurly", pattern: "}" })

    // keywords and Name
    // Name must not be placed into the TokenTypeList before any keywords
    // as it can match any keyword, so we use "orgCreateToken"
    const Name = orgCreateToken({
        name: "Name",
        pattern: /[_A-Za-z][_0-9A-Za-z]*/
    })
    const Keyword = createToken({ name: "Keyword", pattern: Lexer.NA })
    const Query = createKeywordToken({ name: "Query", pattern: "query" })
    const Mutation = createKeywordToken({
        name: "Mutation",
        pattern: "mutation"
    })
    const Subscription = createKeywordToken({
        name: "Subscription",
        pattern: "Subscription"
    })
    const Fragment = createKeywordToken({
        name: "Fragment",
        pattern: "fragment"
    })
    const On = createKeywordToken({ name: "On", pattern: "on" })
    const True = createKeywordToken({ name: "True", pattern: "true" })
    const False = createKeywordToken({ name: "False", pattern: "false" })
    const Null = createKeywordToken({ name: "Null", pattern: "null" })
    const Schema = createKeywordToken({ name: "Schema", pattern: "schema" })
    const Extend = createKeywordToken({ name: "Extend", pattern: "extend" })
    const Scalar = createKeywordToken({ name: "Scalar", pattern: "scalar" })
    const Implements = createKeywordToken({
        name: "Implements",
        pattern: "implements"
    })
    const Interface = createKeywordToken({
        name: "Interface",
        pattern: "interface"
    })
    const Union = createKeywordToken({ name: "Union", pattern: "Union" })
    const Enum = createKeywordToken({ name: "Enum", pattern: "enum" })
    const Input = createKeywordToken({ name: "Input", pattern: "Input" })
    const DirectiveTok = createKeywordToken({
        name: "DirectiveTok",
        pattern: "directive"
    })
    const TypeTok = createKeywordToken({ name: "TypeTok", pattern: "type" })

    // TODO: are these really tokens/keywords?
    // they are used in "ExecutableDirectiveLocation" and "TypeSystemDirectiveLocation" rules
    // Why are they upper case?
    // Why are they with the names of parsing rules
    const QUERY = createKeywordToken({ name: "QUERY", pattern: "QUERY" })
    const MUTATION = createKeywordToken({
        name: "MUTATION",
        pattern: "MUTATION"
    })
    const SUBSCRIPTION = createKeywordToken({
        name: "SUBSCRIPTION",
        pattern: "SUBSCRIPTION"
    })
    const FIELD = createKeywordToken({ name: "FIELD", pattern: "FIELD" })
    const FRAGMENT_DEFINITION = createKeywordToken({
        name: "FRAGMENT_DEFINITION",
        pattern: "FRAGMENT_DEFINITION"
    })
    const FRAGMENT_SPREAD = createKeywordToken({
        name: "FRAGMENT_SPREAD",
        pattern: "FRAGMENT_SPREAD"
    })
    const INLINE_FRAGMENT = createKeywordToken({
        name: "INLINE_FRAGMENT",
        pattern: "INLINE_FRAGMENT"
    })
    const SCHEMA = createKeywordToken({ name: "SCHEMA", pattern: "SCHEMA" })
    const SCALAR = createKeywordToken({ name: "SCALAR", pattern: "SCALAR" })
    const OBJECT = createKeywordToken({ name: "OBJECT", pattern: "OBJECT" })
    const FIELD_DEFINITION = createKeywordToken({
        name: "FIELD_DEFINITION",
        pattern: "FIELD_DEFINITION"
    })
    const ARGUMENT_DEFINITION = createKeywordToken({
        name: "ARGUMENT_DEFINITION",
        pattern: "ARGUMENT_DEFINITION"
    })
    const INTERFACE = createKeywordToken({
        name: "INTERFACE",
        pattern: "INTERFACE"
    })
    const UNION = createKeywordToken({ name: "UNION", pattern: "UNION" })
    const ENUM = createKeywordToken({ name: "ENUM", pattern: "ENUM" })
    const ENUM_VALUE = createKeywordToken({
        name: "ENUM_VALUE",
        pattern: "ENUM_VALUE"
    })
    const INPUT_OBJECT = createKeywordToken({
        name: "INPUT_OBJECT",
        pattern: "INPUT_OBJECT"
    })
    const INPUT_FIELD_DEFINITION = createKeywordToken({
        name: "INPUT_FIELD_DEFINITION",
        pattern: "INPUT_FIELD_DEFINITION"
    })
    const NameButNotOn = createNotToken({
        name: "NameButNotOn",
        not: [On]
    })
    const NameButNotTrueOrFalseOrNull = createNotToken({
        name: "NameButNotTrueOrFalseOrNull",
        not: [True, False, Null]
    })

    // We manually add the general Identifier (Name) AFTER all the keyword token types.
    allTokens.push(Name)

    FRAGMENT("IntegerPart", "-?(0|[1-9][0-9]*)")
    FRAGMENT("FractionalPart", "\\.[0-9]+")
    FRAGMENT("ExponentPart", "[eE][+-]?[0-9]+")
    const IntValue = createToken({
        name: "IntValue",
        pattern: MAKE_PATTERN("{{IntegerPart}}")
    })
    const FloatValue = createToken({
        name: "FloatValue",
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
    FRAGMENT("BlockStringCharacter", '\\\\"""|[^"]|"(?!"")')
    const StringValue = createToken({
        name: "StringValue",
        pattern: MAKE_PATTERN(
            '"""(?:{{BlockStringCharacter}})*"""|"(?:{{StringCharacter}})*"'
        )
    })

    const GraphQLLexer = new Lexer(allTokens)

    class GraphQLParser extends Parser {
        // Unfortunately no support for class fields with initializer in ES2015, only in esNext...
        // so the parsing rules are defined inside the constructor, as each parsing rule must be initialized by
        // invoking RULE(...)
        // see: https://github.com/jeffmo/es-class-fields-and-static-properties
        constructor(input) {
            super(input, allTokens, {
                outputCst: true
            })

            // not mandatory, using $ (or any other sign) to reduce verbosity (this. this. this. this. .......)
            const $ = this

            // the parsing methods
            $.RULE("Document", () => {
                $.MANY(() => {
                    $.SUBRULE($.Definition)
                })
            })

            $.RULE("Definition", () => {
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

                            $.SUBRULE2($.SelectionSet)
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
                    $.SUBRULE($.Arguments, { ARGS: [false] })
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
                $.CONSUME(Colon)
            })

            $.RULE("Arguments", isConst => {
                $.CONSUME(LParen)
                $.AT_LEAST_ONE(() => {
                    $.SUBRULE($.Argument, { ARGS: [isConst] })
                })
                $.CONSUME(RParen)
            })

            $.RULE("Argument", isConst => {
                $.CONSUME(Name)
                $.CONSUME(Colon)
                $.SUBRULE($.Value, { ARGS: [isConst] })
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
                $.CONSUME(NameButNotOn)
            })

            $.RULE("TypeCondition", () => {
                $.CONSUME(On)
                $.SUBRULE($.NamedType)
            })

            $.RULE("Value", isConst => {
                $.OR([
                    { GATE: () => !isConst, ALT: () => $.SUBRULE($.Variable) },
                    { ALT: () => $.CONSUME(IntValue) },
                    { ALT: () => $.CONSUME(FloatValue) },
                    { ALT: () => $.CONSUME(StringValue) },
                    { ALT: () => $.SUBRULE($.BooleanValue) },
                    { ALT: () => $.SUBRULE($.NullValue) },
                    { ALT: () => $.SUBRULE($.EnumValue) },
                    { ALT: () => $.SUBRULE($.ListValue, { ARGS: [isConst] }) },
                    { ALT: () => $.SUBRULE($.ObjectValue, { ARGS: [isConst] }) }
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
                $.CONSUME(NameButNotTrueOrFalseOrNull)
            })

            $.RULE("ListValue", isConst => {
                $.CONSUME(LSquare)
                $.MANY(() => {
                    $.SUBRULE($.Value, { ARGS: [isConst] })
                })
                $.CONSUME(RSquare)
            })

            $.RULE("ObjectValue", isConst => {
                $.CONSUME(LCurly)
                $.MANY(() => {
                    $.SUBRULE($.ObjectField, { ARGS: [isConst] })
                })
                $.CONSUME(RCurly)
            })

            $.RULE("ObjectField", isConst => {
                $.CONSUME(Name)
                $.CONSUME(Colon)
                $.SUBRULE($.Value, { ARGS: [isConst] })
            })

            $.RULE("VariableDefinitions", () => {
                $.CONSUME(LParen)
                $.AT_LEAST_ONE(() => {
                    $.SUBRULE($.VariableDefinition)
                })
                $.CONSUME(RParen)
            })

            $.RULE("VariableDefinition", () => {
                $.CONSUME(Name)
                $.CONSUME(Colon)
                $.SUBRULE($.Type)
                $.OPTION(() => {
                    $.SUBRULE($.DefaultValue)
                })
            })

            $.RULE("Variable", () => {
                $.CONSUME(Dollar)
                $.CONSUME(Name)
            })

            $.RULE("DefaultValue", () => {
                $.CONSUME(Equals)
                $.SUBRULE($.Value, { ARGS: [true] })
            })

            $.RULE("Type", () => {
                $.OR([
                    { ALT: () => $.SUBRULE($.NamedType) },
                    { ALT: () => $.SUBRULE($.ListType) }
                ])

                // NonNullType rule refactored inside the TypeRule
                // as Its not written in LL(K) form.
                $.OPTION(() => {
                    $.CONSUME(Exclamation)
                })
            })

            $.RULE("NamedType", () => {
                $.CONSUME(Name)
            })

            $.RULE("ListType", () => {
                $.CONSUME(LSquare)
                $.AT_LEAST_ONE(() => {
                    $.SUBRULE($.Type)
                })
                $.CONSUME(RSquare)
            })

            $.RULE("Directives", isConst => {
                $.AT_LEAST_ONE(() => {
                    $.SUBRULE($.Directive, { ARGS: [isConst] })
                })
            })

            $.RULE("Directive", isConst => {
                $.CONSUME(At)
                $.CONSUME(Name)
                $.SUBRULE($.Arguments, { ARGS: [isConst] })
            })

            $.RULE("TypeSystemDefinition", () => {
                $.OR([
                    { ALT: () => $.SUBRULE($.SchemaDefinition) },
                    { ALT: () => $.SUBRULE($.TypeDefinition) },
                    { ALT: () => $.SUBRULE($.DirectiveDefinition) }
                ])
            })

            $.RULE("TypeSystemExtension", () => {
                $.OR([
                    { ALT: () => $.SUBRULE($.SchemaExtension) },
                    { ALT: () => $.SUBRULE($.TypeExtension) }
                ])
            })

            $.RULE("SchemaDefinition", () => {
                $.CONSUME(Schema)
                $.OPTION(() => {
                    $.SUBRULE($.Directives, { ARGS: [true] })
                })
                $.CONSUME(LCurly)
                $.AT_LEAST_ONE(() => {
                    $.SUBRULE($.OperationTypeDefinition)
                })
                $.CONSUME(RCurly)
            })

            $.RULE("SchemaExtension", () => {
                $.CONSUME(Extend)
                $.CONSUME(Schema)

                // Refactored the grammar to be LL(K)
                $.OR([
                    {
                        ALT: () => {
                            $.SUBRULE($.Directives, { ARGS: [true] })
                            $.OPTION(() => {
                                $.SUBRULE($.OperationTypeDefinitionList)
                            })
                        }
                    },
                    {
                        ALT: () => {
                            $.SUBRULE2($.OperationTypeDefinitionList)
                        }
                    }
                ])
            })

            // This rule does not appear in the original spec, its a factoring out
            // of a the common suffix for "SchemaExtension"
            $.RULE("OperationTypeDefinitionList", () => {
                $.CONSUME(LCurly)
                $.AT_LEAST_ONE(() => {
                    $.SUBRULE($.OperationTypeDefinition)
                })
                $.CONSUME(RCurly)
            })

            $.RULE("OperationTypeDefinition", () => {
                $.SUBRULE($.OperationType)
                $.CONSUME(Colon)
                $.SUBRULE($.NamedType)
            })

            $.RULE("Description", () => {
                $.CONSUME(StringValue)
            })

            $.RULE("TypeDefinition", () => {
                $.OR([
                    { ALT: () => $.SUBRULE($.ScalarTypeDefinition) },
                    { ALT: () => $.SUBRULE($.ObjectTypeDefinition) },
                    { ALT: () => $.SUBRULE($.InterfaceTypeDefinition) },
                    { ALT: () => $.SUBRULE($.UnionTypeDefinition) },
                    { ALT: () => $.SUBRULE($.EnumTypeDefinition) },
                    { ALT: () => $.SUBRULE($.InputObjectTypeDefinition) }
                ])
            })

            $.RULE("TypeExtension", () => {
                $.OR([
                    { ALT: () => $.SUBRULE($.ScalarTypeExtension) },
                    { ALT: () => $.SUBRULE($.ObjectTypeExtension) },
                    { ALT: () => $.SUBRULE($.InterfaceTypeExtension) },
                    { ALT: () => $.SUBRULE($.UnionTypeExtension) },
                    { ALT: () => $.SUBRULE($.EnumTypeExtension) },
                    { ALT: () => $.SUBRULE($.InputObjectTypeExtension) }
                ])
            })

            $.RULE("ScalarTypeDefinition", () => {
                $.OPTION(() => {
                    $.SUBRULE($.Description)
                })
                $.CONSUME(Scalar)
                $.CONSUME(Name)
                $.OPTION2(() => {
                    $.SUBRULE($.Directives, { ARGS: [true] })
                })
            })

            $.RULE("ScalarTypeExtension", () => {
                $.CONSUME(Extend)
                $.CONSUME(Scalar)
                $.CONSUME(Name)
                $.SUBRULE($.Directives, { ARGS: [true] })
            })

            $.RULE("ObjectTypeDefinition", () => {
                $.OPTION(() => {
                    $.SUBRULE($.Description)
                })
                $.CONSUME(TypeTok)
                $.CONSUME(Name)
                $.OPTION2(() => {
                    $.SUBRULE($.ImplementsInterfaces)
                })
                $.OPTION3(() => {
                    $.SUBRULE($.Directives, { ARGS: [true] })
                })
                $.OPTION4(() => {
                    $.SUBRULE($.FieldsDefinition)
                })
            })

            $.RULE("ObjectTypeExtension", () => {
                $.CONSUME(Extend)
                $.CONSUME(TypeTok)
                $.CONSUME(Name)

                // refactored the spec grammar be LL(K)
                $.OR([
                    {
                        ALT: () => {
                            $.SUBRULE($.ImplementsInterfaces)
                            $.OPTION(() => {
                                $.SUBRULE($.Directives, { ARGS: [true] })
                            })
                            $.OPTION2(() => {
                                $.SUBRULE($.FieldsDefinition)
                            })
                        }
                    },
                    {
                        ALT: () => {
                            $.SUBRULE2($.Directives, { ARGS: [true] })
                            $.OPTION3(() => {
                                $.SUBRULE2($.FieldsDefinition)
                            })
                        }
                    },
                    {
                        ALT: () => {
                            $.SUBRULE3($.FieldsDefinition)
                        }
                    }
                ])
            })

            $.RULE("ImplementsInterfaces", () => {
                $.CONSUME(Implements)
                $.OPTION(() => {
                    $.CONSUME(At)
                })
                $.SUBRULE($.NamedType)
                $.MANY(() => {
                    $.CONSUME2(At)
                    $.SUBRULE2($.NamedType)
                })
            })

            $.RULE("FieldsDefinition", () => {
                $.CONSUME(LCurly)
                $.AT_LEAST_ONE(() => {
                    $.SUBRULE($.FieldDefinition)
                })
                $.CONSUME(RCurly)
            })

            $.RULE("FieldDefinition", () => {
                $.OPTION(() => {
                    $.SUBRULE($.Description)
                })
                $.CONSUME(Name)
                $.OPTION2(() => {
                    $.SUBRULE($.ArgumentsDefinition)
                })
                $.CONSUME(Colon)
                $.SUBRULE($.Type)
                $.OPTION3(() => {
                    $.SUBRULE($.Directives, { ARGS: [true] })
                })
            })

            $.RULE("ArgumentsDefinition", () => {
                $.CONSUME(LParen)
                $.AT_LEAST_ONE(() => {
                    $.SUBRULE($.InputValueDefinition)
                })
                $.CONSUME(RParen)
            })

            $.RULE("InputValueDefinition", () => {
                $.OPTION(() => {
                    $.SUBRULE($.Description)
                })
                $.CONSUME(Name)
                $.CONSUME(Colon)
                $.SUBRULE($.Type)
                $.OPTION2(() => {
                    $.SUBRULE($.DefaultValue)
                })
                $.OPTION3(() => {
                    $.SUBRULE($.Directives, { ARGS: [true] })
                })
            })

            $.RULE("InterfaceTypeDefinition", () => {
                $.OPTION(() => {
                    $.SUBRULE($.Description)
                })
                $.CONSUME(Interface)
                $.CONSUME(Name)
                $.OPTION2(() => {
                    $.SUBRULE($.Directives, { ARGS: [true] })
                })
                $.OPTION3(() => {
                    $.SUBRULE($.FieldsDefinition)
                })
            })

            $.RULE("InterfaceTypeExtension", () => {
                $.CONSUME(Extend)
                $.CONSUME(Interface)
                $.CONSUME(Name)

                // Refactored the grammar to be LL(K)
                $.OR([
                    {
                        ALT: () => {
                            $.SUBRULE($.Directives, { ARGS: [true] })
                            $.OPTION(() => {
                                $.SUBRULE($.FieldsDefinition)
                            })
                        }
                    },
                    {
                        ALT: () => {
                            $.SUBRULE2($.FieldsDefinition)
                        }
                    }
                ])
            })

            $.RULE("UnionTypeDefinition", () => {
                $.OPTION(() => {
                    $.SUBRULE($.Description)
                })
                $.CONSUME(Union)
                $.CONSUME(Name)
                $.OPTION2(() => {
                    $.SUBRULE($.Directives, { ARGS: [true] })
                })
                $.OPTION3(() => {
                    $.SUBRULE($.UnionMemberTypes)
                })
            })

            $.RULE("UnionMemberTypes", () => {
                $.CONSUME(Equals)

                $.OPTION(() => {
                    $.CONSUME(VerticalLine)
                })
                $.SUBRULE($.NamedType)

                $.MANY(() => {
                    $.CONSUME2(VerticalLine)
                    $.SUBRULE2($.NamedType)
                })
            })

            $.RULE("UnionTypeExtension", () => {
                $.CONSUME(Extend)
                $.CONSUME(Union)
                $.CONSUME(Name)

                // Refactored the grammar to be LL(K)
                $.OR([
                    {
                        ALT: () => {
                            $.SUBRULE($.Directives, { ARGS: [true] })
                            $.OPTION(() => {
                                $.SUBRULE($.UnionMemberTypes)
                            })
                        }
                    },
                    {
                        ALT: () => {
                            $.SUBRULE2($.UnionMemberTypes)
                        }
                    }
                ])
            })

            $.RULE("EnumTypeDefinition", () => {
                $.OPTION(() => {
                    $.SUBRULE($.Description)
                })
                $.CONSUME(Enum)
                $.CONSUME(Name)
                $.OPTION2(() => {
                    $.SUBRULE($.Directives, { ARGS: [true] })
                })
                $.OPTION3(() => {
                    $.SUBRULE($.EnumValuesDefinition)
                })
            })

            $.RULE("EnumValuesDefinition", () => {
                $.CONSUME(LCurly)
                $.AT_LEAST_ONE(() => {
                    $.SUBRULE($.EnumValueDefinition)
                })
                $.CONSUME(RCurly)
            })

            $.RULE("EnumValueDefinition", () => {
                $.OPTION(() => {
                    $.SUBRULE($.Description)
                })
                $.SUBRULE($.EnumValue)
                $.OPTION2(() => {
                    $.SUBRULE($.Directives, { ARGS: [true] })
                })
            })

            $.RULE("EnumTypeExtension", () => {
                $.CONSUME(Extend)
                $.CONSUME(Enum)
                $.CONSUME(Name)

                // Refactored the grammar to be LL(K)
                $.OR([
                    {
                        ALT: () => {
                            $.SUBRULE($.Directives, { ARGS: [true] })
                            $.OPTION(() => {
                                $.SUBRULE($.EnumValuesDefinition)
                            })
                        }
                    },
                    {
                        ALT: () => {
                            $.SUBRULE2($.EnumValuesDefinition)
                        }
                    }
                ])
            })

            $.RULE("InputObjectTypeDefinition", () => {
                $.OPTION(() => {
                    $.SUBRULE($.Description)
                })

                $.CONSUME(Input)
                $.CONSUME(Name)

                $.OPTION2(() => {
                    $.SUBRULE($.Directives, { ARGS: [true] })
                })

                $.OPTION3(() => {
                    $.SUBRULE($.InputFieldsDefinition)
                })
            })

            $.RULE("InputFieldsDefinition", () => {
                $.CONSUME(LCurly)
                $.AT_LEAST_ONE(() => {
                    $.SUBRULE($.InputValueDefinition)
                })
                $.CONSUME(RCurly)
            })

            $.RULE("InputObjectTypeExtension", () => {
                $.CONSUME(Extend)
                $.CONSUME(Input)
                $.CONSUME(Name)

                // Refactored the grammar to be LL(K)
                $.OR([
                    {
                        ALT: () => {
                            $.SUBRULE($.Directives, { ARGS: [true] })
                            $.OPTION(() => {
                                $.SUBRULE($.EnumValuesDefinition)
                            })
                        }
                    },
                    {
                        ALT: () => {
                            $.SUBRULE2($.InputFieldsDefinition)
                        }
                    }
                ])
            })

            $.RULE("DirectiveDefinition", () => {
                $.OPTION(() => {
                    $.SUBRULE($.Description)
                })
                $.CONSUME(DirectiveTok)
                $.CONSUME(At)
                $.CONSUME(Name)
                $.OPTION2(() => {
                    $.SUBRULE($.ArgumentsDefinition)
                })
                $.CONSUME(On)

                $.OPTION3(() => {
                    $.SUBRULE($.DirectiveLocations)
                })
            })

            $.RULE("DirectiveLocations", () => {
                $.OPTION(() => {
                    $.CONSUME(VerticalLine)
                })
                $.SUBRULE($.DirectiveLocation)

                $.MANY(() => {
                    $.CONSUME2(VerticalLine)
                    $.SUBRULE2($.DirectiveLocation)
                })
            })

            $.RULE("DirectiveLocation", () => {
                $.OR([
                    { ALT: () => $.SUBRULE($.ExecutableDirectiveLocation) },
                    { ALT: () => $.SUBRULE($.TypeSystemDirectiveLocation) }
                ])
            })

            $.RULE("ExecutableDirectiveLocation", () => {
                $.OR([
                    { ALT: () => $.CONSUME(QUERY) },
                    { ALT: () => $.CONSUME(MUTATION) },
                    { ALT: () => $.CONSUME(SUBSCRIPTION) },
                    { ALT: () => $.CONSUME(FIELD) },
                    { ALT: () => $.CONSUME(FRAGMENT_DEFINITION) },
                    { ALT: () => $.CONSUME(FRAGMENT_SPREAD) },
                    { ALT: () => $.CONSUME(INLINE_FRAGMENT) }
                ])
            })

            $.RULE("TypeSystemDirectiveLocation", () => {
                $.OR([
                    { ALT: () => $.CONSUME(SCHEMA) },
                    { ALT: () => $.CONSUME(SCALAR) },
                    { ALT: () => $.CONSUME(OBJECT) },
                    { ALT: () => $.CONSUME(FIELD_DEFINITION) },
                    { ALT: () => $.CONSUME(ARGUMENT_DEFINITION) },
                    { ALT: () => $.CONSUME(INTERFACE) },
                    { ALT: () => $.CONSUME(UNION) },
                    { ALT: () => $.CONSUME(ENUM) },
                    { ALT: () => $.CONSUME(ENUM_VALUE) },
                    { ALT: () => $.CONSUME(INPUT_OBJECT) },
                    { ALT: () => $.CONSUME(INPUT_FIELD_DEFINITION) }
                ])
            })

            // very important to call this after all the rules have been defined.
            // otherwise the parser may not work correctly as it will lack information
            // derived during the self analysis phase.
            this.performSelfAnalysis()
        }
    }

    const parser = new GraphQLParser([])

    return {
        GraphQLToken: allTokens,

        GraphQLParser: GraphQLParser,

        parse: function parse(text) {
            const lexResult = GraphQLLexer.tokenize(text)
            // setting a new input will RESET the parser instance's state.
            parser.input = lexResult.tokens
            // any top level rule may be used as an entry point
            const cst = parser.Document()

            return {
                value: cst,
                lexErrors: lexResult.errors,
                parseErrors: parser.errors
            }
        }
    }
})
