import { Lexer, Parser } from "chevrotain"

// Using TypeScript we have both classes and static properties to define Tokens
class True {
    static PATTERN = /true/
}
class False {
    static PATTERN = /false/
}
class Null {
    static PATTERN = /null/
}
class LCurly {
    static PATTERN = /{/
}
class RCurly {
    static PATTERN = /}/
}
class LSquare {
    static PATTERN = /\[/
}
class RSquare {
    static PATTERN = /]/
}
class Comma {
    static PATTERN = /,/
}
class Colon {
    static PATTERN = /:/
}
class StringLiteral {
    static PATTERN = /"(:?[^\\"]|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
}
class NumberLiteral {
    static PATTERN = /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
}
class WhiteSpace {
    static PATTERN = /\s+/
    static GROUP = Lexer.SKIPPED
    static LINE_BREAKS = true
}

const allTokens = [
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
const JsonLexer = new Lexer(allTokens)

class JsonParserTypeScript extends Parser {
    constructor(input: Token[]) {
        super(input, allTokens)
        Parser.performSelfAnalysis(this)
    }

    // In TypeScript the parsing rules are explicitly defined as class instance properties
    // This allows for using access control (public/private/protected) and more importantly "informs" the TypeScript compiler
    // about the API of our Parser, so referencing an invalid rule name (this.SUBRULE(this.oopsType);)
    // is now a TypeScript compilation error.
    public json = this.RULE("json", () => {
        // prettier-ignore
        this.OR([
            // using ES6 Arrow functions to reduce verbosity.
            {ALT: () => { this.SUBRULE(this.object)}},
            {ALT: () => {this.SUBRULE(this.array)}}
        ])
    })

    // example for private access control
    private object = this.RULE("object", () => {
        this.CONSUME(LCurly)
        this.MANY_SEP({
            SEP: Comma,
            DEF: () => {
                this.SUBRULE2(this.objectItem)
            }
        })
        this.CONSUME(RCurly)
    })

    private objectItem = this.RULE("objectItem", () => {
        this.CONSUME(StringLiteral)
        this.CONSUME(Colon)
        this.SUBRULE(this.value)
    })

    private array = this.RULE("array", () => {
        this.CONSUME(LSquare)
        this.MANY_SEP({
            SEP: Comma,
            DEF: () => {
                this.SUBRULE(this.value)
            }
        })
        this.CONSUME(RSquare)
    })

    private value = this.RULE("value", () => {
        // prettier-ignore
        this.OR([
            { ALT: () => this.CONSUME(StringLiteral) },
            { ALT: () => this.CONSUME(NumberLiteral) },
            { ALT: () => this.SUBRULE(this.object) },
            { ALT: () => this.SUBRULE(this.array) },
            { ALT: () => this.CONSUME(True) },
            { ALT: () => this.CONSUME(False) },
            { ALT: () => this.CONSUME(Null) }
        ])
    })
}

// reuse the same parser instance.
const parser = new JsonParserTypeScript([])

export function parseJson(text) {
    let lexResult = JsonLexer.tokenize(text)
    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens
    // any top level rule may be used as an entry point
    let value = parser.json()

    // this would be a TypeScript compilation error because our parser now has a clear API.
    // let value = parser.json_OopsTypo()

    return {
        value: value, // this is a pure grammar, the value will always be <undefined>
        lexErrors: lexResult.errors,
        parseErrors: parser.errors
    }
}
