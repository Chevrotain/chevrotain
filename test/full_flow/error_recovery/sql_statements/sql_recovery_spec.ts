// long lines for token init seems more readable to me than to break them up
// into multiple line.
/* tslint:disable:max-line-length  */

import {
    INVALID_DDL,
    INVALID_CREATE_STMT,
    INVALID_INSERT_STMT,
    INVALID_DELETE_STMT,
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
    LParenTok,
    CommaTok,
    RParenTok,
    StringTok,
    IntTok
} from "./sql_recovery_tokens"
import { DDLExampleRecoveryParser } from "./sql_recovery_parser"
import { IToken, tokenMatcher } from "../../../../src/scan/tokens_public"
import { exceptions } from "../../../../src/parse/exceptions_public"
import { ParseTree } from "../../parse_tree"
import { flatten } from "../../../../src/utils/utils"
import { createRegularToken } from "../../../utils/matchers"

// for side effect if augmenting the Token classes.
new DDLExampleRecoveryParser([])
describe("Error Recovery SQL DDL Example", () => {
    let schemaFQN = [
        createRegularToken(IdentTok, "schema2"),
        createRegularToken(DotTok),
        createRegularToken(IdentTok, "Persons")
    ]
    /* tslint:disable:quotemark  */
    let shahar32Record = [
        createRegularToken(LParenTok),
        createRegularToken(IntTok, "32"),
        createRegularToken(CommaTok),
        createRegularToken(StringTok, "SHAHAR"),
        createRegularToken(RParenTok)
    ]

    let shahar31Record = [
        createRegularToken(LParenTok),
        createRegularToken(IntTok, "31"),
        createRegularToken(CommaTok),
        createRegularToken(StringTok, '"SHAHAR"'),
        createRegularToken(RParenTok)
    ]
    /* tslint:enable:quotemark  */

    it("can parse a series of three statements successfully", () => {
        let input: any = flatten([
            // CREATE TABLE schema2.Persons
            createRegularToken(CreateTok),
            createRegularToken(TableTok),
            schemaFQN,
            createRegularToken(SemiColonTok),
            // INSERT (32, "SHAHAR") INTO schema2.Persons
            createRegularToken(InsertTok),
            shahar32Record,
            createRegularToken(IntoTok),
            schemaFQN,
            createRegularToken(SemiColonTok),
            // DELETE (31, "SHAHAR") FROM schema2.Persons
            createRegularToken(DeleteTok),
            shahar31Record,
            createRegularToken(FromTok),
            schemaFQN,
            createRegularToken(SemiColonTok)
        ])

        let parser = new DDLExampleRecoveryParser(input)
        let ptResult = parser.ddl()
        expect(parser.errors.length).to.equal(0)
        expect(parser.isAtEndOfInput()).to.equal(true)
        assertAllThreeStatementsPresentAndValid(ptResult)
    })

    describe("Single Token insertion recovery mechanism", () => {
        let input: any = flatten([
            // CREATE TABLE schema2.Persons
            createRegularToken(CreateTok),
            createRegularToken(TableTok),
            schemaFQN,
            createRegularToken(SemiColonTok),
            // INSERT (32, "SHAHAR") INTO schema2.Persons
            createRegularToken(InsertTok),
            shahar32Record,
            createRegularToken(IntoTok),
            schemaFQN /*createRegularToken(SemiColonTok), <-- missing semicolon!*/,
            // DELETE (31, "SHAHAR") FROM schema2.Persons
            createRegularToken(DeleteTok),
            shahar31Record,
            createRegularToken(FromTok),
            schemaFQN,
            createRegularToken(SemiColonTok)
        ])

        it("can perform single token insertion for a missing semicolon", () => {
            let parser = new DDLExampleRecoveryParser(input)
            let ptResult: any = parser.ddl()
            // one error encountered
            expect(parser.errors.length).to.equal(1)
            // yet the whole input has been parsed
            expect(parser.isAtEndOfInput()).to.equal(true)
            // and the output parseTree contains ALL three statements
            assertAllThreeStatementsPresentAndValid(ptResult)
            let insertedSemiColon: IToken =
                ptResult.children[1].children[4].payload
            // the semicolon is present even though it did not exist in the input, magic!
            expect(tokenMatcher(insertedSemiColon, SemiColonTok)).to.be.true
            expect(insertedSemiColon.isInsertedInRecovery).to.equal(true)
        })

        it("can disable single token insertion for a missing semicolon", () => {
            let parser = new DDLExampleRecoveryParser(input, false)
            let ptResult: any = parser.ddl()
            expect(parser.errors.length).to.equal(1)
            expect(parser.isAtEndOfInput()).to.equal(true)
            expect(ptResult.payload.tokenType).to.equal(INVALID_DDL)
            expect(ptResult.children).to.have.length(0)
        })
    })

    describe("Single Token deletion recovery mechanism", () => {
        let input: any = flatten([
            // CREATE TABLE schema2.Persons
            createRegularToken(CreateTok),
            createRegularToken(TableTok),
            schemaFQN,
            createRegularToken(SemiColonTok),
            // INSERT (32, "SHAHAR") INTO INTO schema2.Persons
            createRegularToken(InsertTok),
            shahar32Record,
            createRegularToken(IntoTok),
            createRegularToken(IntoTok),
            /* <-- "INTO INTO" oops */ schemaFQN,
            createRegularToken(SemiColonTok),
            // DELETE (31, "SHAHAR") FROM schema2.Persons
            createRegularToken(DeleteTok),
            shahar31Record,
            createRegularToken(FromTok),
            schemaFQN,
            createRegularToken(SemiColonTok)
        ])

        it("can perform single token deletion for a redundant keyword", () => {
            let parser = new DDLExampleRecoveryParser(input)
            let ptResult = parser.ddl()
            // one error encountered
            expect(parser.errors.length).to.equal(1)
            // yet the whole input has been parsed
            expect(parser.isAtEndOfInput()).to.equal(true)
            // and the output parseTree contains ALL three statements
            assertAllThreeStatementsPresentAndValid(ptResult)
        })

        it("can disable single token deletion for a redundant keyword", () => {
            let parser = new DDLExampleRecoveryParser(input, false)
            let ptResult: any = parser.ddl()
            expect(parser.errors.length).to.equal(1)
            expect(parser.isAtEndOfInput()).to.equal(true)
            expect(ptResult.payload.tokenType).to.equal(INVALID_DDL)
            expect(ptResult.children).to.have.length(0)
        })
    })

    describe("resync recovery mechanism", () => {
        it("can perform re-sync recovery and only 'lose' part of the input", () => {
            let input: any = flatten([
                // CREATE TABLE schema2.Persons
                createRegularToken(CreateTok),
                createRegularToken(TableTok),
                schemaFQN,
                createRegularToken(SemiColonTok),
                // INSERT (32, "SHAHAR") FROM (( schema2.Persons <-- this can't be recovered with a single token insertion of deletion, must do re-sync
                createRegularToken(InsertTok),
                shahar32Record,
                createRegularToken(FromTok),
                createRegularToken(LParenTok),
                createRegularToken(LParenTok),
                schemaFQN,
                createRegularToken(SemiColonTok),
                // DELETE (31, "SHAHAR") FROM schema2.Persons
                createRegularToken(DeleteTok),
                shahar31Record,
                createRegularToken(FromTok),
                schemaFQN,
                createRegularToken(SemiColonTok)
            ])

            let parser = new DDLExampleRecoveryParser(input)
            let ptResult: any = parser.ddl()
            // one error encountered
            expect(parser.errors.length).to.equal(1)
            // yet the whole input has been parsed
            expect(parser.isAtEndOfInput()).to.equal(true)
            expect(ptResult.payload.tokenType).to.equal(STATEMENTS)
            // 3 statements found
            expect(ptResult.children.length).to.equal(3)
            expect(ptResult.children[0].payload.tokenType).to.equal(CREATE_STMT)
            expect(ptResult.children[0].payload.tokenType).to.not.equal(
                INVALID_CREATE_STMT
            )
            // but the second one is marked as invalid
            expect(ptResult.children[1].payload.tokenType).to.equal(
                INVALID_INSERT_STMT
            )
            // yet the third one is still valid!, we recovered and continued parsing.
            expect(ptResult.children[2].payload.tokenType).to.equal(DELETE_STMT)
            expect(ptResult.children[2].payload.tokenType).to.not.equal(
                INVALID_DELETE_STMT
            )
        })
        // (32, "SHAHAR" ( <-- wrong parenthesis
        let badShahar32Record = [
            createRegularToken(LParenTok),
            createRegularToken(IntTok, "32"),
            createRegularToken(CommaTok),
            createRegularToken(StringTok, '"SHAHAR"'),
            createRegularToken(LParenTok)
        ]

        let input: any = flatten([
            // CREATE TABLE schema2.Persons
            createRegularToken(CreateTok),
            createRegularToken(TableTok),
            schemaFQN,
            createRegularToken(SemiColonTok),
            // issues:
            // 1. FromTok instead of IntoTok so this rule also includes a bug
            // 2. using the bad/invalid record Token.
            createRegularToken(InsertTok),
            badShahar32Record,
            createRegularToken(FromTok),
            schemaFQN,
            createRegularToken(SemiColonTok),
            // DELETE (31, "SHAHAR") FROM schema2.Persons
            createRegularToken(DeleteTok),
            shahar31Record,
            createRegularToken(FromTok),
            schemaFQN,
            createRegularToken(SemiColonTok)
        ])

        it("can perform re-sync recovery and only 'lose' part of the input even when re-syncing to two rules 'above'", () => {
            let parser = new DDLExampleRecoveryParser(input)
            let ptResult: any = parser.ddl()
            // one error encountered
            expect(parser.errors.length).to.equal(1)
            // yet the whole input has been parsed
            expect(parser.isAtEndOfInput()).to.equal(true)
            expect(ptResult.payload.tokenType).to.equal(STATEMENTS)
            // 3 statements found
            expect(ptResult.children.length).to.equal(3)
            expect(ptResult.children[0].payload.tokenType).to.equal(CREATE_STMT)
            expect(ptResult.children[0].payload.tokenType).to.not.equal(
                INVALID_CREATE_STMT
            )
            // but the second one is marked as invalid, this means we kept trying to re-sync to an "higher" rule
            expect(ptResult.children[1].payload.tokenType).to.equal(
                INVALID_INSERT_STMT
            )
            // yet the third one is still valid!, we recovered and continued parsing.
            expect(ptResult.children[2].payload.tokenType).to.equal(DELETE_STMT)
            expect(ptResult.children[2].payload.tokenType).to.not.equal(
                INVALID_DELETE_STMT
            )
        })

        it("can disable re-sync recovery and only 'lose' part of the input even when re-syncing to two rules 'above'", () => {
            let parser = new DDLExampleRecoveryParser(input, false)
            let ptResult: any = parser.ddl()
            // one error encountered
            expect(parser.errors.length).to.equal(1)
            // yet the whole input has been parsed
            expect(parser.isAtEndOfInput()).to.equal(true)
            expect(ptResult.payload.tokenType).to.equal(INVALID_DDL)
            expect(ptResult.children).to.have.length(0)
        })
    })

    function assertAllThreeStatementsPresentAndValid(
        ptResult: ParseTree
    ): void {
        expect(ptResult.payload.tokenType).to.equal(STATEMENTS)
        // 3 statements found
        expect(ptResult.children.length).to.equal(3)
        expect(ptResult.children[0].payload.tokenType).to.equal(CREATE_STMT)
        expect(ptResult.children[0].payload.tokenType).to.not.equal(
            INVALID_CREATE_STMT
        )
        expect(ptResult.children[1].payload.tokenType).to.equal(INSERT_STMT)
        expect(ptResult.children[1].payload.tokenType).to.not.equal(
            INVALID_INSERT_STMT
        )
        expect(ptResult.children[2].payload.tokenType).to.equal(DELETE_STMT)
        expect(ptResult.children[2].payload.tokenType).to.not.equal(
            INVALID_DELETE_STMT
        )
    }

    it("will encounter an NotAllInputParsedException when some of the input vector has not been parsed", () => {
        let input: any = flatten([
            // CREATE TABLE schema2.Persons; TABLE <-- redundant "TABLE" token
            createRegularToken(CreateTok),
            createRegularToken(TableTok),
            schemaFQN,
            createRegularToken(SemiColonTok),
            createRegularToken(TableTok)
        ])
        let parser = new DDLExampleRecoveryParser(input)

        parser.ddl()
        expect(parser.errors.length).to.equal(1)
        expect(parser.errors[0]).to.be.an.instanceof(
            exceptions.NotAllInputParsedException
        )
    })

    it("can use the same parser instance to parse multiple inputs", () => {
        let input1: any = flatten([
            // CREATE TABLE schema2.Persons;
            createRegularToken(CreateTok),
            createRegularToken(TableTok),
            schemaFQN,
            createRegularToken(SemiColonTok)
        ])
        let parser = new DDLExampleRecoveryParser(input1)
        parser.ddl()
        expect(parser.errors.length).to.equal(0)
        expect(parser.isAtEndOfInput()).to.equal(true)

        let input2: any = flatten([
            // DELETE (31, "SHAHAR") FROM schema2.Persons
            createRegularToken(DeleteTok),
            shahar31Record,
            createRegularToken(FromTok),
            schemaFQN,
            createRegularToken(SemiColonTok)
        ])
        // the parser is being reset instead of creating a new instance for each new input
        parser.reset()
        parser.input = input2
        let ptResult: any = parser.ddl()
        expect(parser.errors.length).to.equal(0)
        expect(parser.isAtEndOfInput()).to.equal(true)
        // verify returned ParseTree
        expect(ptResult.payload.tokenType).to.equal(STATEMENTS)
        expect(ptResult.children.length).to.equal(1)
        expect(ptResult.children[0].payload.tokenType).to.equal(DELETE_STMT)
        expect(ptResult.children[0].payload.tokenType).to.not.equal(
            INVALID_DELETE_STMT
        )
    })

    it("can re-sync to the next iteration in a MANY rule", () => {
        let input: any = flatten([
            // CREATE TABLE schema2.Persons
            createRegularToken(CreateTok),
            createRegularToken(TableTok),
            schemaFQN,
            createRegularToken(SemiColonTok),
            // INSERT (32, "SHAHAR") INTO schema2.Persons TABLE <-- the redundant 'TABLE' should trigger in repetition recovery
            createRegularToken(InsertTok),
            shahar32Record,
            createRegularToken(IntoTok),
            schemaFQN,
            createRegularToken(SemiColonTok),
            createRegularToken(TableTok),

            // DELETE (31, "SHAHAR") FROM schema2.Persons
            createRegularToken(DeleteTok),
            shahar31Record,
            createRegularToken(FromTok),
            schemaFQN,
            createRegularToken(SemiColonTok)
        ])

        let parser = new DDLExampleRecoveryParser(input)
        let ptResult = parser.ddl()
        expect(parser.errors.length).to.equal(1)
        expect(parser.isAtEndOfInput()).to.equal(true)
        assertAllThreeStatementsPresentAndValid(ptResult)
    })
})
