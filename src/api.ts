/**
 * defines the public API of Chevrotain.
 * changes here may require major version change. (semVer)
 */

declare var CHEV_TEST_MODE
declare var global

var testMode = (typeof global === "object" && global.CHEV_TEST_MODE) ||
    (typeof window === "object" && (<any>window).CHEV_TEST_MODE)

var API:any = {}
/* istanbul ignore next */
if (!testMode) {
    // runtime API
    API.Parser = chevrotain.recognizer.BaseIntrospectionRecognizer
    API.Lexer = chevrotain.lexer.SimpleLexer
    API.Token = chevrotain.tokens.Token

    // grammar reflection API
    API.gast = {}
    API.gast.GAstVisitor = chevrotain.gast.GAstVisitor
    API.gast.FLAT = chevrotain.gast.FLAT
    API.gast.AT_LEAST_ONE = chevrotain.gast.AT_LEAST_ONE
    API.gast.MANY = chevrotain.gast.MANY
    API.gast.OPTION = chevrotain.gast.OPTION
    API.gast.OR = chevrotain.gast.OR
    API.gast.ProdRef = chevrotain.gast.ProdRef
    API.gast.Terminal = chevrotain.gast.Terminal
}
else {
    console.log("running in TEST_MODE")
    API = chevrotain
}


