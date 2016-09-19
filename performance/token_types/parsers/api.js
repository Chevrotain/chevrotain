// ----------------- wrapping it all together -----------------
function performSingleLexAndParserBase(text) {
    var lexResult = base.lexer.tokenize(text);

    // setting a new input will RESET the parser instance's state.
    base.parser.input = lexResult.tokens;

    // any top level rule may be used as an entry point
    var value = base.parser.json();

    if (lexResult.errors.length > 0 || base.parser.errors.length > 0) {
        throw Error("sad sad panda");
    }

    return {
        value:       value, // this is a pure grammar, the value will always be <undefined>
        lexErrors:   lexResult.errors,
        parseErrors: base.parser.errors
    };
}

function performSingleLexAndParserLazy(text) {
    var lexResult = lazy.lexer.tokenize(text);

    // setting a new input will RESET the parser instance's state.
    lazy.parser.input = lexResult.tokens;

    // any top level rule may be used as an entry point
    var value = lazy.parser.json();

    if (lexResult.errors.length > 0 || lazy.parser.errors.length > 0) {
        throw Error("sad sad panda");
    }

    return {
        value:       value, // this is a pure grammar, the value will always be <undefined>
        lexErrors:   lexResult.errors,
        parseErrors: lazy.parser.errors
    };
}

function performSingleLexAndParserSimpleLazy(text) {
    var lexResult = simpleLazy.lexer.tokenize(text);

    // setting a new input will RESET the parser instance's state.
    simpleLazy.parser.input = lexResult.tokens;

    // any top level rule may be used as an entry point
    var value = simpleLazy.parser.json();

    if (lexResult.errors.length > 0 || simpleLazy.parser.errors.length > 0) {
        throw Error("sad sad panda");
    }

    return {
        value:       value, // this is a pure grammar, the value will always be <undefined>
        lexErrors:   lexResult.errors,
        parseErrors: simpleLazy.parser.errors
    };
}
