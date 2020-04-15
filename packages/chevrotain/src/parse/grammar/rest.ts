import { drop, forEach } from "../../utils/utils"
import {
  AbstractProduction,
  Alternation,
  Alternative,
  NonTerminal,
  Option,
  Repetition,
  RepetitionMandatory,
  RepetitionMandatoryWithSeparator,
  RepetitionWithSeparator,
  Terminal
} from "./gast/gast_public"
import { IProduction } from "../../../api"

/**
 *  A Grammar Walker that computes the "remaining" grammar "after" a productions in the grammar.
 */
export abstract class RestWalker {
  walk(prod: AbstractProduction, prevRest: any[] = []): void {
    forEach(prod.definition, (subProd: IProduction, index) => {
      let currRest = drop(prod.definition, index + 1)
      /* istanbul ignore else */
      if (subProd instanceof NonTerminal) {
        this.walkProdRef(subProd, currRest, prevRest)
      } else if (subProd instanceof Terminal) {
        this.walkTerminal(subProd, currRest, prevRest)
      } else if (subProd instanceof Alternative) {
        this.walkFlat(subProd, currRest, prevRest)
      } else if (subProd instanceof Option) {
        this.walkOption(subProd, currRest, prevRest)
      } else if (subProd instanceof RepetitionMandatory) {
        this.walkAtLeastOne(subProd, currRest, prevRest)
      } else if (subProd instanceof RepetitionMandatoryWithSeparator) {
        this.walkAtLeastOneSep(subProd, currRest, prevRest)
      } else if (subProd instanceof RepetitionWithSeparator) {
        this.walkManySep(subProd, currRest, prevRest)
      } else if (subProd instanceof Repetition) {
        this.walkMany(subProd, currRest, prevRest)
      } else if (subProd instanceof Alternation) {
        this.walkOr(subProd, currRest, prevRest)
      } else {
        throw Error("non exhaustive match")
      }
    })
  }

  walkTerminal(
    terminal: Terminal,
    currRest: IProduction[],
    prevRest: IProduction[]
  ): void {}

  walkProdRef(
    refProd: NonTerminal,
    currRest: IProduction[],
    prevRest: IProduction[]
  ): void {}

  walkFlat(
    flatProd: Alternative,
    currRest: IProduction[],
    prevRest: IProduction[]
  ): void {
    // ABCDEF => after the D the rest is EF
    let fullOrRest = currRest.concat(prevRest)
    this.walk(flatProd, <any>fullOrRest)
  }

  walkOption(
    optionProd: Option,
    currRest: IProduction[],
    prevRest: IProduction[]
  ): void {
    // ABC(DE)?F => after the (DE)? the rest is F
    let fullOrRest = currRest.concat(prevRest)
    this.walk(optionProd, <any>fullOrRest)
  }

  walkAtLeastOne(
    atLeastOneProd: RepetitionMandatory,
    currRest: IProduction[],
    prevRest: IProduction[]
  ): void {
    // ABC(DE)+F => after the (DE)+ the rest is (DE)?F
    let fullAtLeastOneRest: IProduction[] = [
      new Option({ definition: atLeastOneProd.definition })
    ].concat(<any>currRest, <any>prevRest)
    this.walk(atLeastOneProd, fullAtLeastOneRest)
  }

  walkAtLeastOneSep(
    atLeastOneSepProd: RepetitionMandatoryWithSeparator,
    currRest: IProduction[],
    prevRest: IProduction[]
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
    manyProd: Repetition,
    currRest: IProduction[],
    prevRest: IProduction[]
  ): void {
    // ABC(DE)*F => after the (DE)* the rest is (DE)?F
    let fullManyRest: IProduction[] = [
      new Option({ definition: manyProd.definition })
    ].concat(<any>currRest, <any>prevRest)
    this.walk(manyProd, fullManyRest)
  }

  walkManySep(
    manySepProd: RepetitionWithSeparator,
    currRest: IProduction[],
    prevRest: IProduction[]
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
    orProd: Alternation,
    currRest: IProduction[],
    prevRest: IProduction[]
  ): void {
    // ABC(D|E|F)G => when finding the (D|E|F) the rest is G
    let fullOrRest = currRest.concat(prevRest)
    // walk all different alternatives
    forEach(orProd.definition, (alt) => {
      // wrapping each alternative in a single definition wrapper
      // to avoid errors in computing the rest of that alternative in the invocation to computeInProdFollows
      // (otherwise for OR([alt1,alt2]) alt2 will be considered in 'rest' of alt1
      let prodWrapper = new Alternative({ definition: [alt] })
      this.walk(prodWrapper, <any>fullOrRest)
    })
  }
}

function restForRepetitionWithSeparator(repSepProd, currRest, prevRest) {
  let repSepRest = [
    new Option({
      definition: [new Terminal({ terminalType: repSepProd.separator })].concat(
        repSepProd.definition
      )
    })
  ]
  let fullRepSepRest: IProduction[] = repSepRest.concat(
    <any>currRest,
    <any>prevRest
  )
  return fullRepSepRest
}
