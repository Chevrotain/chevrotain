import {Parser, EMPTY_ALT, ParserDefinitionErrorType} from "./parse/parser_public"
import {Lexer, LexerDefinitionErrorType} from "./scan/lexer_public"
import {
    Token,
    extendToken,
    tokenName,
    tokenLabel,
    extendLazyToken,
    extendSimpleLazyToken,
    getStartOffset,
    getImage,
    getStartLine,
    getStartColumn,
    getEndOffset,
    getEndLine,
    getEndColumn,
    VirtualToken,
    EOF,
    getTokenConstructor,
    tokenMatcher,
    SimpleLazyToken,
    LazyToken
} from "./scan/tokens_public"
import {exceptions} from "./parse/exceptions_public"
import {gast} from "./parse/grammar/gast_public"
import {clearCache} from "./parse/cache_public"
import {NextAfterTokenWalker} from "./parse/grammar/interpreter"

/**
 * defines the public API of
 * changes here may require major version change. (semVer)
 */
let API:any = {}

// semantic version
API.VERSION = "0.17.0"

// runtime API
API.Parser = Parser
API.ParserDefinitionErrorType = ParserDefinitionErrorType
API.Lexer = Lexer
API.LexerDefinitionErrorType = LexerDefinitionErrorType
API.Token = Token
API.LazyToken = LazyToken
API.SimpleLazyToken = SimpleLazyToken
// TODO: remove this, does not belong on the API.
API.VirtualToken = VirtualToken
API.EOF = EOF

// Tokens utilities
API.extendToken = extendToken
API.extendLazyToken = extendLazyToken
API.extendSimpleLazyToken = extendSimpleLazyToken
API.tokenName = tokenName
API.tokenLabel = tokenLabel
API.tokenMatcher = tokenMatcher

// Tokens getters
API.getImage = getImage
API.getStartOffset = getStartOffset
API.getStartLine = getStartLine
API.getStartColumn = getStartColumn
API.getEndOffset = getEndOffset
API.getEndLine = getEndLine
API.getEndColumn = getEndColumn
API.getTokenConstructor = getTokenConstructor

// Other Utilities
API.EMPTY_ALT = EMPTY_ALT

API.exceptions = {}
API.exceptions.isRecognitionException = exceptions.isRecognitionException
API.exceptions.EarlyExitException = exceptions.EarlyExitException
API.exceptions.MismatchedTokenException = exceptions.MismatchedTokenException
API.exceptions.NotAllInputParsedException = exceptions.NotAllInputParsedException
API.exceptions.NoViableAltException = exceptions.NoViableAltException

// grammar reflection API
API.gast = {}
API.gast.GAstVisitor = gast.GAstVisitor
API.gast.Flat = gast.Flat
API.gast.Repetition = gast.Repetition
API.gast.RepetitionWithSeparator = gast.RepetitionWithSeparator
API.gast.RepetitionMandatory = gast.RepetitionMandatory
API.gast.RepetitionMandatoryWithSeparator = gast.RepetitionMandatoryWithSeparator
API.gast.Option = gast.Option
API.gast.Alternation = gast.Alternation
API.gast.NonTerminal = gast.NonTerminal
API.gast.Terminal = gast.Terminal
API.gast.Rule = gast.Rule
API.gast.serializeGrammar = gast.serializeGrammar
API.gast.serializeProduction = gast.serializeProduction

API.interperter = {}
API.interperter.NextAfterTokenWalker = NextAfterTokenWalker

API.clearCache = clearCache

module.exports = API
