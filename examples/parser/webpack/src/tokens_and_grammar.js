import { Token, Lexer, Parser } from "chevrotain"

// ----------------- lexer -----------------
// TODO: does babel support static properties?
// Unfortunately no support for static class properties in ES2015, only in ES2016...
// so the PATTERN/GROUP static props are defined outside the class declarations.
// see: https://github.com/jeffmo/es-class-fields-and-static-properties
class LSquare {}
LSquare.PATTERN = /\[/

class RSquare {}
RSquare.PATTERN = /]/

class Comma {}
Comma.PATTERN = /,/

class Integer {}
Integer.PATTERN = /\d+/

class WhiteSpace {}
WhiteSpace.PATTERN = /\s+/
WhiteSpace.GROUP = Lexer.SKIPPED // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.
WhiteSpace.LINE_BREAKS = true

export const allTokens = [WhiteSpace, LSquare, RSquare, Comma, Integer]
const ArrayLexer = new Lexer(allTokens)

// ----------------- parser -----------------
class ArrayParserCombined extends Parser {
    constructor(input) {
        super(input, allTokens)
        const $ = this

        $.RULE("array", () => {
            $.CONSUME(LSquare)
            $.OPTION(() => {
                $.CONSUME(Integer)
                $.MANY(() => {
                    $.CONSUME(Comma)
                    $.CONSUME2(Integer)
                })
            })
            $.CONSUME(RSquare)
        })

        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this)
    }
}

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
const parser = new ArrayParserCombined([])

export function parse(text) {
    const lexResult = ArrayLexer.tokenize(text)
    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens
    // any top level rule may be used as an entry point
    const value = parser.array()

    return {
        value: value, // this is a pure grammar, the value will always be <undefined>
        lexErrors: lexResult.errors,
        parseErrors: parser.errors
    }
}
