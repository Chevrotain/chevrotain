function antlr4LexerAndParser(text) {
    var chars = new antlr4.InputStream(text);
    var lexer = new antlr4Json.JSON_ANTLRLexer(chars);
    var tokens = new antlr4.CommonTokenStream(lexer);
    var parser = new antlr4Json.JSON_ANTLRParser(tokens);
    parser.buildParseTrees = false;
    parser.json();
    if (parser._errHandler.lastErrorIndex !== -1) {
        throw Error("errors found while parsing with Antlr4");
    }
}
