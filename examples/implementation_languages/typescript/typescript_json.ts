//
import {
    createToken,
    Lexer,
    Parser,
    IToken,
    ILexingError,
    IRecognitionException
} from "chevrotain"

const True = createToken({ name: "True", pattern: /true/ })
const False = createToken({ name: "False", pattern: /false/ })
const Null = createToken({ name: "Null", pattern: /null/ })
const LCurly = createToken({ name: "LCurly", pattern: /{/ })
const RCurly = createToken({ name: "RCurly", pattern: /}/ })
const LSquare = createToken({ name: "LSquare", pattern: /\[/ })
const RSquare = createToken({ name: "RSquare", pattern: /]/ })
const Comma = createToken({ name: "Comma", pattern: /,/ })
const Colon = createToken({ name: "Colon", pattern: /:/ })
const StringLiteral = createToken({
    name: "StringLiteral",
    pattern: /"(:?[^\\"]|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
})
const NumberLiteral = createToken({
    name: "NumberLiteral",
    pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
})
const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /[ \t\n\r]+/,
    group: Lexer.SKIPPED
})

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
    constructor(input: IToken[]) {
        super(input, allTokens)
        this.performSelfAnalysis()
    }

    // In TypeScript the parsing rules are explicitly defined as class instance properties
    // This allows for using access control (public/private/protected) and more importantly "informs" the TypeScript compiler
    // about the API of our Parser, so referencing an invalid rule name (this.SUBRULE(this.oopsType);)
    // is now a TypeScript compilation error.
    public json = this.RULE("json", () => {
        this.OR([
            // using ES6 Arrow functions to reduce verbosity.
            { ALT: () => this.SUBRULE(this.object) },
            { ALT: () => this.SUBRULE(this.array) }
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
        // This is a pure grammar, the value will be undefined until we add embedded actions
        // or enable automatic CST creation.
        value: value,
        lexErrors: lexResult.errors,
        parseErrors: parser.errors
    }
}
