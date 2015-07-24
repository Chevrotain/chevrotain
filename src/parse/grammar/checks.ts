namespace chevrotain.checks {

    import gast = chevrotain.gast

    export function validateGrammar(topLevels:gast.Rule[]):string[] {
        let errorMessagesArrs = _.map(topLevels, validateSingleTopLevelRule)
        return <string[]>_.flatten(errorMessagesArrs)
    }

    function validateSingleTopLevelRule(topLevelRule:gast.Rule):IParserDuplicatesDefinitionError[] {
        let collectorVisitor = new OccurrenceValidationCollector()
        topLevelRule.accept(collectorVisitor)
        let allRuleProductions = collectorVisitor.allProductions

        let productionGroups = _.groupBy(allRuleProductions, identifyProductionForDuplicates)

        let duplicates:any = _.pick(productionGroups, (currGroup) => {
            return currGroup.length > 1
        })

        let errors = _.map(duplicates, (currDuplicates:any) => {
            let firstProd:any = _.first(currDuplicates)
            let msg = createDuplicatesErrorMessage(currDuplicates, topLevelRule.name)
            let dslName = gast.getProductionDslName(firstProd)
            let defError:IParserDuplicatesDefinitionError = {
                message:    msg,
                type:       ParserDefinitionErrorType.DUPLICATE_PRODUCTIONS,
                ruleName:   topLevelRule.name,
                dslName:    dslName,
                occurrence: firstProd.occurrenceInParent
            }

            let param = getExtraProductionArgument(firstProd)
            if (param) {
                defError.parameter = param
            }

            return defError
        })
        return errors
    }

    function createDuplicatesErrorMessage(duplicateProds:gast.IProductionWithOccurrence[], topLevelName):string {
        let firstProd = _.first(duplicateProds)
        let index = firstProd.occurrenceInParent
        let dslName = gast.getProductionDslName(firstProd)
        let extraArgument = getExtraProductionArgument(firstProd)

        let msg = `->${dslName}<- with occurrence index: ->${index}<-
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


    let ruleNamePattern = /^[a-zA-Z_]\w*$/

    export function validateRuleName(ruleName:string, definedRulesNames:string[], className):IParserDefinitionError[] {
        let errors = []
        let errMsg

        if (!ruleName.match(ruleNamePattern)) {
            errMsg = `Invalid Grammar rule name --> ${ruleName} it must match the pattern: ${ruleNamePattern.toString()}`
            errors.push({
                message:  errMsg,
                type:     ParserDefinitionErrorType.INVALID_RULE_NAME,
                ruleName: ruleName
            })
        }

        if ((_.contains(definedRulesNames, ruleName))) {
            errMsg = `Duplicate definition, rule: ${ruleName} is already defined in the grammar: ${className}`
            errors.push({
                message:  errMsg,
                type:     ParserDefinitionErrorType.DUPLICATE_RULE_NAME,
                ruleName: ruleName
            })
        }

        return errors
    }

}
