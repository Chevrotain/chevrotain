import { IParserConfig, IParserErrorMessageProvider, IRecognitionException } from "../../../../api";
import { PROD_TYPE } from "../../grammar/lookahead";
import { MixedInParser } from "./parser_traits";
/**
 * Trait responsible for runtime parsing errors.
 */
export declare class ErrorHandler {
    _errors: IRecognitionException[];
    errorMessageProvider: IParserErrorMessageProvider;
    initErrorHandler(config: IParserConfig): void;
    SAVE_ERROR(this: MixedInParser, error: IRecognitionException): IRecognitionException;
    errors: IRecognitionException[];
    raiseEarlyExitException(this: MixedInParser, occurrence: number, prodType: PROD_TYPE, userDefinedErrMsg: string): void;
    raiseNoAltException(this: MixedInParser, occurrence: number, errMsgTypes: string): void;
}
