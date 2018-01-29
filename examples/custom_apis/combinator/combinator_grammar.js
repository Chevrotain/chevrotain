const c = require("./combinator_api")
const { tokens, JsonLexer } = require("../common/lexer")
const t = tokens

const json = c.choice("array", "object").toRule("json")
const pair = c.seq(t.StringLiteral, t.Colon, "value").toRule("pair")

const object = c
    .seq(t.LCurly, c.delimited(pair, t.Comma), t.RCurly)
    .toRule("object")

const array = c
    .seq(t.LSquare, c.delimited("value", t.Comma), t.RSquare)
    .toRule("array")

const value = c
    .choice(
        t.StringLiteral,
        t.False,
        t.True,
        t.Null,
        t.NumberLiteral,
        array,
        object
    )
    .toRule("value")

const jsonParserInstance = c.createParser(
    "json",
    [json, pair, object, array, value],
    tokens
)

module.exports = function(text) {
    const lexResult = JsonLexer.tokenize(text)

    if (lexResult.errors.length > 0) {
        throw Error("Sad Sad Panda, lexing errors detected")
    }

    // setting a new input will RESET the parser instance's state.
    jsonParserInstance.input = lexResult.tokens

    // step into the following statement to debug the generated chevrotain code.
    const value = jsonParserInstance.json()

    if (jsonParserInstance.errors.length > 0) {
        throw Error("Sad Sad Panda, parsing errors detected")
    }

    return {
        value: value,
        lexErrors: lexResult.errors,
        parseErrors: jsonParserInstance.errors
    }
}
