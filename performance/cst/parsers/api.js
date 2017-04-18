// ----------------- wrapping it all together -----------------
function performSingleLexAndParserBase(text, lexerAndParser) {
    var lexResult = lexerAndParser.lexer.tokenize(text);

    // setting a new input will RESET the parser instance's state.
    lexerAndParser.parser.input = lexResult.tokens;

    // any top level rule may be used as an entry point
    var value = lexerAndParser.parser.json();

    if (lexResult.errors.length > 0 || lexerAndParser.parser.errors.length > 0) {
        throw Error("sad sad panda");
    }

    return {
        value:       value,
        lexErrors:   lexResult.errors,
        parseErrors: lexerAndParser.parser.errors
    };
}

