/**
 * a language made of a series of statements terminated by semicolons
 *
 * CREATE TABLE schema2.Persons
 * INSERT (32, "SHAHAR") INTO schema2.Persons
 * DELETE (31, "SHAHAR") FROM schema2.Persons
 */
import { Parser } from "../../../../src/parse/parser/traits/parser_traits"
import * as allTokens from "./sql_recovery_tokens"
import {
    INVALID_DDL,
    INVALID_CREATE_STMT,
    INVALID_INSERT_STMT,
    INVALID_DELETE_STMT,
    INVALID_QUALIFIED_NAME,
    STATEMENTS,
    CreateTok,
    TableTok,
    SemiColonTok,
    CREATE_STMT,
    InsertTok,
    IntoTok,
    INSERT_STMT,
    DeleteTok,
    FromTok,
    DELETE_STMT,
    IdentTok,
    DotTok,
    DOTS,
    QUALIFIED_NAME,
    LParenTok,
    CommaTok,
    RParenTok,
    COMMAS,
    StringTok,
    IntTok,
    VirtualToken
} from "./sql_recovery_tokens"
import { ParseTree } from "../../parse_tree"
import { augmentTokenTypes } from "../../../../src/scan/tokens"

import { createRegularToken } from "../../../utils/matchers"
import { IToken, TokenType } from "../../../../api"

const allTokensToUse = { ...allTokens }
augmentTokenTypes(<any>allTokensToUse)

// DOCS: to enable error recovery functionality one must extend BaseErrorRecoveryRecognizer
export class DDLExampleRecoveryParser extends Parser {
    constructor(isRecoveryEnabled: boolean = true) {
        // DOCS: note the first parameter in the super class. this is the namespace in which the token constructors are defined.
        //       it is mandatory to provide this map to be able to perform self analysis
        //       and allow the framework to "understand" the implemented grammar.
        super(allTokensToUse, {
            outputCst: false,
            recoveryEnabled: isRecoveryEnabled
        })
        // DOCS: The call to performSelfAnalysis needs to happen after all the RULEs have been defined
        //       The typescript compiler places the constructor body last after initializations in the class's body
        //       which is why place the call here meets the criteria.
        this.performSelfAnalysis()
    }

    // DOCS: the invocation to RULE(...) is what wraps our parsing implementation method
    // with the error recovery re-sync behavior.
    // note that when one parsing rule calls another (via SUBRULE) the invoked rule is the one defined here,
    // without the "parse" prefix.
    public ddl = this.RULE("ddl", this.parseDdl, {
        recoveryValueFunc: INVALID(INVALID_DDL)
    })
    // DOCS: a specific return type has been provided in case of re-sync recovery.
    public createStmt = this.RULE("createStmt", this.parseCreateStmt, {
        recoveryValueFunc: INVALID(INVALID_CREATE_STMT)
    })
    public insertStmt = this.RULE("insertStmt", this.parseInsertStmt, {
        recoveryValueFunc: INVALID(INVALID_INSERT_STMT)
    })
    public deleteStmt = this.RULE("deleteStmt", this.parseDeleteStmt, {
        recoveryValueFunc: INVALID(INVALID_DELETE_STMT)
    })
    public qualifiedName = this.RULE("qualifiedName", this.parseQualifiedName, {
        recoveryValueFunc: INVALID(INVALID_QUALIFIED_NAME)
    })
    public recordValue = this.RULE("recordValue", this.parseRecordValue, {
        recoveryValueFunc: INVALID()
    })
    // DOCS: A Parsing rule may also be private and not part of the public API
    private value = this.RULE("value", this.parseValue, {
        recoveryValueFunc: INVALID()
    })

    // DOCS: note how all the parsing rules in this example return a ParseTree, we require some output from the parser
    // to demonstrate the error recovery mechanisms. otherwise it is harder to prove we have indeed recovered.
    private parseDdl(): ParseTree {
        let stmts = []

        this.MANY(() => {
            this.OR([
                {
                    ALT: () => {
                        stmts.push(this.SUBRULE(this.createStmt))
                    }
                },
                {
                    ALT: () => {
                        stmts.push(this.SUBRULE(this.insertStmt))
                    }
                },
                {
                    ALT: () => {
                        stmts.push(this.SUBRULE(this.deleteStmt))
                    }
                }
            ])
        })

        return PT(createRegularToken(STATEMENTS), stmts)
    }

