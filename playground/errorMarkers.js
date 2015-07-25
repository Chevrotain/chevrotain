// TODO: handle case when location was not found

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
    var extendRegExp = new RegExp("extendToken\\s*\\(\\s*('|\")" + tokenName)
    var execResult = extendRegExp.exec(text)

    if (!execResult) {
        return undefined
    }

    var startOffset = execResult.index
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

    // TODO: currently ignoring string/regexp literals/comments which makes this very
    // not robust, however for the basic scenarios for which this is supposed to work.
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

    return -1;
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
            return locateDuplicateProductions()
            break
        case chevrotain.ParserDefinitionErrorType.DUPLICATE_RULE_NAME:
        case chevrotain.ParserDefinitionErrorType.INVALID_RULE_NAME:
            return locateRuleDefinition(parseErr.ruleName, parserImplText, positionHelper)
            break
        case chevrotain.ParserDefinitionErrorType.UNRESOLVED_SUBRULE_REF:
            ruleText = gAstProductions.get(parseErr.ruleName).orgText
            return locateUnresolvedSubruleRef(parserImplText, ruleText, parseErr.unresolvedRefName, positionHelper)
            break
        default:
            throw new Error("none exhaustive match ->" + parseErr.type + "<-")
    }
}


/**
 * @param {string} ruleName - the name of the rule whose definition we are seeking in the text.
 * @param {string} text - the text to search in.
 * @param {{posFromIndex:{Function(Number):{line:number, ch:number}}}} positionHelper
 *
 * @return {{start:{line:number, column:number},
 *             end:{line:number, column:number}}
 */
function locateRuleDefinition(ruleName, text, positionHelper) {
    // the capturing group for the '.rule(' part of the seekerRegExp
    var patternPrefixGroup = 1
    var patternRuleNameGroup = 2
    var soughtPattern = "(\\.RULE\\s*\\(\\s*)(['\"]" + ruleName + "['\"])"
    var seekerRegExp = new RegExp(soughtPattern, "g")

    var ruleDefPositions = []
    var execResult
    while ((execResult = seekerRegExp.exec(text))) {
        var startOffset = execResult.index + execResult[patternPrefixGroup].length
        var endOffset = startOffset + execResult[patternRuleNameGroup].length
        var startPos = positionHelper.posFromIndex(startOffset)
        var endPos = positionHelper.posFromIndex(endOffset)
        ruleDefPositions.push({start: startPos, end: endPos})
    }

    return ruleDefPositions
}


/**
 * @param {string} fullText - the full text to search in.
 * @param {string} ruleText - a subset of the full text to search in
 * @param {string} unresolvedRefName - the name of the unresolved
 * @param {{posFromIndex:{Function(Number):{line:number, ch:number}}}} positionHelper
 *
 * @return {{start:{line:number, column:number},
 *             end:{line:number, column:number}}
 */
// TODO: extract common logic with locateRuleDefinition ?
function locateUnresolvedSubruleRef(fullText, ruleText, unresolvedRefName, positionHelper) {
    var ruleTextStartOffset = fullText.indexOf(ruleText)
    // the capturing group for the '.rule(' part of the seekerRegExp
    var patternPrefixGroup = 1
    var patternRuleRefGroup = 2
    var soughtPattern = "(\\.SUBRULE(?:\\d)?\\s*\\(.*)(" + unresolvedRefName + ")"
    var seekerRegExp = new RegExp(soughtPattern, "g")

    var unresolvedRefPos = []
    var execResult
    while ((execResult = seekerRegExp.exec(ruleText))) {
        var startOffset = ruleTextStartOffset + execResult.index + execResult[patternPrefixGroup].length
        var endOffset = startOffset + execResult[patternRuleRefGroup].length
        var startPos = positionHelper.posFromIndex(startOffset)
        var endPos = positionHelper.posFromIndex(endOffset)
        unresolvedRefPos.push({start: startPos, end: endPos})
    }

    return unresolvedRefPos
}