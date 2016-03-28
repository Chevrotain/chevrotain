import {Token} from "../scan/tokens_public"
import {functionName} from "../lang/lang_extensions"
import {contains} from "../utils/utils"

export namespace exceptions {

    export interface IRecognitionException {
        name:string,
        message:string,
        /**
         * The token which caused the parser error.
         */
        token:Token,
        /**
         * Additional tokens which have been re-synced in error recovery due to the original error.
         * This information can be used the calculate the whole text area which has been skipped due to an error.
         * For example for displaying with a red underline in a text editor.
         */
        resyncedTokens:Token[]
    }

    // hacks to bypass no support for custom Errors in javascript/typescript
    export function isRecognitionException(error:Error) {
        let recognitionExceptions = [
            functionName(MismatchedTokenException),
            functionName(NoViableAltException),
            functionName(EarlyExitException),
            functionName(NotAllInputParsedException)]
        // can't do instanceof on hacked custom js exceptions
        return contains(recognitionExceptions, error.name)
    }

    export function MismatchedTokenException(message:string, token:Token) {
        this.name = functionName(MismatchedTokenException)
        this.message = message
        this.token = token
        this.resyncedTokens = []
    }

    // must use the "Error.prototype" instead of "new Error"
    // because the stack trace points to where "new Error" was invoked"
    MismatchedTokenException.prototype = Error.prototype

    export function NoViableAltException(message:string, token:Token) {
        this.name = functionName(NoViableAltException)
        this.message = message
        this.token = token
        this.resyncedTokens = []
    }

    NoViableAltException.prototype = Error.prototype

    export function NotAllInputParsedException(message:string, token:Token) {
        this.name = functionName(NotAllInputParsedException)
        this.message = message
        this.token = token
        this.resyncedTokens = []
    }

    NotAllInputParsedException.prototype = Error.prototype


    export function EarlyExitException(message:string, token:Token) {
        this.name = functionName(EarlyExitException)
        this.message = message
        this.token = token
        this.resyncedTokens = []
    }

    EarlyExitException.prototype = Error.prototype
}
