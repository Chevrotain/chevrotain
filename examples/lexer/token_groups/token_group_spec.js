const assert = require("assert")
const groupsLexer = require("./token_groups")
const tokenMatcher = require("chevrotain").tokenMatcher

describe("The Chevrotain Lexer ability to group the Tokens.", () => {
    it("will output the comments into a separate ouput object and will ignore whitespaces", () => {
        const text =
            "if (666) // some comment!\n" +
            "   return 333\n" +
            "// some other comment!\n" +
            "else \n" +
            "   return 667\n"

        const lexResult = groupsLexer.tokenize(text)

        assert.equal(lexResult.errors.length, 0)
        assert.equal(lexResult.tokens.length, 9)

        lexResult.tokens.forEach(function(lexedToken) {
            // the whitespace has been completely skipped/ignored
            assert.notEqual(
                tokenMatcher(lexedToken, groupsLexer.Whitespace),
                true
            )
        })

        const commentsGroup = lexResult.groups.singleLineComments
        assert.equal(commentsGroup.length, 2)
        assert.equal(tokenMatcher(commentsGroup[0], groupsLexer.Comment), true)
        assert.equal(commentsGroup[0].image, "// some comment!")
        assert.equal(tokenMatcher(commentsGroup[1], groupsLexer.Comment), true)
        assert.equal(commentsGroup[1].image, "// some other comment!")
    })
})
