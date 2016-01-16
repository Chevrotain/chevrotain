// long lines for token init seems more readable to me than to break them up into multiple line.
/* tslint:disable:max-line-length  */

import {
    SwitchTok,
    LParenTok,
    IdentTok,
    RParenTok,
    LCurlyTok,
    CaseTok,
    StringTok,
    ColonTok,
    ReturnTok,
    IntTok,
    RCurlyTok,
    SemiColonTok
} from "./Switchcase_recovery_tokens"
import {SwitchCaseRecoveryParser} from "./switchcase_recovery_parser"
import {exceptions} from "../../../../src/parse/exceptions_public"
import * as _ from "lodash"


describe("Error Recovery switch-case Example", function () {
    "use strict"

    it("can parse a valid text successfully", function () {
        let input = [
            // switch (name) {
            new SwitchTok(1, 1), new LParenTok(1, 1), new IdentTok("name", 0, 1, 1), new RParenTok(1, 1), new LCurlyTok(1, 1),
            // case "Terry" : return 2;
            new CaseTok(1, 1), new StringTok("Terry", 0, 1, 1), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok("2", 0, 1, 1), new SemiColonTok(1, 1),
            // case "Robert" : return 4;
            new CaseTok(1, 1), new StringTok("Robert", 0, 1, 1), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok("4", 0, 1, 1), new SemiColonTok(1, 1),
            // case "Brandon" : return 6;
            new CaseTok(1, 1), new StringTok("Brandon", 0, 1, 1), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok("6", 0, 1, 1), new SemiColonTok(1, 1),
            new RCurlyTok(1, 1)
        ]

        let parser = new SwitchCaseRecoveryParser(input)
        let parseResult = parser.switchStmt()
        expect(parser.errors.length).to.equal(0)
        expect(parser.isAtEndOfInput()).to.equal(true)

        expect(parseResult).to.deep.equal({
            "Terry":   2,
            "Robert":  4,
            "Brandon": 6
        })
    })

    it("can perform re-sync recovery to the next case stmt", function () {
        let input = [
            // switch (name) {
            new SwitchTok(1, 1), new LParenTok(1, 1), new IdentTok("name", 0, 1, 1), new RParenTok(1, 1), new LCurlyTok(1, 1),
            // case "Terry" : return 2;
            new CaseTok(1, 1), new StringTok("Terry", 0, 1, 1), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok("2", 0, 1, 1), new SemiColonTok(1, 1),
            // case "Robert" ::: return 4; <-- using 3 colons to trigger re-sync recovery
            new CaseTok(1, 1), new StringTok("Robert", 0, 1, 1), new ColonTok(1, 1), new ColonTok(1, 1), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok("4", 0, 1, 1), new SemiColonTok(1, 1),
            // case "Brandon" : return 6;
            new CaseTok(1, 1), new StringTok("Brandon", 0, 1, 1), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok("6", 0, 1, 1), new SemiColonTok(1, 1),
            new RCurlyTok(1, 1)
        ]

        let parser = new SwitchCaseRecoveryParser(input)
        let parseResult = parser.switchStmt()
        expect(parser.errors.length).to.equal(1)
        expect(parser.isAtEndOfInput()).to.equal(true)

        expect(parseResult).to.deep.equal({
            "Terry":    2,
            "invalid1": undefined,
            "Brandon":  6
        })
    })

    it("will detect an error if missing AT_LEAST_ONCE occurrence", function () {
        let input = [
            // switch (name) { }
            new SwitchTok(1, 1), new LParenTok(1, 1), new IdentTok("name", 0, 1, 1), new RParenTok(1, 1), new LCurlyTok(1, 1), new RCurlyTok(1, 1)
        ]

        let parser = new SwitchCaseRecoveryParser(input)
        let parseResult = parser.switchStmt()
        expect(parser.errors.length).to.equal(1)
        expect(parser.errors[0]).to.be.an.instanceof(exceptions.EarlyExitException)
        // we have re-synced to the end of the input therefore all the input has been "parsed"
        expect(parser.isAtEndOfInput()).to.equal(true)
        expect(parseResult).to.deep.equal({})
    })


    it("can perform re-sync recovery to the next case stmt even if the unexpected tokens are between valid case stmts", function () {
        let input = [
            // switch (name) {
            new SwitchTok(1, 1), new LParenTok(1, 1), new IdentTok("name", 0, 1, 1), new RParenTok(1, 1), new LCurlyTok(1, 1),
            // case "Terry" : return 2;
            new CaseTok(1, 1), new StringTok("Terry", 0, 1, 1), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok("2", 0, 1, 1), new SemiColonTok(1, 1),
            // case "Robert" : return 4;
            new CaseTok(1, 1), new StringTok("Robert", 0, 1, 1), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok("4", 0, 1, 1), new SemiColonTok(1, 1),
            // "ima" "aba" "bamba" <-- these three strings do not belong here, but instead of failing everything
            // we should still get a valid output as these tokens will be ignored and the parser will re-sync to the next case stmt
            new StringTok("ima", 0, 1, 1), new StringTok("aba", 0, 1, 1), new StringTok("bamba", 0, 1, 1),
            // case "Brandon" : return 6;
            new CaseTok(1, 1), new StringTok("Brandon", 0, 1, 1), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok("6", 0, 1, 1), new SemiColonTok(1, 1),

            new RCurlyTok(1, 1)
        ]

        let parser = new SwitchCaseRecoveryParser(input)
        let parseResult = parser.switchStmt()
        expect(parser.errors.length).to.equal(1)
        expect(parser.isAtEndOfInput()).to.equal(true)

        expect(parseResult).to.deep.equal({
            "Terry":   2,
            "Robert":  4,
            "Brandon": 6
        })
    })

    it("can also sometimes fail in automatic error recovery :)", function () {
        let input = [
            // switch (name) {
            new SwitchTok(1, 1), new LParenTok(1, 1), new IdentTok("name", 0, 1, 1), new RParenTok(1, 1), new LCurlyTok(1, 1),
            // case "Terry" : return 2;
            new CaseTok(1, 1), new StringTok("Terry", 0, 1, 1), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok("2", 0, 1, 1), new SemiColonTok(1, 1),
            // case "Robert" : return 4;
            new CaseTok(1, 1), new StringTok("Robert", 0, 1, 1), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok("4", 0, 1, 1), new SemiColonTok(1, 1),
            // case "Brandon" : return 6;
            new CaseTok(1, 1), new StringTok("Brandon", 0, 1, 1), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok("6", 0, 1, 1), new SemiColonTok(1, 1),
            // in this sample input the "bad" input is after a valid iteration of a caseStmt
            // so inRepetition recovery won't work because we have no other iteration to re-sync to, and because
            // "switchStmt" is the top rule the re-sync is to EOF.
            new StringTok("ima", 0, 1, 1), new StringTok("aba", 0, 1, 1), new StringTok("bamba", 0, 1, 1),
            new RCurlyTok(1, 1)
        ]

        let parser = new SwitchCaseRecoveryParser(input)
        let parseResult = parser.switchStmt()
        expect(parser.errors.length).to.equal(1)
        expect(parser.isAtEndOfInput()).to.equal(true)
        expect(parseResult).to.deep.equal({})
    })

    it("can perform single token deletion recovery", function () {
        let input = [
            // switch (name) {
            new SwitchTok(1, 1), new LParenTok(1, 1), new IdentTok("name", 0, 1, 1), new RParenTok(1, 1), new LCurlyTok(1, 1),
            // case "Terry" : return 2;
            new CaseTok(1, 1), new StringTok("Terry", 0, 1, 1), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok("2", 0, 1, 1), new SemiColonTok(1, 1),
            // case "Robert" : return 4;
            new CaseTok(1, 1), new StringTok("Robert", 0, 1, 1), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok("4", 0, 1, 1), new SemiColonTok(1, 1),
            // case "Brandon" : return 6;
            new CaseTok(1, 1), new StringTok("Brandon", 0, 1, 1), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok("6", 0, 1, 1), new SemiColonTok(1, 1),
            new SemiColonTok(1, 1), // <-- the redundant token to be deleted
            new RCurlyTok(1, 1)
        ]

        let parser = new SwitchCaseRecoveryParser(input)
        let parseResult = parser.switchStmt()
        expect(parser.errors.length).to.equal(1)
        expect(parser.isAtEndOfInput()).to.equal(true)
        expect(parseResult).to.deep.equal({
            "Terry":   2,
            "Robert":  4,
            "Brandon": 6
        })
    })

    it("will perform single token insertion for a missing colon", function () {
        let input = [
            // case "Terry" return 2 <-- missing the colon between "Terry" and return
            new CaseTok(1, 1), new StringTok("Terry", 0, 1, 1), /* new ColonTok(1, 1) ,*/ new ReturnTok(1, 1), new IntTok("2", 0, 1, 1), new SemiColonTok(1, 1),
        ]

        let parser = new SwitchCaseRecoveryParser(input)
        let parseResult = parser.caseStmt()
        expect(parser.errors.length).to.equal(1)
        expect(parser.errors[0]).to.be.an.instanceof(exceptions.MismatchedTokenException)
        expect(parser.isAtEndOfInput()).to.equal(true)
        expect(parseResult).to.deep.equal({"Terry": 2})
    })

    it("will NOT perform single token insertion for a missing string", function () {
        let input = [
            // case  : return 2 <-- missing the string for the case's value
            new CaseTok(1, 1), /* new StringTok("Terry" , 0, 1, 1),*/  new ColonTok(1, 1), new ReturnTok(1, 1),
            new IntTok("2", 0, 1, 1), new SemiColonTok(1, 1),
        ]

        let parser = new SwitchCaseRecoveryParser(input)
        let parseResult = parser.caseStmt()
        expect(parser.errors.length).to.equal(1)
        expect(parser.errors[0]).to.be.an.instanceof(exceptions.MismatchedTokenException)
        expect(parser.isAtEndOfInput()).to.equal(true) // in rule recovery failed, will now re-sync to EOF
        expect(parseResult).to.deep.equal({"invalid1": undefined})
    })

})
