// module for building the GAst representation of a Grammar
module chevrotain.gastBuilder {

    import r = chevrotain.range
    import gast = chevrotain.gast
    import lang = chevrotain.lang;

    export enum ProdType {
        OPTION,
        OR,
        MANY,
        AT_LEAST_ONE,
        REF,
        TERMINAL,
        FLAT
    }

    export interface IProdRange {
        range:r.IRange
        text:string
        type:ProdType
    }

    // TODO: this regexp creates a constraint on names of Terminals (Tokens).
    // TODO: document and consider reducing the constraint by expanding the regexp
    var terminalRegEx = /\.\s*CONSUME(\d)?\s*\(\s*(?:[a-zA-Z_$]\w*\s*\.\s*)*([a-zA-Z_$]\w*)/
    var terminalRegGlobal = new RegExp(terminalRegEx.source, "g")

    var refRegEx = /\.\s*SUBRULE(\d)?\s*\(\s*(?:[a-zA-Z_$]\w*\s*\.\s*)*([a-zA-Z_$]\w*)/
    var refRegExGlobal = new RegExp(refRegEx.source, "g")

    var optionRegEx = /\.\s*OPTION(\d)?\s*\(/
    var optionRegExGlobal = new RegExp(optionRegEx.source, "g")

    var manyRegEx = /.\s*MANY(\d)?\s*\(/
    var manyRegExGlobal = new RegExp(manyRegEx.source, "g")

    var atLeastOneRegEx = /\.\s*AT_LEAST_ONE(\d)?\s*\(/
    var atLeastOneRegExGlobal = new RegExp(atLeastOneRegEx.source, "g")

    var orRegEx = /\.\s*OR(\d)?\s*\(/
    var orRegExGlobal = new RegExp(orRegEx.source, "g")

    var orPartRegEx = /{\s*(WHEN|ALT)\s*:/g

    export interface ITerminalNameToConstructor {
        [fqn: string]: Function
    }

    export var terminalNameToConstructor:ITerminalNameToConstructor = {}

    export function buildTopProduction(impelText:string, name:string, terminals:ITerminalNameToConstructor):gast.Rule {
        // pseudo state. so little state does not yet mandate the complexity of wrapping in a class...
        // TODO: this is confusing, might be time to create a class..
        terminalNameToConstructor = terminals
        // the top most range must strictly contain all the other ranges
        // which is why we prefix the text with " " (curr Range impel is only for positive ranges)
        var spacedImpelText = " " + impelText
        var txtWithoutComments = removeComments(" " + spacedImpelText)
        // TODO: consider removing literal strings too to avoid future errors (literal string with ')' for example)
        var prodRanges = createRanges(txtWithoutComments)
        var topRange = new r.Range(0, impelText.length + 2)
        return buildTopLevel(name, topRange, prodRanges, impelText)
    }

    function buildTopLevel(name:string, topRange:r.IRange, allRanges:IProdRange[], orgText:string):gast.Rule {
        var topLevelProd = new gast.Rule(name, [], orgText)
        return buildAbstractProd(topLevelProd, topRange, allRanges)
    }

    export function buildProdGast(prodRange:IProdRange, allRanges:IProdRange[]):gast.IProduction {
        "use strict"
        switch (prodRange.type) {
            case ProdType.AT_LEAST_ONE:
                return buildAtLeastOneProd(prodRange, allRanges)
            case ProdType.MANY:
                return buildManyProd(prodRange, allRanges)
            case ProdType.OPTION:
                return buildOptionProd(prodRange, allRanges)
            case ProdType.OR:
                return buildOrProd(prodRange, allRanges)
            case ProdType.FLAT:
                return buildAbstractProd(new gast.Flat([]), prodRange.range, allRanges)
            case ProdType.REF:
                return buildRefProd(prodRange)
            case ProdType.TERMINAL:
                return buildTerminalProd(prodRange)
            default:
                throw Error("non exhaustive match")
        }
    }

    function buildRefProd(prodRange:IProdRange):gast.NonTerminal {
        var reResult = refRegEx.exec(prodRange.text)
        var isImplicitOccurrenceIdx = reResult[1] === undefined
        var refOccurrence = isImplicitOccurrenceIdx ? 1 : parseInt(reResult[1], 10)
        var refProdName = reResult[2]
        var newRef = new gast.NonTerminal(refProdName, undefined, refOccurrence)
        newRef.implicitOccurrenceIndex = isImplicitOccurrenceIdx
        return newRef
    }

    function buildTerminalProd(prodRange:IProdRange):gast.Terminal {
        var reResult = terminalRegEx.exec(prodRange.text)
        var isImplicitOccurrenceIdx = reResult[1] === undefined
        var terminalOccurrence = isImplicitOccurrenceIdx ? 1 : parseInt(reResult[1], 10)
        var terminalName = reResult[2]
        var terminalType = terminalNameToConstructor[terminalName]
        if (!terminalType) {
            throw Error("Terminal Token name: " + terminalName + " not found")
        }

        var newTerminal = new gast.Terminal(terminalType, terminalOccurrence)
        newTerminal.implicitOccurrenceIndex = isImplicitOccurrenceIdx
        return newTerminal
    }

    // http://stackoverflow.com/questions/17125764/can-you-specify-multiple-type-constraints-for-typescript-generics
    interface AbsProdWithOccurrence extends gast.IProductionWithOccurrence, gast.AbstractProduction {}

    function buildProdWithOccurrence<T extends AbsProdWithOccurrence>(regEx:RegExp,
                                                                      prodInstance:T,
                                                                      prodRange:IProdRange,
                                                                      allRanges:IProdRange[]):T {
        var reResult = regEx.exec(prodRange.text)
        var isImplicitOccurrenceIdx = reResult[1] === undefined
        prodInstance.occurrenceInParent = isImplicitOccurrenceIdx ? 1 : parseInt(reResult[1], 10)
        prodInstance.implicitOccurrenceIndex = isImplicitOccurrenceIdx
        // <any> due to intellij bugs
        return <any>buildAbstractProd(prodInstance, prodRange.range, allRanges)
    }

    function buildAtLeastOneProd(prodRange:IProdRange, allRanges:IProdRange[]):gast.RepetitionMandatory {
        return buildProdWithOccurrence(atLeastOneRegEx, new gast.RepetitionMandatory([]), prodRange, allRanges)
    }

    function buildManyProd(prodRange:IProdRange, allRanges:IProdRange[]):gast.Repetition {
        return buildProdWithOccurrence(manyRegEx, new gast.Repetition([]), prodRange, allRanges)
    }

    function buildOptionProd(prodRange:IProdRange, allRanges:IProdRange[]):gast.Option {
        return buildProdWithOccurrence(optionRegEx, new gast.Option([]), prodRange, allRanges)
    }

    function buildOrProd(prodRange:IProdRange, allRanges:IProdRange[]):gast.Alternation {
        return buildProdWithOccurrence(orRegEx, new gast.Alternation([]), prodRange, allRanges)
    }

    function buildAbstractProd<T extends AbsProdWithOccurrence | gast.AbstractProduction >(prod:T,
                                                                                           topLevelRange:r.IRange,
                                                                                           allRanges:IProdRange[]):T {
        var secondLevelProds = getDirectlyContainedRanges(topLevelRange, allRanges)
        var secondLevelInOrder = _.sortBy(secondLevelProds, (prodRng) => { return prodRng.range.start })

        var definition:gast.IProduction[] = []
        _.forEach(secondLevelInOrder, (prodRng) => {
            definition.push(buildProdGast(prodRng, allRanges))
        });

        // IntelliJ bug workaround
        (<any>prod).definition = definition
        return prod
    }

    export function getDirectlyContainedRanges(y:r.IRange, prodRanges:IProdRange[]):IProdRange[] {
        return _.filter(prodRanges, (x:IProdRange) => {
            var isXDescendantOfY = y.strictlyContainsRange(x.range)
            var xDoesNotHaveAnyAncestorWhichIsDecendantOfY = _.every(prodRanges, (maybeAnotherParent:IProdRange) => {
                var isParentOfX = maybeAnotherParent.range.strictlyContainsRange(x.range)
                var isChildOfY = maybeAnotherParent.range.isStrictlyContainedInRange(y)
                return !(isParentOfX && isChildOfY)
            })
            return isXDescendantOfY && xDoesNotHaveAnyAncestorWhichIsDecendantOfY
        })
    }

    var singleLineCommentRegEx = /\/\/.*/g
    var multiLineCommentRegEx = /\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g

    export function removeComments(text:string):string {
        var noSingleLine = text.replace(singleLineCommentRegEx, "")
        var noComments = noSingleLine.replace(multiLineCommentRegEx, "")
        return noComments
    }

    export function createRanges(text:string):IProdRange[] {
        var terminalRanges = createTerminalRanges(text)
        var refsRanges = createRefsRanges(text)
        var atLeastOneRanges = createAtLeastOneRanges(text)
        var manyRanges = createManyRanges(text)
        var optionRanges = createOptionRanges(text)
        var orRanges = createOrRanges(text)

        return _.union(terminalRanges, refsRanges, atLeastOneRanges, atLeastOneRanges,
            manyRanges, optionRanges, orRanges)
    }

    export function createTerminalRanges(text:string):IProdRange[] {
        return createRefOrTerminalProdRangeInternal(text, ProdType.TERMINAL, terminalRegGlobal)
    }

    export function createRefsRanges(text:string):IProdRange[] {
        return createRefOrTerminalProdRangeInternal(text, ProdType.REF, refRegExGlobal)
    }

    export function createAtLeastOneRanges(text:string):IProdRange[] {
        return createOperatorProdRangeParenthesis(text, ProdType.AT_LEAST_ONE, atLeastOneRegExGlobal)
    }

    export function createManyRanges(text:string):IProdRange[] {
        return createOperatorProdRangeParenthesis(text, ProdType.MANY, manyRegExGlobal)
    }

    export function createOptionRanges(text:string):IProdRange[] {
        return createOperatorProdRangeParenthesis(text, ProdType.OPTION, optionRegExGlobal)
    }

    export function createOrRanges(text):IProdRange[] {
        var orRanges = createOperatorProdRangeParenthesis(text, ProdType.OR, orRegExGlobal)
        // have to split up the OR cases into separate FLAT productions
        // (A |BB | CDE) ==> or.def[0] --> FLAT(A) , or.def[1] --> FLAT(BB) , or.def[2] --> FLAT(CCDE)
        var orSubPartsRanges = createOrPartRanges(orRanges)
        return _.union(orRanges, orSubPartsRanges)
    }

    var findClosingCurly:(start:number, text:string) => number = <any>_.partial(findClosingOffset, "{", "}")

    var findClosingParen:(start:number, text:string) => number = <any>_.partial(findClosingOffset, "(", ")")

    export function createOrPartRanges(orRanges:IProdRange[]):IProdRange[] {
        var orPartRanges:IProdRange[] = []
        _.forEach(orRanges, (orRange) => {
            var currOrParts = createOperatorProdRangeInternal(orRange.text, ProdType.FLAT, orPartRegEx, findClosingCurly)
            var currOrRangeStart = orRange.range.start
            // fix offsets as we are working on a subset of the text
            _.forEach(currOrParts, (orPart) => {
                orPart.range.start += currOrRangeStart
                orPart.range.end += currOrRangeStart
            })
            orPartRanges = _.union(orPartRanges, currOrParts)
        })

        var uniqueOrPartRanges = _.uniq(orPartRanges, (prodRange:IProdRange) => {
            // using "~" as a separator for the identify function as its not a valid char in javascript
            return prodRange.type + "~" + prodRange.range.start + "~" + prodRange.range.end + "~" + prodRange.text
        })

        return uniqueOrPartRanges
    }

    function createRefOrTerminalProdRangeInternal(text:string, prodType:ProdType, pattern:RegExp):IProdRange[] {
        var prodRanges:IProdRange[] = []
        var matched:RegExpExecArray
        while (matched = pattern.exec(text)) {
            var start = matched.index
            var stop = pattern.lastIndex
            var currRange = new r.Range(start, stop)
            var currText = matched[0]
            prodRanges.push({range: currRange, text: currText, type: prodType})
        }
        return prodRanges
    }

    function createOperatorProdRangeParenthesis(text:string, prodType:ProdType, pattern:RegExp):IProdRange[] {
        return createOperatorProdRangeInternal(text, prodType, pattern, findClosingParen)
    }

    function createOperatorProdRangeInternal(text:string,
                                             prodType:ProdType,
                                             pattern:RegExp,
                                             findTerminatorOffSet:(startAt:number,
                                                                   text:string) => number):IProdRange[] {
        var operatorRanges:IProdRange[] = []
        var matched:RegExpExecArray
        while (matched = pattern.exec(text)) {
            var start = matched.index
            var stop = findTerminatorOffSet(start + matched[0].length, text)
            var currRange = new r.Range(start, stop)
            var currText = text.substr(start, stop - start + 1)
            operatorRanges.push({range: currRange, text: currText, type: prodType})
        }
        return operatorRanges
    }

    export function findClosingOffset(opening:string, closing:string, start:number, text:string):number {
        var parenthesisStack = [1]

        var i = 0
        while (!(_.isEmpty(parenthesisStack)) && i + start < text.length) {
            // TODO: verify this is indeed meant to skip the first character?
            i++
            var nextChar = text.charAt(start + i)
            if (nextChar === opening) {
                parenthesisStack.push(1)
            }
            else if (nextChar === closing) {
                parenthesisStack.pop()
            }
        }

        // valid termination of the search loop
        if (_.isEmpty(parenthesisStack)) {
            return i + start
        }
        else {
            throw new Error("INVALID INPUT TEXT, UNTERMINATED PARENTHESIS")
        }
    }
}
