import { SmartParser } from "./smart_parser"
import { ErrorHandler } from "../traits/error_handler"
import { LexerAdapter } from "../traits/lexer_adapter"
import { LooksAhead } from "../traits/looksahead"
import { Recoverable } from "../traits/recoverable"
import { TreeBuilder } from "../traits/tree_builder"
import { ContentAssist } from "../traits/context_assist"
import { SmartRecognizerApi } from "./smart_recognizer_api"
import { SmartRecognizerEngine } from "./smart_recognizer_engine"
import { MixedInParser } from "../traits/parser_traits"

export type SmartMixedInParser = MixedInParser &
    SmartParser &
    SmartRecognizerApi &
    SmartRecognizerEngine
