"use strict"

const tokenize = require("./ecma5_lexer").tokenize
const ECMAScript5Parser = require("./ecma5_parser").ECMAScript5Parser

const start = new Date().getTime()
const parserInstance = new ECMAScript5Parser()
const end = new Date().getTime()
console.log(end - start)

function parse(str) {
    const tokens = tokenize(str)
    parserInstance.input = tokens
    parserInstance.orgText = str
    parserInstance.Program()

    if (parserInstance.errors.length > 0) {
        throw Error("Sad Sad Panda")
    }
}

module.exports = {
    parse
}
