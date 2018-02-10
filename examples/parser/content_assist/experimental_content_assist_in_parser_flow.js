/**
 * EXPERIMENTAL!
 *
 * Use "official_feature_content_assist.js" as a reference on this topic unless
 * you cannot work around it's limitations.
 *
 * This example is kept as a basis for expansion in the future, but currently has limitations
 * Particularly around multiple Token lookahead.
 * See Issue 290 for details: https://github.com/SAP/chevrotain/issues/290
 *
 *
 *
 * An Example of using chevrotain to implement content assist (both syntatic and semantic)
 * for a mini SQL like language.
 *
 * The suggestions will be Keywords(SELECT/FROM/WHERE) and symbols (column/table names)
 *
 * For symbol names:
 * The Implementation accepts as a parameter a symbol table which specifies the
 * existing column and table names. Of these symbols only relevant ones will be suggested.
 * For example:
 * 1. in a <FROM> clause, only table names will be suggested.
 * 2. in a <SELECT> clause, only column names will be suggested.
 *
 * In all cases the existing prefix of a word will be used to filter the suggestions.
 *
 * Note that this content assist logic may also work if the preceding input is not valid.
 * (see tests in content_assist_spec.js) as long as Chevrotain's error recovery heuristics managed
 * to overcome the issue...
 */

"use strict"

const { createToken, Lexer, Parser, tokenMatcher, EOF } = require("chevrotain")
const _ = require("lodash")

// all keywords (from/select/where/...) belong to the Keyword category thus
// they will be easy to identify for the purpose of content assist.
const Keyword = createToken({ name: "Keyword", pattern: Lexer.NA })
const Select = createToken({
    name: "Select",
    pattern: /SELECT/,
    categories: Keyword
})
const From = createToken({ name: "From", pattern: /FROM/, categories: Keyword })
const Where = createToken({
    name: "Where",
    pattern: /WHERE/,
    categories: Keyword
})
const Comma = createToken({ name: "Comma", pattern: /,/ })
const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
const Integer = createToken({ name: "Integer", pattern: /0|[1-9]\d+/ })
const GreaterThan = createToken({ name: "GreaterThan", pattern: /</ })
const LessThan = createToken({ name: "LessThan", pattern: />/ })
const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: Lexer.SKIPPED,
    line_breaks: true
})

const allTokens = [
    WhiteSpace,
    Select,
    From,
    Where,
    Comma,
    Identifier,
    Integer,
    GreaterThan,
    LessThan
]
const SelectLexer = new Lexer(allTokens)

// ----------------- parser -----------------
class SelectParser extends Parser {
    constructor(input) {
        super(input, allTokens, { recoveryEnabled: true })

        const $ = this

        $.RULE("selectStatement", () => {
            $.SUBRULE($.selectClause)
            $.SUBRULE($.fromClause)
            $.OPTION(() => {
                $.SUBRULE($.whereClause)
            })
        })

        $.RULE("selectClause", () => {
            $.CONSUME(Select)
            $.CONSUME(Identifier)
            $.MANY(() => {
                $.CONSUME(Comma)
                $.CONSUME2(Identifier)
            })
        })

        $.RULE("fromClause", () => {
            $.CONSUME(From)
            $.CONSUME(Identifier)
        })

        $.RULE("whereClause", () => {
            $.CONSUME(Where)
            $.SUBRULE($.expression)
        })

        $.RULE("expression", () => {
            $.SUBRULE($.atomicExpression)
            $.SUBRULE($.relationalOperator)
            $.SUBRULE2($.atomicExpression)
        })

        $.RULE("atomicExpression", () => {
            $.OR([
                { ALT: () => $.CONSUME(Integer) },
                { ALT: () => $.CONSUME(Identifier) }
            ])
        })

        $.RULE("relationalOperator", () => {
            $.OR([
                { ALT: () => $.CONSUME(GreaterThan) },
                { ALT: () => $.CONSUME(LessThan) }
            ])
        })

        Parser.performSelfAnalysis(this)
    }
}

class SelectContentAssistParser extends SelectParser {
    constructor(input, assistOffset) {
        super(input)
        this.assistOffset = assistOffset
        this.lastGrammarPath = {
            ruleStack: [],
            occurrenceStack: [],
            lastTok: undefined,
            lastTokOccurrence: undefined
        }
    }

