/// <reference path="../scan/Tokens.ts" />
/// <reference path="../text/Range.ts" />
/// <reference path="../lang/LangExtensions.ts" />
/// <reference path="../parse/grammar/GAst.ts" />
/// <reference path="../../libs/lodash.d.ts" />


// module for building the GAst representation of the parserImpel
module chevrotain.parse.gast.builder {

    import tok = chevrotain.scan.tokens
    import r = chevrotain.text.range
    import gast = chevrotain.parse.grammar.gast
    import lang = chevrotain.lang.extensions;

    export enum ProdType {
        TOP_LEVEL,
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
        // can't simply do 'typeof' IProduction because typeScript does not support 'typeof' on an Interface
        type:ProdType
    }

    // CONSUME1([ns1.ns2.ns3.]LCurlyTok)
    var terminalRegEx = /this\s*.\s*CONSUME(\d)\s*\(\s*(?:[a-zA-Z0-9]+\s*\.\s*)*([a-zA-Z0-9]+)/
    var terminalRegGlobal = /this\s*.\s*CONSUME\d\s*\(\s*(?:[a-zA-Z0-9]+\s*\.\s*)*(?:[a-zA-Z0-9]+)/g

    // note that there is an optional underscore '_' before the 'this'
    // typescript adds this when generating code for arrow function ()=>{...}
    var refRegEx = /this\s*.\s*SUBRULE\s*\(\s*_?this\s*.\s*(\w+)\s*\(\s*(\d)/
    var refRegExGlobal = /this\s*.\s*SUBRULE\s*\(\s*_?this\s*.\s*\w+\s*\(\s*\d/g

    // this.OPTION(this.isSemicolon, ()=> {semicolon = this.CONSUME1(tok.SemicolonTok)})
    var optionRegEx = /this\s*.\s*OPTION\s*\(/g
    var orRegEx = /this\s*.\s*OR\s*\(/g
    var manyRegEx = /this\s*.\s*MANY\s*\(/g
    var manyOrRegEx = /this\s*.\s*MANY_OR\s*\(/g
    var orInManyRegEx = /_OR\s*\(/g
    var atLeastOneRegEx = /this\s*.\s*AT_LEAST_ONE\s*\(/g

    var orPartRegEx = /{\s*WHEN\s*:/g

    export interface ITerminalNameToConstructor {
        [fqn: string]: Function
    }

    export var terminalNameToConstructor:ITerminalNameToConstructor = {}

    export function buildTopProduction(impelText:string, name:string, terminals:ITerminalNameToConstructor):gast.TOP_LEVEL {
        // pseudo state. so little state does not yet mandate the complexity of wrapping in a class...
        // TODO: this is confusing, might be time to create a class..
        terminalNameToConstructor = terminals
        // the top most range must strictly contain all the other ranges
        // which is why we prefix the text with " " (curr Range impel is only for positive ranges)
        impelText = " " + impelText
        var txtWithoutComments = removeComments(" " + impelText)
        // TODO: consider removing literal strings too to avoid future errors (literal string with ')' for example)
        var prodRanges = createRanges(txtWithoutComments)
        var topRange = new r.Range(0, impelText.length + 2)
        return buildTopLevel(name, topRange, prodRanges)
    }

    function buildTopLevel(name:string, topRange:r.IRange, allRanges:IProdRange[]):gast.TOP_LEVEL {
        var topLevelProd = new gast.TOP_LEVEL(name, [])
        return buildAbstractProd(topLevelProd, topRange, allRanges)
    }

    export function buildProdGast(prodRange:IProdRange, allRanges:IProdRange[]):gast.IProduction {
        "use strict"
        switch (prodRange.type) {
            case ProdType.AT_LEAST_ONE:
                return buildAbstractProd(new gast.AT_LEAST_ONE([]), prodRange.range, allRanges)
            case ProdType.MANY:
                return buildAbstractProd(new gast.MANY([]), prodRange.range, allRanges)
            case ProdType.OPTION:
                return buildAbstractProd(new gast.OPTION([]), prodRange.range, allRanges)
            case ProdType.OR:
                return buildAbstractProd(new gast.OR([]), prodRange.range, allRanges)
            case ProdType.FLAT:
                return buildAbstractProd(new gast.FLAT([]), prodRange.range, allRanges)
            case ProdType.REF:
                return buildRefProd(prodRange)
            case ProdType.TERMINAL:
                return buildTerminalProd(prodRange)
            default:
            { throw Error("None exhaustive match") }
        }
    }

    function buildRefProd(prodRange:IProdRange):gast.ProdRef {
        var reResult = refRegEx.exec(prodRange.text)
        var refProdName = reResult[1]
        var refOccurrence = parseInt(reResult[2], 10)
        return new gast.ProdRef(refProdName, null, refOccurrence)
    }

    function buildTerminalProd(prodRange:IProdRange):gast.Terminal {
        var reResult = terminalRegEx.exec(prodRange.text)
        var terminalOccurrence = parseInt(reResult[1], 10)
        var terminalName = reResult[2]
        var terminalType = terminalNameToConstructor[terminalName]
        if (!terminalType) {
            throw Error("Terminal Token name: " + terminalName + " not found")
        }
        return new gast.Terminal(terminalType, terminalOccurrence)
    }

    function buildAbstractProd<T extends gast.AbstractProduction>(prod:T,
                                                                  topLevelRange:r.IRange,
                                                                  allRanges:IProdRange[]):T {
        var secondLevelProds = getDirectlyContainedRanges(topLevelRange, allRanges)
        var secondLevelInOrder = _.sortBy(secondLevelProds, (prodRng) => { return prodRng.range.start })

        var definition:gast.IProduction[] = []
        _.forEach(secondLevelInOrder, (prodRng) => {
            definition.push(buildProdGast(prodRng, allRanges))
        })

        // TODO-ss: intelij bug with generics + constraints remove type assertion when fixed
        var assertedProd = <gast.AbstractProduction>prod
        assertedProd.definition = definition
        return <any>assertedProd
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
        var manyOrRanges = createManyOrRanges(text)

        return _.union(terminalRanges, refsRanges, atLeastOneRanges, atLeastOneRanges,
            manyRanges, optionRanges, orRanges, manyOrRanges)
    }

    export function createTerminalRanges(text:string):IProdRange[] {
        return createRefOrTerminalProdRangeInternal(text, ProdType.TERMINAL, terminalRegGlobal)
    }

    export function createRefsRanges(text:string):IProdRange[] {
        return createRefOrTerminalProdRangeInternal(text, ProdType.REF, refRegExGlobal)
    }

    export function createAtLeastOneRanges(text:string):IProdRange[] {
        return createOperatorProdRangeParenthesis(text, ProdType.AT_LEAST_ONE, atLeastOneRegEx)
    }

    export function createManyRanges(text:string):IProdRange[] {
        return createOperatorProdRangeParenthesis(text, ProdType.MANY, manyRegEx)
    }

    export function createOptionRanges(text:string):IProdRange[] {
        return createOperatorProdRangeParenthesis(text, ProdType.OPTION, optionRegEx)
    }

    export function createOrRanges(text):IProdRange[] {
        var orRanges = createOperatorProdRangeParenthesis(text, ProdType.OR, orRegEx)
        // have to split up the OR cases into separate FLAT productions
        // (A |BB | CDE) ==> or.def[0] --> FLAT(A) , or.def[1] --> FLAT(BB) , or.def[2] --> FLAT(CCDE)
        var orSubPartsRanges = createOrPartRanges(orRanges)
        return _.union(orRanges, orSubPartsRanges)
    }

    // MANY_OR is just "syntactic sugar" its parsed as MANY(OR(...)
    export function createManyOrRanges(text):IProdRange[] {
        var manyRanges = createOperatorProdRangeParenthesis(text, ProdType.MANY, manyOrRegEx)
        var orInManyRanges = createOperatorProdRangeParenthesis(text, ProdType.OR, orInManyRegEx)
        _.forEach(orInManyRanges, (innerOr) => {
            // for MANY_OR(....) the terminating parentehsis is the same, which will break the condition of striclyContains...
            // so we adjust the OR to 'end' just before the MANY
            innerOr.range.end = innerOr.range.end - 1
        })
        // have to split up the OR cases into separate FLAT productions
        // (A |BB | CDE) ==> or.def[0] --> FLAT(A) , or.def[1] --> FLAT(BB) , or.def[2] --> FLAT(CCDE)
        var orSubPartsRanges = createOrPartRanges(orInManyRanges)
        return _.union(manyRanges, orInManyRanges, orSubPartsRanges)
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


    function findClosingOffset(opening:string, closing:string, start:number, text:string):number {
        var parenthesisStack = [1]

        var i = 0
        while (!(_.isEmpty(parenthesisStack)) && i + start < text.length) {
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


    export class GastRefResolverVisitor extends gast.GAstVisitor {

        constructor(private nameToProd:lang.Hashtable<gast.TOP_LEVEL>) { super() }

        public resolveRefs():void {
            _.forEach(this.nameToProd.values(), (prod) => {
                prod.accept(this)
            })
        }

        public visitProdRef(node:gast.ProdRef):void {
            var ref = this.nameToProd.get(node.refProdName)

            if (!ref) {
                throw Error("Invalid grammar, reference to rule which is not defined --> " + node.refProdName)
            }

            node.ref = ref
        }

    }
}

