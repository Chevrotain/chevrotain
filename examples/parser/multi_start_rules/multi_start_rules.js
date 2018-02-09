/*
 * An example showing that any Production may be used as a start rule in chevrotain.
 * There is no artificial limit of which rule may be a start rule.
 *
 * Multiple start rules can be useful in certain contexts, for example:
 * 1. Unit Testing the grammar.
 * 2. Partial parsing of only the modified parts of a document in an IDE.
 */

const { createToken, Lexer, Parser } = require("chevrotain")

// ----------------- lexer -----------------
const Alpha = createToken({ name: "Alpha", pattern: /A/ })
const Bravo = createToken({ name: "Bravo", pattern: /B/ })
const Charlie = createToken({ name: "Charlie", pattern: /C/ })

const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: Lexer.SKIPPED,
    line_breaks: true
})

const allTokens = [
    WhiteSpace, // whitespace is normally very common so it should be placed first to speed up the lexer's performance
    Alpha,
    Bravo,
    Charlie
]

const PhoneticLexer = new Lexer(allTokens)

// ----------------- parser -----------------
class MultiStartParser extends Parser {
    constructor(input) {
        super(input, allTokens)

        const $ = this

        $.RULE("firstRule", () => {
            $.CONSUME(Alpha)

            $.OPTION(() => {
                $.SUBRULE($.secondRule)
            })
        })

        $.RULE("secondRule", () => {
            $.CONSUME(Bravo)

            $.OPTION(() => {
                $.SUBRULE($.thirdRule)
            })
        })

        $.RULE("thirdRule", () => {
            $.CONSUME(Charlie)
        })

        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this)
    }
}

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
const parser = new MultiStartParser([])

function parseStartingWithRule(ruleName) {
    return function(text) {
        const lexResult = PhoneticLexer.tokenize(text)
        // setting a new input will RESET the parser instance's state.
        parser.input = lexResult.tokens
        // just invoke which ever rule you want as the start rule. its all just plain javascript...
        const value = parser[ruleName]()

        return {
            value: value, // this is a pure grammar, the value will always be <undefined>
            lexErrors: lexResult.errors,
            parseErrors: parser.errors
        }
    }
}

module.exports = {
    parseFirst: parseStartingWithRule("firstRule"),
    parseSecond: parseStartingWithRule("secondRule"),
    parseThird: parseStartingWithRule("thirdRule")
}
