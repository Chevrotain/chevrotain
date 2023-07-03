import { expect } from "chai"
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
import { tokenMatcher } from "../../../../src/scan/tokens_public"
import { NotAllInputParsedException } from "../../../../src/parse/exceptions_public"
import { ParseTree } from "../../parse_tree"
import { flatten } from "remeda"
import { createRegularToken } from "../../../utils/matchers"
import { IToken } from "@chevrotain/types"

describe("Error Recovery SQL DDL Example", () => {
  let schemaFQN: IToken[], shahar32Record: IToken[], shahar31Record: IToken[]
  before(() => {
    // for side effect if augmenting the Token classes.
    new DDLExampleRecoveryParser()

    schemaFQN = [
      createRegularToken(IdentTok, "schema2"),
      createRegularToken(DotTok),
      createRegularToken(IdentTok, "Persons")
    ]
    shahar32Record = [
      createRegularToken(LParenTok),
      createRegularToken(IntTok, "32"),
      createRegularToken(CommaTok),
      createRegularToken(StringTok, "SHAHAR"),
      createRegularToken(RParenTok)
    ]
    shahar31Record = [
      createRegularToken(LParenTok),
      createRegularToken(IntTok, "31"),
      createRegularToken(CommaTok),
      createRegularToken(StringTok, '"SHAHAR"'),
      createRegularToken(RParenTok)
    ]
  })

  it("can parse a series of three statements successfully", () => {
    const input: any = flatten([
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

    const parser = new DDLExampleRecoveryParser()
    parser.input = input
    const ptResult = parser.ddl()
    expect(parser.errors.length).to.equal(0)
    assertAllThreeStatementsPresentAndValid(ptResult)
  })

  describe("Single Token insertion recovery mechanism", () => {
    let input: IToken[]

    before(() => {
      input = flatten([
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
    })

    it("can perform single token insertion for a missing semicolon", () => {
      const parser = new DDLExampleRecoveryParser()
      parser.input = input
      const ptResult: any = parser.ddl()
      // one error encountered
      expect(parser.errors.length).to.equal(1)
      // yet the whole input has been parsed
      // and the output parseTree contains ALL three statements
      assertAllThreeStatementsPresentAndValid(ptResult)
      const insertedSemiColon: IToken = ptResult.children[1].children[4].payload
      // the semicolon is present even though it did not exist in the input, magic!
      expect(tokenMatcher(insertedSemiColon, SemiColonTok)).to.be.true
      expect(insertedSemiColon.isInsertedInRecovery).to.equal(true)
    })

    it("can disable single token insertion for a missing semicolon", () => {
      const parser = new DDLExampleRecoveryParser(false)
      parser.input = input
      const ptResult: any = parser.ddl()
      expect(parser.errors.length).to.equal(1)
      expect(ptResult.payload.tokenType).to.equal(INVALID_DDL)
      expect(ptResult.children).to.have.length(0)
    })
  })

  describe("Single Token deletion recovery mechanism", () => {
    let input: IToken[]

    before(() => {
      input = flatten([
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
    })

    it("can perform single token deletion for a redundant keyword", () => {
      const parser = new DDLExampleRecoveryParser()
      parser.input = input
      const ptResult = parser.ddl()
      // one error encountered
      expect(parser.errors.length).to.equal(1)
      // yet the whole input has been parsed
      // and the output parseTree contains ALL three statements
      assertAllThreeStatementsPresentAndValid(ptResult)
    })

    it("can disable single token deletion for a redundant keyword", () => {
      const parser = new DDLExampleRecoveryParser(false)
      parser.input = input
      const ptResult: any = parser.ddl()
      expect(parser.errors.length).to.equal(1)
      expect(ptResult.payload.tokenType).to.equal(INVALID_DDL)
      expect(ptResult.children).to.have.length(0)
    })
  })

  describe("resync recovery mechanism", () => {
    let badShahar32Record: IToken[], input: IToken[]

    before(() => {
      // (32, "SHAHAR" ( <-- wrong parenthesis
      badShahar32Record = [
        createRegularToken(LParenTok),
        createRegularToken(IntTok, "32"),
        createRegularToken(CommaTok),
        createRegularToken(StringTok, '"SHAHAR"'),
        createRegularToken(LParenTok)
      ]

      input = flatten([
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
    })

    it("can perform re-sync recovery and only 'lose' part of the input", () => {
      const input: any = flatten([
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

      const parser = new DDLExampleRecoveryParser()
      parser.input = input

      const ptResult: any = parser.ddl()
      // one error encountered
      expect(parser.errors.length).to.equal(1)
      // yet the whole input has been parsed
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

    it("can perform re-sync recovery and only 'lose' part of the input even when re-syncing to two rules 'above'", () => {
      const parser = new DDLExampleRecoveryParser()
      parser.input = input
      const ptResult: any = parser.ddl()
      // one error encountered
      expect(parser.errors.length).to.equal(1)
      // yet the whole input has been parsed
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
      const parser = new DDLExampleRecoveryParser(false)
      parser.input = input
      const ptResult: any = parser.ddl()
      // one error encountered
      expect(parser.errors.length).to.equal(1)
      // yet the whole input has been parsed
      expect(ptResult.payload.tokenType).to.equal(INVALID_DDL)
      expect(ptResult.children).to.have.length(0)
    })
  })

  function assertAllThreeStatementsPresentAndValid(ptResult: ParseTree): void {
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
    const input: any = flatten([
      // CREATE TABLE schema2.Persons; TABLE <-- redundant "TABLE" token
      createRegularToken(CreateTok),
      createRegularToken(TableTok),
      schemaFQN,
      createRegularToken(SemiColonTok),
      createRegularToken(TableTok)
    ])
    const parser = new DDLExampleRecoveryParser()
    parser.input = input

    parser.ddl()
    expect(parser.errors.length).to.equal(1)
    expect(parser.errors[0]).to.be.an.instanceof(NotAllInputParsedException)
  })

  it("can use the same parser instance to parse multiple inputs", () => {
    const input1: any = flatten([
      // CREATE TABLE schema2.Persons;
      createRegularToken(CreateTok),
      createRegularToken(TableTok),
      schemaFQN,
      createRegularToken(SemiColonTok)
    ])
    const parser = new DDLExampleRecoveryParser(input1)
    parser.ddl()
    expect(parser.errors.length).to.equal(0)

    const input2: any = flatten([
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
    const ptResult: any = parser.ddl()
    expect(parser.errors.length).to.equal(0)
    // verify returned ParseTree
    expect(ptResult.payload.tokenType).to.equal(STATEMENTS)
    expect(ptResult.children.length).to.equal(1)
    expect(ptResult.children[0].payload.tokenType).to.equal(DELETE_STMT)
    expect(ptResult.children[0].payload.tokenType).to.not.equal(
      INVALID_DELETE_STMT
    )
  })

  it("can re-sync to the next iteration in a MANY rule", () => {
    const input: any = flatten([
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

    const parser = new DDLExampleRecoveryParser()
    parser.input = input
    const ptResult = parser.ddl()
    expect(parser.errors.length).to.equal(1)
    assertAllThreeStatementsPresentAndValid(ptResult)
  })
})
