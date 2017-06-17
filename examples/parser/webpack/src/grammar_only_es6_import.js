// Using ES6 style imports, this means Webpack 2 can perform tree shaking
import { Parser } from "chevrotain"
import {
    ArrayLexer,
    allTokens,
    Integer,
    Comma,
    LSquare,
    RSquare
} from "./tokens_only"

class ArrayParserES6 extends Parser {
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

        Parser.performSelfAnalysis(this)
    }
}

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
const parser = new ArrayParserES6([])

export function parse(text) {
    const lexResult = ArrayLexer.tokenize(text)
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
