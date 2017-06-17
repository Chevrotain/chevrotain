"use strict"
var chevrotain = require("chevrotain")

// ----------------- lexer -----------------
var Token = chevrotain.Token
var Lexer = chevrotain.Lexer
var Parser = chevrotain.Parser

// Unfortunately no support for static class properties in ES2015, only in ES2016...
// so the PATTERN/GROUP static props are defined outside the class declarations.
// see: https://github.com/jeffmo/es-class-fields-and-static-properties
class True extends Token {}

True.PATTERN = /true/

class False extends Token {}
False.PATTERN = /false/

class Null extends Token {}
Null.PATTERN = /null/

class LCurly extends Token {}
LCurly.PATTERN = /{/

class RCurly extends Token {}
RCurly.PATTERN = /}/

class LSquare extends Token {}
LSquare.PATTERN = /\[/

class RSquare extends Token {}
RSquare.PATTERN = /]/

class Comma extends Token {}
Comma.PATTERN = /,/

class Colon extends Token {}
Colon.PATTERN = /:/

class StringLiteral extends Token {}
StringLiteral.PATTERN = /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/

class NumberLiteral extends Token {}
NumberLiteral.PATTERN = /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/

class WhiteSpace extends Token {}
WhiteSpace.PATTERN = /\s+/
WhiteSpace.GROUP = Lexer.SKIPPED // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.

var allTokens = [
    WhiteSpace,
    NumberLiteral,
    StringLiteral,
    LCurly,
    RCurly,
    LSquare,
    RSquare,
    Comma,
    Colon,
    True,
    False,
    Null
]
var JsonLexer = new Lexer(allTokens)

// ----------------- parser -----------------

class JsonParserES6 extends chevrotain.Parser {
    // Unfortunately no support for class fields with initializer in ES2015, only in ES2016...
    // so the parsing rules are defined inside the constructor, as each parsing rule must be initialized by
    // invoking RULE(...)
    // see: https://github.com/jeffmo/es-class-fields-and-static-properties
    constructor(input) {
        super(input, allTokens)

        // not mandatory, using $ (or any other sign) to reduce verbosity (this. this. this. this. .......)
        const $ = this

        $.RULE("json", () => {
            $.OR([
                {
                    ALT: () => {
                        $.SUBRULE($.object)
                    }
                },
                {
                    ALT: () => {
                        $.SUBRULE($.array)
                    }
                }
            ])
        })

        // the parsing methods
        $.RULE("object", () => {
            // using ES2015 Arrow functions to reduce verbosity.
            $.CONSUME(LCurly)
            $.OPTION(() => {
                $.SUBRULE($.objectItem)
                $.MANY(() => {
                    $.CONSUME(Comma)
                    $.SUBRULE2($.objectItem)
                })
            })
            $.CONSUME(RCurly)
        })

        $.RULE("objectItem", () => {
            $.CONSUME(StringLiteral)
            $.CONSUME(Colon)
            $.SUBRULE($.value)
        })

        $.RULE("array", () => {
            $.CONSUME(LSquare)
            $.OPTION(() => {
                $.SUBRULE($.value)
                $.MANY(() => {
                    $.CONSUME(Comma)
                    $.SUBRULE2($.value)
                })
            })
            $.CONSUME(RSquare)
        })

        $.RULE("value", () => {
            $.OR([
                {
                    ALT: () => {
                        $.CONSUME(StringLiteral)
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME(NumberLiteral)
                    }
                },
                {
                    ALT: () => {
                        $.SUBRULE($.object)
                    }
                },
                {
                    ALT: () => {
                        $.SUBRULE($.array)
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME(True)
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME(False)
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME(Null)
                    }
                }
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
const parser = new JsonParserES6([])

module.exports = function(text) {
    const lexResult = JsonLexer.tokenize(text)
    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens
    // any top level rule may be used as an entry point
    const value = parser.json()

    return {
        value: value, // this is a pure grammar, the value will always be <undefined>
        lexErrors: lexResult.errors,
        parseErrors: parser.errors
    }
}
