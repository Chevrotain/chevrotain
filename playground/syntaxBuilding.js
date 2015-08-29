function renderSyntaxDiagrams(topRules) {
    diagramsDiv.innerHTML = ""
    diagramsDiv.innerHTML += diagramsHeaderOrgHtml
    _.forEach(topRules, function (production) {
        var currDiagramHtml = convertProductionToDiagram(production, production.name)
        diagramsDiv.innerHTML += '<h2 class="diagramHeader">' + production.name + '</h2>' + currDiagramHtml
    })
    attachHighlightEvents()
}


function definitionsToSubDiagrams(definitions, topRuleName) {
    var subDiagrams = _.map(definitions, function (subProd) {
        return convertProductionToDiagram(subProd, topRuleName)
    })
    return subDiagrams
}


/**
 * @param {chevrotain.gast.Terminal} prod
 *
 * @return {RailRoadDiagram.Terminal}
 */
function createTerminalFromGastProd(prod) {
    return Terminal(chevrotain.tokenName(prod.terminalType), undefined, prod.terminalType.PATTERN.source)
}


/**
 * @param {function} tokenConstructor
 *
 * @return {RailRoadDiagram.Terminal}
 */
function createTerminalFromToken(tokenConstructor) {
    var result = Terminal(chevrotain.tokenName(tokenConstructor), undefined, tokenConstructor.PATTERN.source)
    return result
}


/**
 *
 * @param prod
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
                return Optional(_.first(subDiagrams))
            }
            else {
                throw new Error("Empty Optional production, WTF!")
            }
        }
        else if (prod instanceof chevrotain.gast.Repetition) {
            if (subDiagrams.length > 1) {
                return ZeroOrMore(Sequence.apply(this, subDiagrams))
            }
            else if (subDiagrams.length === 1) {
                return ZeroOrMore(_.first(subDiagrams))
            }
            else {
                throw new Error("Empty Optional production, WTF!")
            }
        }
        else if (prod instanceof chevrotain.gast.Alternation) {
            // todo: what does the first argument of choice (the index 0 means?)
            return Choice.apply(this, _.flatten([0, subDiagrams]))
        }
        else if (prod instanceof chevrotain.gast.RepetitionMandatory) {
            if (subDiagrams.length > 1) {
                return OneOrMore(Sequence.apply(this, subDiagrams))
            }
            else if (subDiagrams.length === 1) {
                return OneOrMore(_.first(subDiagrams))
            }
            else {
                throw new Error("Empty Optional production, WTF!")
            }
        }
        else if (prod instanceof chevrotain.gast.RepetitionWithSeparator) {
            if (subDiagrams.length > 0) {
                // MANY_SEP(separator, definition) === (definition (separator definition)*)?
                return Optional(Sequence.apply(this, subDiagrams.concat(
                    [ZeroOrMore(Sequence.apply(this, [createTerminalFromToken(prod.separator)].concat(subDiagrams)))])))
            }
            else {
                throw new Error("Empty Optional production, WTF!")
            }
        }
        else if (prod instanceof chevrotain.gast.RepetitionMandatoryWithSeparator) {
            if (subDiagrams.length > 0) {
                // AT_LEAST_ONE_SEP(separator, definition) === definition (separator definition)*
                return Sequence.apply(this, subDiagrams.concat(
                    [ZeroOrMore(Sequence.apply(this, [createTerminalFromToken(prod.separator)].concat(subDiagrams)))]))
            }
            else {
                throw new Error("Empty Optional production, WTF!")
            }
        }
    }
    else if (prod instanceof chevrotain.gast.Terminal) {
        return createTerminalFromGastProd(prod)
    }
    else {
        throw Error("non exhaustive match")
    }
}
