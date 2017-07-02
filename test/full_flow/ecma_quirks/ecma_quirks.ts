// Using TypeScript we have both classes and static properties to define Tokens

import { createToken, IToken, Token } from "../../../src/scan/tokens_public"
import { Lexer, TokenConstructor } from "../../../src/scan/lexer_public"
import { END_OF_FILE, Parser } from "../../../src/parse/parser_public"
import { exceptions } from "../../../src/parse/exceptions_public"

const Return = createToken({
    name: "Return",
    pattern: /return/y
})

const DivisionOperator = createToken({
    name: "DivisionOperator",
    pattern: /\//y
})

const RegExpLiteral = createToken({
    name: "RegExpLiteral",
    pattern: /\/\d+\//y
})

const NumberLiteral = createToken({
    name: "NumberLiteral",
    pattern: /\d+/y
})

// todo differentiate line terminators and other whitespace?
const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/y,
    group: Lexer.SKIPPED,
    line_breaks: true
})

const Semicolon = createToken({
    name: "Semicolon",
    pattern: /;/y
})

const allTokens = [
    WhiteSpace,
    NumberLiteral,
    Return,
    DivisionOperator,
    RegExpLiteral,
    Semicolon
]

const ErrorToken = createToken({ name: "ErrorToken" })

class EcmaScriptQuirksParser extends Parser {
    constructor(input: Token[]) {
        super(input, allTokens)
        Parser.performSelfAnalysis(this)
    }

    public statement = this.RULE("statement", () => {
        this.CONSUME(Return)
        // this.SUBRULE(this.expression)
        this.CONSUME(Semicolon)
    })

    public expression = this.RULE("expression", () => {
        this.SUBRULE(this.atomic)
        this.MANY(() => {
            this.CONSUME(DivisionOperator)
            this.SUBRULE2(this.atomic)
        })
    })

    public atomic = this.RULE("atomic", () => {
        this.OR([
            { ALT: () => this.CONSUME(RegExpLiteral) },
            { ALT: () => this.CONSUME(NumberLiteral) }
        ])
    })

    private orgText
    private textIdx

    // lexer related methods
    public set textInput(newInput: string) {
        this.reset()
        this.orgText = newInput
    }

    public get textInput(): string {
        return this.orgText
    }

    protected resetLexerState(): void {
        this.textIdx = 0
    }

    protected IS_NEXT_TOKEN(expectedType: TokenConstructor): IToken | boolean {
        if (this.orgText.length <= this.textIdx) {
            return END_OF_FILE
        } else {
            this.skipWhitespace()
            return this.consumeExpected(expectedType)
        }
    }

    private skipWhitespace(): void {
        const wsPattern = WhiteSpace.PATTERN as RegExp
        wsPattern.lastIndex = this.textIdx
        const wsMatch = wsPattern.exec(this.orgText)
        if (wsMatch !== null) {
            const wsLength = wsMatch[0].length
            this.textIdx += wsLength
        }
    }

    private consumeExpected(expectedType: TokenConstructor): IToken | false {
        // match expected
        const expectedPattern = expectedType.PATTERN as RegExp
        expectedPattern.lastIndex = this.textIdx
        const match = expectedPattern.exec(this.orgText)
        if (match !== null) {
            const image = match[0]
            const startOffset = this.textIdx
            const newToken = {
                tokenType: expectedType.tokenType,
                image,
                startOffset
            }
            this.textIdx += image.length
            return newToken
        }

        return false
    }

    protected consumeInternal(tokClass: TokenConstructor, idx: number): IToken {
        this.skipWhitespace()
        let nextToken = this.consumeExpected(tokClass)
        if (nextToken !== false) {
            return nextToken
        } else {
            const errorToken = {
                tokenType: ErrorToken.tokenType,
                image: this.orgText[this.textIdx],
                startOffset: this.textIdx
            }
            let msg = this.errorMessageProvider.buildMismatchTokenMessage({
                expected: tokClass,
                actual: errorToken,
                ruleName: this.getCurrRuleFullName()
            })
            throw this.SAVE_ERROR(
                new exceptions.MismatchedTokenException(msg, errorToken)
            )
        }
    }

    protected exportLexerState(): number {
        return this.textIdx
    }

    protected importLexerState(newState: number) {
        this.textIdx = newState
    }
}

// reuse the same parser instance.
const parser = new EcmaScriptQuirksParser([])

export function parse(text): any {
    parser.textInput = text
    let value = parser.statement()

    return {
        value: value,
        errors: parser.errors
    }
}
