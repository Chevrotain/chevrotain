// ----------------- wrapping it all together -----------------
var chevrotainJsonParserInstance
function chevrotainParseWithChevrotainLexer(text) {
    var lexResult = ChevJsonLexer.tokenize(text);
    if (lexResult.errors.length > 0) {
        throw Error("Lexing errors detected")
    }

    // It is recommended to only initialize a Chevrotain Parser once
    // and reset it's state instead of re-initializing it
    if (chevrotainJsonParserInstance === undefined) {
        chevrotainJsonParserInstance = new ChevrotainJsonParser([])
    }

    // setting a new input will RESET the parser instance's state.
    chevrotainJsonParserInstance.input = lexResult.tokens;

    // any top level rule may be used as an entry point
    var value = chevrotainJsonParserInstance.json();

    if (chevrotainJsonParserInstance.errors.length > 0) {
        throw Error("Parsing Errors detected")
    }
    return {
        value: value, // this is a pure grammar, the value will always be <undefined>
        lexErrors: lexResult.errors,
        parseErrors: chevrotainJsonParserInstance.errors
    };
}

// ----------------- wrapping it all together -----------------
function chevrotainParseWithHandBuiltLexer(text) {
    var fullResult = {};
    var lexResult = handBuiltLexer.lex(text);

    var parser = new ChevrotainJsonParser(lexResult.tokens);
    parser.object();

    fullResult.tokens = lexResult.tokens;
    fullResult.parseErrors = parser.errors;

    if (parser.errors.length > 0) {
        throw "Errors when parsing with Chevrotain and hand built lexer"
    }

    return fullResult;
}