import { str, between, regex, any, seq, zeroOrMany, ParseText } from 'https://unpkg.com/parser-combinators/dist-esm/index.js';

const WhiteSpace = regex(/\s*/m, 'whitespace');

const True = str("true");
const False = str("false");
const Null = str("null");
const LCurly = str("{");
const RCurly = str("}");
const LSquare = str("[");
const RSquare = str("]");
const Comma = between(WhiteSpace, str(","), WhiteSpace);
const Colon = str(":");

const StringLiteral = regex(/"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/, 'string literal');
const NumberLiteral = regex(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/, 'number literal');

const Value = any(
    StringLiteral,
    NumberLiteral,
    JObject(),
    JArray(),
    True,
    False,
    Null,
);

const ObjectEntry = seq(StringLiteral, WhiteSpace, Colon, WhiteSpace, Value);

function JArray() {
    return (ctx) => seq(
        LSquare,
        WhiteSpace,
        zeroOrMany(Value, Comma),
        WhiteSpace,
        RSquare
    )(ctx);
};

function JObject() {
    return (ctx) => seq(
        LCurly,
        WhiteSpace,
        zeroOrMany(ObjectEntry, Comma),
        WhiteSpace,
        RCurly
    )(ctx);
}

const json = between(WhiteSpace, Value, WhiteSpace);

window.parse = function(input) {
    return ParseText(input, json);
}
