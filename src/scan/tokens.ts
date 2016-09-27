import {TokenConstructor} from "./lexer_public"
import {has, forEach, isEmpty, getSuperClass, difference, cloneArr, contains} from "../utils/utils"
import {Token, LazyToken, IToken, SimpleLazyToken, LazyTokenCacheData, ISimpleToken, ISimpleLazyToken} from "./tokens_public"
import {HashTable} from "../lang/lang_extensions"

export function fillUpLineToOffset(lineToOffset:number[], text:string):void {
    let currLine = 0
    let currOffset = 0
    // line 1 (idx 0 in the array) always starts at offset 0
    lineToOffset.push(0)

    while (currOffset < text.length) {
        let c = text.charCodeAt(currOffset)
        if (c === 10) { // "\n"
            currLine++
            // +1 because the next line starts only AFTER the "\n"
            lineToOffset.push(currOffset + 1)
        }
        else if (c === 13) { // \r
            if (currOffset !== text.length - 1 &&
                text.charCodeAt(currOffset + 1) === 10) { // "\n"
                // +2 because the next line starts only AFTER the "\r\n"
                lineToOffset.push(currOffset + 2)
                // "consume" two chars
                currOffset++
            }
            else {
                currLine++
                // +1 because the next line starts only AFTER the "\r"
                lineToOffset.push(currOffset + 1)
            }
        }
        currOffset++
    }

    // to make the data structure consistent
    lineToOffset.push(Infinity)
}

export function getStartLineFromLineToOffset(startOffset:number, lineToOffset:number[]):number {
    return findLineOfOffset(startOffset, lineToOffset)
}

export function getEndLineFromLineToOffset(endOffset:number, lineToOffset:number[]):number {
    return findLineOfOffset(endOffset, lineToOffset)
}

export function getStartColumnFromLineToOffset(startOffset:number, lineToOffset:number[]):number {
    return findColumnOfOffset(startOffset, lineToOffset)
}

export function getEndColumnFromLineToOffset(endOffset:number, lineToOffset:number[]):number {
    // none inclusive
    return findColumnOfOffset(endOffset, lineToOffset)
}

/**
 *  Modification of a binary search to seek
 */
function findLineOfOffset(targetOffset:number, lineToOffset:number[]):number {
    let lowIdx = 0
    let highIdx = lineToOffset.length - 1
    let found = false
    let line = -1

    while (!found) {
        let middleIdx = Math.floor((highIdx + lowIdx) / 2)
        let middleOffset = lineToOffset[middleIdx]
        let middleNextOffset = lineToOffset[middleIdx + 1]

        if (middleOffset <= targetOffset &&
            middleNextOffset > targetOffset) {
            found = true
            line = middleIdx
        }
        else if (middleOffset > targetOffset) {
            highIdx = middleIdx

        }
        else if (middleNextOffset < targetOffset) {
            lowIdx = middleIdx
        }
        else if (middleNextOffset === targetOffset) {
            found = true
            line = middleIdx + 1
        }
        else {
            throw Error("non exhaustive match")
        }
    }

    // +1 because lines are counted from 1 while array indices are zero based.
    return line + 1
}

function findColumnOfOffset(offset:number, lineToOffset:number[]):number {
    let line = findLineOfOffset(offset, lineToOffset)
    // +1 because columns always start at 1
    return offset - lineToOffset[line - 1] + 1
}

export function tokenStructuredMatcher(tokInstance, tokConstructor) {
    if (tokInstance.tokenType === tokConstructor.tokenType) {
        return true
    }
    else if (tokConstructor.extendingTokenTypes.length > 0) {
        let extendingTokenTypes = tokConstructor.extendingTokenTypes
        let extendingTokenTypesLength = extendingTokenTypes.length
        for (let i = 0; i < extendingTokenTypesLength; i++) {
            if (extendingTokenTypes[i] === tokInstance.tokenType) {
                return true
            }
        }
        return false
    }
    else {
        return false
    }
}

export function tokenInstanceofMatcher(tokInstance, tokConstructor) {
    return tokInstance instanceof tokConstructor
}

export function tokenClassIdentity(tokenConstructor:TokenConstructor):string {
    // return tokenName(tokenConstructor)
    return (<any>tokenConstructor).tokenType
}

export function tokenInstanceIdentity(tokenInstance:IToken):string {
    return (<any>tokenInstance.constructor).tokenType
}

export function tokenStructuredIdentity(token:TokenConstructor|IToken):string {
    return (<any>token).tokenType
}

export function isBaseTokenOrObject(tokClass:TokenConstructor):boolean {
    return isBaseTokenClass(tokClass) || <any>tokClass === Object
}

export function isBaseTokenClass(tokClass:Function):boolean {
    return tokClass === Token || tokClass === LazyToken || tokClass === SimpleLazyToken
}

export let tokenShortNameIdx = 1
export const tokenIdxToClass = new HashTable<TokenConstructor>()

export function augmentTokenClasses(tokenClasses:TokenConstructor[]):void {
    // 1. collect the parent Token classes as well.
    let tokenClassesAndParents = expandTokenHierarchy(tokenClasses)

    // 2. add required tokenType and extendingTokenTypes properties
    assignTokenDefaultProps(tokenClassesAndParents)

    // 3. fill up the extendingTokenTypes
    assignExtendingTokensProp(tokenClassesAndParents)
}

