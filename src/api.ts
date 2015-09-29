/**
 * defines the public API of Chevrotain.
 * changes here may require major version change. (semVer)
 */
declare let global
declare let CHEV_TEST_MODE
/* istanbul ignore next */
let testMode = (typeof global === "object" && (<any>global).CHEV_TEST_MODE) ||
    (typeof window === "object" && (<any>window).CHEV_TEST_MODE)

let API:any = {}
/* istanbul ignore next */
if (!testMode) {
    // semantic version
    API.VERSION = "0.5.6";

    // runtime API
    API.Parser = chevrotain.Parser
    API.Lexer = chevrotain.Lexer
    API.Token = chevrotain.Token
    API.VirtualToken = chevrotain.VirtualToken
    API.EOF = chevrotain.EOF

    // Tokens utilities
    API.extendToken = chevrotain.extendToken
    API.tokenName = chevrotain.tokenName

    API.exceptions = {}
    API.exceptions.isRecognitionException = chevrotain.exceptions.isRecognitionException
    API.exceptions.EarlyExitException = chevrotain.exceptions.EarlyExitException
    API.exceptions.MismatchedTokenException = chevrotain.exceptions.MismatchedTokenException
    API.exceptions.NotAllInputParsedException = chevrotain.exceptions.NotAllInputParsedException
    API.exceptions.NoViableAltException = chevrotain.exceptions.NoViableAltException

    // grammar reflection API
    API.gast = {}
    API.gast.GAstVisitor = chevrotain.gast.GAstVisitor
    API.gast.Flat = chevrotain.gast.Flat
    API.gast.Repetition = chevrotain.gast.Repetition
    API.gast.RepetitionWithSeparator = chevrotain.gast.RepetitionWithSeparator
    API.gast.RepetitionMandatory = chevrotain.gast.RepetitionMandatory
    API.gast.RepetitionMandatoryWithSeparator = chevrotain.gast.RepetitionMandatoryWithSeparator
    API.gast.Option = chevrotain.gast.Option
    API.gast.Alternation = chevrotain.gast.Alternation
    API.gast.NonTerminal = chevrotain.gast.NonTerminal
    API.gast.Terminal = chevrotain.gast.Terminal
    API.gast.Rule = chevrotain.gast.Rule
}
else {
    console.log("running in TEST_MODE")
    API = chevrotain
}


