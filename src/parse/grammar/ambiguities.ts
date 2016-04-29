import {
    isEmpty,
    map,
    reduce,
    forEach
} from "../../utils/utils"
import {tokenLabel} from "../../scan/tokens_public"
import {Alternative, containsPath} from "./lookahead"

export function checkForOrAmbiguities(alternatives:Alternative[],
                                      orOccurrence:number,
                                      ruleName:string):void {
    let altsAmbiguityErrors = checkAlternativesAmbiguities(alternatives)

    if (!isEmpty(altsAmbiguityErrors)) {
        let errorMessages = map(altsAmbiguityErrors, (currAmbiguity) => {
            // From the user's prospective the alternatives are counted from one (1 , 2 , 3 ...)
            let ambgIndices = map(currAmbiguity.alts, (currAltIdx) => currAltIdx + 1)
            let pathMsg = map(currAmbiguity.path, (currtok) => tokenLabel(currtok)).join(", ")
            return `Ambiguous alternatives: <${ambgIndices.join(" ,")}> in <OR${orOccurrence}> inside <${ruleName}> Rule,\n` +
                `<${pathMsg}> may appears as a prefix path in all these alternatives.\n`
        })

        throw new Error(errorMessages.join("\n ---------------- \n") +
            "To Resolve this, try one of of the following: \n" +
            "1. Refactor your grammar to be LL(K) for the current value of k (by default k=5)\n" +
            "2. Increase the value of K for your grammar by providing a larger 'maxLookahead' value in the parser's config\n" +
            "3. Add ignore ambiguities argument to this OR Production:\n" +
            "OR([], 'msg', Parser.IGNORE_AMBIGUITIES)\n" +
            "This will cause the parser to always pick the first alternative that matches and ignore all others")
    }
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
