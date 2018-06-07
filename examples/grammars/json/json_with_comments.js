const { tokenMatcher, Lexer, createToken } = require("chevrotain")
const { jsonTokens, JsonParser } = require("./json")

// Upgrade the lexer to support single line comments.
const Comment = createToken({
    name: "Comment",
    pattern: /\/\/.*/
})

const allTokens = jsonTokens.concat([Comment])

const JsonWithCommentsLexer = new Lexer(allTokens)

// ----------------- parser -----------------

/**
 * Our JsonWithComments Parser does not need any new parsing rules.
 * Only overrides private methods to automatically collect comments
 */
class JsonParserWithComments extends JsonParser {
    constructor(input) {
        super(input, { outputCst: true })
        // We did not define any new rules so no need to call performSelfAnalysis
    }

    LA(howMuch) {
        // Skip Comments during regular parsing as we wish to auto-magically insert them
        // into our CST
        while (tokenMatcher(super.LA(howMuch), Comment)) {
            super.consumeToken()
        }

        return super.LA(howMuch)
    }

    cstPostTerminal(key, consumedToken) {
        super.cstPostTerminal(key, consumedToken)

        let lookBehindIdx = -1
        let prevToken = super.LA(lookBehindIdx)

        // After every Token (terminal) is successfully consumed
        // We will add all the comment that appeared before it to the CST (Parse Tree)
        while (tokenMatcher(prevToken, Comment)) {
            super.cstPostTerminal(Comment.tokenName, prevToken)
            lookBehindIdx--
            prevToken = super.LA(lookBehindIdx)
        }
    }
}

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
const parser = new JsonParserWithComments([])

module.exports = function(text) {
    const lexResult = JsonWithCommentsLexer.tokenize(text)
    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens
    // any top level rule may be used as an entry point
    const value = parser.json()

    return {
        value: value,
        lexErrors: lexResult.errors,
        parseErrors: parser.errors
    }
}
