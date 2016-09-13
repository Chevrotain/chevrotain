import {TokenConstructor} from "./lexer_public"
import {has, forEach} from "../utils/utils"
import {Token, LazyToken} from "./tokens_public"

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

export function isBaseTokenClass(tokClass:Function):boolean {
    return tokClass === Token || tokClass === LazyToken
}

let tokenShortNameIdx = 0

export function augmentTokenClasses(tokenClasses:TokenConstructor[]):void {
    forEach(tokenClasses, (currTokClass) => {
        if (!hasShortKeyProperty(currTokClass)) {
            currTokClass.uniqueTokenTypeShortKey = tokenShortNameIdx++
        }
    })
}

export function hasShortKeyProperty(tokClass:TokenConstructor):boolean {
    return has(tokClass, "uniqueTokenTypeShortKey")
}
