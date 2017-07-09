import { IToken } from "../../scan/tokens_public"
import { END_OF_FILE } from "../parser_public"

export interface ILexerAdapter<INPUT, STATE> {
    lookahead(howMuch: number): IToken

    consume(): void

    skip(): IToken

    isAtEOI(howFarAhead: number): boolean

    reset(): void

    exportState(): STATE

    importState(newState: STATE): void

    getInput(): INPUT

    setInput(newInput: INPUT): void
}

export type TokVectorState = { currIdx: number }

export class TokenVectorLexerAdapter
    implements ILexerAdapter<IToken[], TokVectorState> {
    protected currIdx = -1

    constructor(public tokVector: IToken[] = []) {}

    lookahead(howMuch: number): IToken {
        if (this.tokVector.length <= this.currIdx + howMuch) {
            return END_OF_FILE
        } else {
            return this.tokVector[this.currIdx + howMuch]
        }
    }

    isAtEOI(howFarAhead: number): boolean {
        return this.currIdx >= this.tokVector.length - howFarAhead
    }

    reset(): void {
        this.currIdx = -1
    }

    importState(newState: TokVectorState): void {
        this.currIdx = newState.currIdx
    }

    exportState(): TokVectorState {
        return {
            currIdx: this.currIdx
        }
    }

    // TODO: rename, but which name?
    moveToTerminatedState(): void {
        this.currIdx = this.tokVector.length - 1
    }

    consume(): void {
        this.currIdx++
    }

    skip(): IToken {
        // example: assume 45 tokens in the input, if input index is 44 it means that NEXT_TOKEN will return
        // input[45] which is the 46th item and no longer exists,
        // so in this case the largest valid input index is 43 (input.length - 2 )
        if (this.currIdx <= this.tokVector.length - 2) {
            this.consume()
            return this.lookahead(1)
        } else {
            return END_OF_FILE
        }
    }

    getInput(): IToken[] {
        return this.tokVector
    }

    setInput(newInput: IToken[]): void {
        this.tokVector = newInput
    }
}
