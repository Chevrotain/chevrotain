"use strict"
const chevrotain = require("chevrotain")
const { Parser, Lexer, createToken } = chevrotain
const XRegExp = require("xregexp")

// ----------------- lexer -----------------
// A little mini DSL for easier lexer definition using xRegExp.
const fragments = {}

function FRAGMENT(name, def) {
    fragments[name] = XRegExp.build(def, fragments)
}

function MAKE_PATTERN(def, flags) {
    return XRegExp.build(def, fragments, flags)
}

FRAGMENT(
    "NameStartChar",
    "([a-zA-Z]|\\u2070-\\u218F|\\u2C00-\\u2FEF|\\u3001-\\uD7FF|\\uF900-\\uFDCF|\\uFDF0-\\uFFFD)"
)
FRAGMENT(
    "NameChar",
    "{{NameStartChar}}|-|_|\\.|\\d|\\u00B7||[\\u0300-\\u036F]|[\\u203F-\\u2040]"
)
FRAGMENT("Name", "{{NameStartChar}}({{NameChar}})*")

// Unfortunately no support for static class properties in ES2015, only in esNext...
// so the PATTERN/GROUP static props are defined outside the class declarations.
// see: https://github.com/jeffmo/es-class-fields-and-static-properties
const Comment = createToken({ name: "Comment", pattern: /<!--.*?-->/ })
// A Comment may span multiple lines.
Comment.LINE_BREAKS = true

const CData = createToken({ name: "CData", pattern: /<!\[CDATA\[.*?]]>/ })

const DTD = createToken({
    name: "DTD",
    pattern: /<!.*?>/,
    group: Lexer.SKIPPED
})

const EntityRef = createToken({
    name: "EntityRef",
    pattern: MAKE_PATTERN("&{{Name}};")
})

const CharRef = createToken({
    name: "CharRef",
    pattern: /&#\d+;|&#x[a-fA-F0-9]/
})

const SEA_WS = createToken({
    name: "SEA_WS",
    pattern: /( |\t|\n|\r\n)+/,
    line_breaks: true
})

const XMLDeclOpen = createToken({
    name: "XMLDeclOpen",
    pattern: /<\?xml[ \t\r\n]/,
    push_mode: "INSIDE",
    line_breaks: true
})

const SLASH_OPEN = createToken({
    name: "SLASH_OPEN",
    pattern: /<\//,
    push_mode: "INSIDE"
})

const OPEN = createToken({ name: "OPEN", pattern: /</, push_mode: "INSIDE" })

const PROCESSING_INSTRUCTION = createToken({
    name: "PROCESSING_INSTRUCTION",
    pattern: MAKE_PATTERN("<\\?{{Name}}.*\\?>")
})

const TEXT = createToken({ name: "TEXT", pattern: /[^<&]+/, line_breaks: true })

const CLOSE = createToken({ name: "CLOSE", pattern: />/, pop_mode: true })

const SPECIAL_CLOSE = createToken({
    name: "SPECIAL_CLOSE",
    pattern: /\?>/,
    pop_mode: true
})

const SLASH_CLOSE = createToken({
    name: "SLASH_CLOSE",
    pattern: /\/>/,
    pop_mode: true
})

