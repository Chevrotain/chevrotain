/**
 * @param {chevrotain.gast.Rule[]} topRules
 *
 * @returns {string} - The htmlText that will render the diagrams
 */
function buildSyntaxDiagramsText(topRules) {
    var diagramsHtml = ""

    topRules.forEach(function (production) {
        var currDiagramHtml = convertProductionToDiagram(production, production.name)
        diagramsHtml += '<h2 class="diagramHeader">' + production.name + '</h2>' + currDiagramHtml
    })

    return diagramsHtml;
}


function definitionsToSubDiagrams(definitions, topRuleName) {
    var subDiagrams = definitions.map(function (subProd) {
        return convertProductionToDiagram(subProd, topRuleName)
    })
    return subDiagrams
}


/**
 * @param {chevrotain.gast.Terminal} prod
 * @param {string} topRuleName
 * @param {string} dslRuleName
 *
 * @return {RailRoadDiagram.Terminal}
 */
function createTerminalFromGastProd(prod, topRuleName, dslRuleName) {
    return Terminal(chevrotain.tokenName(prod.terminalType),
        undefined,
        prod.terminalType.PATTERN.source,
        prod.occurrenceInParent,
        topRuleName,
        dslRuleName
    )
}


/**
 * @param {function} tokenConstructor
 * @param {number} occurrenceInParent
 * @param {string} topRuleName
 * @param {string} dslRuleName
 *
 * @return {RailRoadDiagram.Terminal}
 */
function createTerminalFromToken(tokenConstructor, occurrenceInParent, topRuleName, dslRuleName) {
    var result = Terminal(chevrotain.tokenName(tokenConstructor),
        undefined,
        tokenConstructor.PATTERN.source,
        occurrenceInParent,
        topRuleName,
        dslRuleName)
    return result
}


/**
 * @param prod
 * @param topRuleName
 *
 * @returns {*}
 */
function convertProductionToDiagram(prod, topRuleName) {

    if (prod instanceof chevrotain.gast.NonTerminal) {
        // must handle NonTerminal separately from the other AbstractProductions as we do not want to expand the subDefinition
        // of a reference and cause infinite loops
        return NonTerminal(prod.nonTerminalName, undefined, prod.occurrenceInParent, topRuleName)
    }
    else if (!(prod instanceof chevrotain.gast.Terminal)) {
        var subDiagrams = definitionsToSubDiagrams(prod.definition, topRuleName)
        if (prod instanceof chevrotain.gast.Rule) {
            return Diagram.apply(this, subDiagrams)
        }
        else if (prod instanceof chevrotain.gast.Flat) {
            return Sequence.apply(this, subDiagrams)
        }
        else if (prod instanceof chevrotain.gast.Option) {
            if (subDiagrams.length > 1) {
                return Optional(Sequence.apply(this, subDiagrams))
            }
            else if (subDiagrams.length === 1) {
                return Optional(subDiagrams[0])
            }
            else {
                throw Error("Empty Optional production, OOPS!")
            }
        }
        else if (prod instanceof chevrotain.gast.Repetition) {
            if (subDiagrams.length > 1) {
                return ZeroOrMore(Sequence.apply(this, subDiagrams))
            }
            else if (subDiagrams.length === 1) {
                return ZeroOrMore(subDiagrams[0])
            }
            else {
                throw Error("Empty Optional production, OOPS!")
            }
        }
        else if (prod instanceof chevrotain.gast.Alternation) {
            // todo: what does the first argument of choice (the index 0 means?)
            return Choice.apply(this, [0].concat(subDiagrams))
        }
        else if (prod instanceof chevrotain.gast.RepetitionMandatory) {
            if (subDiagrams.length > 1) {
                return OneOrMore(Sequence.apply(this, subDiagrams))
            }
            else if (subDiagrams.length === 1) {
                return OneOrMore(subDiagrams[0])
            }
            else {
                throw Error("Empty Optional production, OOPS!")
            }
        }
        else if (prod instanceof chevrotain.gast.RepetitionWithSeparator) {
            if (subDiagrams.length > 0) {
                // MANY_SEP(separator, definition) === (definition (separator definition)*)?
                return Optional(Sequence.apply(this, subDiagrams.concat(
                    [ZeroOrMore(Sequence.apply(this,
                        [createTerminalFromToken(prod.separator, prod.occurrenceInParent, topRuleName, "many_sep")].concat(subDiagrams)))])))
            }
            else {
                throw Error("Empty Optional production, OOPS!")
            }
        }
        else if (prod instanceof chevrotain.gast.RepetitionMandatoryWithSeparator) {
            if (subDiagrams.length > 0) {
                // AT_LEAST_ONE_SEP(separator, definition) === definition (separator definition)*
                return Sequence.apply(this, subDiagrams.concat(
                    [ZeroOrMore(Sequence.apply(this,
                        [createTerminalFromToken(prod.separator, prod.occurrenceInParent, topRuleName, "at_least_one_sep")].concat(subDiagrams)))]))
            }
            else {
                throw Error("Empty Optional production, OOPS!")
            }
        }
    }
    else if (prod instanceof chevrotain.gast.Terminal) {
        return createTerminalFromGastProd(prod, topRuleName, "consume")
    }
    else {
        throw Error("non exhaustive match")
    }
}
