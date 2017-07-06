// ----------------- wrapping it all together -----------------
var parserInstance

function parseBench(text, lexOnly, lexer, parser, rootRule) {
    var lexResult = lexer.tokenize(text)
    if (lexResult.errors.length > 0) {
        throw Error("Lexing errors detected")
    }

    // It is recommended to only initialize a Chevrotain Parser once
    // and reset it's state instead of re-initializing it
    if (parserInstance === undefined) {
        parserInstance = new parser([])
    }

    if (lexOnly) {
        return lexResult.tokens
    } else {
        // setting a new input will RESET the parser instance's state.
        parserInstance.input = lexResult.tokens

        // any top level rule may be used as an entry point
        var value = parserInstance[rootRule]()

        if (parserInstance.errors.length > 0) {
            throw Error("Parsing Errors detected")
        }
        return {
            value: value, // this is a pure grammar, the value will always be <undefined>
            lexErrors: lexResult.errors,
            parseErrors: parserInstance.errors
        }
    }
}
