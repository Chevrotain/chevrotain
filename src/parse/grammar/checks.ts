// TODO: rename to validations ?
module chevrotain.validations {

    import gast = chevrotain.gast

    export function validateGrammar(topLevels:gast.Rule[]):string[] {
        var errorMessagesArrs = _.map(topLevels, validateSingleTopLevelRule)
        return <string[]>_.flatten(errorMessagesArrs)
    }

    function validateSingleTopLevelRule(topLevelRule:gast.Rule):string[] {
        var collectorVisitor = new OccurrenceValidationCollector()
        topLevelRule.accept(collectorVisitor)
        var allRuleProductions = collectorVisitor.allProductions

        var productionGroups = _.groupBy(allRuleProductions, identifyProductionForDuplicates)

        var duplicates:any = _.pick(productionGroups, (currGroup) => {
            return currGroup.length > 1
        })

        var errorMsgs = _.map(duplicates, (currDuplicates:any) => {
            return createDuplicatesErrorMessage(currDuplicates, topLevelRule.name)
        })

        return errorMsgs
    }

    function createDuplicatesErrorMessage(duplicateProds:gast.IProductionWithOccurrence[], topLevelName):string {
        var firstProd = _.first(duplicateProds)
        var index = firstProd.occurrenceInParent
        var dslName = gast.getProductionDslName(firstProd)
        var extraArgument = getExtraProductionArgument(firstProd)

        var msg = `->${dslName}<- with occurrence index: ->${index}<-
                  ${extraArgument ? `and argument: ${extraArgument}` : ""}
                  appears more than once (${duplicateProds.length} times) in the top level rule: ${topLevelName}.
                  ${index === 1 ? `note that ${dslName} and ${dslName}1 both have the same occurrence index 1}` : ""}}
                  to fix this make sure each usage of ${dslName} ${extraArgument ? `with the argument: ${extraArgument}` : ""}
                  in the rule ${topLevelName} has a different occurrence index (1-5), as that combination acts as a unique
                  position key in the grammar, which is needed by the parsing engine.`

        // white space trimming time! better to trim afterwards as it allows to use WELL formatted multi line template strings...
        msg = msg.replace(/[ \t]+/g, " ")
        msg = msg.replace(/\s\s+/g, "\n")

        return msg;
    }

    export function identifyProductionForDuplicates(prod:gast.IProductionWithOccurrence):string {
        return `${gast.getProductionDslName(prod)}_#_${prod.occurrenceInParent}_#_${getExtraProductionArgument(prod)}`
    }

    function getExtraProductionArgument(prod:gast.IProductionWithOccurrence):string {
        if (prod instanceof gast.Terminal) {
            return tokenName(prod.terminalType)
        }
        else if (prod instanceof  gast.NonTerminal) {
            return prod.nonTerminalName
        }
        else {
            return ""
        }
    }

    export class OccurrenceValidationCollector extends gast.GAstVisitor {
        public allProductions:gast.IProduction[] = []

        public visitNonTerminal(subrule:gast.NonTerminal):void {
            this.allProductions.push(subrule)
        }

        public visitOption(option:gast.Option):void {
            this.allProductions.push(option)
        }

        public visitRepetitionMandatory(atLeastOne:gast.RepetitionMandatory):void {
            this.allProductions.push(atLeastOne)
        }

        public visitRepetition(many:gast.Repetition):void {
            this.allProductions.push(many)
        }

        public visitAlternation(or:gast.Alternation):void {
            this.allProductions.push(or)
        }

        public visitTerminal(terminal:gast.Terminal):void {
            this.allProductions.push(terminal)
        }
    }

}
