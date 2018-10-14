import { END_OF_FILE } from "../parser_public"
import { IToken } from "../../../api"
import { MixedInParser } from "./parser_traits"

/**
 * Trait responsible abstracting over the interaction with Lexer output (Token vector).
 *
 * This could be generalized to support other kinds of lexers, e.g.
 * - Just in Time Lexing / Lexer-Less parsing.
 * - Streaming Lexer.
 */
export class LexerAdapter {
    // lexer related methods
    set input(this: MixedInParser, newInput: IToken[]) {
        this.reset()
        this.tokVector = newInput
        this.tokVectorLength = newInput.length
    }

    get input(this: MixedInParser): IToken[] {
        return this.tokVector
    }

    // skips a token and returns the next token
    SKIP_TOKEN(this: MixedInParser): IToken {
        if (this.currIdx <= this.tokVector.length - 2) {
            this.consumeToken()
            return this.LA(1)
        } else {
            return END_OF_FILE
        }
    }

    // Lexer (accessing Token vector) related methods which can be overridden to implement lazy lexers
    // or lexers dependent on parser context.
    LA(this: MixedInParser, howMuch: number): IToken {
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

    consumeToken(this: MixedInParser) {
        this.currIdx++
    }

    exportLexerState(this: MixedInParser): number {
        return this.currIdx
    }

    importLexerState(this: MixedInParser, newState: number) {
        this.currIdx = newState
    }

    resetLexerState(this: MixedInParser): void {
        this.currIdx = -1
    }

    moveToTerminatedState(this: MixedInParser): void {
        this.currIdx = this.tokVector.length - 1
    }

    getLexerPosition(this: MixedInParser): number {
        return this.exportLexerState()
    }
}
