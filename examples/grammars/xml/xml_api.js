const { xmlLexer } = require("./xml_lexer")
const { xmlParser } = require("./xml_parser")

module.exports = function(text) {
    const lexResult = xmlLexer.tokenize(text)
    // setting a new input will RESET the parser instance's state.
    xmlParser.input = lexResult.tokens
    // any top level rule may be used as an entry point
    const cst = xmlParser.document()

    return {
        cst: cst,
        lexErrors: lexResult.errors,
        parseErrors: xmlParser.errors
    }
}
