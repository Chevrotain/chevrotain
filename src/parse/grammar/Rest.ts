/// <reference path="../../parse/grammar/GAst.ts" />
/// <reference path="../../../libs/lodash.d.ts" />

module chevrotain.rest {

    import g = chevrotain.gast

    export class RestWalker {

        // TODO: using "any" in prevRest due to IntelliJ bug
        walk(prod:g.AbstractProduction, prevRest:any[] = []):void {
            _.forEach(prod.definition, (subProd:gast.IProduction, index) => {
                var currRest = _.drop(prod.definition, index + 1)

                if (subProd instanceof g.ProdRef) {
                    this.walkProdRef(<g.ProdRef>subProd, currRest, prevRest)
                }
                else if (subProd instanceof g.Terminal) {
                    this.walkTerminal(<g.Terminal>subProd, currRest, prevRest)
                }
                else if (subProd instanceof g.FLAT) {
                    this.walkFlat(<g.FLAT>subProd, currRest, prevRest)
                }
                else if (subProd instanceof g.OPTION) {
                    this.walkOption(<g.OPTION>subProd, currRest, prevRest)
                }
                else if (subProd instanceof g.AT_LEAST_ONE) {
                    this.walkAtLeastOne(<g.AT_LEAST_ONE>subProd, currRest, prevRest)
                }
                else if (subProd instanceof g.MANY) {
                    this.walkMany(<g.MANY>subProd, currRest, prevRest)
                }
                else if (subProd instanceof g.OR) {
                    this.walkOr(<g.OR>subProd, currRest, prevRest)
                }
                else {throw Error("non exhaustive match") }
            })
        }

        walkTerminal(terminal:g.Terminal, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
        }

        // override this either with an empty impel to ignore references to other productions
        // or implement an expansion of other production references
        /* istanbul ignore next */
        walkProdRef(refProd:g.ProdRef, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            throw Error("unimplemented Abstract Error")
        }

        walkFlat(flatProd:g.FLAT, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            // ABCDEF => after the D the rest is EF
            var fullOrRest = currRest.concat(prevRest)
            this.walk(flatProd, <any>fullOrRest)
        }

        walkOption(optionProd:g.OPTION, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            // ABC(DE)?F => after the (DE)? the rest is F
            var fullOrRest = currRest.concat(prevRest)
            this.walk(optionProd, <any>fullOrRest)
        }

        walkAtLeastOne(atLeastOneProd:g.AT_LEAST_ONE, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            // ABC(DE)+F => after the (DE)+ the rest is (DE)?F
            var fullAtLeastOneRest:g.IProduction[] = [new g.OPTION(atLeastOneProd.definition)].concat(<any>currRest, <any>prevRest)
            this.walk(atLeastOneProd, fullAtLeastOneRest)
        }

        walkMany(manyProd:g.MANY, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            // ABC(DE)*F => after the (DE)* the rest is (DE)?F
            var fullManyRest:g.IProduction[] = [new g.OPTION(manyProd.definition)].concat(<any>currRest, <any>prevRest)
            this.walk(manyProd, fullManyRest)
        }

        walkOr(orProd:g.OR, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            // ABC(D|E|F)G => when finding the (D|E|F) the rest is G
            var fullOrRest = currRest.concat(prevRest)
            // walk all different alternatives
            _.forEach(orProd.definition, (alt) => {
                // wrapping each alternative in a single definition wrapper
                // to avoid errors in computing the rest of that alternative in the invocation to computeInProdFollows
                // (otherwise for OR([alt1,alt2]) alt2 will be considered in 'rest' of alt1
                var prodWrapper = new gast.FLAT([alt])
                this.walk(prodWrapper, <any>fullOrRest)
            })
        }

    }

}
