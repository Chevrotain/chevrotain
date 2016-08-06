function antlr4LexerAndParser(text) {
    // using an API as documented in https://github.com/antlr/antlr4/blob/master/doc/javascript-target.md
    // It seems like these instances must be created anew for each parse.
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
