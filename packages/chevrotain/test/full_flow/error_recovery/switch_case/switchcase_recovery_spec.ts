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
  SwitchTok,
} from "./switchcase_recovery_tokens.js";
import { SwitchCaseRecoveryParser } from "./switchcase_recovery_parser.js";
import {
  EarlyExitException,
  MismatchedTokenException,
} from "../../../../src/parse/exceptions_public.js";
import { createRegularToken } from "../../../utils/matchers.js";
import { expect } from "chai";

describe("Error Recovery switch-case Example", () => {
  before(() => {
    // called for side effect of augmenting
    new SwitchCaseRecoveryParser([]);
  });

  it("can parse a valid text successfully", () => {
    const input = [
      // switch (name) {
      createRegularToken(SwitchTok),
      createRegularToken(LParenTok),
      createRegularToken(IdentTok, "name"),
      createRegularToken(RParenTok),
      createRegularToken(LCurlyTok),
      // case "Terry" : return 2;
      createRegularToken(CaseTok),
      createRegularToken(StringTok, "Terry"),
      createRegularToken(ColonTok),
      createRegularToken(ReturnTok),
      createRegularToken(IntTok, "2"),
      createRegularToken(SemiColonTok),
      // case "Robert" : return 4;
      createRegularToken(CaseTok),
      createRegularToken(StringTok, "Robert"),
      createRegularToken(ColonTok),
      createRegularToken(ReturnTok),
      createRegularToken(IntTok, "4"),
      createRegularToken(SemiColonTok),
      // case "Brandon" : return 6;
      createRegularToken(CaseTok),
      createRegularToken(StringTok, "Brandon"),
      createRegularToken(ColonTok),
      createRegularToken(ReturnTok),
      createRegularToken(IntTok, "6"),
      createRegularToken(SemiColonTok),
      createRegularToken(RCurlyTok),
    ];

    const parser = new SwitchCaseRecoveryParser();
    parser.input = input;

    const parseResult = parser.switchStmt();
    expect(parser.errors.length).to.equal(0);

    expect(parseResult).to.deep.equal({
      Terry: 2,
      Robert: 4,
      Brandon: 6,
    });
  });

  it("can perform re-sync recovery to the next case stmt", () => {
    const input = [
      // switch (name) {
      createRegularToken(SwitchTok),
      createRegularToken(LParenTok),
      createRegularToken(IdentTok, "name"),
      createRegularToken(RParenTok),
      createRegularToken(LCurlyTok),
      // case "Terry" : return 2;
      createRegularToken(CaseTok),
      createRegularToken(StringTok, "Terry"),
      createRegularToken(ColonTok),
      createRegularToken(ReturnTok),
      createRegularToken(IntTok, "2"),
      createRegularToken(SemiColonTok),
      // case "Robert" ::: return 4; <-- using 3 colons to trigger re-sync recovery
      createRegularToken(CaseTok),
      createRegularToken(StringTok, "Robert"),
      createRegularToken(ColonTok, ":"),
      createRegularToken(ColonTok, ":"),
      createRegularToken(ColonTok, ":"),
      createRegularToken(ReturnTok, "return"),
      createRegularToken(IntTok, "4"),
      createRegularToken(SemiColonTok, ";"),
      // case "Brandon" : return 6;
      createRegularToken(CaseTok),
      createRegularToken(StringTok, "Brandon"),
      createRegularToken(ColonTok),
      createRegularToken(ReturnTok),
      createRegularToken(IntTok, "6"),
      createRegularToken(SemiColonTok),
      createRegularToken(RCurlyTok),
    ];

    const parser = new SwitchCaseRecoveryParser();
    parser.input = input;

    const parseResult = parser.switchStmt();

    expect(parseResult).to.deep.equal({
      Terry: 2,
      invalid1: undefined,
      Brandon: 6,
    });

    expect(parser.errors.length).to.equal(1);
    expect(parser.errors[0].resyncedTokens).to.have.lengthOf(4);
    expect(parser.errors[0].resyncedTokens[0].image).to.equal(":");
    expect(parser.errors[0].resyncedTokens[1].image).to.equal("return");
    expect(parser.errors[0].resyncedTokens[2].image).to.equal("4");
    expect(parser.errors[0].resyncedTokens[3].image).to.equal(";");
  });

  it("will detect an error if missing AT_LEAST_ONCE occurrence", () => {
    const input = [
      // switch (name) { }
      createRegularToken(SwitchTok),
      createRegularToken(LParenTok),
      createRegularToken(IdentTok, "name"),
      createRegularToken(RParenTok),
      createRegularToken(LCurlyTok),
      createRegularToken(RCurlyTok),
    ];

    const parser = new SwitchCaseRecoveryParser();
    parser.input = input;

    const parseResult = parser.switchStmt();
    expect(parser.errors.length).to.equal(1);
    expect(parser.errors[0]).to.be.an.instanceof(EarlyExitException);
    expect(parseResult).to.deep.equal({});
  });

  it("can perform re-sync recovery to the next case stmt even if the unexpected tokens are between valid case stmts", () => {
    const input = [
      // switch (name) {
      createRegularToken(SwitchTok),
      createRegularToken(LParenTok),
      createRegularToken(IdentTok, "name"),
      createRegularToken(RParenTok),
      createRegularToken(LCurlyTok),
      // case "Terry" : return 2;
      createRegularToken(CaseTok),
      createRegularToken(StringTok, "Terry"),
      createRegularToken(ColonTok),
      createRegularToken(ReturnTok),
      createRegularToken(IntTok, "2"),
      createRegularToken(SemiColonTok),
      // case "Robert" : return 4;
      createRegularToken(CaseTok),
      createRegularToken(StringTok, "Robert"),
      createRegularToken(ColonTok),
      createRegularToken(ReturnTok),
      createRegularToken(IntTok, "4"),
      createRegularToken(SemiColonTok),
      // "ima" "aba" "bamba" <-- these three strings do not belong here, but instead of failing everything
      // we should still get a valid output as these tokens will be ignored and the parser will re-sync to the next case stmt
      createRegularToken(StringTok, "ima"),
      createRegularToken(StringTok, "aba"),
      createRegularToken(StringTok, "bamba"),
      // case "Brandon" : return 6;
      createRegularToken(CaseTok),
      createRegularToken(StringTok, "Brandon"),
      createRegularToken(ColonTok),
      createRegularToken(ReturnTok),
      createRegularToken(IntTok, "6"),
      createRegularToken(SemiColonTok),

      createRegularToken(RCurlyTok),
    ];

    const parser = new SwitchCaseRecoveryParser();
    parser.input = input;

    const parseResult = parser.switchStmt();
    expect(parser.errors.length).to.equal(1);

    expect(parseResult).to.deep.equal({
      Terry: 2,
      Robert: 4,
      Brandon: 6,
    });
  });

  it("can perform re-sync recovery to the right curly after the case statements repetition", () => {
    const input = [
      // switch (name) {
      createRegularToken(SwitchTok),
      createRegularToken(LParenTok),
      createRegularToken(IdentTok, "name"),
      createRegularToken(RParenTok),
      createRegularToken(LCurlyTok),
      // case "Terry" : return 2;
      createRegularToken(CaseTok),
      createRegularToken(StringTok, "Terry"),
      createRegularToken(ColonTok),
      createRegularToken(ReturnTok),
      createRegularToken(IntTok, "2"),
      createRegularToken(SemiColonTok),
      // case "Robert" : return 4;
      createRegularToken(CaseTok),
      createRegularToken(StringTok, "Robert"),
      createRegularToken(ColonTok),
      createRegularToken(ReturnTok),
      createRegularToken(IntTok, "4"),
      createRegularToken(SemiColonTok),
      // case "Brandon" : return 6;
      createRegularToken(CaseTok),
      createRegularToken(StringTok, "Brandon"),
      createRegularToken(ColonTok),
      createRegularToken(ReturnTok),
      createRegularToken(IntTok, "6"),
      createRegularToken(SemiColonTok),
      createRegularToken(StringTok, "ima"),
      createRegularToken(StringTok, "aba"),
      createRegularToken(StringTok, "bamba"),
      createRegularToken(RCurlyTok),
    ];

    const parser = new SwitchCaseRecoveryParser();
    parser.input = input;

    const parseResult = parser.switchStmt();
    expect(parser.errors.length).to.equal(1);
    expect(parseResult).to.deep.equal({
      Terry: 2,
      Robert: 4,
      Brandon: 6,
    });

    expect(parser.errors.length).to.equal(1);
    expect(parser.errors[0].resyncedTokens).to.have.lengthOf(2);
    expect(parser.errors[0].token.image).to.equal("ima");
    expect(parser.errors[0].resyncedTokens[0].image).to.equal("aba");
    expect(parser.errors[0].resyncedTokens[1].image).to.equal("bamba");
  });

  it("can perform single token deletion recovery", () => {
    const input = [
      // switch (name) {
      createRegularToken(SwitchTok),
      createRegularToken(LParenTok),
      createRegularToken(IdentTok, "name"),
      createRegularToken(RParenTok),
      createRegularToken(LCurlyTok),
      // case "Terry" : return 2;
      createRegularToken(CaseTok),
      createRegularToken(StringTok, "Terry"),
      createRegularToken(ColonTok), // <-- the redundant token to be deleted
      createRegularToken(ColonTok),
      createRegularToken(ReturnTok),
      createRegularToken(IntTok, "2"),
      createRegularToken(SemiColonTok),
      createRegularToken(RCurlyTok),
    ];

    const parser = new SwitchCaseRecoveryParser();
    parser.input = input;

    const parseResult = parser.switchStmt();
    expect(parser.errors.length).to.equal(1);
    expect(parseResult).to.deep.equal({ Terry: 2 });
  });

  it("can disable single token deletion recovery", () => {
    const input = [
      // switch (name) {
      createRegularToken(SwitchTok),
      createRegularToken(LParenTok),
      createRegularToken(IdentTok, "name"),
      createRegularToken(RParenTok),
      createRegularToken(LCurlyTok),
      // case "Terry" : return 2;
      createRegularToken(CaseTok),
      createRegularToken(StringTok, "Terry"),
      createRegularToken(ColonTok), // <-- the redundant token
      createRegularToken(ColonTok),
      createRegularToken(ReturnTok),
      createRegularToken(IntTok, "2"),
      createRegularToken(SemiColonTok),
      createRegularToken(RCurlyTok),
    ];

    const parser = new SwitchCaseRecoveryParser();
    parser.input = input;

    // disable the single token deletion recovery explicitly
    parser.singleTokenDeletionEnabled = false;

    const parseResult = parser.switchStmt();
    expect(parser.errors.length).to.equal(1);
    expect(parser.errors[0]).to.be.an.instanceof(MismatchedTokenException);
    expect(parseResult).to.deep.equal({ invalid1: undefined });
  });

  it("will perform single token insertion for a missing colon", () => {
    const input = [
      // case "Terry" return 2 <-- missing the colon between "Terry" and return
      createRegularToken(CaseTok),
      createRegularToken(StringTok, "Terry"),
      /* createRegularToken(ColonTok) ,*/ createRegularToken(ReturnTok),
      createRegularToken(IntTok, "2"),
      createRegularToken(SemiColonTok),
    ];

    const parser = new SwitchCaseRecoveryParser();
    parser.input = input;

    const parseResult = parser.caseStmt();
    expect(parser.errors.length).to.equal(1);
    expect(parser.errors[0]).to.be.an.instanceof(MismatchedTokenException);
    expect(parseResult).to.deep.equal({ Terry: 2 });
  });

  it("will NOT perform single token insertion for a missing string", () => {
    const input = [
      // case  : return 2 <-- missing the string for the case's value
      createRegularToken(CaseTok),
      /* new StringTok("Terry" , 0, 1, 1),*/ createRegularToken(ColonTok),
      createRegularToken(ReturnTok),
      createRegularToken(IntTok, "2"),
      createRegularToken(SemiColonTok),
    ];

    const parser = new SwitchCaseRecoveryParser();
    parser.input = input;

    const parseResult = parser.caseStmt();
    expect(parser.errors.length).to.equal(1);
    expect(parser.errors[0]).to.be.an.instanceof(MismatchedTokenException);
    expect(parseResult).to.deep.equal({ invalid1: undefined });
  });
});
