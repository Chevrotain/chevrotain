/*
 * Example Of using Grammar inheritance to support multiple versions of the same grammar.
 */

const { createToken, Lexer, Parser } = require("chevrotain")

// ----------------- lexer -----------------
const Select = createToken({ name: "Select", pattern: /SELECT/i })
const From = createToken({ name: "From", pattern: /FROM/i })
const Where = createToken({ name: "Where", pattern: /WHERE/i })
const Comma = createToken({ name: "Comma", pattern: /,/ })
const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
const Integer = createToken({ name: "Integer", pattern: /0|[1-9]\d+/ })
const GreaterThan = createToken({ name: "GreaterThan", pattern: /</ })
const LessThan = createToken({ name: "LessThan", pattern: />/ })
const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: Lexer.SKIPPED
})

const allTokens = [
    WhiteSpace,
    Select,
    From,
    Where,
    Comma,
    Identifier,
    Integer,
    GreaterThan,
    LessThan
]
const SelectLexer = new Lexer(allTokens)

// ----------------- parser -----------------

class SelectParserVersion1 extends Parser {
    constructor(input, isInvokedByChildConstructor = false) {
        super(input, allTokens)

        const $ = this

        $.RULE("selectStatement", () => {
            $.SUBRULE($.selectClause)
            $.SUBRULE($.fromClause)
            $.OPTION(() => {
                $.SUBRULE($.whereClause)
            })
        })

        $.RULE("selectClause", () => {
            $.CONSUME(Select)
            $.AT_LEAST_ONE_SEP({
                SEP: Comma,
                DEF: () => {
                    $.CONSUME(Identifier)
                }
            })
        })

        // fromClause in version1 allows only a single column name.
        $.RULE("fromClause", () => {
            $.CONSUME(From)
            $.CONSUME(Identifier)
        })

        $.RULE("whereClause", () => {
            $.CONSUME(Where)
            $.SUBRULE($.expression)
        })

        $.RULE("expression", () => {
            $.SUBRULE($.atomicExpression)
            $.SUBRULE($.relationalOperator)
            $.SUBRULE2($.atomicExpression) // note the '2' suffix to distinguish
            // from the 'SUBRULE(atomicExpression)' 2 lines above.
        })

        $.RULE("atomicExpression", () => {
            $.OR([
                { ALT: () => $.CONSUME(Integer) },
                { ALT: () => $.CONSUME(Identifier) }
            ])
        })

        $.RULE("relationalOperator", () => {
            $.OR([
                { ALT: () => $.CONSUME(GreaterThan) },
                { ALT: () => $.CONSUME(LessThan) }
            ])
        })

        // the selfAnalysis must only be performed ONCE during grammar construction.
        // that invocation should be the in the LAST (bottom of the hierarchy) grammar.
        // of in inheritance chain.
        if (!isInvokedByChildConstructor) {
            // very important to call this after all the rules have been defined.
            // otherwise the parser may not work correctly as it will lack information
            // derived during the self analysis phase.
            this.performSelfAnalysis()
        }
    }
}

// V2 extends V1
class SelectParserVersion2 extends SelectParserVersion1 {
    constructor(input) {
        super(input, true)

        const $ = this

        // "fromClause" production in version2 is overridden to allow multiple table names.
        this.fromClause = $.OVERRIDE_RULE("fromClause", () => {
            $.CONSUME(From)
            $.AT_LEAST_ONE_SEP({
                SEP: Comma,
                DEF: () => {
                    $.CONSUME(Identifier)
                }
            })
        })

        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        this.performSelfAnalysis()
    }
}

// ----------------- wrapping it all together -----------------

// reuse the same parser instances.
const version1Parser = new SelectParserVersion1([])
const version2Parser = new SelectParserVersion2([])

module.exports = function(text, version) {
    const lexResult = SelectLexer.tokenize(text)

    let parser

    // initialize a parser for the specific version version chosen.
    switch (version) {
        case 1:
            parser = version1Parser
            break
        case 2:
            parser = version2Parser
            break
        default:
            throw Error("no valid version chosen")
    }

    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens
    const cst = parser.selectStatement()

    return {
        value: cst,
        lexErrors: lexResult.errors,
        parseErrors: parser.errors
    }
}
