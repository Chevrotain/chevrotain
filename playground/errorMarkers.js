function markInputErrors(lexErrors, parseErrors) {
    var start, end, marker
    _.forEach(inputEditorMarkers, function (currMarker) {
        currMarker.clear()
    })
    inputEditorMarkers = []

    _.forEach(lexErrors, function (currLexError) {
        start = {line: currLexError.line - 1, ch: currLexError.column - 1}
        end = {
            line: currLexError.line - 1,
            ch  : currLexError.column - 1 + currLexError.length
        }
        marker = inputEditor.markText(start, end, {
            className: "markTextError",
            title    : currLexError.message
        })
        inputEditorMarkers.push(marker)
    })

    _.forEach(parseErrors, function (currParserError) {
        start = {
            line: currParserError.token.startLine - 1,
            ch  : currParserError.token.startColumn - 1
        }
        end = {
            line: currParserError.token.endLine - 1,
            ch  : currParserError.token.endColumn
        }
        marker = inputEditor.markText(start, end, {
            className: "markTextError",
            title    : currParserError.message
        })
        inputEditorMarkers.push(marker)
    })
}


function markLexerDefinitionErrors(lexer) {
    var marker, errPositions
    _.forEach(lexerErrorsMarkers, function (currMarker) {
        currMarker.clear()
    })
    lexerErrorsMarkers = []

    // TODO: duplicate errors, mark all RegExp
    // invalid errors, mark extendToken or the invalid param
    // missing ? not sure need to be handled maybe mark the extend Token?
    _.forEach(lexer.lexerDefinitionErrors, function (currLexError) {
        errPositions = getLexerErrorStartStopPos(currLexError, javaScriptEditor.getValue(), javaScriptEditor)
        _.forEach(errPositions, function (currPos) {
            marker = javaScriptEditor.markText(currPos.start, currPos.end, {
                className: "markTextError",
                title    : currLexError.message
            })
            lexerErrorsMarkers.push(marker)
        })
    })
}


// TODO extract common logic with markLexerDefinitonErrors
function markParserDefinitionErrors(parser) {
    var marker, errPositions
    _.forEach(parserErrorsMarkers, function (currMarker) {
        currMarker.clear()
    })
    parserErrorsMarkers = []

    _.forEach(parser.definitionErrors, function (currParserDefError) {
        errPositions = getParserErrorStartStopPos(currParserDefError, javaScriptEditor.getValue(), parser.getGAstProductions(), javaScriptEditor)
        _.forEach(errPositions, function (currPos) {
            marker = javaScriptEditor.markText(currPos.start, currPos.end, {
                className: "markTextError",
                title    : currParserDefError.message
            })
            parserErrorsMarkers.push(marker)
        })
    })
}


/**
 * @param {chevrotain.ILexerDefinitionError} lexErr
 * @param {string} parserImplText
 * @param {{posFromIndex:{Function(Number):{line:number, ch:number}}}} positionHelper
 *
 * @return {{start:{line:number, column:number},
 *             end:{line:number, column:number}[]}
 */
function getLexerErrorStartStopPos(lexErr, parserImplText, positionHelper) {
    switch (lexErr.type) {
        case chevrotain.LexerDefinitionErrorType.DUPLICATE_PATTERNS_FOUND:
            return locateRegExpLiteral(_.first(lexErr.tokenClasses).PATTERN, parserImplText, positionHelper, lexErr.tokenClasses.length)
            break
        case chevrotain.LexerDefinitionErrorType.INVALID_PATTERN:
        case chevrotain.LexerDefinitionErrorType.MISSING_PATTERN:
            return [locateExtendTokenPos(_.first(lexErr.tokenClasses), parserImplText, positionHelper)]
            break
        case chevrotain.LexerDefinitionErrorType.EOI_ANCHOR_FOUND:
        case chevrotain.LexerDefinitionErrorType.INVALID_GROUP_TYPE_FOUND:
        case chevrotain.LexerDefinitionErrorType.UNSUPPORTED_FLAGS_FOUND:
        default:
            return locateRegExpLiteral(_.first(lexErr.tokenClasses).PATTERN, parserImplText, positionHelper, 1)
    }
}


/**
 * @param {RegExp} regExp - the regExp whose literal we are seeking in the text.
 * @param {string} text - the text to search in.
 * @param {{posFromIndex:{Function(Number):{line:number, ch:number}}}} positionHelper
 * @param {number} times - how many occurrences of the RegExp literal to seek.
 *
 * @return {{start:{line:number, column:number},
 *             end:{line:number, column:number}}
 */
