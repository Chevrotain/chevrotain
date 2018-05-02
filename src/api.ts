import {
    EMPTY_ALT,
    Parser,
    ParserDefinitionErrorType
} from "./parse/parser_public"
import { Lexer, LexerDefinitionErrorType } from "./scan/lexer_public"
import {
    createToken,
    createTokenInstance,
    EOF,
    tokenLabel,
    tokenMatcher,
    tokenName
} from "./scan/tokens_public"
import {
    EarlyExitException,
    isRecognitionException,
    MismatchedTokenException,
    NotAllInputParsedException,
    NoViableAltException
} from "./parse/exceptions_public"
import { clearCache } from "./parse/cache_public"
import { VERSION } from "./version"
import {
    defaultGrammarResolverErrorProvider,
    defaultGrammarValidatorErrorProvider,
    defaultParserErrorProvider
} from "./parse/errors_public"
import { createSyntaxDiagramsCode } from "./diagrams/render_public"
import { GAstVisitor } from "./parse/grammar/gast/gast_visitor_public"
import {
    Alternation,
    Flat,
    NonTerminal,
    Option,
    Repetition,
    RepetitionMandatory,
    RepetitionMandatoryWithSeparator,
    RepetitionWithSeparator,
    Rule,
    serializeGrammar,
    serializeProduction,
    Terminal
} from "./parse/grammar/gast/gast_public"
import {
    assignOccurrenceIndices,
    resolveGrammar,
    validateGrammar
} from "./parse/grammar/gast/gast_resolver_public"
import {
    generateParserFactory,
    generateParserModule
} from "./generate/generate_public"

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
// TODO: Breaking Change -> renamed property
API.defaultParserErrorProvider = defaultParserErrorProvider
API.isRecognitionException = isRecognitionException
API.EarlyExitException = EarlyExitException
API.MismatchedTokenException = MismatchedTokenException
API.NotAllInputParsedException = NotAllInputParsedException
API.NoViableAltException = NoViableAltException

// grammar reflection API
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

// GAST Utilities
API.GAstVisitor = GAstVisitor
API.serializeGrammar = serializeGrammar
API.serializeProduction = serializeProduction
API.resolveGrammar = resolveGrammar
API.defaultGrammarResolverErrorProvider = defaultGrammarResolverErrorProvider
API.validateGrammar = validateGrammar
API.defaultGrammarValidatorErrorProvider = defaultGrammarValidatorErrorProvider
API.assignOccurrenceIndices = assignOccurrenceIndices

API.clearCache = clearCache

API.createSyntaxDiagramsCode = createSyntaxDiagramsCode

API.generateParserFactory = generateParserFactory
API.generateParserModule = generateParserModule

module.exports = API
