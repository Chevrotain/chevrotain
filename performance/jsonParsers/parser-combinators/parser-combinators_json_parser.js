import { any, between, lazy, regex, seq, str, zeroOrMany, ParseText } from 'https://unpkg.com/parser-combinators/dist-esm/index.js';

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

const JArray = lazy(() => seq(
    LSquare,
    WhiteSpace,
    zeroOrMany(Value, Comma),
    WhiteSpace,
    RSquare
));

const JObject = lazy(() => seq(
    LCurly,
    WhiteSpace,
    zeroOrMany(ObjectEntry, Comma),
    WhiteSpace,
    RCurly
));

const Value = any(
    StringLiteral,
    NumberLiteral,
    JObject,
    JArray,
    True,
    False,
    Null,
);

const ObjectEntry = seq(StringLiteral, WhiteSpace, Colon, WhiteSpace, Value);

const json = between(WhiteSpace, Value, WhiteSpace);

window.parse = function(input) {
    return ParseText(input, json);
}
