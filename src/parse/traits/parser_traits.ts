import { ErrorHandler } from "./error_handler"
import { LexerAdapter } from "./lexer_adapter"
import { LooksAhead } from "./looksahead"
import { RecognizerApi, RecognizerEngine } from "./recognizer"
import { Recoverable } from "./recoverable"
import { TreeBuilder } from "./tree_builder"
import { Parser as ParserConstructorImpel } from "../parser_public"
import * as defs from "../../../api"

export type MixedInParser = ParserConstructorImpel &
    ErrorHandler &
    LexerAdapter &
    LooksAhead &
    RecognizerApi &
    RecognizerEngine &
    Recoverable &
    TreeBuilder

interface MixedInParserConstructor {
    new (
        tokenVocabulary: defs.TokenVocabulary,
        config?: defs.IParserConfig
    ): defs.Parser
}

export const Parser: MixedInParserConstructor = <any>ParserConstructorImpel
