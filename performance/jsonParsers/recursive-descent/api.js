import { BNFParser, Parser } from './module.js';

// from: https://github.com/egemadra/recursive-descent/blob/master/examples/json/json.grammar
// based on: https://github.com/antlr/grammars-v4/blob/master/json/JSON.g4
const grammar = `
ignore = ~[ \t\n\r]+~ ;

false = 'false';
true  = 'true';
null  = 'null';

program : value ;

value : string | number | object | array | true | false | null ;

object : '{' object_body? '}' ;

object_body : pair <(',' pair)* ;

pair : string ':' value ;

array : '[' array_body? ']' ;

array_body : value <(',' value)* ;

string = ~"((\\u[A-Fa-f0-9]{4})|[^\\"\u0000-\u001F]|(\\[bfnrt"\\]))*"~ ;

number = ~\-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+\-]?(0|[1-9][0-9]*))?~ ;
`;

const bnfParser = new BNFParser(grammar);
const rules = bnfParser.parse();

//Ask parser to not to give us tokens that don't represent a value
//This results in much cleaner and smaller tree.
const options = {
    exclude: ["{", "}", "[", "]", ",", ':']
};

window.parse = function(program) {
    //Parse the program
    const parser = new Parser(rules, program, options);
    const root = parser.parse();
};
