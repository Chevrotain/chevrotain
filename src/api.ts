import {
    Parser,
    ParserDefinitionErrorType,
    EMPTY_ALT
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

import * as defs from "../api"
import { IProduction } from "../api"
import { TokenType } from "../api"

interface ParserConstructor {
    new (
        input: defs.IToken[],
        tokenVocabulary: defs.TokenVocabulary,
        config?: defs.IParserConfig
    ): defs.Parser
}

interface LexerConstructor {
    new (
        lexerDefinition: defs.TokenType[] | defs.IMultiModeLexerDefinition,
        config: defs.ILexerConfig
    ): defs.Lexer
}

interface FlatConstructor {
    new (options: { definition: IProduction[]; name?: string }): defs.Flat
}
interface RepetitionConstructor {
    new (options: {
        definition: IProduction[]
        idx?: number
        name?: string
    }): defs.Repetition
}
interface RepetitionWithSeparatorConstructor {
    new (options: {
        definition: IProduction[]
        separator: TokenType
        idx?: number
        name?: string
    }): defs.RepetitionWithSeparator
}
interface RepetitionMandatoryConstructor {
    new (options: {
        definition: IProduction[]
        idx?: number
        name?: string
    }): defs.RepetitionMandatory
}
interface RepetitionMandatoryWithSeparatorConstructor {
    new (options: {
        definition: IProduction[]
        separator: TokenType
        idx?: number
        name?: string
    }): defs.RepetitionMandatoryWithSeparator
}
interface OptionConstructor {
    new (options: {
        definition: IProduction[]
        idx?: number
        name?: string
    }): defs.Option
}
interface AlternationConstructor {
    new (options: {
        definition: IProduction[]
        idx?: number
        name?: string
    }): defs.Alternation
}
interface NonTerminalConstructor {
    new (options: {
        nonTerminalName: string
        referencedRule?: Rule
        idx?: number
    }): defs.NonTerminal
}
interface TerminalConstructor {
    new (options: { terminalType: TokenType; idx?: number }): defs.Terminal
}
interface RuleConstructor {
    new (options: {
        name: string
        definition: IProduction[]
        orgText?: string
    }): defs.Rule
}

/**
 * defines the public API of
 * changes here may require major version change. (semVer)
 */
let API: {
    VERSION: typeof defs.VERSION
    Parser: ParserConstructor
    ParserDefinitionErrorType: typeof defs.ParserDefinitionErrorType
    Lexer: LexerConstructor
    LexerDefinitionErrorType: typeof defs.LexerDefinitionErrorType
    EOF: defs.TokenType
    tokenName: typeof defs.tokenName
    tokenLabel: typeof defs.tokenLabel
    tokenMatcher: typeof defs.tokenMatcher
    createToken: typeof defs.createToken
    createTokenInstance: typeof defs.createTokenInstance
    EMPTY_ALT: typeof defs.EMPTY_ALT
    defaultParserErrorProvider: typeof defs.defaultParserErrorProvider
    isRecognitionException: typeof defs.isRecognitionException
    EarlyExitException: typeof defs.EarlyExitException
    MismatchedTokenException: typeof defs.MismatchedTokenException
    NotAllInputParsedException: typeof defs.NotAllInputParsedException
    NoViableAltException: typeof defs.NoViableAltException
    Flat: FlatConstructor
    Repetition: RepetitionConstructor
    RepetitionWithSeparator: RepetitionWithSeparatorConstructor
    RepetitionMandatory: RepetitionMandatoryConstructor
    RepetitionMandatoryWithSeparator: RepetitionMandatoryWithSeparatorConstructor
    Option: OptionConstructor
    Alternation: AlternationConstructor
    NonTerminal: NonTerminalConstructor
    Terminal: TerminalConstructor
    Rule: RuleConstructor
    GAstVisitor: typeof defs.GAstVisitor

    serializeGrammar: typeof defs.serializeGrammar
    serializeProduction: typeof defs.serializeProduction
    resolveGrammar: typeof defs.resolveGrammar
    defaultGrammarResolverErrorProvider: typeof defs.defaultGrammarResolverErrorProvider
    validateGrammar: typeof defs.validateGrammar
    defaultGrammarValidatorErrorProvider: typeof defs.defaultGrammarValidatorErrorProvider
    assignOccurrenceIndices: typeof defs.assignOccurrenceIndices

    clearCache: typeof defs.clearCache

    createSyntaxDiagramsCode: typeof defs.createSyntaxDiagramsCode

    generateParserFactory: typeof defs.generateParserFactory
    generateParserModule: typeof defs.generateParserModule
} = <any>{}

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
//
// // Other Utilities
API.EMPTY_ALT = EMPTY_ALT
API.defaultParserErrorProvider = defaultParserErrorProvider
API.isRecognitionException = isRecognitionException
API.EarlyExitException = EarlyExitException
API.MismatchedTokenException = MismatchedTokenException
API.NotAllInputParsedException = NotAllInputParsedException
API.NoViableAltException = NoViableAltException
//
// // grammar reflection API
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

// // GAST Utilities
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
