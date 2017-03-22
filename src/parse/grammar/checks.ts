import * as utils from "../../utils/utils"
import {contains, every, flatten, forEach, groupBy, isEmpty, map, pick, reduce, reject, values} from "../../utils/utils"
import {
    IgnoredParserIssues,
    IParserAmbiguousAlternativesDefinitionError,
    IParserDefinitionError,
    IParserDuplicatesDefinitionError,
    IParserEmptyAlternativeDefinitionError,
    ParserDefinitionErrorType
} from "../parser_public"
import {gast} from "./gast_public"
import {getProductionDslName, isOptionalProd} from "./gast"
import {tokenLabel, tokenName} from "../../scan/tokens_public"
import {first} from "./first"
import {Alternative, containsPath, getLookaheadPathsForOr, getLookaheadPathsForOptionalProd, getProdType} from "./lookahead"
import {VERSION} from "../../version"
import {TokenConstructor} from "../../scan/lexer_public"
import {NamedDSLMethodsCollectorVisitor} from "../cst/cst"


export function validateGrammar(topLevels:gast.Rule[],
                                maxLookahead:number,
                                tokens:TokenConstructor[],
                                ignoredIssues:IgnoredParserIssues):IParserDefinitionError[] {
    let duplicateErrors:any = utils.map(topLevels, validateDuplicateProductions)
    let leftRecursionErrors:any = utils.map(topLevels, currTopRule => validateNoLeftRecursion(currTopRule, currTopRule))

    let emptyAltErrors = []
    let ambiguousAltsErrors = []

    // left recursion could cause infinite loops in the following validations.
    // It is safest to first have the user fix the left recursion errors first and only then examine farther issues.
    if (every(leftRecursionErrors, isEmpty)) {
        emptyAltErrors = map(topLevels, validateEmptyOrAlternative)
        ambiguousAltsErrors = map(topLevels, currTopRule =>
            validateAmbiguousAlternationAlternatives(currTopRule, maxLookahead, ignoredIssues))
    }

    let ruleNames = map(topLevels, (currTopLevel) => currTopLevel.name)
    let tokenNames = map(tokens, (currToken) => tokenName(currToken))
    let termsNamespaceConflictErrors = checkTerminalAndNoneTerminalsNameSpace(ruleNames, tokenNames)

    let tokenNameErrors:any = utils.map(tokenNames, validateTokenName)
    let nestedRulesNameErrors:any = validateNestedRulesNames(topLevels)
    let nestedRulesDuplicateErrors:any = validateDuplicateNestedRules(topLevels)

    let emptyRepetitionErrors = validateSomeNonEmptyLookaheadPath(topLevels, maxLookahead)

    return <any>utils.flatten(duplicateErrors.concat(tokenNameErrors,
        nestedRulesNameErrors,
        nestedRulesDuplicateErrors,
        emptyRepetitionErrors,
        leftRecursionErrors,
        emptyAltErrors,
        ambiguousAltsErrors,
        termsNamespaceConflictErrors))
}

function validateNestedRulesNames(topLevels:gast.Rule[]):IParserDefinitionError[] {
    let result = []
    forEach(topLevels, (curTopLevel) => {
        let namedCollectorVisitor = new NamedDSLMethodsCollectorVisitor("")
        curTopLevel.accept(namedCollectorVisitor)
        let nestedNamesPerRule = map(namedCollectorVisitor.result, (currItem) => currItem.name)
        let currTopRuleName = curTopLevel.name
        result.push(map(nestedNamesPerRule, (currNestedName) => validateNestedRuleName(currNestedName, currTopRuleName)))
    })

    return <any>flatten(result)
}

