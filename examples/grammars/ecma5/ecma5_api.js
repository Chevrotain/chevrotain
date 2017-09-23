const tokenize = require("./ecma5_lexer").tokenize
const ECMAScript5Parser = require("./ecma5_parser").ECMAScript5Parser

const parserInstance = new ECMAScript5Parser()

function parse(str) {
    lexResult = tokenize(str)

    // TODO: does acorn stop on the first error?
    // if (lexResult.errors.length > 0) {
    //     throw Error("Sad Sad Panda")
    // }
    const tokens = lexResult
    parserInstance.input = tokens
    parserInstance.orgText = str
    parserInstance.Program()

    if (parserInstance.errors.length > 0) {
        throw Error("Sad Sad Panda")
    }
}
// parse("var x = 5;")

module.exports = {
    parse
}
