function parse_json_with_nearley(input) {
    // No known API to reset the parser state, may not be possible to avoid parser reinitialization.
    // trying to clone the internal state of the parser to face a "reset" also fails
    var nearleyJsonParser = new nearley.Parser(nearley_parser.ParserRules, nearley_parser.ParserStart);
    var lexResult = handBuiltLexer.lex(input);
    nearleyJsonParser.feed(lexResult.tokens);
}