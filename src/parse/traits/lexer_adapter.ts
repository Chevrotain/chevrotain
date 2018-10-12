import { END_OF_FILE, Parser } from "../parser_public"
import { IToken } from "../../../api"

export class LexerAdapter {
    // lexer related methods
    set input(this: Parser, newInput: IToken[]) {
        this.reset()
        this.tokVector = newInput
        this.tokVectorLength = newInput.length
    }

    get input(this: Parser): IToken[] {
        return this.tokVector
    }

    // skips a token and returns the next token
    SKIP_TOKEN(this: Parser): IToken {
        if (this.currIdx <= this.tokVector.length - 2) {
            this.consumeToken()
            return this.LA(1)
        } else {
            return END_OF_FILE
        }
    }

    // Lexer (accessing Token vector) related methods which can be overridden to implement lazy lexers
    // or lexers dependent on parser context.
    LA(this: Parser, howMuch: number): IToken {
        // does: is this optimization (saving tokVectorLength benefits?)
        if (
            this.currIdx + howMuch < 0 ||
            this.tokVectorLength <= this.currIdx + howMuch
        ) {
            return END_OF_FILE
        } else {
            return this.tokVector[this.currIdx + howMuch]
        }
    }

    consumeToken(this: Parser) {
        this.currIdx++
    }

    exportLexerState(this: Parser): number {
        return this.currIdx
    }

    importLexerState(this: Parser, newState: number) {
        this.currIdx = newState
    }

    resetLexerState(this: Parser): void {
        this.currIdx = -1
    }

    moveToTerminatedState(this: Parser): void {
        this.currIdx = this.tokVector.length - 1
    }

    getLexerPosition(this: Parser): number {
        return this.exportLexerState()
    }
}
