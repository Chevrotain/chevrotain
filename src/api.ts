import {
    Parser,
    EMPTY_ALT,
    ParserDefinitionErrorType
} from "./parse/parser_public"
import { Lexer, LexerDefinitionErrorType } from "./scan/lexer_public"
import {
    tokenName,
    tokenLabel,
    EOF,
    tokenMatcher,
    createToken,
    createTokenInstance
} from "./scan/tokens_public"
import { exceptions } from "./parse/exceptions_public"
import { clearCache } from "./parse/cache_public"
import { NextAfterTokenWalker } from "./parse/grammar/interpreter"
import { VERSION } from "./version"
import { defaultErrorProvider } from "./parse/errors_public"
import { createSyntaxDiagramsCode } from "./diagrams/render_public"
import { GAstVisitor } from "./parse/grammar/gast/gast_visitor_public"
import {
    Alternation,
    Option,
    Flat,
    Repetition,
    RepetitionMandatory,
    RepetitionMandatoryWithSeparator,
    RepetitionWithSeparator,
    serializeGrammar,
    serializeProduction,
    Rule,
    Terminal,
    NonTerminal
} from "./parse/grammar/gast/gast_public"
import {
    resolveGrammar,
    validateGrammar
} from "./parse/grammar/gast/gast_resolver_public"

/**
 * defines the public API of
 * changes here may require major version change. (semVer)
 */
let API: any = {}

// semantic version
API.VERSION = VERSION

// runtime API
API.Parser = Parser
API.ParserDefinitionErrorType = ParserDefinitionErrorType
API.Lexer = Lexer
API.LexerDefinitionErrorType = LexerDefinitionErrorType
API.EOF = EOF

// Tokens utilities
API.tokenName = tokenName
API.tokenLabel = tokenLabel
API.tokenMatcher = tokenMatcher
API.createToken = createToken
API.createTokenInstance = createTokenInstance

// Other Utilities
API.EMPTY_ALT = EMPTY_ALT
API.defaultErrorProvider = defaultErrorProvider

// TODO: remove nested namespace usage
API.exceptions = {}
API.exceptions.isRecognitionException = exceptions.isRecognitionException
API.exceptions.EarlyExitException = exceptions.EarlyExitException
API.exceptions.MismatchedTokenException = exceptions.MismatchedTokenException
API.exceptions.NotAllInputParsedException =
    exceptions.NotAllInputParsedException
API.exceptions.NoViableAltException = exceptions.NoViableAltException

// grammar reflection API
API.gast = {}
API.GAstVisitor = GAstVisitor
API.Flat = Flat
API.Repetition = Repetition
API.RepetitionWithSeparator = RepetitionWithSeparator
API.RepetitionMandatory = RepetitionMandatory
API.RepetitionMandatoryWithSeparator = RepetitionMandatoryWithSeparator
API.Option = Option
API.Alternation = Alternation
API.NonTerminal = NonTerminal
API.Terminal = Terminal
API.Rule = Rule
API.serializeGrammar = serializeGrammar
API.serializeProduction = serializeProduction
API.resolveGrammar = resolveGrammar
API.validateGrammar = validateGrammar

API.clearCache = clearCache

API.createSyntaxDiagramsCode = createSyntaxDiagramsCode

module.exports = API
