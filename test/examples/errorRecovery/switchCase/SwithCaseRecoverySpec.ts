/// <reference path="SwitchCaseRecoveryParser.ts" />
/// <reference path="SwitchCaseRecoveryTokens.ts" />
/// <reference path="../../../../src/scan/Tokens.ts" />
/// <reference path="../../../../src/parse/ParseTree.ts" />
/// <reference path="../../../../libs/jasmine.d.ts" />
/// <reference path="../../../../libs/lodash.d.ts" />


// long lines for token init seems more readable to me than to break them up
// into multiple line.
/* tslint:disable:max-line-length  */
module chevrotain.examples.recovery.switchcase.spec {

    import tok = chevrotain.scan.tokens
    import pt =  chevrotain.parse.tree

    describe("Error Recovery switch-case Example", function () {
        "use strict"


        it("can parse a valid example successfully", function () {
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
            var parseResult = parser.switchStmt(1, true)
            expect(parser.errors.length).toBe(0)
            expect(parser.isAtEndOfInput()).toBe(true)

            expect(parseResult).toEqual({
                "Terry":   2,
                "Robert":  4,
                "Brandon": 6
            })
        })

        it("can perform re-sync recovery to the next repetition", function () {
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
            var parseResult = parser.switchStmt(1, true)
            expect(parser.errors.length).toBe(1)
            expect(parser.isAtEndOfInput()).toBe(true)

            expect(parseResult).toEqual({
                "Terry":    2,
                "invalid1": undefined,
                "Brandon":  6
            })
        })

        it("will detect an error if missing AT_LEAST_ONCE occurrence", function () {
            var input = [
                // switch (name) { }
                new SwitchTok(1, 1), new LParenTok(1, 1), new IdentTok(1, 1, "name"), new RParenTok(1, 1), new LCurlyTok(1, 1), new RCurlyTok(1, 1)
            ]

            var parser = new SwitchCaseRecoveryParser(input)
            var parseResult = parser.switchStmt(1, true)
            expect(parser.errors.length).toBe(1)
            expect(parser.errors[0]).toEqual(jasmine.any(recog.EarlyExitException))
            // we have re-synced to the end of the input therefore all the input has been "parsed"
            expect(parser.isAtEndOfInput()).toBe(true)
            expect(parseResult).toEqual({})
        })

    })

}
