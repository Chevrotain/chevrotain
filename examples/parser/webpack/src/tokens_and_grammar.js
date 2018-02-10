import { Token, Lexer, Parser, createToken } from "chevrotain"

// ----------------- lexer -----------------
const LSquare = createToken({ name: "LSquare", pattern: /\[/ })
const RSquare = createToken({ name: "RSquare", pattern: /]/ })
const Comma = createToken({ name: "Comma", pattern: /,/ })
const Integer = createToken({ name: "Integer", pattern: /\d+/ })
const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: Lexer.SKIPPED,
    line_breaks: true
})

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
        value: value,
        lexErrors: lexResult.errors,
        parseErrors: parser.errors
    }
}
