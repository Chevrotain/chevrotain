import {Token} from "../scan/tokens_public"
import {functionName} from "../lang/lang_extensions"
import {contains} from "../utils/utils"

export namespace exceptions {
    export interface IRecognitionException {
        name:string,
        message:string,
        token:Token
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
    }

    // must use the "Error.prototype" instead of "new Error"
    // because the stack trace points to where "new Error" was invoked"
    MismatchedTokenException.prototype = Error.prototype

    export function NoViableAltException(message:string, token:Token) {
        this.name = functionName(NoViableAltException)
        this.message = message
        this.token = token
    }

    NoViableAltException.prototype = Error.prototype

    export function NotAllInputParsedException(message:string, token:Token) {
        this.name = functionName(NotAllInputParsedException)
        this.message = message
        this.token = token
    }

    NotAllInputParsedException.prototype = Error.prototype


    export function EarlyExitException(message:string, token:Token) {
        this.name = functionName(EarlyExitException)
        this.message = message
        this.token = token
    }

    EarlyExitException.prototype = Error.prototype
}
