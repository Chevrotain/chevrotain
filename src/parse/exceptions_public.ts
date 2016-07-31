import {Token} from "../scan/tokens_public"
import {contains} from "../utils/utils"

export namespace exceptions {

    export interface IRecognizerContext {
        /**
         * A copy of the parser's rule stack at the "time" the RecognitionException occurred.
         * This can be used to help debug parsing errors (How did we get here?).
         */
        ruleStack:string[]

        /**
         * A copy of the parser's rule occurrence stack at the "time" the RecognitionException occurred.
         * This can be used to help debug parsing errors (How did we get here?).
         */
        ruleOccurrenceStack:number[]
    }

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

        context:IRecognizerContext
    }

    const MISMATCHED_TOKEN_EXCEPTION = "MismatchedTokenException"
    const NO_VIABLE_ALT_EXCEPTION = "NoViableAltException"
    const EARLY_EXIT_EXCEPTION = "EarlyExitException"
    const NOT_ALL_INPUT_PARSED_EXCEPTION = "NotAllInputParsedException"

    const RECOGNITION_EXCEPTION_NAMES = [
        MISMATCHED_TOKEN_EXCEPTION,
        NO_VIABLE_ALT_EXCEPTION,
        EARLY_EXIT_EXCEPTION,
        NOT_ALL_INPUT_PARSED_EXCEPTION
    ]

    Object.freeze(RECOGNITION_EXCEPTION_NAMES)

    // hacks to bypass no support for custom Errors in javascript/typescript
    export function isRecognitionException(error:Error) {
        // can't do instanceof on hacked custom js exceptions
        return contains(RECOGNITION_EXCEPTION_NAMES, error.name)
    }

    export function MismatchedTokenException(message:string, token:Token) {
        this.name = MISMATCHED_TOKEN_EXCEPTION
        this.message = message
        this.token = token
        this.resyncedTokens = []
    }

    // must use the "Error.prototype" instead of "new Error"
    // because the stack trace points to where "new Error" was invoked"
    MismatchedTokenException.prototype = Error.prototype

    export function NoViableAltException(message:string, token:Token) {
        this.name = NO_VIABLE_ALT_EXCEPTION
        this.message = message
        this.token = token
        this.resyncedTokens = []
    }

    NoViableAltException.prototype = Error.prototype

    export function NotAllInputParsedException(message:string, token:Token) {
        this.name = NOT_ALL_INPUT_PARSED_EXCEPTION
        this.message = message
        this.token = token
        this.resyncedTokens = []
    }

    NotAllInputParsedException.prototype = Error.prototype

    export function EarlyExitException(message:string, token:Token) {
        this.name = EARLY_EXIT_EXCEPTION
        this.message = message
        this.token = token
        this.resyncedTokens = []
    }

    EarlyExitException.prototype = Error.prototype
}