function locateRegExpLiteral(regExp, text, positionHelper, times) {
    var fromOffset = 0
    var soughtPattern = regExp.toString()

    // TODO: use regExp with global flag and tons of escaping instead of fixed number of searched, this will make it idiot proof
    return _.map(_.range(times), function () {
        var startOffset = text.indexOf(soughtPattern, fromOffset)
        var endOffset = startOffset + soughtPattern.length
        var startPos = positionHelper.posFromIndex(startOffset)
        var endPos = positionHelper.posFromIndex(endOffset)
        fromOffset = endOffset
        return {start: startPos, end: endPos}
    })
}


/**
 *
 * @param {Function} tokenClass - constructor of the Token whos definition we are seeking.
 * @param {string} text - the text to seek the definition in.
 * @param {{posFromIndex:{Function(Number):{line:number, ch:number}}}} positionHelper
 *
 * @return {{start:{line:number, column:number},
 *             end:{line:number, column:number}}
 */
function locateExtendTokenPos(tokenClass, text, positionHelper) {
    var tokenName = chevrotain.tokenName(tokenClass)
    var extendRegExp = RegExp("extendToken\\s*\\(\\s*('|\")" + tokenName)
    var execResult = extendRegExp.exec(text)

    if (!execResult) {
        return undefined
    }

    var startOffset = execResult.index
    // TODO: edge case where we failed to locate the closing parenthesis, fail gracefully
    var endOffset = locateClosingParenthesis(startOffset, text)
    var startPos = positionHelper.posFromIndex(startOffset)
    var endPos = positionHelper.posFromIndex(endOffset)
    return {start: startPos, end: endPos}
}


/**
 * locates the closing parenthesis of a function invocation.
 *
 * @param startOffset - offset to start looking from.
 * @param text - the text to look in.
 *
 * @return {number} offset in which the closing parenthesis is found, or -1 is none was found
 */
function locateClosingParenthesis(startOffset, text) {

    // TODO: currently ignoring string/regexp literals/comments which makes this somewhat
    // none robust, however for the basic scenarios for which this is supposed to work.
    // missing patterns/invalid patterns types, it should work for the vast majority of
    // cases. This can be upgraded later to be more robust...
    var currOffset = startOffset
    var found = false
    while (!found && currOffset < text.length) {
        if (text.charAt(currOffset) === ")") {
            return currOffset
        }
        currOffset++
    }

    return -1
}


/**
 * @param {chevrotain.IParserDefinitionError} parseErr
 * @param {string} parserImplText
 * @param {lang.HashTable<gast.Rule>} gAstProductions
 * @param {{posFromIndex:{Function(Number):{line:number, ch:number}}}} positionHelper
 *
 * @return {{start:{line:number, column:number},
 *             end:{line:number, column:number}[]}
 */
function getParserErrorStartStopPos(parseErr, parserImplText, gAstProductions, positionHelper) {
    var ruleText
    switch (parseErr.type) {
        case chevrotain.ParserDefinitionErrorType.DUPLICATE_PRODUCTIONS:
            ruleText = gAstProductions.get(parseErr.ruleName).orgText
            return locateProduction(parserImplText, ruleText, parseErr.dslName, parseErr.occurrence, positionHelper, parseErr.parameter)
            break
        case chevrotain.ParserDefinitionErrorType.DUPLICATE_RULE_NAME:
        case chevrotain.ParserDefinitionErrorType.INVALID_RULE_NAME:
            return locateRuleDefinition(parseErr.ruleName, parserImplText, positionHelper)
            break
        case chevrotain.ParserDefinitionErrorType.UNRESOLVED_SUBRULE_REF:
            ruleText = gAstProductions.get(parseErr.ruleName).orgText
            //noinspection JSUnresolvedVariable
            return locateSubruleRef(parserImplText, parseErr.unresolvedRefName, positionHelper, ruleText)
            break
        case chevrotain.ParserDefinitionErrorType.LEFT_RECURSION:
            return locateRuleDefinition(parseErr.ruleName, parserImplText, positionHelper)
            break
        case chevrotain.ParserDefinitionErrorType.NONE_LAST_EMPTY_ALT:
            ruleText = gAstProductions.get(parseErr.ruleName).orgText
            return locateProduction(parserImplText, ruleText, "OR", 1, positionHelper)
            break
        default:
            throw Error("unknown parser error type ->" + parseErr.type + "<-")
    }
}


var locateRuleDefinition = _.partial(locateGrammarDefinition, "RULE")
var locateTokenDefinition = _.partial(locateGrammarDefinition, "extendToken")

/**
 * @param {string} dslName - the chevrotain DSL name to look for (CONSUME/SUBRULE normally)
 * @param {string} paramName - the name of the rule whose definition we are seeking in the text.
 * @param {string} text - the text to search in.
 * @param {{posFromIndex:{Function(Number):{line:number, ch:number}}}} positionHelper
 *
 * @return {{start:{line:number, column:number},
 *             end:{line:number, column:number}}
 */
