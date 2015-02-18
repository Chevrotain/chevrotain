/// <reference path="../../scan/Tokens.ts" />
/// <reference path="../../parse/grammar/GAst.ts" />
/// <reference path="../../parse/grammar/Rest.ts" />
/// <reference path="../../parse/grammar/First.ts" />
/// <reference path="../../parse/Constants.ts" />
/// <reference path="../../../libs/hashtable.d.ts" />

module chevrotain.parse.grammar.follow {

    import t = chevrotain.scan.tokens;
    import g = chevrotain.parse.grammar.gast;
    import r = chevrotain.parse.grammar.rest;
    import f = chevrotain.parse.grammar.first;
    import IN = chevrotain.parse.constants.IN;

    // This InRuleFollowsWalker computes all of the follows required for single token insertion
    // (terminals only) for a single grammar production. This Walker does not skip reference production
    export class InRuleFollowsWalker extends r.RestWalker {
        public follows = new Hashtable<string, Function[]>();

        constructor(private topProd:g.TOP_LEVEL) {super();}

        startWalking():IHashtable<string, Function[]> {
            this.walk(this.topProd);
            return this.follows;
        }

        walkTerminal(terminal:g.Terminal, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            var followName = buildInProdFollowPrefix(terminal) + this.topProd.name;
            var fullRest = currRest.concat(prevRest);
            var restProd = new g.FLAT(fullRest);
            var t_in_topProd_follows = f.first(restProd);
            this.follows.put(followName, t_in_topProd_follows);
        }

        walkProdRef(refProd:g.ProdRef, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            // do nothing(useful)! just like the government
        }
    }

    // This ResyncFollowsWalker computes all of the follows required for RESYNC
    // (skipping reference production).
    export class ResyncFollowsWalker extends r.RestWalker {
        public follows = new Hashtable<string, Function[]>();

        constructor(private topProd:g.TOP_LEVEL) {super();}

        startWalking():IHashtable<string, Function[]> {
            this.walk(this.topProd);
            return this.follows;
        }

        walkTerminal(terminal:g.Terminal, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            // do nothing! just like in the public sector after 13:00
        }

        walkProdRef(refProd:g.ProdRef, currRest:g.IProduction[], prevRest:g.IProduction[]):void {
            var targetProd = (<g.ProdRef>refProd).ref;
            var occurrenceInParent = refProd.occurrenceInParent;
            var followName = buildBetweenProdsFollowPrefix(targetProd, occurrenceInParent) + this.topProd.name;
            var fullRest = currRest.concat(prevRest);
            var restProd = new g.FLAT(fullRest);
            var allowSkippingProductionReference = true;
            var t_in_topProd_follows = f.first(restProd, allowSkippingProductionReference);
            this.follows.put(followName, t_in_topProd_follows);
        }
    }

    export interface AllFollows {
        inRuleFollows:IHashtable<string, Function[]>;
        reSyncFollows:IHashtable<string, Function[]>;
    }

    export function computeAllProdsFollows(topProductions:g.TOP_LEVEL[]):AllFollows {
        var inRuleFollows = new Hashtable<string, Function[]>();
        var reSyncFollows = new Hashtable<string, Function[]>();

        _.forEach(topProductions, (topProd)=> {
            var currTermFollow = new InRuleFollowsWalker(topProd).startWalking();
            var currRefsFollow = new ResyncFollowsWalker(topProd).startWalking();
            inRuleFollows.putAll(currTermFollow);
            reSyncFollows.putAll(currRefsFollow);
        });
        return {inRuleFollows: inRuleFollows, reSyncFollows: reSyncFollows};
    }

    export function buildBetweenProdsFollowPrefix(inner:g.TOP_LEVEL, occurenceInParent:number):string {
        return inner.name + occurenceInParent + IN;
    }

    export function buildInProdFollowPrefix(terminal:g.Terminal):string {
        var terminalName = t.getTokName(terminal.terminalType);
        return terminalName + terminal.occurrenceInParent + IN;
    }

}
