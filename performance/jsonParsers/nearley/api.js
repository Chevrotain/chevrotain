var mooLexer = Moo.compile({
    WS: {match: /\s+/, lineBreaks: true},
    NumberLiteral: /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/,
    StringLiteral: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/,
    LCurly: '{',
    RCurly: '}',
    LSquare: '[',
    RSquare: ']',
    Comma: ',',
    Colon: ':',
    True: /true/,
    False: /false/,
    Null: /null/,
})


function parse_json_with_nearley(input) {
    // No known API to reset the parser state, may not be possible to avoid parser reinitialization.
    // trying to clone the internal state of the parser to face a "reset" also fails
    var nearleyJsonParser = new nearley.Parser(nearley_parser.ParserRules, nearley_parser.ParserStart);

    mooLexer.reset(input)
    var tokens = []
    var tok
    while (tok = mooLexer.next()) {
        if (tok.type !== "WS") {
            tokens.push(tok)
        }
    }

    nearleyJsonParser.feed(tokens);
}
