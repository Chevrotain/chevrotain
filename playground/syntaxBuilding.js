
function definitionsToSubDiagrams(definitions) {
    "use strict";
    var subDiagrams = _.map(definitions, function (subProd) {
        return convertProductionToDiagram(subProd);
    });
    return subDiagrams;
}

function convertProductionToDiagram(prod) {

    if (prod instanceof chevrotain.gast.NonTerminal) {
        // must handle NonTerminal separately from the other AbstractProductions as we do not want to expand the subDefinition
        // of a reference and cause infinite loops
        return NonTerminal(prod.nonTerminalName)
    }
    else if (!(prod instanceof chevrotain.gast.Terminal)) {
        var subDiagrams = definitionsToSubDiagrams(prod.definition);
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
    }
    else if (prod instanceof chevrotain.gast.Terminal) {
        // TODO: TokenName or regexp?
        return Terminal(prod.terminalType.PATTERN.source)
    }
    else {
        throw Error("non exhaustive match")
    }
}