export function expandTokenHierarchy(tokenClasses:TokenConstructor[]):TokenConstructor[] {
    let tokenClassesAndParents = cloneArr(tokenClasses)

    forEach(tokenClasses, (currTokClass) => {
        let currParentClass:any = getSuperClass(currTokClass)
        while (!isBaseTokenOrObject(currParentClass)) {
            if (!contains(tokenClassesAndParents, currParentClass)) {
                tokenClassesAndParents.push(currParentClass)
            }
            currParentClass = getSuperClass(currParentClass)
        }
    })

    return tokenClassesAndParents
}

export function assignTokenDefaultProps(tokenClasses:TokenConstructor[]):void {
    forEach(tokenClasses, (currTokClass) => {
        if (!hasShortKeyProperty(currTokClass)) {
            tokenIdxToClass.put(tokenShortNameIdx, currTokClass);
            (<any>currTokClass).tokenType = tokenShortNameIdx++
        }

        if (!hasExtendingTokensTypesProperty(currTokClass)) {
            currTokClass.extendingTokenTypes = []
        }
    })
}

export function assignExtendingTokensProp(tokenClasses:TokenConstructor[]):void {
    forEach(tokenClasses, (currTokClass) => {
        let currSubClassesExtendingTypes = [currTokClass.tokenType]
        let currParentClass:any = getSuperClass(currTokClass)

        while (!isBaseTokenClass(currParentClass) && currParentClass !== Object) {
            let newExtendingTypes = difference(currSubClassesExtendingTypes, currParentClass.extendingTokenTypes)
            currParentClass.extendingTokenTypes = currParentClass.extendingTokenTypes.concat(newExtendingTypes)
            currSubClassesExtendingTypes.push(currParentClass.tokenType)
            currParentClass = getSuperClass(currParentClass)
        }
    })

}

export function hasShortKeyProperty(tokClass:TokenConstructor):boolean {
    return has(tokClass, "tokenType")
}

export function hasExtendingTokensTypesProperty(tokClass:TokenConstructor):boolean {
    return has(tokClass, "extendingTokenTypes")
}

export type LazyTokenCreator = (startOffset:number,
                                endOffset:number,
                                tokClass:TokenConstructor,
                                cacheData:LazyTokenCacheData) => ISimpleToken

export function createSimpleLazyToken(startOffset:number,
                                      endOffset:number,
                                      tokClass:TokenConstructor,
                                      cacheData:LazyTokenCacheData):ISimpleLazyToken {
    return <any>{
        startOffset: startOffset,
        endOffset:   endOffset,
        tokenType:   (<any>tokClass).tokenType,
        cacheData:   cacheData
    }
}

export function createLazyTokenInstance(startOffset:number,
                                        endOffset:number,
                                        tokClass:TokenConstructor,
                                        cacheData:LazyTokenCacheData):IToken {
    return new (<any>tokClass)(startOffset, endOffset, cacheData)
}

export function isInheritanceBasedToken(token:ISimpleToken):boolean {
    return token instanceof Token || token instanceof LazyToken
}

export function getImageFromLazyToken(lazyToken):string {
    if (lazyToken.isInsertedInRecovery) {
        return ""
    }
    return lazyToken.cacheData.orgText.substring(lazyToken.startOffset, lazyToken.endOffset + 1)
}

export function getStartLineFromLazyToken(lazyToken):number {
    if (lazyToken.isInsertedInRecovery) {
        return NaN
    }
    ensureLineDataProcessing(lazyToken.cacheData)
    return getStartLineFromLineToOffset(lazyToken.startOffset, lazyToken.cacheData.lineToOffset)
}

export function getStartColumnFromLazyToken(lazyToken):number {
    if (lazyToken.isInsertedInRecovery) {
        return NaN
    }
    ensureLineDataProcessing(lazyToken.cacheData)
    return getStartColumnFromLineToOffset(lazyToken.startOffset, lazyToken.cacheData.lineToOffset)
}

export function getEndLineFromLazyToken(lazyToken):number {
    if (lazyToken.isInsertedInRecovery) {
        return NaN
    }
    ensureLineDataProcessing(lazyToken.cacheData)
    return getEndLineFromLineToOffset(lazyToken.endOffset, lazyToken.cacheData.lineToOffset)
}

export function getEndColumnFromLazyToken(lazyToken):number {
    if (lazyToken.isInsertedInRecovery) {
        return NaN
    }
    ensureLineDataProcessing(lazyToken.cacheData)
    return getEndColumnFromLineToOffset(lazyToken.endOffset, lazyToken.cacheData.lineToOffset)
}

export function ensureLineDataProcessing(cacheData):void {
    if (isEmpty(cacheData.lineToOffset)) {
        fillUpLineToOffset(cacheData.lineToOffset, cacheData.orgText)
    }
}

export function isLazyToken(tokType:TokenConstructor):boolean {
    return LazyToken.prototype.isPrototypeOf(tokType.prototype) ||
        SimpleLazyToken.prototype.isPrototypeOf(tokType.prototype)
}

export function isSimpleToken(tokType:TokenConstructor):boolean {
    return SimpleLazyToken.prototype.isPrototypeOf(tokType.prototype)
}