const SLASH = createToken({ name: "SLASH", pattern: /\// })

const STRING = createToken({
    name: "STRING",
    pattern: /"[^<"]*"|'[^<']*'/,
    line_breaks: true
})

const EQUALS = createToken({ name: "EQUALS", pattern: /=/ })

const Name = createToken({ name: "Name", pattern: MAKE_PATTERN("{{Name}}") })

const S = createToken({
    name: "S",
    pattern: /[ \t\r\n]/,
    group: Lexer.SKIPPED,
    line_breaks: true
})

const XmlLexerDefinition = {
    defaultMode: "OUTSIDE",

    modes: {
        // the default (initial) mode is "numbers_mode"
        OUTSIDE: [
            Comment,
            CData,
            DTD,
            EntityRef,
            CharRef,
            SEA_WS,
            XMLDeclOpen,
            SLASH_OPEN,
            OPEN,
            PROCESSING_INSTRUCTION,
            TEXT
        ],
        INSIDE: [
            CLOSE,
            SPECIAL_CLOSE,
            SLASH_CLOSE,
            SLASH,
            EQUALS,
            STRING,
            Name,
            S
        ]
    }
}

const XmlLexer = new Lexer(XmlLexerDefinition)
const allTokens = XmlLexerDefinition.modes.INSIDE.concat(
    XmlLexerDefinition.modes.OUTSIDE
)

// ----------------- parser -----------------
class XmlParser extends Parser {
    // Unfortunately no support for class fields with initializer in ES2015, only in ESNext...
    // so the parsing rules are defined inside the constructor, as each parsing rule must be initialized by
    // invoking RULE(...)
    // see: https://github.com/jeffmo/es-class-fields-and-static-properties
    constructor(input) {
        super(
            input,
            allTokens,
            // by default the error recovery / fault tolerance capabilities are disabled
            // use this flag to enable them
            { recoveryEnabled: true }
        )

        // not mandatory, using $ (or any other sign) to reduce verbosity (this. this. this. this. .......)
        const $ = this

        $.RULE("document", () => {
            $.OPTION(() => {
                $.SUBRULE($.prolog)
            })

            $.MANY(() => {
                $.SUBRULE($.misc)
            })

            $.SUBRULE($.element)

            $.MANY2(() => {
                $.SUBRULE2($.misc)
            })
        })

        $.RULE("prolog", () => {
            $.CONSUME(XMLDeclOpen)
            $.MANY2(() => {
                $.SUBRULE($.attribute)
            })
            $.CONSUME(SPECIAL_CLOSE)
        })

        $.RULE("content", () => {
            $.OPTION(() => {
                $.SUBRULE($.chardata)
            })

            $.MANY(() => {
                $.OR([
                    { ALT: () => $.SUBRULE($.element) },
                    { ALT: () => $.SUBRULE($.reference) },
                    { ALT: () => $.CONSUME(CData) },
                    { ALT: () => $.CONSUME(PROCESSING_INSTRUCTION) },
                    { ALT: () => $.CONSUME(Comment) }
                ])

                $.OPTION2(() => {
                    $.SUBRULE2($.chardata)
                })
            })
        })

        $.RULE("element", () => {
            $.CONSUME(OPEN)
            $.CONSUME(Name)
            $.MANY(() => {
                $.SUBRULE($.attribute)
            })

            $.OR([
                {
                    ALT: () => {
                        $.CONSUME(CLOSE)
                        $.SUBRULE($.content)
                        $.CONSUME(SLASH_OPEN)
                        $.CONSUME2(Name)
                        $.CONSUME2(CLOSE)
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME(SLASH_CLOSE)
                    }
                }
            ])
        })

        $.RULE("reference", () => {
            $.OR([
                { ALT: () => $.CONSUME(EntityRef) },
                { ALT: () => $.CONSUME(CharRef) }
            ])
        })

        $.RULE("attribute", () => {
            $.CONSUME(Name)
            $.CONSUME(EQUALS)
            $.CONSUME(STRING)
        })

        $.RULE("chardata", () => {
            $.OR([
                { ALT: () => $.CONSUME(TEXT) },
                { ALT: () => $.CONSUME(SEA_WS) }
            ])
        })

        $.RULE("misc", () => {
            $.OR([
                { ALT: () => $.CONSUME(Comment) },
                { ALT: () => $.CONSUME(PROCESSING_INSTRUCTION) },
                { ALT: () => $.CONSUME(SEA_WS) }
            ])
        })

        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this)
    }
}

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
const parser = new XmlParser([])

module.exports = function(text) {
    const lexResult = XmlLexer.tokenize(text)
    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens
    // any top level rule may be used as an entry point
    const value = parser.document()

    return {
        // This is a pure grammar, the value will be undefined until we add embedded actions
        // or enable automatic CST creation.
        value: value,
        lexErrors: lexResult.errors,
        parseErrors: parser.errors
    }
}
