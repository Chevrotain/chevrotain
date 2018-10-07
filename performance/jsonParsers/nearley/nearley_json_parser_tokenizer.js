// Generated automatically by nearley, version 2.15.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

var LCurly = {test: function(x) {return x.type === "LCurly"; }}
var RCurly = {test: function(x) {return x.type === "RCurly"; }}

var LSquare = {test: function(x) {return x.type === "LSquare"; }}
var RSquare = {test: function(x) {return x.type === "RSquare"; }}

var Colon = {test: function(x) {return x.type === "Colon"; }}
var Comma = {test: function(x) {return x.type === "Comma"; }}

var True = {test: function(x) {return x.type === "True"; }}
var False = {test: function(x) {return x.type === "False"; }}
var Null = {test: function(x) {return x.type === "Null"; }}

var StringLiteral = {test: function(x) {return x.type === "StringLiteral"; }}
var NumberLiteral = {test: function(x) {return x.type === "NumberLiteral"; }}
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "json$subexpression$1", "symbols": ["object"]},
    {"name": "json$subexpression$1", "symbols": ["array"]},
    {"name": "json", "symbols": ["json$subexpression$1"]},
    {"name": "object$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "object$ebnf$1$subexpression$1$ebnf$1$subexpression$1", "symbols": [Comma, "objectItem"]},
    {"name": "object$ebnf$1$subexpression$1$ebnf$1", "symbols": ["object$ebnf$1$subexpression$1$ebnf$1", "object$ebnf$1$subexpression$1$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "object$ebnf$1$subexpression$1", "symbols": ["objectItem", "object$ebnf$1$subexpression$1$ebnf$1"]},
    {"name": "object$ebnf$1", "symbols": ["object$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "object$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "object", "symbols": [LCurly, "object$ebnf$1", RCurly]},
    {"name": "objectItem", "symbols": [StringLiteral, Colon, "value"]},
    {"name": "array$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "array$ebnf$1$subexpression$1$ebnf$1$subexpression$1", "symbols": [Comma, "value"]},
    {"name": "array$ebnf$1$subexpression$1$ebnf$1", "symbols": ["array$ebnf$1$subexpression$1$ebnf$1", "array$ebnf$1$subexpression$1$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "array$ebnf$1$subexpression$1", "symbols": ["value", "array$ebnf$1$subexpression$1$ebnf$1"]},
    {"name": "array$ebnf$1", "symbols": ["array$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "array$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "array", "symbols": [LSquare, "array$ebnf$1", RSquare]},
    {"name": "value", "symbols": [StringLiteral]},
    {"name": "value", "symbols": [NumberLiteral]},
    {"name": "value", "symbols": ["object"]},
    {"name": "value", "symbols": ["array"]},
    {"name": "value", "symbols": [True]},
    {"name": "value", "symbols": [False]},
    {"name": "value", "symbols": [Null]}
]
  , ParserStart: "json"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.nearley_parser = grammar;
}
})();
