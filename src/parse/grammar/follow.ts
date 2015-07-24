
module chevrotain.follow {

    import g = chevrotain.gast
    import r = chevrotain.rest
    import f = chevrotain.first
    import IN = chevrotain.constants.IN
    import lang = chevrotain.lang

    // This ResyncFollowsWalker computes all of the follows required for RESYNC
    // (skipping reference production).
    export class ResyncFollowsWalker extends r.RestWalker {
        public follows = new lang.HashTable<Function[]>()

        constructor(private topProd:g.Rule) { super() }

        startWalking():lang.HashTable<Function[]> {
            this.walk(this.topProd)
            return this.follows
        }

        walkTerminal(terminal:g.Terminal, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            // do nothing! just like in the public sector after 13:00
        }

        walkProdRef(refProd:g.NonTerminal, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            let followName = buildBetweenProdsFollowPrefix(refProd.referencedRule, refProd.occurrenceInParent) + this.topProd.name
            let fullRest:g.IProduction[] = currRest.concat(prevRest)
            let restProd = new g.Flat(fullRest)
            let t_in_topProd_follows = f.first(restProd)
            this.follows.put(followName, t_in_topProd_follows)
        }
    }

    export function computeAllProdsFollows(topProductions:g.Rule[]):lang.HashTable<Function[]> {
        let reSyncFollows = new lang.HashTable<Function[]>()

        _.forEach(topProductions, (topProd) => {
            let currRefsFollow = new ResyncFollowsWalker(topProd).startWalking()
            reSyncFollows.putAll(currRefsFollow)
        })
        return reSyncFollows
    }

    export function buildBetweenProdsFollowPrefix(inner:g.Rule, occurenceInParent:number):string {
        return inner.name + occurenceInParent + IN
    }

    export function buildInProdFollowPrefix(terminal:g.Terminal):string {
        let terminalName = tokenName(terminal.terminalType)
        return terminalName + terminal.occurrenceInParent + IN
    }

}
