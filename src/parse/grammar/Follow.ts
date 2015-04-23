/// <reference path="../../scan/Tokens.ts" />
/// <reference path="../../parse/grammar/GAst.ts" />
/// <reference path="../../parse/grammar/Rest.ts" />
/// <reference path="../../parse/grammar/First.ts" />
/// <reference path="../../parse/Constants.ts" />
/// <reference path="../../lang/LangExtensions.ts" />

module chevrotain.follow {

    import t = chevrotain.tokens
    import g = chevrotain.gast
    import r = chevrotain.rest
    import f = chevrotain.first
    import IN = chevrotain.constants.IN
    import lang = chevrotain.lang

    // This ResyncFollowsWalker computes all of the follows required for RESYNC
    // (skipping reference production).
    export class ResyncFollowsWalker extends r.RestWalker {
        public follows = new lang.HashTable<Function[]>()

        constructor(private topProd:g.TOP_LEVEL) { super() }

        startWalking():lang.HashTable<Function[]> {
            this.walk(this.topProd)
            return this.follows
        }

        walkTerminal(terminal:g.Terminal, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            // do nothing! just like in the public sector after 13:00
        }

        walkProdRef(refProd:g.ProdRef, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            var followName = buildBetweenProdsFollowPrefix(refProd.ref, refProd.occurrenceInParent) + this.topProd.name
            var fullRest:g.IProduction[] = currRest.concat(prevRest)
            var restProd = new g.FLAT(fullRest)
            var t_in_topProd_follows = f.first(restProd)
            this.follows.put(followName, t_in_topProd_follows)
        }
    }

    export function computeAllProdsFollows(topProductions:g.TOP_LEVEL[]):lang.HashTable<Function[]> {
        var reSyncFollows = new lang.HashTable<Function[]>()

        _.forEach(topProductions, (topProd) => {
            var currRefsFollow = new ResyncFollowsWalker(topProd).startWalking()
            reSyncFollows.putAll(currRefsFollow)
        })
        return reSyncFollows
    }

    export function buildBetweenProdsFollowPrefix(inner:g.TOP_LEVEL, occurenceInParent:number):string {
        return inner.name + occurenceInParent + IN
    }

    export function buildInProdFollowPrefix(terminal:g.Terminal):string {
        var terminalName = t.getTokName(terminal.terminalType)
        return terminalName + terminal.occurrenceInParent + IN
    }

}
