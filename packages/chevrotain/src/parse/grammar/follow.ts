import { RestWalker } from "./rest"
import { first } from "./first"
import { assign, forEach } from "../../utils/utils"
import { IN } from "../constants"
import { tokenName } from "../../scan/tokens_public"
import { Flat, NonTerminal, Rule, Terminal } from "./gast/gast_public"
import { IProduction, TokenType } from "../../../api"

// This ResyncFollowsWalker computes all of the follows required for RESYNC
// (skipping reference production).
export class ResyncFollowsWalker extends RestWalker {
    public follows = {}

    constructor(private topProd: Rule) {
        super()
    }

    startWalking(): Record<string, TokenType[]> {
        this.walk(this.topProd)
        return this.follows
    }

    walkTerminal(
        terminal: Terminal,
        currRest: IProduction[],
        prevRest: IProduction[]
    ): void {
        // do nothing! just like in the public sector after 13:00
    }

    walkProdRef(
        refProd: NonTerminal,
        currRest: IProduction[],
        prevRest: IProduction[]
    ): void {
        let followName =
            buildBetweenProdsFollowPrefix(refProd.referencedRule, refProd.idx) +
            this.topProd.name
        let fullRest: IProduction[] = currRest.concat(prevRest)
        let restProd = new Flat({ definition: fullRest })
        let t_in_topProd_follows = first(restProd)
        this.follows[followName] = t_in_topProd_follows
    }
}

export function computeAllProdsFollows(
    topProductions: Rule[]
): Record<string, TokenType[]> {
    let reSyncFollows = {}

    forEach(topProductions, topProd => {
        let currRefsFollow = new ResyncFollowsWalker(topProd).startWalking()
        assign(reSyncFollows, currRefsFollow)
    })
    return reSyncFollows
}

export function buildBetweenProdsFollowPrefix(
    inner: Rule,
    occurenceInParent: number
): string {
    return inner.name + occurenceInParent + IN
}

export function buildInProdFollowPrefix(terminal: Terminal): string {
    let terminalName = tokenName(terminal.terminalType)
    return terminalName + terminal.idx + IN
}
