/**
 * a simple language made up of only
 * switch/case/return identifiers strings and integers
 *
 * example:
 * switch (name) {
 *    case "Terry" : return 2;
 *    case "Robert" : return 4;
 *    case "Brandon" : return 6;
 * }
 *
 * In this case the parser result is a "JSON" object representing the switch case:
 * for the above example the result would be:
 *
 * {
 *    "Terry"    : 2,
 *    "Robert"   : 4,
 *    "Brandon"   : 6
 * }
 *
 * forEach invalid case statement an invalidN property will be added
 * with an undefined value. for example :
 *
 * {
 *    "Terry"    : 2,
 *    "invalid1  : undefined
 *    "Brandon"   : 6
 * }
 */

import {
    EmbeddedActionsParser,
    Parser
} from "../../../../src/parse/parser/traits/parser_traits"
import * as allTokens from "./Switchcase_recovery_tokens"
import {
    CaseTok,
    ColonTok,
    IdentTok,
    IntTok,
    LCurlyTok,
    LParenTok,
    RCurlyTok,
    ReturnTok,
    RParenTok,
    SemiColonTok,
    StringTok,
    SwitchTok
} from "./Switchcase_recovery_tokens"
import { assign, contains } from "../../../../src/utils/utils"
import { IToken, TokenType } from "../../../../api"

export interface RetType {
    [caseValue: string]: number
}

// DOCS: to enable error recovery functionality one must extend BaseErrorRecoveryRecognizer
export class SwitchCaseRecoveryParser extends EmbeddedActionsParser {
    constructor(input: IToken[] = []) {
        // DOCS: note the second parameter in the super class. this is the namespace in which the token constructors are defined.
        //       it is mandatory to provide this map to be able to perform self analysis
        //       and allow the framework to "understand" the implemented grammar.
        super(
            { ...allTokens },
            {
                recoveryEnabled: true
            }
        )
        // DOCS: The call to performSelfAnalysis needs to happen after all the RULEs have been defined
        //       The typescript compiler places the constructor body last after initializations in the class's body
        //       which is why place the call here meets the criteria.
        this.performSelfAnalysis()
    }

    public switchStmt = this.RULE("switchStmt", this.parseSwitchStmt, {
        recoveryValueFunc: () => {
            return {}
        }
    })
    public caseStmt = this.RULE("caseStmt", this.parseCaseStmt, {
        recoveryValueFunc: this.INVALID()
    })

    // DOCS: in this example we avoid automatic missing token insertion for tokens that have additional semantic meaning.
    //       to understand this first consider the positive case, which tokens can we safely insert?
    //       a missing colon / semicolon ? yes a missing parenthesis ? yes
    //       but what about a missing StringToken? if we insert one, what will be its string value?
    //       an empty string? in the grammar this could lead to an empty key in the created object...
    //       what about a string with some random value? this could still lead to duplicate keys in the returned parse result
    private tokTypesThatCannotBeInsertedInRecovery = [
        IdentTok,
        StringTok,
        IntTok
    ]

    // DOCS: overriding this method allows us to customize the logic for which tokens may not be automaticaly inserted
    // during error recovery.
    public canTokenTypeBeInsertedInRecovery(tokType: TokenType) {
        return !contains(this.tokTypesThatCannotBeInsertedInRecovery, tokType)
    }

    public parseSwitchStmt(): RetType {
        // house keeping so the invalid property names will not be dependent on
        // previous grammar rule invocations.
        this.invalidIdx = 1

        let retObj: RetType = {}

        this.CONSUME(SwitchTok)
        this.CONSUME(LParenTok)
        this.CONSUME(IdentTok)
        this.CONSUME(RParenTok)
        this.CONSUME(LCurlyTok)

        this.AT_LEAST_ONE(() => {
            assign(retObj, this.SUBRULE(this.caseStmt))
        })

        this.CONSUME(RCurlyTok)

        return retObj
    }

    private parseCaseStmt(): RetType {
        let keyTok, valueTok, key, value

        this.CONSUME(CaseTok)
        keyTok = this.CONSUME(StringTok)
        this.CONSUME(ColonTok)
        this.CONSUME(ReturnTok)
        valueTok = this.CONSUME(IntTok)
        this.OPTION6(() => {
            this.CONSUME(SemiColonTok)
        })

        key = keyTok.image
        value = parseInt(valueTok.image, 10)
        let caseKeyValue: RetType = {}
        caseKeyValue[key] = value
        return caseKeyValue
    }

    // because we are building a javascript object we must not have any duplications
    // in the name of the keys, the index below is used to solve this.
    private invalidIdx = 1

    private INVALID(): () => RetType {
        return () => {
            let retObj: RetType = {}
            retObj["invalid" + this.invalidIdx++] = undefined
            return retObj
        }
    }
}
