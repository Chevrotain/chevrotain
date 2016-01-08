namespace chevrotain.checks {

    import gast = chevrotain.gast
    import GAstVisitor = chevrotain.gast.GAstVisitor
    import IProduction = chevrotain.gast.IProduction

    export function validateGrammar(topLevels:gast.Rule[]):IParserDefinitionError[] {
        let duplicateErrors = utils.map(topLevels, validateDuplicateProductions)
        let leftRecursionErrors:any = utils.map(topLevels, currTopRule => validateNoLeftRecursion(currTopRule, currTopRule))
        let emptyAltErrors = utils.map(topLevels, validateEmptyOrAlternative)
        return <any>utils.flatten(duplicateErrors.concat(leftRecursionErrors, emptyAltErrors))
    }

    function validateDuplicateProductions(topLevelRule:gast.Rule):IParserDuplicatesDefinitionError[] {
        let collectorVisitor = new OccurrenceValidationCollector()
        topLevelRule.accept(collectorVisitor)
        let allRuleProductions = collectorVisitor.allProductions

        let productionGroups = _.groupBy(allRuleProductions, identifyProductionForDuplicates)

        let duplicates:any = _.pick(productionGroups, (currGroup) => {
            return currGroup.length > 1
        })

        let errors = utils.map(utils.values(duplicates), (currDuplicates:any) => {
            let firstProd:any = utils.first(currDuplicates)
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
        let firstProd = utils.first(duplicateProds)
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
        else if (prod instanceof gast.NonTerminal) {
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

        public visitRepetitionWithSeparator(manySep:gast.RepetitionWithSeparator):void {
            this.allProductions.push(manySep)
        }

        public visitRepetitionMandatory(atLeastOne:gast.RepetitionMandatory):void {
            this.allProductions.push(atLeastOne)
        }

        public visitRepetitionMandatoryWithSeparator(atLeastOneSep:gast.RepetitionMandatoryWithSeparator):void {
            this.allProductions.push(atLeastOneSep)
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

        if ((utils.contains(definedRulesNames, ruleName))) {
            errMsg = `Duplicate definition, rule: ${ruleName} is already defined in the grammar: ${className}`
            errors.push({
                message:  errMsg,
                type:     ParserDefinitionErrorType.DUPLICATE_RULE_NAME,
                ruleName: ruleName
            })
        }

        return errors
    }

    export function validateNoLeftRecursion(topRule:gast.Rule,
                                            currRule:gast.Rule,
                                            path:gast.Rule[] = []):IParserDefinitionError[] {
        let errors = []
        let nextNonTerminals = getFirstNoneTerminal(currRule.definition)
        if (utils.isEmpty(nextNonTerminals)) {
            return []
        }
        else {
            let ruleName = topRule.name
            let foundLeftRecursion = utils.contains(<any>nextNonTerminals, topRule)
            let pathNames = utils.map(path, currRule => currRule.name)
            let leftRecursivePath = `${ruleName} --> ${pathNames.concat([ruleName]).join(" --> ")}`
            if (foundLeftRecursion) {
                let errMsg = `Left Recursion found in grammar.\n` +
                    `rule: <${ruleName}> can be invoked from itself (directly or indirectly)\n` +
                    `without consuming any Tokens. The grammar path that causes this is: \n ${leftRecursivePath}\n` +
                    ` To fix this refactor your grammar to remove the left recursion.\n` +
                    `see: https://en.wikipedia.org/wiki/LL_parser#Left_Factoring.`
                errors.push({
                    message:  errMsg,
                    type:     ParserDefinitionErrorType.LEFT_RECURSION,
                    ruleName: ruleName
                })
            }

            // we are only looking for cyclic paths leading back to the specific topRule
            // other cyclic paths are ignored, we still need this difference to avoid infinite loops...
            let validNextSteps = _.difference(nextNonTerminals, path.concat([topRule]))
            let errorsFromNextSteps = utils.map(validNextSteps, (currRefRule) => {
                let newPath = utils.cloneArr(path)
                newPath.push(currRefRule)
                return validateNoLeftRecursion(topRule, currRefRule, newPath)
            })

            return errors.concat(utils.flatten(errorsFromNextSteps))
        }
    }

    export function getFirstNoneTerminal(definition:gast.IProduction[]):gast.Rule[] {
        let result = []
        if (utils.isEmpty(definition)) {
            return result
        }
        let firstProd = utils.first(definition)


        if (firstProd instanceof gast.NonTerminal) {
            // this allows the check to be performed on partially valid grammars that have not been completly resolved.
            if (firstProd.referencedRule === undefined) {
                return result
            }
            result.push(firstProd.referencedRule)
        }
        else if (firstProd instanceof gast.Flat ||
            firstProd instanceof gast.Option ||
            firstProd instanceof gast.RepetitionMandatory ||
            firstProd instanceof gast.RepetitionMandatoryWithSeparator ||
            firstProd instanceof gast.RepetitionWithSeparator ||
            firstProd instanceof gast.Repetition
        ) {
            result = result.concat(getFirstNoneTerminal(<gast.IProduction[]>firstProd.definition))
        }
        else if (firstProd instanceof gast.Alternation) {
            // each sub definition in alternation is a FLAT
            result = utils.flatten(
                utils.map(firstProd.definition, currSubDef => getFirstNoneTerminal((<gast.Flat>currSubDef).definition)))
        }
        else if (firstProd instanceof gast.Terminal) {
            // nothing to see, move along
        }
        else {
            throw Error("non exhaustive match")
        }

        let isFirstOptional = gast.isOptionalProd(firstProd)
        let hasMore = definition.length > 1
        if (isFirstOptional && hasMore) {
            let rest = utils.drop(definition)
            return result.concat(getFirstNoneTerminal(rest))
        }
        else {
            return result
        }
    }

    class OrCollector extends GAstVisitor {
        public alternations = []

        public visitAlternation(node:gast.Alternation):void {
            this.alternations.push(node)
        }
    }

    export function validateEmptyOrAlternative(topLevelRule:gast.Rule):IParserEmptyAlternativeDefinitionError[] {
        let orCollector = new OrCollector()
        topLevelRule.accept(orCollector)
        let ors = orCollector.alternations

        let errors = utils.reduce(ors, (errors, currOr) => {
            let exceptLast = utils.dropRight(currOr.definition)
            let currErrors = utils.map(exceptLast, (currAlternative:IProduction, currAltIdx) => {
                if (utils.isEmpty(first.first(currAlternative))) {
                    return {
                        message:     `Ambiguous empty alternative: <${currAltIdx + 1}>` +
                                     ` in <OR${currOr.occurrenceInParent}> inside <${topLevelRule.name}> Rule.\n` +
                                     `Only the last alternative may be an empty alternative.`,
                        type:        ParserDefinitionErrorType.NONE_LAST_EMPTY_ALT,
                        ruleName:    topLevelRule.name,
                        occurrence:  currOr.occurrenceInParent,
                        alternative: currAltIdx + 1
                    }
                }
                else {
                    return null
                }
            })
            return errors.concat(utils.compact(currErrors))
        }, [])

        return errors
    }
}
