
function onInputEditorContentChange() {

    function lexAndParse(text, lexer, parser, startRuleName) {
        var lexResult = lexer.tokenize(text)
        parser.reset()
        parser.input = lexResult.tokens
        var value = parser[startRuleName]()
        return {value: value, lexErrors: lexResult.errors, parseErrors: parser.errors}
    }

    parserOutput.val("")
    var result = lexAndParse(inputEditor.getValue(), lexer, parser, defaultRuleName)
    markInputErrors(result.lexErrors, result.parseErrors)
    var resultValue = result.value
    var processedResult
    if (_.isNumber(resultValue) || _.isString(resultValue) || _.isBoolean(resultValue)) {
        processedResult = resultValue // no processing needed
    }
    else if (_.isObject(resultValue)) {
        processedResult = JSON.stringify(resultValue, null, "\t") // TODO: any better way to display json?
    }
    parserOutput.val(processedResult)
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
    var editorFuncVal = eval(javaScriptEditor.getValue())
    var parserConstructor = editorFuncVal.parser
    lexer = editorFuncVal.lexer
    markLexerDefinitionErrors(lexer)
    defaultRuleName = editorFuncVal.defaultRule
    parser = new parserConstructor()
    markParserDefinitionErrors(parser)
    var topRules = parser.getGAstProductions().values()
    renderSyntaxDiagrams(topRules)
}
