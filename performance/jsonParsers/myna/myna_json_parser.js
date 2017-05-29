
// JSON Parser built with the Myna parsing library
//
// * Myna - https://github.com/cdiggins/myna-parser 
// * JSON Grammar - https://github.com/cdiggins/myna-parser/blob/master/grammars/grammar_json.js

(function (exports) {
    var grammar = CreateJsonGrammar(Myna);
    var rule = grammar.array;
    exports.parseJsonMyna = function(input) {
        var ast = Myna.parse(rule, input);
        // Uncomment this line to see the generated AST 
        //console.log(ast.allText);
    }
})(this);