function validateDuplicateProductions(topLevelRule:gast.Rule):IParserDuplicatesDefinitionError[] {
    let collectorVisitor = new OccurrenceValidationCollector()
    topLevelRule.accept(collectorVisitor)
    let allRuleProductions = collectorVisitor.allProductions

    let productionGroups = utils.groupBy(allRuleProductions, identifyProductionForDuplicates)

    let duplicates:any = utils.pick(productionGroups, (currGroup) => {
        return currGroup.length > 1
    })

    let errors = utils.map(utils.values(duplicates), (currDuplicates:any) => {
        let firstProd:any = utils.first(currDuplicates)
        let msg = createDuplicatesErrorMessage(currDuplicates, topLevelRule.name)
        let dslName = getProductionDslName(firstProd)
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
    let dslName = getProductionDslName(firstProd)
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

    return msg
}

export function identifyProductionForDuplicates(prod:gast.IProductionWithOccurrence):string {
    return `${getProductionDslName(prod)}_#_${prod.occurrenceInParent}_#_${getExtraProductionArgument(prod)}`
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

export const validTermsPattern = /^[a-zA-Z_]\w*$/
export const validNestedRuleName = new RegExp(validTermsPattern.source.replace("^", "^\\$"))

export function validateRuleName(ruleName:string):IParserDefinitionError[] {
    let errors = []
    let errMsg

    if (!ruleName.match(validTermsPattern)) {
        errMsg = `Invalid Grammar rule name: ->${ruleName}<- it must match the pattern: ->${validTermsPattern.toString()}<-`
        errors.push({
            message:  errMsg,
            type:     ParserDefinitionErrorType.INVALID_RULE_NAME,
            ruleName: ruleName
        })
    }

    return errors
}

export function validateNestedRuleName(nestedRuleName:string, containingRuleName:string):IParserDefinitionError[] {
    let errors = []
    let errMsg

    if (!nestedRuleName.match(validNestedRuleName)) {
        errMsg = `Invalid nested rule name: ->${nestedRuleName}<- inside rule: ->${containingRuleName}<-\n` +
            `it must match the pattern: ->${validNestedRuleName.toString()}<-.\n` +
            `Note that this means a nested rule name must start with the '$'(dollar) sign.`
        errors.push({
            message:  errMsg,
            type:     ParserDefinitionErrorType.INVALID_NESTED_RULE_NAME,
            ruleName: nestedRuleName
        })
    }

    return errors
}

export function validateTokenName(tokenNAme:string):IParserDefinitionError[] {
    let errors = []
    let errMsg

    if (!tokenNAme.match(validTermsPattern)) {
        errMsg = `Invalid Grammar Token name: ->${tokenNAme}<- it must match the pattern: ->${validTermsPattern.toString()}<-`
        errors.push({
            message: errMsg,
            type:    ParserDefinitionErrorType.INVALID_TOKEN_NAME
        })
    }

    return errors
}

export function validateRuleDoesNotAlreadyExist(ruleName:string, definedRulesNames:string[], className):IParserDefinitionError[] {
    let errors = []
    let errMsg

    if ((utils.contains(definedRulesNames, ruleName))) {
        errMsg = `Duplicate definition, rule: ->${ruleName}<- is already defined in the grammar: ->${className}<-`
        errors.push({
            message:  errMsg,
            type:     ParserDefinitionErrorType.DUPLICATE_RULE_NAME,
            ruleName: ruleName
        })
    }

    return errors
}

// TODO: is there anyway to get only the rule names of rules inherited from the super grammars?
export function validateRuleIsOverridden(ruleName:string, definedRulesNames:string[], className):IParserDefinitionError[] {
    let errors = []
    let errMsg

    if (!(utils.contains(definedRulesNames, ruleName))) {
        errMsg = `Invalid rule override, rule: ->${ruleName}<- cannot be overridden in the grammar: ->${className}<-` +
            `as it is not defined in any of the super grammars `
        errors.push({
            message:  errMsg,
            type:     ParserDefinitionErrorType.INVALID_RULE_OVERRIDE,
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
        let validNextSteps = utils.difference(nextNonTerminals, path.concat([topRule]))
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

    let isFirstOptional = isOptionalProd(firstProd)
    let hasMore = definition.length > 1
    if (isFirstOptional && hasMore) {
        let rest = utils.drop(definition)
        return result.concat(getFirstNoneTerminal(rest))
    }
    else {
        return result
    }
}

class OrCollector extends gast.GAstVisitor {
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
        let currErrors = utils.map(exceptLast, (currAlternative:gast.IProduction, currAltIdx) => {
            if (utils.isEmpty(first(currAlternative))) {
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

export function validateAmbiguousAlternationAlternatives(topLevelRule:gast.Rule,
                                                         maxLookahead:number,
                                                         ignoredIssues:IgnoredParserIssues):IParserAmbiguousAlternativesDefinitionError[] {

    let orCollector = new OrCollector()
    topLevelRule.accept(orCollector)
    let ors = orCollector.alternations

    let ignoredIssuesForCurrentRule = ignoredIssues[topLevelRule.name]
    if (ignoredIssuesForCurrentRule) {
        ors = reject(ors, (currOr) => ignoredIssuesForCurrentRule[getProductionDslName(currOr) + currOr.occurrenceInParent])
    }

    let errors = utils.reduce(ors, (result, currOr:gast.Alternation) => {

        let currOccurrence = currOr.occurrenceInParent
        let alternatives = getLookaheadPathsForOr(currOccurrence, topLevelRule, maxLookahead)
        let altsAmbiguityErrors = checkAlternativesAmbiguities(alternatives)

        let currErrors = utils.map(altsAmbiguityErrors, (currAmbDescriptor) => {
            let ambgIndices = map(currAmbDescriptor.alts, (currAltIdx) => currAltIdx + 1)
            let pathMsg = map(currAmbDescriptor.path, (currtok) => tokenLabel(currtok)).join(", ")
            let currMessage = `Ambiguous alternatives: <${ambgIndices.join(" ,")}> in <OR${currOccurrence}>` +
                ` inside <${topLevelRule.name}> Rule,\n` +
                `<${pathMsg}> may appears as a prefix path in all these alternatives.\n`


            let docs_version = VERSION.replace(/\./g, "_")
            // Should this information be on the error message or in some common errors docs?
            currMessage = currMessage + "To Resolve this, try one of of the following: \n" +
                "1. Refactor your grammar to be LL(K) for the current value of k (by default k=5)\n" +
                "2. Increase the value of K for your grammar by providing a larger 'maxLookahead' value in the parser's config\n" +
                "3. This issue can be ignored (if you know what you are doing...), see" +
                " http://sap.github.io/chevrotain/documentation/" + docs_version + "/interfaces/iparserconfig.html#ignoredissues for more" +
                " details\n"

            return {
                message:      currMessage,
                type:         ParserDefinitionErrorType.AMBIGUOUS_ALTS,
                ruleName:     topLevelRule.name,
                occurrence:   currOr.occurrenceInParent,
                alternatives: [currAmbDescriptor.alts]
            }
        })
        return result.concat(currErrors)
    }, [])

    return errors
}

export class RepetionCollector extends gast.GAstVisitor {
    public allProductions:gast.IProduction[] = []

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
}

export function validateSomeNonEmptyLookaheadPath(topLevelRules:gast.Rule[], maxLookahead:number):IParserDefinitionError[] {
    let errors = []
    forEach(topLevelRules, (currTopRule) => {
        let collectorVisitor = new RepetionCollector()
        currTopRule.accept(collectorVisitor)
        let allRuleProductions = collectorVisitor.allProductions
        forEach(allRuleProductions, (currProd) => {
            let prodType = getProdType(currProd)
            let currOccurrence = currProd.occurrenceInParent
            let paths = getLookaheadPathsForOptionalProd(currOccurrence, currTopRule, prodType, maxLookahead)
            let pathsInsideProduction = paths[0]
            if (isEmpty(flatten(pathsInsideProduction))) {
                let implicitOccurrence = currProd.implicitOccurrenceIndex
                let dslName = getProductionDslName(currProd)
                if (!implicitOccurrence) {
                    dslName += currOccurrence
                }
                let errMsg = `The repetition <${dslName}> within Rule <${currTopRule.name}> can never consume any tokens.\n` +
                    `This could lead to an infinite loop.`
                errors.push({
                    message:  errMsg,
                    type:     ParserDefinitionErrorType.NO_NON_EMPTY_LOOKAHEAD,
                    ruleName: currTopRule.name
                })
            }
        })
    })

    return errors
}

export interface IAmbiguityDescriptor {
    alts:number[]
    path:Function[]
}

function checkAlternativesAmbiguities(alternatives:Alternative[]):IAmbiguityDescriptor[] {

    let foundAmbiguousPaths = []
    let identicalAmbiguities = reduce(alternatives, (result, currAlt, currAltIdx) => {
        forEach(currAlt, (currPath) => {

            let altsCurrPathAppearsIn = [currAltIdx]
            forEach(alternatives, (currOtherAlt, currOtherAltIdx) => {
                if (currAltIdx !== currOtherAltIdx && containsPath(currOtherAlt, currPath)) {
                    altsCurrPathAppearsIn.push(currOtherAltIdx)
                }
            })

            if (altsCurrPathAppearsIn.length > 1 && !containsPath(foundAmbiguousPaths, currPath)) {
                foundAmbiguousPaths.push(currPath)
                result.push({
                    alts: altsCurrPathAppearsIn,
                    path: currPath
                })
            }
        })
        return result
    }, [])

    return identicalAmbiguities
}

function checkTerminalAndNoneTerminalsNameSpace(ruleNames:string[], terminalNames:string[]):IParserDefinitionError[] {
    let errors = []

    forEach(ruleNames, (currRuleName) => {
        if (contains(terminalNames, currRuleName)) {
            let errMsg = `Namespace conflict found in grammar.\n` +
                `The grammar has both a Terminal(Token) and a Non-Terminal(Rule) named: <${currRuleName}>.\n` +
                `To resolve this make sure each Terminal and Non-Terminal names are unique\n` +
                `This is easy to accomplish by using the convention that Terminal names start with an uppercase letter\n` +
                `and Non-Terminal names start with a lower case letter.`

            errors.push({
                message:  errMsg,
                type:     ParserDefinitionErrorType.CONFLICT_TOKENS_RULES_NAMESPACE,
                ruleName: currRuleName
            })
        }
    })

    return errors
}

function validateDuplicateNestedRules(topLevelRules:gast.Rule[]):IParserDefinitionError[] {

    let errors = []

    forEach(topLevelRules, (currTopRule) => {
        let namedCollectorVisitor = new NamedDSLMethodsCollectorVisitor("")
        currTopRule.accept(namedCollectorVisitor)
        let nestedNames = map(namedCollectorVisitor.result, (currItem) => currItem.name)
        let namesGroups = groupBy(nestedNames, (item) => item)

        let duplicates:any = pick(namesGroups, (currGroup) => {
            return currGroup.length > 1
        })

        forEach(values(duplicates), (currDuplicates:any) => {
            let duplicateName = utils.first(currDuplicates)
            let errMsg = `Duplicate nested rule name: ->${duplicateName}<- inside rule: ->${currTopRule.name}<-\n` +
                `A nested name must be unique in the scope of a top level grammar rule.`
            errors.push({
                    message:  errMsg,
                    type:     ParserDefinitionErrorType.DUPLICATE_NESTED_NAME,
                    ruleName: currTopRule.name
                }
            )
        })
    })

    return errors
}
