
// ----------------- wrapping it all together -----------------
function parseChevrotainWithJisonLexer(text) {
    var fullResult = {};

    jisonLexer.setInput(text);
    var reachedEOF = false;
    var tokens = [];

    // lex the whole input
    while (!reachedEOF) {
        var nextToken = jisonLexer.lex();
        if (nextToken === 'EOF') {
            reachedEOF = true;
        }
        else {
            tokens.push(nextToken);
        }
    }

    var parser = new JsonParser(tokens);
    parser.object();

    fullResult.tokens = tokens;
    fullResult.parseErrors = parser.errors;
    fullResult.lexerDone = jisonLexer.done;

    if (parser.errors.length > 0) {
        throw "Errors when parsing with Chevrotain and jison lexer"
    }
    return fullResult;
}


function parseChevrotainWithHandBuiltLexer(text) {
    var lextTest = chevrotain.examples.json.lexer.lex('"bamba\\r" : true');

    var fullResult = {};
    var lexResult = chevrotain.examples.json.lexer.lex(text);

    var parser = new JsonParser(lexResult.tokens);
    parser.object();

    fullResult.tokens = lexResult.tokens;
    fullResult.parseErrors = parser.errors;

    if (parser.errors.length >0) {
        throw "Errors when parsing with Chevrotain and hand built lexer"
    }

    return fullResult;
}