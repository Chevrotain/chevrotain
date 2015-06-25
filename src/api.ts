/// <reference path="../libs/node.d.ts" />

/**
 * defines the public API of Chevrotain.
 * changes here may require major version change. (semVer)
 */

declare var CHEV_TEST_MODE
/* istanbul ignore next */
var testMode = (typeof global === "object" && (<any>global).CHEV_TEST_MODE) ||
    (typeof window === "object" && (<any>window).CHEV_TEST_MODE)

var API:any = {}
/* istanbul ignore next */
if (!testMode) {
    // runtime API
    API.Parser = chevrotain.Parser
    API.Lexer = chevrotain.Lexer
    API.Token = chevrotain.Token

    // utilities
    API.extendToken = chevrotain.extendToken

    // grammar reflection API
    API.gast = {}
    API.gast.GAstVisitor = chevrotain.gast.GAstVisitor
    API.gast.Flat = chevrotain.gast.Flat
    API.gast.RepetitionMandatory = chevrotain.gast.RepetitionMandatory
    API.gast.Repetition = chevrotain.gast.Repetition
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


