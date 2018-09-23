// DOCS: simple language with two statements which require backtracking to differentiate during parse time
//       element A:ns1.ns2...nsN = 5;
//       element B:ns1.ns2...nsN default 5;
// generally one should avoid having to use backtracking, and this specific example can be resolved by parsing
// both statements in a single rule and only distinguishing between them later, but lets see an example of using backtracking :)

import { Parser } from "../../../src/parse/parser_public"
import { IParserConfig, IToken } from "../../../api"

export enum RET_TYPE {
    WITH_DEFAULT,
    WITH_EQUALS,
    QUALIFED_NAME,
    INVALID_WITH_DEFAULT,
    INVALID_WITH_EQUALS,
    INVALID_STATEMENT,
    INVALID_FQN
}

export class NumberTok {
    static PATTERN = /NA/
}
export class ElementTok {
    static PATTERN = /NA/
}
export class DefaultTok {
    static PATTERN = /NA/
}
export class DotTok {
    static PATTERN = /NA/
}
export class ColonTok {
    static PATTERN = /NA/
}
export class EqualsTok {
    static PATTERN = /NA/
}
export class SemiColonTok {
    static PATTERN = /NA/
}
export class IdentTok {
    static PATTERN = /NA/
}

const configuration: IParserConfig = {
    outputCst: false,
    ignoredIssues: {
        statement: { OR: true }
    }
}

// extending the BaseErrorRecoveryRecognizer in this example because it too has logic related to backtracking
// that needs to be tested too.
export class BackTrackingParser extends Parser {
    constructor() {
        // DOCS: note the second parameter in the super class. this is the namespace in which the token constructors are defined.
        //       it is mandatory to provide this map to be able to perform self analysis
        //       and allow the framework to "understand" the implemented grammar.
        super(
            [
                NumberTok,
                ElementTok,
                DefaultTok,
                DotTok,
                ColonTok,
                EqualsTok,
                SemiColonTok,
                IdentTok
            ],
            configuration
        )
        // DOCS: The call to performSelfAnalysis needs to happen after all the RULEs have been defined
        //       The typescript compiler places the constructor body last after initializations in the class's body
        //       which is why place the call here meets the criteria.
        this.performSelfAnalysis()
    }

    public statement = this.RULE("statement", this.parseStatement, {
        recoveryValueFunc: INVALID(RET_TYPE.INVALID_STATEMENT)
    })
    public withEqualsStatement = this.RULE(
        "withEqualsStatement",
        this.parseWithEqualsStatement,
        { recoveryValueFunc: INVALID(RET_TYPE.INVALID_WITH_EQUALS) }
    )
    public withDefaultStatement = this.RULE(
        "withDefaultStatement",
        this.parseWithDefaultStatement,
        {
            recoveryValueFunc: INVALID(RET_TYPE.INVALID_WITH_DEFAULT)
        }
    )
    public qualifiedName = this.RULE("qualifiedName", this.parseQualifiedName, {
        recoveryValueFunc: INVALID(RET_TYPE.INVALID_FQN),
        resyncEnabled: false
    })

    private parseStatement(): RET_TYPE {
        let statementTypeFound: RET_TYPE = undefined
        this.OR([
            // both statements have the same prefix which may be of "infinite" length, this means there is no K for which
            // we can build an LL(K) parser that can distinguish the two alternatives as a negative example
            // would be to simply create a qualifiedName with a length of k+1.
            {
                GATE: this.BACKTRACK(this.withEqualsStatement),
                ALT: () => {
                    statementTypeFound = this.SUBRULE8(this.withEqualsStatement)
                }
            },
            {
                GATE: this.BACKTRACK(this.withDefaultStatement),
                ALT: () => {
                    statementTypeFound = this.SUBRULE9(
                        this.withDefaultStatement
                    )
                }
            }
        ])

        return statementTypeFound
    }

    private parseWithEqualsStatement(): RET_TYPE {
        this.CONSUME(ElementTok)
        this.CONSUME6(IdentTok)
        this.CONSUME7(ColonTok)
        this.SUBRULE7(this.qualifiedName) // this rule creates the no fixed look ahead issue
        this.CONSUME8(EqualsTok)
        this.CONSUME9(NumberTok)
        this.CONSUME(SemiColonTok)

        return RET_TYPE.WITH_EQUALS
    }

    private parseWithDefaultStatement(): RET_TYPE {
        this.CONSUME(ElementTok)
        this.CONSUME(IdentTok)
        this.CONSUME(ColonTok)
        this.SUBRULE6(this.qualifiedName) // this rule creates the no fixed look ahead issue
        this.CONSUME(DefaultTok)
        this.CONSUME(NumberTok)
        this.CONSUME(SemiColonTok)

        return RET_TYPE.WITH_DEFAULT
    }

    private parseQualifiedName(): RET_TYPE {
        this.CONSUME(IdentTok)
        this.MANY(() => {
            this.CONSUME(DotTok)
            this.CONSUME2(IdentTok)
        })
        return RET_TYPE.QUALIFED_NAME
    }
}

export function INVALID(stmtType: RET_TYPE): () => RET_TYPE {
    return () => {
        return stmtType
    }
}
