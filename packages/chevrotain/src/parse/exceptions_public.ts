import { contains } from "../utils/utils"
import {
    IToken,
    IRecognizerContext,
    MismatchedTokenException as DefMismatchedTokenException
} from "../../api"

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
export function isRecognitionException(error: Error) {
    // can't do instanceof on hacked custom js exceptions
    return contains(RECOGNITION_EXCEPTION_NAMES, error.name)
}

export abstract class RecognitionExceptionBase extends Error {
    public name: string

    constructor(
        message: string,
        public token: IToken,
        public resyncedTokens: IToken[] = [],
        public context: IRecognizerContext = undefined
    ) {
        super(message)

        // Set the prototype explicitly.
        // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, RecognitionExceptionBase.prototype)
    }
}

export class MismatchedTokenException extends RecognitionExceptionBase {
    public name = MISMATCHED_TOKEN_EXCEPTION

    constructor(message: string, token: IToken, public previousToken: IToken) {
        super(message, token)

        Object.setPrototypeOf(this, MismatchedTokenException.prototype)
    }
}

export class NoViableAltException extends RecognitionExceptionBase {
    public name = NO_VIABLE_ALT_EXCEPTION

    constructor(message: string, token: IToken, public previousToken: IToken) {
        super(message, token)

        Object.setPrototypeOf(this, NoViableAltException.prototype)
    }
}

export class NotAllInputParsedException extends RecognitionExceptionBase {
    public name = NOT_ALL_INPUT_PARSED_EXCEPTION

    constructor(message: string, token: IToken) {
        super(message, token)

        Object.setPrototypeOf(this, NotAllInputParsedException.prototype)
    }
}

export class EarlyExitException extends RecognitionExceptionBase {
    public name = EARLY_EXIT_EXCEPTION

    constructor(message: string, token: IToken, public previousToken: IToken) {
        super(message, token)

        Object.setPrototypeOf(this, EarlyExitException.prototype)
    }
}
