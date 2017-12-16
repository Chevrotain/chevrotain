import { gast } from "./gast_public"
import { drop, forEach } from "../../utils/utils"

/**
 *  A Grammar Walker that computes the "remaining" grammar "after" a productions in the grammar.
 */
export abstract class RestWalker {
    walk(prod: gast.AbstractProduction, prevRest: any[] = []): void {
        forEach(prod.definition, (subProd: gast.IProduction, index) => {
            let currRest = drop(prod.definition, index + 1)

            if (subProd instanceof gast.NonTerminal) {
                this.walkProdRef(subProd, currRest, prevRest)
            } else if (subProd instanceof gast.Terminal) {
                this.walkTerminal(subProd, currRest, prevRest)
            } else if (subProd instanceof gast.Flat) {
                this.walkFlat(subProd, currRest, prevRest)
            } else if (subProd instanceof gast.Option) {
                this.walkOption(subProd, currRest, prevRest)
            } else if (subProd instanceof gast.RepetitionMandatory) {
                this.walkAtLeastOne(subProd, currRest, prevRest)
            } else if (
                subProd instanceof gast.RepetitionMandatoryWithSeparator
            ) {
                this.walkAtLeastOneSep(subProd, currRest, prevRest)
            } else if (subProd instanceof gast.RepetitionWithSeparator) {
                this.walkManySep(subProd, currRest, prevRest)
            } else if (subProd instanceof gast.Repetition) {
                this.walkMany(subProd, currRest, prevRest)
            } else if (subProd instanceof gast.Alternation) {
                this.walkOr(subProd, currRest, prevRest)
            } else {
                /* istanbul ignore next */
                throw Error("non exhaustive match")
            }
        })
    }

    walkTerminal(
        terminal: gast.Terminal,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {}

    walkProdRef(
        refProd: gast.NonTerminal,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {}

    walkFlat(
        flatProd: gast.Flat,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        // ABCDEF => after the D the rest is EF
        let fullOrRest = currRest.concat(prevRest)
        this.walk(flatProd, <any>fullOrRest)
    }

    walkOption(
        optionProd: gast.Option,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        // ABC(DE)?F => after the (DE)? the rest is F
        let fullOrRest = currRest.concat(prevRest)
        this.walk(optionProd, <any>fullOrRest)
    }

    walkAtLeastOne(
        atLeastOneProd: gast.RepetitionMandatory,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        // ABC(DE)+F => after the (DE)+ the rest is (DE)?F
        let fullAtLeastOneRest: gast.IProduction[] = [
            new gast.Option(atLeastOneProd.definition)
        ].concat(<any>currRest, <any>prevRest)
        this.walk(atLeastOneProd, fullAtLeastOneRest)
    }

    walkAtLeastOneSep(
        atLeastOneSepProd: gast.RepetitionMandatoryWithSeparator,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        // ABC DE(,DE)* F => after the (,DE)+ the rest is (,DE)?F
        let fullAtLeastOneSepRest = restForRepetitionWithSeparator(
            atLeastOneSepProd,
            currRest,
            prevRest
        )
        this.walk(atLeastOneSepProd, fullAtLeastOneSepRest)
    }

    walkMany(
        manyProd: gast.Repetition,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        // ABC(DE)*F => after the (DE)* the rest is (DE)?F
        let fullManyRest: gast.IProduction[] = [
            new gast.Option(manyProd.definition)
        ].concat(<any>currRest, <any>prevRest)
        this.walk(manyProd, fullManyRest)
    }

    walkManySep(
        manySepProd: gast.RepetitionWithSeparator,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        // ABC (DE(,DE)*)? F => after the (,DE)* the rest is (,DE)?F
        let fullManySepRest = restForRepetitionWithSeparator(
            manySepProd,
            currRest,
            prevRest
        )
        this.walk(manySepProd, fullManySepRest)
    }

    walkOr(
        orProd: gast.Alternation,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        // ABC(D|E|F)G => when finding the (D|E|F) the rest is G
        let fullOrRest = currRest.concat(prevRest)
        // walk all different alternatives
        forEach(orProd.definition, alt => {
            // wrapping each alternative in a single definition wrapper
            // to avoid errors in computing the rest of that alternative in the invocation to computeInProdFollows
            // (otherwise for OR([alt1,alt2]) alt2 will be considered in 'rest' of alt1
            let prodWrapper = new gast.Flat([alt])
            this.walk(prodWrapper, <any>fullOrRest)
        })
    }
}

function restForRepetitionWithSeparator(repSepProd, currRest, prevRest) {
    let repSepRest = [
        new gast.Option(
            [<any>new gast.Terminal(repSepProd.separator)].concat(
                repSepProd.definition
            )
        )
    ]
    let fullRepSepRest: gast.IProduction[] = repSepRest.concat(
        <any>currRest,
        <any>prevRest
    )
    return fullRepSepRest
}
