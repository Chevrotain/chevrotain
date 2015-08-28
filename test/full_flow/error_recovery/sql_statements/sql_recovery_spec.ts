// long lines for token init seems more readable to me than to break them up
// into multiple line.
/* tslint:disable:max-line-length  */
namespace chevrotain.examples.recovery.sql.spec {

    import pt =  chevrotain.tree
    import exceptions = chevrotain.exceptions


    describe("Error Recovery SQL DDL Example", function () {
        "use strict"

        let schemaFQN = [new IdentTok(1, 1, "schema2"), new DotTok(1, 1), new IdentTok(1, 1, "Persons")]
        /* tslint:disable:quotemark  */
        let shahar32Record = [
            new LParenTok(1, 1), new IntTok(1, 9, "32"), new CommaTok(1, 1), new StringTok(1, 1, '"SHAHAR"'), new RParenTok(1, 1)]
        let shahar31Record = [new LParenTok(1, 1), new IntTok(1, 9, "31"), new CommaTok(1, 1), new StringTok(1, 1, '"SHAHAR"'), new RParenTok(1, 1)]
        /* tslint:enable:quotemark  */

        it("can parse a series of three statements successfully", function () {
            let input:any = _.flatten([
                // CREATE TABLE schema2.Persons
                new CreateTok(1, 1), new TableTok(1, 1), schemaFQN, new SemiColonTok(1, 1),
                // INSERT (32, "SHAHAR") INTO schema2.Persons
                new InsertTok(1, 1), shahar32Record, new IntoTok(1, 1), schemaFQN, new SemiColonTok(1, 1),
                // DELETE (31, "SHAHAR") FROM schema2.Persons
                new DeleteTok(1, 1), shahar31Record, new FromTok(1, 1), schemaFQN, new SemiColonTok(1, 1)
            ])

            let parser = new DDLExampleRecoveryParser(input)
            let ptResult = parser.ddl()
            expect(parser.errors.length).to.equal(0)
            expect(parser.isAtEndOfInput()).to.equal(true)
            assertAllThreeStatementsPresentAndValid(ptResult)
        })


        describe("Single Token insertion recovery mechanism", () => {
            let input:any = _.flatten([
                // CREATE TABLE schema2.Persons
                new CreateTok(1, 1), new TableTok(1, 1), schemaFQN, new SemiColonTok(1, 1),
                // INSERT (32, "SHAHAR") INTO schema2.Persons
                new InsertTok(1, 1), shahar32Record, new IntoTok(1, 1), schemaFQN, /*new SemiColonTok(1, 1), <-- missing semicolon!*/
                // DELETE (31, "SHAHAR") FROM schema2.Persons
                new DeleteTok(1, 1), shahar31Record, new FromTok(1, 1), schemaFQN, new SemiColonTok(1, 1)
            ])

            it("can perform single token insertion for a missing semicolon", function () {
                let parser = new DDLExampleRecoveryParser(input)
                let ptResult:any = parser.ddl()
                // one error encountered
                expect(parser.errors.length).to.equal(1)
                // yet the whole input has been parsed
                expect(parser.isAtEndOfInput()).to.equal(true)
                // and the output parseTree contains ALL three statements
                assertAllThreeStatementsPresentAndValid(ptResult)
                let insertedSemiColon:Token = ptResult.children[1].children[4].payload
                // the semicolon is present even though it did not exist in the input, magic!
                expect(insertedSemiColon).to.be.an.instanceof(SemiColonTok)
                expect(insertedSemiColon.isInsertedInRecovery).to.equal(true)
            })

            it("can disable single token insertion for a missing semicolon", function () {
                let parser = new DDLExampleRecoveryParser(input, false)
                let ptResult:any = parser.ddl()
                expect(parser.errors.length).to.equal(1)
                expect(parser.isAtEndOfInput()).to.equal(true)
                expect(ptResult.payload).to.be.an.instanceof(INVALID_DDL)
                expect(ptResult.children).to.have.length(0)
            })
        })


        describe("Single Token deletion recovery mechanism", () => {

            let input:any = _.flatten([
                // CREATE TABLE schema2.Persons
                new CreateTok(1, 1), new TableTok(1, 1), schemaFQN, new SemiColonTok(1, 1),
                // INSERT (32, "SHAHAR") INTO INTO schema2.Persons
                new InsertTok(1, 1), shahar32Record, new IntoTok(1, 1), new IntoTok(1, 1), /* <-- "INTO INTO" oops */ schemaFQN, new SemiColonTok(1, 1),
                // DELETE (31, "SHAHAR") FROM schema2.Persons
                new DeleteTok(1, 1), shahar31Record, new FromTok(1, 1), schemaFQN, new SemiColonTok(1, 1)
            ])

            it("can perform single token deletion for a redundant keyword", function () {
                let parser = new DDLExampleRecoveryParser(input)
                let ptResult = parser.ddl()
                // one error encountered
                expect(parser.errors.length).to.equal(1)
                // yet the whole input has been parsed
                expect(parser.isAtEndOfInput()).to.equal(true)
                // and the output parseTree contains ALL three statements
                assertAllThreeStatementsPresentAndValid(ptResult)
            })

            it("can disable single token deletion for a redundant keyword", function () {
                let parser = new DDLExampleRecoveryParser(input, false)
                let ptResult:any = parser.ddl()
                expect(parser.errors.length).to.equal(1)
                expect(parser.isAtEndOfInput()).to.equal(true)
                expect(ptResult.payload).to.be.an.instanceof(INVALID_DDL)
                expect(ptResult.children).to.have.length(0)
            })
        })


        describe("resync recovery mechanism", () => {

            it("can perform re-sync recovery and only 'lose' part of the input", function () {
                let input:any = _.flatten([
                    // CREATE TABLE schema2.Persons
                    new CreateTok(1, 1), new TableTok(1, 1), schemaFQN, new SemiColonTok(1, 1),
                    // INSERT (32, "SHAHAR") FROM (( schema2.Persons <-- this can't be recovered with a single token insertion of deletion, must do re-sync
                    new InsertTok(1, 1), shahar32Record, new FromTok(1, 1), new LParenTok(1, 1), new LParenTok(1, 1), schemaFQN, new SemiColonTok(1, 1),
                    // DELETE (31, "SHAHAR") FROM schema2.Persons
                    new DeleteTok(1, 1), shahar31Record, new FromTok(1, 1), schemaFQN, new SemiColonTok(1, 1)
                ])

                let parser = new DDLExampleRecoveryParser(input)
                let ptResult:any = parser.ddl()
                // one error encountered
                expect(parser.errors.length).to.equal(1)
                // yet the whole input has been parsed
                expect(parser.isAtEndOfInput()).to.equal(true)
                expect(ptResult.payload).to.be.an.instanceof(STATEMENTS)
                // 3 statements found
                expect(ptResult.children.length).to.equal(3)
                expect(ptResult.children[0].payload).to.be.an.instanceOf(CREATE_STMT)
                expect(ptResult.children[0].payload).not.to.be.an.instanceof(INVALID_CREATE_STMT)
                // but the second one is marked as invalid
                expect(ptResult.children[1].payload).to.be.an.instanceof(INVALID_INSERT_STMT)
                // yet the third one is still valid!, we recovered and continued parsing.
                expect(ptResult.children[2].payload).to.be.an.instanceof(DELETE_STMT)
                expect(ptResult.children[2].payload).not.to.be.an.instanceof(INVALID_DELETE_STMT)
            })
            // (32, "SHAHAR" ( <-- wrong parenthesis
            let badShahar32Record = [
                new LParenTok(1, 1), new IntTok(1, 9, "32"), new CommaTok(1, 1), new StringTok(1, 1, "\"SHAHAR\""), new LParenTok(1, 1)]

            let input:any = _.flatten([
                // CREATE TABLE schema2.Persons
                new CreateTok(1, 1), new TableTok(1, 1), schemaFQN, new SemiColonTok(1, 1),
                // issues:
                // 1. FromTok instead of IntoTok so this rule also includes a bug
                // 2. using the bad/invalid record Token.
                new InsertTok(1, 1), badShahar32Record, new FromTok(1, 1), schemaFQN, new SemiColonTok(1, 1),
                // DELETE (31, "SHAHAR") FROM schema2.Persons
                new DeleteTok(1, 1), shahar31Record, new FromTok(1, 1), schemaFQN, new SemiColonTok(1, 1)
            ])

            it("can perform re-sync recovery and only 'lose' part of the input even when re-syncing to two rules 'above'", function () {
                let parser = new DDLExampleRecoveryParser(input)
                let ptResult:any = parser.ddl()
                // one error encountered
                expect(parser.errors.length).to.equal(1)
                // yet the whole input has been parsed
                expect(parser.isAtEndOfInput()).to.equal(true)
                expect(ptResult.payload).to.be.an.instanceof(STATEMENTS)
                // 3 statements found
                expect(ptResult.children.length).to.equal(3)
                expect(ptResult.children[0].payload).to.be.an.instanceof(CREATE_STMT)
                expect(ptResult.children[0].payload).not.to.be.an.instanceof(INVALID_CREATE_STMT)
                // but the second one is marked as invalid, this means we kept trying to re-sync to an "higher" rule
                expect(ptResult.children[1].payload).to.be.an.instanceof(INVALID_INSERT_STMT)
                // yet the third one is still valid!, we recovered and continued parsing.
                expect(ptResult.children[2].payload).to.be.an.instanceof(DELETE_STMT)
                expect(ptResult.children[2].payload).not.to.be.an.instanceof(INVALID_DELETE_STMT)
            })

            it("can disable re-sync recovery and only 'lose' part of the input even when re-syncing to two rules 'above'", function () {
                let parser = new DDLExampleRecoveryParser(input, false)
                let ptResult:any = parser.ddl()
                // one error encountered
                expect(parser.errors.length).to.equal(1)
                // yet the whole input has been parsed
                expect(parser.isAtEndOfInput()).to.equal(true)
                expect(ptResult.payload).to.be.an.instanceof(INVALID_DDL)
                expect(ptResult.children).to.have.length(0)
            })
        })


        function assertAllThreeStatementsPresentAndValid(ptResult:pt.ParseTree):void {
            expect(ptResult.payload).to.be.an.instanceof(STATEMENTS)
            // 3 statements found
            expect(ptResult.children.length).to.equal(3)
            expect(ptResult.children[0].payload).to.be.an.instanceof(CREATE_STMT)
            expect(ptResult.children[0].payload).not.to.be.an.instanceof(INVALID_CREATE_STMT)
            expect(ptResult.children[1].payload).to.be.an.instanceof(INSERT_STMT)
            expect(ptResult.children[1].payload).not.to.be.an.instanceof(INVALID_INSERT_STMT)
            expect(ptResult.children[2].payload).to.be.an.instanceof(DELETE_STMT)
            expect(ptResult.children[2].payload).not.to.be.an.instanceof(INVALID_DELETE_STMT)
        }


        it("will encounter an NotAllInputParsedException when some of the input vector has not been parsed", function () {
            let input:any = _.flatten([
                // CREATE TABLE schema2.Persons; TABLE <-- redundant "TABLE" token
                new CreateTok(1, 1), new TableTok(1, 1), schemaFQN, new SemiColonTok(1, 1), new TableTok(1, 1)])
            let parser = new DDLExampleRecoveryParser(input)

            parser.ddl()
            expect(parser.errors.length).to.equal(1)
            expect(parser.errors[0]).to.be.an.instanceof(exceptions.NotAllInputParsedException)
        })

        it("can use the same parser instance to parse multiple inputs", function () {
            let input1:any = _.flatten([
                // CREATE TABLE schema2.Persons;
                new CreateTok(1, 1), new TableTok(1, 1), schemaFQN, new SemiColonTok(1, 1)])
            let parser = new DDLExampleRecoveryParser(input1)
            parser.ddl()
            expect(parser.errors.length).to.equal(0)
            expect(parser.isAtEndOfInput()).to.equal(true)


            let input2:any = _.flatten([
                // DELETE (31, "SHAHAR") FROM schema2.Persons
                new DeleteTok(1, 1), shahar31Record, new FromTok(1, 1), schemaFQN, new SemiColonTok(1, 1)])
            // the parser is being reset instead of creating a new instance for each new input
            parser.reset();
            parser.input = input2
            let ptResult:any = parser.ddl()
            expect(parser.errors.length).to.equal(0)
            expect(parser.isAtEndOfInput()).to.equal(true)
            // verify returned ParseTree
            expect(ptResult.payload).to.be.an.instanceof(STATEMENTS)
            expect(ptResult.children.length).to.equal(1)
            expect(ptResult.children[0].payload).to.be.an.instanceof(DELETE_STMT)
            expect(ptResult.children[0].payload).not.to.be.an.instanceof(INVALID_DELETE_STMT)
        })

        it("can re-sync to the next iteration in a MANY rule", function () {
            let input:any = _.flatten([
                // CREATE TABLE schema2.Persons
                new CreateTok(1, 1), new TableTok(1, 1), schemaFQN, new SemiColonTok(1, 1),
                // INSERT (32, "SHAHAR") INTO schema2.Persons TABLE <-- the redundant 'TABLE' should trigger in repetition recovery
                new InsertTok(1, 1), shahar32Record, new IntoTok(1, 1), schemaFQN, new SemiColonTok(1, 1), new TableTok(1, 1),

                // DELETE (31, "SHAHAR") FROM schema2.Persons
                new DeleteTok(1, 1), shahar31Record, new FromTok(1, 1), schemaFQN, new SemiColonTok(1, 1)
            ])

            let parser = new DDLExampleRecoveryParser(input)
            let ptResult = parser.ddl()
            expect(parser.errors.length).to.equal(1)
            expect(parser.isAtEndOfInput()).to.equal(true)
            assertAllThreeStatementsPresentAndValid(ptResult)
        })

    })

}
