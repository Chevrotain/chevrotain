function antlr4WithRequireLexerAndParser(text) {
    var chars = new antlr4WithRequire.InputStream(text);
    var lexer = new antlr4WithRequireJsonLexer(chars);
    var tokens = new antlr4WithRequire.CommonTokenStream(lexer);
    var parser = new antlr4WithRequireJsonParser(tokens);
    parser.buildParseTrees = false;
    parser.json();
    if (parser._errHandler.lastErrorIndex !== -1) {
        throw Error("errors found while parsing with Antlr4 withRequire");
    }
}