function locateGrammarDefinition(dslName, paramName, text, positionHelper) {
    var patternPrefixGroup = 1
    var patternRuleNameGroup = 2
    var soughtPattern = "(" + dslName + "\\s*\\(\\s*)(['\"]" + paramName + "['\"])"
    var seekerRegExp = RegExp(soughtPattern, "g")

    var found = []
    var execResult
    while ((execResult = seekerRegExp.exec(text))) {
        var startOffset = execResult.index + execResult[patternPrefixGroup].length
        var endOffset = startOffset + execResult[patternRuleNameGroup].length
        var startPos = positionHelper.posFromIndex(startOffset)
        var endPos = positionHelper.posFromIndex(endOffset)
        found.push({start: startPos, end: endPos})
    }

    return found
}


var locateOr = _.partial(locateGrammarUsage, "OR")
var locateSubruleRef = _.partial(locateGrammarUsage, "SUBRULE")
var locateConsume = _.partial(locateGrammarUsage, "CONSUME")
var locateManySepSeparator = _.partial(locateGrammarUsage, "MANY_SEP")
var locateAtLeastOneSepSeparator = _.partial(locateGrammarUsage, "AT_LEAST_ONE_SEP")

/**
 * @param {string} dslName - the chevrotain DSL name to look for (CONSUME/SUBRULE normally)
 * @param {string} fullText - the full text to search in.
 * @param {string} paramName - the name of the parameter for the DSL (CONSUME(XXX))
 * @param {{posFromIndex:{Function(Number):{line:number, ch:number}}}} positionHelper
 * @param {string} [text=fullText] - a subset of the full text to search in. by default will look in ALL the text.
 * @param {string} [occurrenceIdx] - a string which is a number between 1-5. This is the index
 *                                 of the SUBRULE[1-5]?(....)
 *
 * @return {{start:{line:number, column:number},
 *             end:{line:number, column:number}}
 */
function locateGrammarUsage(dslName, fullText, paramName, positionHelper, text, occurrenceIdx) {
    if (text === undefined) {
        text = fullText
    }

    if (occurrenceIdx === undefined) {
        occurrenceIdx = '\\d?'
    }

    // occurrenceIdx 1 may be implicit
    if (occurrenceIdx === "1") {
        occurrenceIdx = '1?'
    }
    var textStartOffset = fullText.indexOf(text)
    // the capturing group for the '.rule(' part of the seekerRegExp
    var patternPrefixGroup = 1
    var patternRuleRefGroup = 2
    var soughtPattern = "(\\." + dslName + occurrenceIdx + "\\s*\\(.*)(" + paramName + ")\\W"
    var seekerRegExp = RegExp(soughtPattern, "g")

    var found = []
    var execResult
    while ((execResult = seekerRegExp.exec(text))) {
        var startOffset = textStartOffset + execResult.index + execResult[patternPrefixGroup].length
        var endOffset = startOffset + execResult[patternRuleRefGroup].length
        var startPos = positionHelper.posFromIndex(startOffset)
        var endPos = positionHelper.posFromIndex(endOffset)
        found.push({start: startPos, end: endPos})
    }

    return found
}


/**
 * @param {string} fullText - the full text to search in.
 * @param {string} ruleText - a subset of the full text to search in
 * @param {string} dslName
 * @param {number} occurrence
 * @param {{posFromIndex:{Function(Number):{line:number, ch:number}}}} positionHelper
 * @param {string} [parameter='']
 * @return {{start:{line:number, column:number},
 *             end:{line:number, column:number}}
 */
function locateProduction(fullText, ruleText, dslName, occurrence, positionHelper, parameter) {
    if (parameter === undefined) {
        parameter = ''
    }

    var ruleTextStartOffset = fullText.indexOf(ruleText)
    var dslNameWithOccurrence = dslName + ( occurrence === 1 ? '(?:|' + occurrence + ')' : occurrence)
    var parameterPart = parameter ? '\\s*\\(\\s*.*' + parameter + '\\s*\\)' : ''

    var soughtPattern = dslNameWithOccurrence + parameterPart
    var seekerRegExp = RegExp(soughtPattern, "g")

    var unresolvedRefPos = []
    var execResult
    while ((execResult = seekerRegExp.exec(ruleText))) {
        var startOffset = ruleTextStartOffset + execResult.index
        var endOffset = startOffset + execResult[0].length
        var startPos = positionHelper.posFromIndex(startOffset)
        var endPos = positionHelper.posFromIndex(endOffset)
        unresolvedRefPos.push({start: startPos, end: endPos})
    }

    return unresolvedRefPos
}