    /**
     * Overrides the protected Parser.prototype <consumeInternal> method
     * To calculate the syntactic information related to content assist
     *
     * Will terminate the parser's execution once the assistOffset has been reached.
     *
     */
    consumeInternal(tokClass, idx) {
        let consumedToken
        let contentAssistPointReached = false
        let pathToTokenBeforeContentAssist
        let prefix = ""

        try {
            this.lastGrammarPath = this.getCurrentGrammarPath(tokClass, idx)
            consumedToken = super.consumeInternal(tokClass, idx)

            const nextToken = this.LA(1)
            const nextTokenEndOffset =
                nextToken.startOffset + nextToken.image.length

            // no prefix scenario (SELECT age FROM ^)
            if (
                consumedToken !== undefined &&
                // we have reached the end of the input without encountering the contentAssist offset
                // this means the content assist offset is AFTER the input
                (tokenMatcher(this.LA(1), EOF) ||
                    // we consumed the last token BEFORE the content assist of offset
                    this.LA(1).startOffset > this.assistOffset)
            ) {
                // reached the content assist point AFTER consuming some token successfully.
                contentAssistPointReached = true
                pathToTokenBeforeContentAssist = this.getCurrentGrammarPath(
                    tokClass,
                    idx
                )
            } else if (
                nextTokenEndOffset >= this.assistOffset && // going to reach or pass the assist offset.
                nextToken.startOffset < this.assistOffset &&
                // only provide suggestions if it was requested after some word like(Ident/Keyword) prefix.
                (tokenMatcher(nextToken, Identifier) ||
                    tokenMatcher(nextToken, Keyword))
            ) {
                // The prefix scenario (SELECT age FRO^)
                contentAssistPointReached = true
                prefix = nextToken.image.substring(
                    0,
                    this.assistOffset - nextToken.startOffset
                )
                // we need the last grammar path and not the current one as we need to find out what TokenTypes the prefix
                // may belong to, and not what may come after the Token the prefix belongs to.
                pathToTokenBeforeContentAssist = this.lastGrammarPath
            }

            return consumedToken
        } finally {
            // halt the parsing flow if we have reached the content assist point
            if (contentAssistPointReached) {
                const nextPossibleTokTypes = this.getNextPossibleTokenTypes(
                    pathToTokenBeforeContentAssist
                )
                const contentAssistEarlyExitError = new Error(
                    "Content Assist path found"
                )

                contentAssistEarlyExitError.path = pathToTokenBeforeContentAssist
                contentAssistEarlyExitError.nextPossibleTokTypes = nextPossibleTokTypes
                contentAssistEarlyExitError.prefix = prefix
                //noinspection ThrowInsideFinallyBlockJS
                throw contentAssistEarlyExitError
            }
        }
    }
}

module.exports = {
    /**
     * @param {string} text
     * @param {number} offset - the offset in which content assist is requested
     * @param {{tableNames: Array.<string>, columnNames: Array.<string>}} symbolTable -
     *                      list of known symbol names divided by to their semantic type.
     *
     * @returns {Array<string>}
     */
    getContentAssist: function(text, offset, symbolTable) {
        const lexResult = SelectLexer.tokenize(text)
        if (lexResult.errors.length >= 1) {
            throw new Error("sad sad panda, lexing errors detected")
        }

        const parser = new SelectContentAssistParser(lexResult.tokens, offset)

        try {
            parser.selectStatement()
        } catch (e) {
            if (e.message === "Content Assist path found") {
                const path = e.path
                const nextPossibleTokTypes = e.nextPossibleTokTypes
                const prefix = e.prefix

                // handling keyword suggestions
                const nextPossibleKeywordsTypes = _.filter(
                    nextPossibleTokTypes,
                    function(currPossibleTokType) {
                        return Keyword.categoryMatchesMap[
                            currPossibleTokType.tokenTypeIdx
                        ]
                    }
                )
                const possibleKeywordSuggestions = _.map(
                    nextPossibleKeywordsTypes,
                    function(currKeywordType) {
                        // relying on the fact that the keyword patterns(regexps) are identical to the strings they match. (very simple regexps)
                        return currKeywordType.PATTERN.source
                    }
                )

                // handling Identifier Suggestions
                let possibleIdentifierSuggestions = []
                if (_.contains(nextPossibleTokTypes, Identifier)) {
                    const currentParsingRule = _.last(path.ruleStack)
                    // filter the semantic options (available global symbols) using syntactic context.
                    if (currentParsingRule === "fromClause") {
                        possibleIdentifierSuggestions = symbolTable.tableNames
                    } else {
                        //  only in the <fromClause> table names are valid in this mini SQL example.
                        possibleIdentifierSuggestions = symbolTable.columnNames
                    }
                }

                const allPossibleSuggestions = possibleKeywordSuggestions.concat(
                    possibleIdentifierSuggestions
                )
                return filterByPrefix(allPossibleSuggestions, prefix)
            }

            throw e
        }
        return []
    }
}

// utilities
function filterByPrefix(arr, prefix) {
    return _.filter(arr, function(currElem) {
        return currElem.lastIndexOf(prefix, 0) === 0
    })
}
