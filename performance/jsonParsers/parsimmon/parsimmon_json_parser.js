// based on: https://github.com/jneen/parsimmon/blob/master/examples/json.js

var x
(function (exports) {

    var P = Parsimmon;

    ///////////////////////////////////////////////////////////////////////

    // This gets reused for both array and object parsing.
    function commaSep(parser) {
        return P.sepBy(parser, token(P.string(',')))
    }

    // Use the JSON standard's definition of whitespace rather than Parsimmon's.
    var whitespace = P.regexp(/\s*/m);

    // JSON is pretty relaxed about whitespace, so let's make it easy to ignore
    // after most text.
    function token(p) {
        return p.skip(whitespace);
    }

    // The basic tokens in JSON, with optional whitespace afterward.
    var lbrace = token(P.string('{'));
    var rbrace = token(P.string('}'));
    var lbracket = token(P.string('['));
    var rbracket = token(P.string(']'));
    var comma = token(P.string(','));
    var colon = token(P.string(':'));

    // `.result` is like `.map` but it takes a value instead of a function, and
    // `.always returns the same value.
    var nullLiteral = token(P.string('null')).result(null);
    var trueLiteral = token(P.string('true')).result(true);
    var falseLiteral = token(P.string('false')).result(false);

    // Regexp based parsers should generally be named for better error reporting.
    var stringLiteral =
        token(P.regexp(/"(?:[^\\"]+|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/))
            .desc('string');

    var numberLiteral =
        token(P.regexp(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/))
            .desc('number');

    // This is the main entry point of the parser: a full JSON document.
    var json = P.lazy(function () {
        return whitespace.then(P.alt(
            stringLiteral,
            numberLiteral,
            object,
            array,
            trueLiteral,
            falseLiteral,
            nullLiteral
        ));
    });

    // Array parsing is just ignoring brackets and commas and parsing as many nested
    // JSON documents as possible. Notice that we're using the parser `json` we just
    // defined above. Arrays and objects in the JSON grammar are recursive because
    // they can contain any other JSON document within them.
    var array = lbracket.then(commaSep(json)).skip(rbracket);

    // Object parsing is a little trickier because we have to collect all the key-
    // value pairs in order as length-2 arrays, then manually copy them into an
    // object.
    var pair = P.seq(stringLiteral.skip(colon), json);
    var object =
        lbrace.then(commaSep(pair)).skip(rbrace)

    ///////////////////////////////////////////////////////////////////////
    exports.parse_json_parsimmon = function parse_json_parsimmon(input) {
        x = json.parse(input, 'utf-8');
    }
})(this);
