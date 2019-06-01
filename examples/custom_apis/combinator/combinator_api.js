/**
 * This Implements a Parser Combinator style API using Chevrotain as the runtime engine.
 * The API was greatly influenced by Myna
 * https://github.com/cdiggins/myna-parser/blob/master/grammars/grammar_json.js
 *
 * This is an example of one combinator API style. many could exist
 * As all the API has to do is generate a chevrotain GAST(GrammarAST) data structure.
 */
const chevrotain = require("chevrotain")
const _ = require("lodash")

// GAST classes
const {
    Rule,
    RepetitionWithSeparator,
    Flat,
    Alternation,
    Terminal,
    NonTerminal,
    generateParserFactory
} = chevrotain

// utilities
const {
    resolveGrammar,
    validateGrammar,
    assignOccurrenceIndices,
    defaultGrammarValidatorErrorProvider,
    tokenLabel
} = chevrotain

function toRule(name) {
    return new Rule({ name: name, definition: [this.definition] })
}

// rule: A B C ...
function seq(...items) {
    const flatDef = _.flatMap(items, toDefinition)
    const definition = new Flat({ definition: flatDef })

    const orgTextParts = _.map(items, toOriginalText)
    definition.orgText = `seq(${orgTextParts.join(", ")})`

    return {
        toRule: toRule,
        definition: definition
    }
}

// rule: A (, B)*
function delimited(item, separator) {
    const definition = new RepetitionWithSeparator({
        definition: toDefinition(item),
        separator: separator
    })

    const orgTextParts = _.map([item, separator], toOriginalText)
    definition.orgText = `delimited(${orgTextParts.join(", ")})`

    return {
        toRule: toRule,
        definition: definition
    }
}

// rule: A | B | C | ...
function choice(...alternatives) {
    const altsDefs = _.map(alternatives, alt => {
        return new Flat({ definition: toDefinition(alt) })
    })

    const orgTextParts = _.map(alternatives, toOriginalText)

    const definition = new Alternation({ definition: altsDefs })
    definition.orgText = `choice(${orgTextParts.join(", ")})`

    return {
        toRule: toRule,
        definition: definition
    }
}

function createParser(name, rules, tokenVocabulary) {
    // stringLiteral references must be resolved to the Rule instance
    const resolutionErrors = resolveGrammar({ rules: rules })

    // The indices must be unique.
    // See https://sap.github.io/chevrotain/docs/FAQ.html#NUMERICAL_SUFFIXES
    assignOccurrenceIndices({ rules: rules })

    if (!_.isEmpty(resolutionErrors)) {
        throw Error(
            "Grammar Resolution Errors Detected:\n" +
                _.map(resolutionErrors, "message").join("\n")
        )
    }

    const validationError = validateGrammar({
        rules: rules,
        maxLookahead: 4,
        tokenTypes: tokenVocabulary,
        grammarName: name,
        errMsgProvider: combinatorGrammarErrorMsgProvider
    })

    if (!_.isEmpty(validationError)) {
        throw Error(
            "Grammar Validation Errors Detected:\n" +
                _.map(validationError, "message").join("\n")
        )
    }

    const parserFactory = generateParserFactory({
        name: name,
        rules: rules,
        tokenVocabulary: tokenVocabulary
    })
    // The IParserConfig is passed to the parserFactory
    return parserFactory()
}

function toDefinition(item) {
    if (_.has(item, "tokenName")) {
        return [new Terminal({ terminalType: item })]
    } else if (item instanceof Rule) {
        return [
            new NonTerminal({
                nonTerminalName: item.name,
                referencedRule: item
            })
        ]
    } else if (_.isString(item)) {
        // A string is passed to resolve cyclic dependencies a Rule referencing another rule before it was defined.
        // e.g Rule1: Identifer Rule2
        //     Rule2: Identifier Rule1
        return [new NonTerminal({ nonTerminalName: item })]
    } else if (_.has(item, "toRule")) {
        return [item.definition]
    } else {
        throw Error(`Unexpected Argument ${item}`)
    }
}

/**
 * Attempts to reconstruct the original api usage text
 * for better error message purposes.
 */
function toOriginalText(item) {
    if (_.has(item, "tokenName")) {
        return item.tokenName
    } else if (item instanceof Rule) {
        return item.name
    } else if (_.isString(item)) {
        return item
    } else if (_.has(item, "toRule")) {
        return item.definition.orgText
    } else {
        throw Error(`Unexpected Argument type ${item}`)
    }
}

// first we "extend" the default errorMsgProvider
const combinatorGrammarErrorMsgProvider = _.clone(
    defaultGrammarValidatorErrorProvider
)

// Secondly we "override" one of the methods to customize it.
combinatorGrammarErrorMsgProvider.buildAlternationAmbiguityError = function({
    topLevelRule,
    prefixPath,
    ambiguityIndices,
    alternation
}) {
    let pathMsg = _.map(prefixPath, tokType => tokenLabel(tokType)).join(", ")
    let errMsg =
        `Ambiguous alternatives: <${ambiguityIndices.join(" ,")}> in <${
            alternation.orgText
        }>` +
        ` inside <${topLevelRule.name}> Rule,\n` +
        `<${pathMsg}> may appears as a prefix path in all these alternatives.\n`

    return errMsg
}

module.exports = {
    seq,
    delimited,
    choice,
    createParser
}
