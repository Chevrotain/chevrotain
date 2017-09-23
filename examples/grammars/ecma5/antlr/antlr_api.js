const antlr4 = require("antlr4")
const ECMAScriptLexer = require("./ECMAScriptLexer").ECMAScriptLexer
const ECMAScriptParser = require("./ECMAScriptParser").ECMAScriptParser

function parse(text) {
    // using an API as documented in https://github.com/antlr/antlr4/blob/master/doc/javascript-target.md
    // It seems like these instances must be created anew for each parse.
    var chars = new antlr4.InputStream(text);
    var lexer = new ECMAScriptLexer(chars);
    var tokens = new antlr4.CommonTokenStream(lexer);
    var parser = new ECMAScriptParser(tokens);
    parser.buildParseTrees = false;

    // parser._interp.predictionMode = antlr4.atn.PredictionMode.SLL;

    parser.program();
    if (parser._errHandler.lastErrorIndex !== -1) {
        throw Error("errors found while parsing with Antlr4");
    }
}


module.exports = {
    parse
}