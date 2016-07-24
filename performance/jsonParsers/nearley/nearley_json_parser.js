// Generated automatically by nearley
// http://github.com/Hardmath123/nearley
(function () {
function id(x) {return x[0]; }
var grammar = {
    ParserRules: [
    {"name": "json$subexpression$1", "symbols": ["object"]},
    {"name": "json$subexpression$1", "symbols": ["array"]},
    {"name": "json", "symbols": ["json$subexpression$1"]},
    {"name": "object$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "object$ebnf$1$subexpression$1$ebnf$1$subexpression$1", "symbols": [{"literal":","}, "objectItem"]},
    {"name": "object$ebnf$1$subexpression$1$ebnf$1", "symbols": ["object$ebnf$1$subexpression$1$ebnf$1$subexpression$1", "object$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "object$ebnf$1$subexpression$1", "symbols": ["objectItem", "object$ebnf$1$subexpression$1$ebnf$1"]},
    {"name": "object$ebnf$1", "symbols": ["object$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "object$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "object", "symbols": [{"literal":"{"}, "object$ebnf$1", {"literal":"}"}]},
    {"name": "objectItem", "symbols": ["stringLiteral", {"literal":":"}, "value"]},
    {"name": "array$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "array$ebnf$1$subexpression$1$ebnf$1$subexpression$1", "symbols": [{"literal":","}, "value"]},
    {"name": "array$ebnf$1$subexpression$1$ebnf$1", "symbols": ["array$ebnf$1$subexpression$1$ebnf$1$subexpression$1", "array$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "array$ebnf$1$subexpression$1", "symbols": ["value", "array$ebnf$1$subexpression$1$ebnf$1"]},
    {"name": "array$ebnf$1", "symbols": ["array$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "array$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "array", "symbols": [{"literal":"["}, "array$ebnf$1", {"literal":"]"}]},
    {"name": "value", "symbols": ["stringLiteral"]},
    {"name": "value", "symbols": ["numberLiteral"]},
    {"name": "value", "symbols": ["object"]},
    {"name": "value", "symbols": ["array"]},
    {"name": "value$string$1", "symbols": [{"literal":"t"}, {"literal":"r"}, {"literal":"u"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "value", "symbols": ["value$string$1"]},
    {"name": "value$string$2", "symbols": [{"literal":"f"}, {"literal":"a"}, {"literal":"l"}, {"literal":"s"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "value", "symbols": ["value$string$2"]},
    {"name": "value$string$3", "symbols": [{"literal":"n"}, {"literal":"u"}, {"literal":"l"}, {"literal":"l"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "value", "symbols": ["value$string$3"]},
    {"name": "stringLiteral$ebnf$1", "symbols": [/[^\\"]/]},
    {"name": "stringLiteral$ebnf$1", "symbols": [/[^\\"]/, "stringLiteral$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "stringLiteral", "symbols": [{"literal":"\""}, "stringLiteral$ebnf$1", {"literal":"\""}]},
    {"name": "numberLiteral$ebnf$1", "symbols": [{"literal":"-"}], "postprocess": id},
    {"name": "numberLiteral$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "numberLiteral$subexpression$1", "symbols": [{"literal":"0"}]},
    {"name": "numberLiteral$subexpression$1$ebnf$1", "symbols": []},
    {"name": "numberLiteral$subexpression$1$ebnf$1", "symbols": [/[0-9]/, "numberLiteral$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "numberLiteral$subexpression$1", "symbols": [/[1-9]/, "numberLiteral$subexpression$1$ebnf$1"]},
    {"name": "numberLiteral$ebnf$2$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "numberLiteral$ebnf$2$subexpression$1$ebnf$1", "symbols": [/[0-9]/, "numberLiteral$ebnf$2$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "numberLiteral$ebnf$2$subexpression$1", "symbols": [{"literal":"."}, "numberLiteral$ebnf$2$subexpression$1$ebnf$1"]},
    {"name": "numberLiteral$ebnf$2", "symbols": ["numberLiteral$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "numberLiteral$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "numberLiteral$ebnf$3$subexpression$1$ebnf$1", "symbols": [/[+-]/], "postprocess": id},
    {"name": "numberLiteral$ebnf$3$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "numberLiteral$ebnf$3$subexpression$1$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "numberLiteral$ebnf$3$subexpression$1$ebnf$2", "symbols": [/[0-9]/, "numberLiteral$ebnf$3$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "numberLiteral$ebnf$3$subexpression$1", "symbols": [/[eE]/, "numberLiteral$ebnf$3$subexpression$1$ebnf$1", "numberLiteral$ebnf$3$subexpression$1$ebnf$2"]},
    {"name": "numberLiteral$ebnf$3", "symbols": ["numberLiteral$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "numberLiteral$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "numberLiteral", "symbols": ["numberLiteral$ebnf$1", "numberLiteral$subexpression$1", "numberLiteral$ebnf$2", "numberLiteral$ebnf$3"]},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": [/[\s]/, "_$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "_", "symbols": ["_$ebnf$1"]}
]
  , ParserStart: "json"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.nearley_parser = grammar;
}
})();
