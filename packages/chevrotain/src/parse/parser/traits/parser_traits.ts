import {
  CstParser as CstParserConstructorImpl,
  EmbeddedActionsParser as EmbeddedActionsParserConstructorImpl,
  ForgivingParser as ForgivingParserConstructorImpl,
  StrictParser as StrictParserConstructorImpl,
  SmartParser as SmartParserConstructorImpl,
} from "../parser.js";
import * as defs from "@chevrotain/types";
/**
 * All traits have been absorbed into the strict parser implementation (Stage 7).
 * MixedInParser is now just StrictParser itself.
 */
export type MixedInParser = StrictParserConstructorImpl;

type ParserConstructor<T> = {
  new (tokenVocabulary: defs.TokenVocabulary, config?: defs.IParserConfig): T;
};

export const CstParser: ParserConstructor<defs.CstParser> = <any>(
  CstParserConstructorImpl
);

export const EmbeddedActionsParser: ParserConstructor<defs.EmbeddedActionsParser> =
  <any>EmbeddedActionsParserConstructorImpl;

export const StrictParser: ParserConstructor<defs.StrictParser> = <any>(
  StrictParserConstructorImpl
);

export const ForgivingParser: ParserConstructor<defs.ForgivingParser> = <any>(
  ForgivingParserConstructorImpl
);

export const SmartParser: ParserConstructor<defs.SmartParser> = <any>(
  SmartParserConstructorImpl
);
