import { ILexerErrorMessageProvider, IToken } from "../../api"

export const defaultLexerErrorProvider: ILexerErrorMessageProvider = {
    buildUnableToPopLexerModeMessage(token: IToken): string {
        return `Unable to pop Lexer Mode after encountering Token ->${
            token.image
        }<- The Mode Stack is empty`
    },

    buildUnexpectedCharacterMessage(
        text: string,
        errorStartOffset: number,
        errorLength: number,
        errorLine: number,
        errorColumn: number
    ): string {
        return (
            `unexpected character: ->${text.charAt(
                errorStartOffset
            )}<- at offset: ${errorStartOffset},` +
            ` skipped ${errorLength} characters.`
        )
    }
}
