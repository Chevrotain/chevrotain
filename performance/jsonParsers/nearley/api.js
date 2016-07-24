

function parse_json_with_nearley(input) {
    var nearleyJsonParser = new nearley.Parser(nearley_parser.ParserRules, nearley_parser.ParserStart);
    nearleyJsonParser.feed(input);
}