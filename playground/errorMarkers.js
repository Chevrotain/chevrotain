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


