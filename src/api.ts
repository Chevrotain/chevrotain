import {Parser, EMPTY_ALT} from "./parse/parser_public"
import {Lexer} from "./scan/lexer_public"
import {Token, VirtualToken, EOF, extendToken, tokenName} from "./scan/tokens_public"
import {exceptions} from "./parse/exceptions_public"
import {gast} from "./parse/grammar/gast_public"
import {clearCache} from "./parse/cache_public"

/**
 * defines the public API of
 * changes here may require major version change. (semVer)
 */
let API:any = {}

// semantic version
API.VERSION = "0.5.14"

// runtime API
API.Parser = Parser
API.Lexer = Lexer
API.Token = Token
API.VirtualToken = VirtualToken
API.EOF = EOF

// Tokens utilities
API.extendToken = extendToken
API.tokenName = tokenName

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

API.clearCache = clearCache

module.exports = API
