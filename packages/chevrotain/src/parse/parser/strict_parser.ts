import { IParserConfig, TokenVocabulary } from "@chevrotain/types";
import {
  DEFAULT_PARSER_CONFIG,
  orNeedsCounterManagement,
  ParserBase,
} from "./parser_core.js";
import { IParserConfigInternal } from "./types.js";

export class StrictParser extends ParserBase {}

export class CstParser extends StrictParser {
  constructor(
    tokenVocabulary: TokenVocabulary,
    config: IParserConfig = DEFAULT_PARSER_CONFIG,
  ) {
    const configClone = { ...config } as IParserConfigInternal;
    configClone.outputCst = true;
    super(tokenVocabulary, configClone);
  }
}

export class EmbeddedActionsParser extends StrictParser {
  constructor(
    tokenVocabulary: TokenVocabulary,
    config: IParserConfig = DEFAULT_PARSER_CONFIG,
  ) {
    const configClone = { ...config } as IParserConfigInternal;
    configClone.outputCst = false;
    super(tokenVocabulary, configClone);
  }
}
