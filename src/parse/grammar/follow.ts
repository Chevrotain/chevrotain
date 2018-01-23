import { RestWalker } from "./rest"
import { HashTable } from "../../lang/lang_extensions"
import { first } from "./first"
import { forEach } from "../../utils/utils"
import { IN } from "../constants"
import { tokenName } from "../../scan/tokens_public"
import { TokenType } from "../../scan/lexer_public"
import {
    Flat,
    IProduction,
    NonTerminal,
    Rule,
    Terminal
} from "./gast/gast_public"

// This ResyncFollowsWalker computes all of the follows required for RESYNC
// (skipping reference production).
export class ResyncFollowsWalker extends RestWalker {
    public follows = new HashTable<TokenType[]>()

    constructor(private topProd: Rule) {
        super()
    }

    startWalking(): HashTable<TokenType[]> {
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
        this.follows.put(followName, t_in_topProd_follows)
    }
}

export function computeAllProdsFollows(
    topProductions: Rule[]
): HashTable<TokenType[]> {
    let reSyncFollows = new HashTable<TokenType[]>()

    forEach(topProductions, topProd => {
        let currRefsFollow = new ResyncFollowsWalker(topProd).startWalking()
        reSyncFollows.putAll(currRefsFollow)
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
