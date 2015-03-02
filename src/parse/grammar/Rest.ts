/// <reference path="../../parse/grammar/GAst.ts" />
/// <reference path="../../../libs/lodash.d.ts" />

module chevrotain.parse.grammar.rest {

    import g = chevrotain.parse.grammar.gast

    export class RestWalker {

        walk(prod:g.AbstractProduction, prevRest:gast.IProduction[] = []):void {
            _.forEach(prod.definition, (subProd:gast.IProduction, index) => {
                var currRest = _.drop(prod.definition, index + 1)

                if (subProd instanceof g.ProdRef) {
                    this.walkProdRef(<g.ProdRef>subProd, currRest, prevRest)
                }
                else if (subProd instanceof g.Terminal) {
                    this.walkTerminal(<g.Terminal>subProd, currRest, prevRest)
                }
                else if (subProd instanceof g.TOP_LEVEL) {
                    this.walkTopLevel(<g.TOP_LEVEL>subProd, currRest, prevRest)
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

        // override this either with an empty impel to ignore terminals
        // or implement relevant logic to compute "things" once a terminal has been found
        walkTerminal(terminal:g.Terminal, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            throw Error("unimplemented Abstract Error")
        }

        // override this either with an empty impel to ignore references to other productions
        // or implement an expansion of other production references
        walkProdRef(refProd:g.ProdRef, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            throw Error("unimplemented Abstract Error")
        }

        walkTopLevel(topProd:g.TOP_LEVEL, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            // top level is just a special case of a flat production...
            var fullOrRest = currRest.concat(prevRest)
            this.walk(topProd, fullOrRest)
        }

        walkFlat(flatProd:g.FLAT, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            // ABCDEF => after the D the rest is EF
            var fullOrRest = currRest.concat(prevRest)
            this.walk(flatProd, fullOrRest)
        }

        walkOption(OptionProd:g.OPTION, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            // ABC(DE)?F => after the (DE)? the rest is F
            var fullOrRest = currRest.concat(prevRest)
            this.walk(OptionProd, fullOrRest)
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
                this.walk(prodWrapper, fullOrRest)
            })
        }

    }

}
