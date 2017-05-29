(function (exports) {
    var grammar = CreateJsonGrammar(Myna);
    var rule = grammar.array;
    exports.parse_json_myna = function parse_json_myna(input) {
        var ast = Myna.parse(rule, input);
        //console.log(ast.allText);
    }
})(this);
