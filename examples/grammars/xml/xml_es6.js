"use strict"
var chevrotain = require("chevrotain")
var XRegExp = require("xregexp")

// ----------------- lexer -----------------
var Token = chevrotain.Token
var Lexer = chevrotain.Lexer
var Parser = chevrotain.Parser

// A little mini DSL for easier lexer definition using xRegExp.
var fragments = {}

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

// Unfortunately no support for static class properties in ES2015, only in ES2016...
// so the PATTERN/GROUP static props are defined outside the class declarations.
// see: https://github.com/jeffmo/es-class-fields-and-static-properties
class Comment {}
Comment.PATTERN = /<!--.*?-->/
// A Comment may span multiple lines.
Comment.LINE_BREAKS = true

class CData {}
CData.PATTERN = /<!\[CDATA\[.*?]]>/

class DTD {}
DTD.PATTERN = /<!.*?>/
DTD.GROUP = Lexer.SKIPPED

class EntityRef {}
EntityRef.PATTERN = MAKE_PATTERN("&{{Name}};")

class CharRef {}
CharRef.PATTERN = /&#\d+;|&#x[a-fA-F0-9]/

class SEA_WS {}
SEA_WS.PATTERN = /( |\t|\n|\r\n)+/
SEA_WS.LINE_BREAKS = true

class XMLDeclOpen {}
XMLDeclOpen.PATTERN = /<\?xml[ \t\r\n]/
XMLDeclOpen.PUSH_MODE = "INSIDE"
XMLDeclOpen.LINE_BREAKS = true

class SLASH_OPEN {}
SLASH_OPEN.PATTERN = /<\//
SLASH_OPEN.PUSH_MODE = "INSIDE"

class OPEN {}
OPEN.PATTERN = /</
OPEN.PUSH_MODE = "INSIDE"

class PROCESSING_INSTRUCTION {}
PROCESSING_INSTRUCTION.PATTERN = MAKE_PATTERN("<\\?{{Name}}.*\\?>")

class TEXT {}
TEXT.PATTERN = /[^<&]+/
TEXT.LINE_BREAKS = true

class CLOSE {}
CLOSE.PATTERN = />/
CLOSE.POP_MODE = true

class SPECIAL_CLOSE {}
SPECIAL_CLOSE.PATTERN = /\?>/
SPECIAL_CLOSE.POP_MODE = true

class SLASH_CLOSE {}
SLASH_CLOSE.PATTERN = /\/>/
SLASH_CLOSE.POP_MODE = true

class SLASH {}
SLASH.PATTERN = /\//

class STRING {}
STRING.PATTERN = /"[^<"]*"|'[^<']*'/
STRING.LINE_BREAKS = true

class EQUALS {}
EQUALS.PATTERN = /=/

class Name {}
Name.PATTERN = MAKE_PATTERN("{{Name}}")

class S {}
S.PATTERN = /[ \t\r\n]/
S.GROUP = Lexer.SKIPPED
S.LINE_BREAKS = true

var XmlLexerDefinition = {
    defaultMode: "OUTSIDE",

    modes: {
        // the default (inital) mode is "numbers_mode"
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

var XmlLexer = new Lexer(XmlLexerDefinition)
var allTokens = XmlLexerDefinition.modes.INSIDE.concat(
    XmlLexerDefinition.modes.OUTSIDE
)

// ----------------- parser -----------------
class XmlParserES6 extends chevrotain.Parser {
    // Unfortunately no support for class fields with initializer in ES2015, only in ES2016...
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
        var $ = this

        $.document = $.RULE("document", () => {
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

        $.prolog = $.RULE("prolog", () => {
            $.CONSUME(XMLDeclOpen)
            $.MANY2(() => {
                $.SUBRULE($.attribute)
            })
            $.CONSUME(SPECIAL_CLOSE)
        })

        $.content = $.RULE("content", () => {
            $.OPTION(() => {
                $.SUBRULE($.chardata)
            })

            $.MANY(() => {
                // prettier-ignore
                $.OR([
                    {ALT: () => {$.SUBRULE($.element)}},
                    {ALT: () => {$.SUBRULE($.reference)}},
                    {ALT: () => {$.CONSUME(CData)}},
                    {ALT: () => {$.CONSUME(PROCESSING_INSTRUCTION)}},
                    {ALT: () => {$.CONSUME(Comment)}}
                ])

                $.OPTION2(() => {
                    $.SUBRULE2($.chardata)
                })
            })
        })

        $.element = $.RULE("element", () => {
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

        $.reference = $.RULE("reference", () => {
            // prettier-ignore
            $.OR([
                {ALT: () => {$.CONSUME(EntityRef)}},
                {ALT: () => {$.CONSUME(CharRef)}}
            ])
        })

        $.attribute = $.RULE("attribute", () => {
            $.CONSUME(Name)
            $.CONSUME(EQUALS)
            $.CONSUME(STRING)
        })

        $.chardata = $.RULE("chardata", () => {
            // prettier-ignore
            $.OR([
                {ALT: () => {$.CONSUME(TEXT)}},
                {ALT: () => {$.CONSUME(SEA_WS)}}
            ])
        })

        $.misc = $.RULE("misc", () => {
            // prettier-ignore
            $.OR([
                {ALT: () => {$.CONSUME(Comment)}},
                {ALT: () => {$.CONSUME(PROCESSING_INSTRUCTION)}},
                {ALT: () => {$.CONSUME(SEA_WS)}}
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
var parser = new XmlParserES6([])

module.exports = function(text) {
    var lexResult = XmlLexer.tokenize(text)
    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens
    // any top level rule may be used as an entry point
    var value = parser.document()

    return {
        value: value, // this is a pure grammar, the value will always be <undefined>
        lexErrors: lexResult.errors,
        parseErrors: parser.errors
    }
}
