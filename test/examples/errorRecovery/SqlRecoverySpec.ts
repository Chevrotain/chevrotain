/// <reference path="SqlRecoveryTokens.ts" />
/// <reference path="SqlRecoveryParser.ts" />
/// <reference path="../../../src/scan/Tokens.ts" />
/// <reference path="../../../src/parse/ParseTree.ts" />
/// <reference path="../../../libs/jasmine.d.ts" />
/// <reference path="../../../libs/lodash.d.ts" />

// long lines for token init seems more readable to me then to break them up
// into multiple line.
/* tslint:disable:max-line-length  */
module chevrotain.examples.recovery.sql.spec {

    import tok = chevrotain.scan.tokens
    import pt =  chevrotain.parse.tree

    describe("Error Recovery SQL DDL Example", function () {
        "use strict"

        var schemaFQN = [new IdentTok(1, 1, "schema2"), new DotTok(1, 1), new IdentTok(1, 1, "Persons")]
        /* tslint:disable:quotemark  */
        var shahar32Record = [
            new LParenTok(1, 1), new IntTok(1, 9, "32"), new CommaTok(1, 1), new StringTok(1, 1, '"SHAHAR"'), new RParenTok(1, 1)]
        var shahar31Record = [new LParenTok(1, 1), new IntTok(1, 9, "31"), new CommaTok(1, 1), new StringTok(1, 1, '"SHAHAR"'), new RParenTok(1, 1)]
        /* tslint:enable:quotemark  */

        it("can parse a series of three statements successfully", function () {
            var input:any = _.flatten([
                // CREATE TABLE schema2.Persons
                new CreateTok(1, 1), new TableTok(1, 1), schemaFQN, new SemiColonTok(1, 1),
                // INSERT (32, "SHAHAR") INTO schema2.Persons
                new InsertTok(1, 1), shahar32Record, new IntoTok(1, 1), schemaFQN, new SemiColonTok(1, 1),
                // DELETE (31, "SHAHAR") FROM schema2.Persons
                new DeleteTok(1, 1), shahar31Record, new FromTok(1, 1), schemaFQN, new SemiColonTok(1, 1)
            ])

            var parser = new DDLExampleRecoveryParser(input)
            var ptResult = parser.ddl(1, true)
            expect(parser.errors.length).toBe(0)
            expect(parser.isAtEndOfInput()).toBe(true)
            assertAllThreeStatementsPresentAndValid(ptResult)
        })

        it("can perform single token insertion for a missing semicolon", function () {
            var input:any = _.flatten([
                // CREATE TABLE schema2.Persons
                new CreateTok(1, 1), new TableTok(1, 1), schemaFQN, new SemiColonTok(1, 1),
                // INSERT (32, "SHAHAR") INTO schema2.Persons
                new InsertTok(1, 1), shahar32Record, new IntoTok(1, 1), schemaFQN, /*new SemiColonTok(1, 1), <-- missing semicolon!*/
                // DELETE (31, "SHAHAR") FROM schema2.Persons
                new DeleteTok(1, 1), shahar31Record, new FromTok(1, 1), schemaFQN, new SemiColonTok(1, 1)
            ])

            var parser = new DDLExampleRecoveryParser(input)
            var ptResult = parser.ddl(1, true)
            // one error encountered
            expect(parser.errors.length).toBe(1)
            // yet the whole input has been parsed
            expect(parser.isAtEndOfInput()).toBe(true)
            // and the output parseTree contains ALL three statements
            assertAllThreeStatementsPresentAndValid(ptResult)
            var insertedSemiColon:tok.Token = ptResult.children[1].children[4].payload
            // the semicolon is present even though it did not exist in the input, magic!
            expect(insertedSemiColon).toEqual(jasmine.any(SemiColonTok))
            expect(insertedSemiColon.isInserted).toBe(true)
        })

        it("can perform single token deletion for a redundant keyword", function () {
            var input:any = _.flatten([
                // CREATE TABLE schema2.Persons
                new CreateTok(1, 1), new TableTok(1, 1), schemaFQN, new SemiColonTok(1, 1),
                // INSERT (32, "SHAHAR") INTO INTO schema2.Persons
                new InsertTok(1, 1), shahar32Record, new IntoTok(1, 1), new IntoTok(1, 1), /* <-- "INTO INTO" oops */ schemaFQN, new SemiColonTok(1, 1),
                // DELETE (31, "SHAHAR") FROM schema2.Persons
                new DeleteTok(1, 1), shahar31Record, new FromTok(1, 1), schemaFQN, new SemiColonTok(1, 1)
            ])

            var parser = new DDLExampleRecoveryParser(input)
            var ptResult = parser.ddl(1, true)
            // one error encountered
            expect(parser.errors.length).toBe(1)
            // yet the whole input has been parsed
            expect(parser.isAtEndOfInput()).toBe(true)
            // and the output parseTree contains ALL three statements
            assertAllThreeStatementsPresentAndValid(ptResult)
        })

        it("can perform re-sync recovery and only 'lose' part of the input", function () {
            var input:any = _.flatten([
                // CREATE TABLE schema2.Persons
                new CreateTok(1, 1), new TableTok(1, 1), schemaFQN, new SemiColonTok(1, 1),
                // INSERT (32, "SHAHAR") FROM (( schema2.Persons <-- this can't be recovered with a single token insertion of deletion, must do re-sync
                new InsertTok(1, 1), shahar32Record, new FromTok(1, 1), new LParenTok(1, 1), new LParenTok(1, 1), schemaFQN, new SemiColonTok(1, 1),
                // DELETE (31, "SHAHAR") FROM schema2.Persons
                new DeleteTok(1, 1), shahar31Record, new FromTok(1, 1), schemaFQN, new SemiColonTok(1, 1)
            ])

            var parser = new DDLExampleRecoveryParser(input)
            var ptResult = parser.ddl(1, true)
            // one error encountered
            expect(parser.errors.length).toBe(1)
            // yet the whole input has been parsed
            expect(parser.isAtEndOfInput()).toBe(true)
            expect(ptResult.payload).toEqual(jasmine.any(STATEMENTS))
            // 3 statements found
            expect(ptResult.children.length).toBe(3)
            expect(ptResult.children[0].payload).toEqual(jasmine.any(CREATE_STMT))
            expect(ptResult.children[0].payload).not.toEqual(jasmine.any(INVALID_CREATE_STMT))
            // but the second one is marked as invalid
            expect(ptResult.children[1].payload).toEqual(jasmine.any(INVALID_STATEMENT))
            // yet the third one is still valid!, we recovered and continued parsing.
            expect(ptResult.children[2].payload).toEqual(jasmine.any(DELETE_STMT))
            expect(ptResult.children[2].payload).not.toEqual(jasmine.any(INVALID_DELETE_STMT))
        })

        function assertAllThreeStatementsPresentAndValid(ptResult:pt.ParseTree):void {
            expect(ptResult.payload).toEqual(jasmine.any(STATEMENTS))
            // 3 statements found
            expect(ptResult.children.length).toBe(3)
            expect(ptResult.children[0].payload).toEqual(jasmine.any(CREATE_STMT))
            expect(ptResult.children[0].payload).not.toEqual(jasmine.any(INVALID_CREATE_STMT))
            expect(ptResult.children[1].payload).toEqual(jasmine.any(INSERT_STMT))
            expect(ptResult.children[1].payload).not.toEqual(jasmine.any(INVALID_INSERT_STMT))
            expect(ptResult.children[2].payload).toEqual(jasmine.any(DELETE_STMT))
            expect(ptResult.children[2].payload).not.toEqual(jasmine.any(INVALID_DELETE_STMT))
        }


        it("will encounter an NotAllInputParsedException when some of the input vector has not been parsed", function () {
            var input:any = _.flatten([
                // CREATE TABLE schema2.Persons; TABLE <-- redundant "TABLE" token
                new CreateTok(1, 1), new TableTok(1, 1), schemaFQN, new SemiColonTok(1, 1), new TableTok(1, 1)])
            var parser = new DDLExampleRecoveryParser(input)

            parser.ddl(1, true)
            expect(parser.errors.length).toBe(1)
            expect(parser.errors[0]).toEqual(jasmine.any(recog.NotAllInputParsedException))
        })

        it("can use the same parser instance to parse multiple inputs", function () {
            var input1:any = _.flatten([
                // CREATE TABLE schema2.Persons;
                new CreateTok(1, 1), new TableTok(1, 1), schemaFQN, new SemiColonTok(1, 1)])
            var parser = new DDLExampleRecoveryParser(input1)
            parser.ddl(1, true)
            expect(parser.errors.length).toBe(0)
            expect(parser.isAtEndOfInput()).toBe(true)


            var input2:any = _.flatten([
                // DELETE (31, "SHAHAR") FROM schema2.Persons
                new DeleteTok(1, 1), shahar31Record, new FromTok(1, 1), schemaFQN, new SemiColonTok(1, 1)])
            // the parser is being reset instead of creating a new instance for each new input
            parser.reset();
            parser.input = input2
            var ptResult = parser.ddl(1, true)
            expect(parser.errors.length).toBe(0)
            expect(parser.isAtEndOfInput()).toBe(true)
            // verify returned ParseTree
            expect(ptResult.payload).toEqual(jasmine.any(STATEMENTS))
            expect(ptResult.children.length).toBe(1)
            expect(ptResult.children[0].payload).toEqual(jasmine.any(DELETE_STMT))
            expect(ptResult.children[0].payload).not.toEqual(jasmine.any(INVALID_DELETE_STMT))
        })

    })

}
