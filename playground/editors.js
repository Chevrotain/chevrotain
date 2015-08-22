function onInputEditorContentChange() {
    var parseResult, printResult

    function lex(text) {
        var lexResult = lexer.tokenize(text)
        return lexResult
    }

    function parse(lexResult, startRuleName) {
        parser.reset()
        parser.input = lexResult.tokens
        var value = parser[startRuleName]()
        return {value: value, parseErrors: parser.errors}
    }

    parserOutput.setValue("")
    var lexResult = lex(inputEditor.getValue(), defaultRuleName)
    // may be falsy if the example is for the lexer only
    if (parser) {
        parseResult = parse(lexResult, defaultRuleName)
        markInputErrors(lexResult.errors, parseResult.parseErrors)
        printResult = parseResult.value
    }
    else {
        markInputErrors(lexResult.errors, [])

        printResult = _.mapValues(lexResult, function (value, key) {
            if (key === "tokens") {
                return _.map(value, function (token) {
                    token.tokenName = chevrotain.tokenName(token.constructor)
                    return token
                })
            }
            else {
                return value
            }
        })
    }

    var processedResult
    if (_.isString(printResult)) {
        processedResult = printResult // no processing needed
    }
    else if (_.isNumber(printResult) || _.isBoolean(printResult)) {
        processedResult = new String(printResult)
    }
    else if (_.isObject(printResult)) {
        processedResult = JSON.stringify(printResult, null, "\t")
    }

    parserOutput.setValue(processedResult ? processedResult : "")
}


function onImplementationEditorContentChange() {

    function cleanChevrotainCache() {
        var hashmaps = _.filter(chevrotain.cache, function (prop) {
            return prop instanceof chevrotain.lang.HashTable
        })

        _.forEach(hashmaps, function (cacheMap) {
            cacheMap._state = {}
        })
    }

    cleanChevrotainCache()
    try {
        var editorFuncVal = eval(javaScriptEditor.getValue())
        var parserConstructor = editorFuncVal.parser
        lexer = editorFuncVal.lexer
        markLexerDefinitionErrors(lexer)
        defaultRuleName = editorFuncVal.defaultRule

        // may be falsy if the example is for the lexer only
        if (parserConstructor) {
            parser = new parserConstructor()
            markParserDefinitionErrors(parser)
            var topRules = parser.getGAstProductions().values()
            renderSyntaxDiagrams(topRules)
            showDiagrams()
        } else { // lexer Only Example
            parser = undefined
            renderSyntaxDiagrams([])
            hideDiagrams()
        }
        onInputEditorContentChange()
    }
    catch (e){
        parserOutput.setValue("Error during evaluation of the implementation: \n" + e.toString())
        parserOutput.markText({line:0, ch:0}, {line:100,ch:100}, {
            className: "markEvalError"
        })
    }
}