    private parseCreateStmt(): ParseTree {
        let createKW, tableKW, qn, semiColon

        createKW = this.CONSUME1(CreateTok)
        tableKW = this.CONSUME1(TableTok)
        qn = this.SUBRULE(this.qualifiedName)
        semiColon = this.CONSUME1(SemiColonTok)

        return PT(createRegularToken(CREATE_STMT), [
            PT(createKW),
            PT(tableKW),
            qn,
            PT(semiColon)
        ])
    }

    private parseInsertStmt(): ParseTree {
        let insertKW, recordValue, intoKW, qn, semiColon

        // parse
        insertKW = this.CONSUME1(InsertTok)
        recordValue = this.SUBRULE(this.recordValue)
        intoKW = this.CONSUME1(IntoTok)
        qn = this.SUBRULE(this.qualifiedName)
        semiColon = this.CONSUME1(SemiColonTok)

        // tree rewrite
        return PT(createRegularToken(INSERT_STMT), [
            PT(insertKW),
            recordValue,
            PT(intoKW),
            qn,
            PT(semiColon)
        ])
    }

    private parseDeleteStmt(): ParseTree {
        let deleteKW, recordValue, fromKW, qn, semiColon

        // parse
        deleteKW = this.CONSUME1(DeleteTok)
        recordValue = this.SUBRULE(this.recordValue)
        fromKW = this.CONSUME1(FromTok)
        qn = this.SUBRULE(this.qualifiedName)
        semiColon = this.CONSUME1(SemiColonTok)

        // tree rewrite
        return PT(createRegularToken(DELETE_STMT), [
            PT(deleteKW),
            recordValue,
            PT(fromKW),
            qn,
            PT(semiColon)
        ])
    }

    private parseQualifiedName(): ParseTree {
        let dots = []
        let idents = []

        // parse
        // DOCS: note how we use CONSUME1(IdentTok) here
        idents.push(this.CONSUME1(IdentTok))
        this.MANY(() => {
            dots.push(this.CONSUME1(DotTok))
            // DOCS: yet here we use CONSUME2(IdentTok)
            //       The number indicates the occurrence number of the consumption of the specific Token in the current
            //       parse rule.
            idents.push(this.CONSUME2(IdentTok))
        })

        // tree rewrite
        let allIdentsPts = WRAP_IN_PT(idents)
        let dotsPt = PT(createRegularToken(DOTS), WRAP_IN_PT(dots))
        let allPtChildren = allIdentsPts.concat([dotsPt])
        return PT(createRegularToken(QUALIFIED_NAME), <any>allPtChildren)
    }

    private parseRecordValue(): ParseTree {
        let values = []
        let commas = []

        // parse
        this.CONSUME1(LParenTok)
        this.SUBRULE1(this.value)
        this.MANY(() => {
            commas.push(this.CONSUME1(CommaTok))
            values.push(this.SUBRULE2(this.value))
        })
        this.CONSUME1(RParenTok)
        // tree rewrite
        let commasPt = PT(createRegularToken(COMMAS), WRAP_IN_PT(commas))
        let allPtChildren = values.concat([commasPt])
        return PT(createRegularToken(QUALIFIED_NAME), allPtChildren)
    }

    private parseValue(): ParseTree {
        let value = null
        this.OR([
            {
                ALT: () => {
                    value = this.CONSUME1(StringTok)
                }
            },
            {
                ALT: () => {
                    value = this.CONSUME1(IntTok)
                }
            }
        ])

        return PT(value)
    }
}

// HELPER FUNCTIONS
function PT(token: IToken, children: ParseTree[] = []): ParseTree {
    return new ParseTree(token, children)
}

export function WRAP_IN_PT(toks: IToken[]): ParseTree[] {
    let parseTrees = new Array(toks.length)
    for (let i = 0; i < toks.length; i++) {
        parseTrees[i] = PT(toks[i])
    }
    return parseTrees
}

/* tslint:disable:class-name */
export class INVALID_INPUT extends VirtualToken {
    static PATTERN = /NA/
}
/* tslint:enable:class-name */
export function INVALID(tokType: TokenType = INVALID_INPUT): () => ParseTree {
    // virtual invalid tokens should have no parameters...
    return () => {
        return PT(createRegularToken(tokType))
    }
}
