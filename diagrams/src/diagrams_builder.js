(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['../vendor/railroad-diagrams', '../../lib/chevrotain'], factory)
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('../vendor/railroad-diagrams'), require('../../lib/chevrotain'))
    } else {
        // Browser globals (root is window)
        root.diagrams_builder = factory(root.railroad, root.chevrotain)
    }
}(this, function(railroad, chevrotain) {

    var Diagram = railroad.Diagram
    var Sequence = railroad.Sequence
    var Choice = railroad.Choice
    var Optional = railroad.Optional
    var OneOrMore = railroad.OneOrMore
    var ZeroOrMore = railroad.ZeroOrMore
    var Terminal = railroad.Terminal
    var NonTerminal = railroad.NonTerminal

    /**
     * @param {chevrotain.gast.Rule[]} topRules
     *
     * @returns {string} - The htmlText that will render the diagrams
     */
    function buildSyntaxDiagramsText(topRules) {
        var diagramsHtml = ""

        topRules.forEach(function(production) {
            var currDiagramHtml = convertProductionToDiagram(production, production.name)
            diagramsHtml += '<h2 class="diagramHeader">' + production.name + '</h2>' + currDiagramHtml
        })

        return diagramsHtml
    }

    function definitionsToSubDiagrams(definitions, topRuleName) {
        var subDiagrams = definitions.map(function(subProd) {
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

        var pattern = prod.terminalType.PATTERN
        // PATTERN static property will not exist when using custom lexers (hand built or other lexer generators)
        var toolTipTitle = pattern ? pattern.source : undefined
        return railroad.Terminal(chevrotain.tokenLabel(prod.terminalType),
            undefined,
            toolTipTitle,
            prod.occurrenceInParent,
            topRuleName,
            dslRuleName,
            chevrotain.tokenName(prod.terminalType)
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
        var result = Terminal(chevrotain.tokenLabel(tokenConstructor),
            undefined,
            // PATTERN static property will not exist when using custom lexers (hand built or other lexer generators)
            tokenConstructor.PATTERN ? tokenConstructor.PATTERN.source : undefined,
            occurrenceInParent,
            topRuleName,
            dslRuleName,
            chevrotain.tokenName(tokenConstructor))
        return result
    }

    /**
     * @param prod
     * @param topRuleName
     *
     * Converts a single Chevrotain Grammar production to a RailRoad Diagram.
     * This is also exported to allow custom logic in the creation of the diagrams.
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

    return {
        buildSyntaxDiagramsText:    buildSyntaxDiagramsText,
        convertProductionToDiagram: convertProductionToDiagram
    }
}))
