import { IToken } from "../../api";
export declare function isRecognitionException(error: Error): boolean;
export declare function MismatchedTokenException(message: string, token: IToken, previousToken: IToken): void;
export declare namespace MismatchedTokenException {
    var prototype: Error;
}
export declare function NoViableAltException(message: string, token: IToken, previousToken: IToken): void;
export declare namespace NoViableAltException {
    var prototype: Error;
}
export declare function NotAllInputParsedException(message: string, token: IToken): void;
export declare namespace NotAllInputParsedException {
    var prototype: Error;
}
export declare function EarlyExitException(message: string, token: IToken, previousToken: IToken): void;
export declare namespace EarlyExitException {
    var prototype: Error;
}
