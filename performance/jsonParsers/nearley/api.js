var mooLexer = moo.compile({
    WS: {match: /\s+/, lineBreaks: true},
    StringLiteral: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/,
    NumberLiteral: /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/,
    Comma: ',',
    Colon: ':',
    LCurly: '{',
    RCurly: '}',
    LSquare: '[',
    RSquare: ']',
    True: /true/,
    False: /false/,
    Null: /null/,
})

// remove default post processors for fairer benchmark
nearley_parser.ParserRules.forEach(function (currRule) {
    currRule.postprocess = undefined
})

function parse(input) {
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