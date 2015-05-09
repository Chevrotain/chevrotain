/// <reference path="switchcase_recovery_parser.ts" />
/// <reference path="Switchcase_recovery_tokens.ts" />
/// <reference path="../../../src/scan/tokens.ts" />
/// <reference path="../../../src/parse/parse_tree.ts" />
/// <reference path="../../../src/parse/recognizer.ts" />
/// <reference path="../../../libs/jasmine.d.ts" />
/// <reference path="../../../libs/lodash.d.ts" />


// long lines for token init seems more readable to me than to break them up
// into multiple line.
/* tslint:disable:max-line-length  */
module chevrotain.examples.recovery.switchcase.spec {

    import tok = chevrotain.tokens
    import pt =  chevrotain.tree
    import recog = chevrotain.recognizer


    describe("Error Recovery switch-case Example", function () {
        "use strict"


        it("can parse a valid text successfully", function () {
            var input = [
                // switch (name) {
                new SwitchTok(1, 1), new LParenTok(1, 1), new IdentTok(1, 1, "name"), new RParenTok(1, 1), new LCurlyTok(1, 1),
                // case "Terry" : return 2;
                new CaseTok(1, 1), new StringTok(1, 1, "Terry"), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok(1, 1, "2"), new SemiColonTok(1, 1),
                // case "Robert" : return 4;
                new CaseTok(1, 1), new StringTok(1, 1, "Robert"), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok(1, 1, "4"), new SemiColonTok(1, 1),
                // case "Brandon" : return 6;
                new CaseTok(1, 1), new StringTok(1, 1, "Brandon"), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok(1, 1, "6"), new SemiColonTok(1, 1),
                new RCurlyTok(1, 1)
            ]

            var parser = new SwitchCaseRecoveryParser(input)
            var parseResult = parser.switchStmt()
            expect(parser.errors.length).toBe(0)
            expect(parser.isAtEndOfInput()).toBe(true)

            expect(parseResult).toEqual({
                "Terry": 2,
                "Robert": 4,
                "Brandon": 6
            })
        })

        it("can perform re-sync recovery to the next case stmt", function () {
            var input = [
                // switch (name) {
                new SwitchTok(1, 1), new LParenTok(1, 1), new IdentTok(1, 1, "name"), new RParenTok(1, 1), new LCurlyTok(1, 1),
                // case "Terry" : return 2;
                new CaseTok(1, 1), new StringTok(1, 1, "Terry"), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok(1, 1, "2"), new SemiColonTok(1, 1),
                // case "Robert" ::: return 4; <-- using 3 colons to trigger re-sync recovery
                new CaseTok(1, 1), new StringTok(1, 1, "Robert"), new ColonTok(1, 1), new ColonTok(1, 1), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok(1, 1, "4"), new SemiColonTok(1, 1),
                // case "Brandon" : return 6;
                new CaseTok(1, 1), new StringTok(1, 1, "Brandon"), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok(1, 1, "6"), new SemiColonTok(1, 1),
                new RCurlyTok(1, 1)
            ]

            var parser = new SwitchCaseRecoveryParser(input)
            var parseResult = parser.switchStmt()
            expect(parser.errors.length).toBe(1)
            expect(parser.isAtEndOfInput()).toBe(true)

            expect(parseResult).toEqual({
                "Terry": 2,
                "invalid1": undefined,
                "Brandon": 6
            })
        })

        it("will detect an error if missing AT_LEAST_ONCE occurrence", function () {
            var input = [
                // switch (name) { }
                new SwitchTok(1, 1), new LParenTok(1, 1), new IdentTok(1, 1, "name"), new RParenTok(1, 1), new LCurlyTok(1, 1), new RCurlyTok(1, 1)
            ]

            var parser = new SwitchCaseRecoveryParser(input)
            var parseResult = parser.switchStmt()
            expect(parser.errors.length).toBe(1)
            expect(parser.errors[0]).toEqual(jasmine.any(recog.EarlyExitException))
            // we have re-synced to the end of the input therefore all the input has been "parsed"
            expect(parser.isAtEndOfInput()).toBe(true)
            expect(parseResult).toEqual({})
        })


        it("can perform re-sync recovery to the next case stmt even if the unexpected tokens are between valid case stmts", function () {
            var input = [
                // switch (name) {
                new SwitchTok(1, 1), new LParenTok(1, 1), new IdentTok(1, 1, "name"), new RParenTok(1, 1), new LCurlyTok(1, 1),
                // case "Terry" : return 2;
                new CaseTok(1, 1), new StringTok(1, 1, "Terry"), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok(1, 1, "2"), new SemiColonTok(1, 1),
                // case "Robert" : return 4;
                new CaseTok(1, 1), new StringTok(1, 1, "Robert"), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok(1, 1, "4"), new SemiColonTok(1, 1),
                // "ima" "aba" "bamba" <-- these three strings do not belong here, but instead of failing everything
                // we should still get a valid output as these tokens will be ignored and the parser will re-sync to the next case stmt
                new StringTok(1, 1, "ima"), new StringTok(1, 1, "aba"), new StringTok(1, 1, "bamba"),
                // case "Brandon" : return 6;
                new CaseTok(1, 1), new StringTok(1, 1, "Brandon"), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok(1, 1, "6"), new SemiColonTok(1, 1),

                new RCurlyTok(1, 1)
            ]

            var parser = new SwitchCaseRecoveryParser(input)
            var parseResult = parser.switchStmt()
            expect(parser.errors.length).toBe(1)
            expect(parser.isAtEndOfInput()).toBe(true)

            expect(parseResult).toEqual({
                "Terry": 2,
                "Robert": 4,
                "Brandon": 6
            })
        })

        it("can also sometimes fail in automatic error recovery :)", function () {
            var input = [
                // switch (name) {
                new SwitchTok(1, 1), new LParenTok(1, 1), new IdentTok(1, 1, "name"), new RParenTok(1, 1), new LCurlyTok(1, 1),
                // case "Terry" : return 2;
                new CaseTok(1, 1), new StringTok(1, 1, "Terry"), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok(1, 1, "2"), new SemiColonTok(1, 1),
                // case "Robert" : return 4;
                new CaseTok(1, 1), new StringTok(1, 1, "Robert"), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok(1, 1, "4"), new SemiColonTok(1, 1),
                // case "Brandon" : return 6;
                new CaseTok(1, 1), new StringTok(1, 1, "Brandon"), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok(1, 1, "6"), new SemiColonTok(1, 1),
                // in this sample input the "bad" input is after a valid iteration of a caseStmt
                // so inRepetition recovery won't work because we have no other iteration to re-sync to, and because
                // "switchStmt" is the top rule the re-sync is to EOF.
                new StringTok(1, 1, "ima"), new StringTok(1, 1, "aba"), new StringTok(1, 1, "bamba"),
                new RCurlyTok(1, 1)
            ]

            var parser = new SwitchCaseRecoveryParser(input)
            var parseResult = parser.switchStmt()
            expect(parser.errors.length).toBe(1)
            expect(parser.isAtEndOfInput()).toBe(true)
            expect(parseResult).toEqual({})
        })

        it("can perform single token deletion recovery", function () {
            var input = [
                // switch (name) {
                new SwitchTok(1, 1), new LParenTok(1, 1), new IdentTok(1, 1, "name"), new RParenTok(1, 1), new LCurlyTok(1, 1),
                // case "Terry" : return 2;
                new CaseTok(1, 1), new StringTok(1, 1, "Terry"), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok(1, 1, "2"), new SemiColonTok(1, 1),
                // case "Robert" : return 4;
                new CaseTok(1, 1), new StringTok(1, 1, "Robert"), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok(1, 1, "4"), new SemiColonTok(1, 1),
                // case "Brandon" : return 6;
                new CaseTok(1, 1), new StringTok(1, 1, "Brandon"), new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok(1, 1, "6"), new SemiColonTok(1, 1),
                new SemiColonTok(1, 1), // <-- the redundant token to be deleted
                new RCurlyTok(1, 1)
            ]

            var parser = new SwitchCaseRecoveryParser(input)
            var parseResult = parser.switchStmt()
            expect(parser.errors.length).toBe(1)
            expect(parser.isAtEndOfInput()).toBe(true)
            expect(parseResult).toEqual({
                "Terry": 2,
                "Robert": 4,
                "Brandon": 6
            })
        })

        it("will perform single token insertion for a missing colon", function () {
            var input = [
                // case "Terry" return 2 <-- missing the colon between "Terry" and return
                new CaseTok(1, 1), new StringTok(1, 1, "Terry"), /* new ColonTok(1, 1) ,*/ new ReturnTok(1, 1), new IntTok(1, 1, "2"), new SemiColonTok(1, 1),
            ]

            var parser = new SwitchCaseRecoveryParser(input)
            var parseResult = parser.caseStmt()
            expect(parser.errors.length).toBe(1)
            expect(parser.errors[0]).toEqual(jasmine.any(recog.MismatchedTokenException))
            expect(parser.isAtEndOfInput()).toBe(true)
            expect(parseResult).toEqual({"Terry": 2})
        })

        it("will NOT perform single token insertion for a missing string", function () {
            var input = [
                // case  : return 2 <-- missing the string for the case's value
                new CaseTok(1, 1), /* new StringTok(1, 1, "Terry"),*/  new ColonTok(1, 1), new ReturnTok(1, 1), new IntTok(1, 1, "2"), new SemiColonTok(1, 1),
            ]

            var parser = new SwitchCaseRecoveryParser(input)
            var parseResult = parser.caseStmt()
            expect(parser.errors.length).toBe(1)
            expect(parser.errors[0]).toEqual(jasmine.any(recog.MismatchedTokenException))
            expect(parser.isAtEndOfInput()).toBe(true) // in rule recovery failed, will now re-sync to EOF
            expect(parseResult).toEqual({"invalid1": undefined})
        })

    })

}
