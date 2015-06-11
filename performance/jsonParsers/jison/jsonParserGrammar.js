// Original version from : https://raw.githubusercontent.com/zaach/jison/master/examples/json.js
// * removed lexer macros which caused issues when inserted into regExp char blocks []
// * removed '\b' word boundry used in some of the lexer rules
// * simplified number regExp
// * fixed missing grammar rule for 'JSONNullLiteral'

var grammar = {
    "comment": "ECMA-262 5th Edition, 15.12.1 The JSON Grammar.",
    "author": "Zach Carter",

    "lex": {
        "rules": [
            ["\\s+", "/* skip whitespace */"],
            ["-?(:?0|[1-9]\\d*)(:?\\.\\d+)?(:?[eE][+-]?\\d+)?", "return 'NUMBER';"],
            ["\"(?:\\\\[\"bfnrt/\\\\]|\\\\u[a-fA-F0-9]{4}|[^\"\\\\])*\"", "return 'STRING';"],
            ["\\{", "return '{'"],
            ["\\}", "return '}'"],
            ["\\[", "return '['"],
            ["\\]", "return ']'"],
            [",", "return ','"],
            [":", "return ':'"],
            ["true", "return 'TRUE'"],
            ["false", "return 'FALSE'"],
            ["null", "return 'NULL'"]
        ]
    },

    "tokens": "STRING NUMBER { } [ ] , : TRUE FALSE NULL",
    "start": "JSONText",

    "bnf": {
        "JSONString": [ "STRING" ],

        "JSONNumber": [ "NUMBER" ],

        "JSONBooleanLiteral": [ "TRUE", "FALSE" ],

        "JSONNullLiteral" : [ "NULL" ],

        "JSONText": [ "JSONValue" ],

        "JSONValue": [ "JSONNullLiteral",
                       "JSONBooleanLiteral",
                       "JSONString",
                       "JSONNumber",
                       "JSONObject",
                       "JSONArray" ],

        "JSONObject": [ "{ }",
                        "{ JSONMemberList }" ],

        "JSONMember": [ "JSONString : JSONValue" ],

        "JSONMemberList": [ "JSONMember",
                              "JSONMemberList , JSONMember" ],

        "JSONArray": [ "[ ]",
                       "[ JSONElementList ]" ],

        "JSONElementList": [ "JSONValue",
                             "JSONElementList , JSONValue" ]
    }
};

var options = {type: "slr", moduleType: "commonjs", moduleName: "jsoncheck"};


var Parser = require("jison").Parser;
var jsonParser = new Parser(grammar);
var parserSource = jsonParser.generate({moduleName: "jisonJsonLexerAndParser"});

var JisonLex = require('jison-lex');
var lexerSource = JisonLex.generate(grammar.lex);

var fs = require("fs");
// must be a way to connect the generated lexer and parser in a better way...
fs.writeFileSync("jisonParser.js", parserSource + "\n\n\n\n\n" + lexerSource + "\n jisonJsonLexerAndParser.lexer = lexer;");

