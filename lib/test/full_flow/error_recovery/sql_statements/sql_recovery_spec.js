"use strict";
// long lines for token init seems more readable to me than to break them up
// into multiple line.
/* tslint:disable:max-line-length  */
Object.defineProperty(exports, "__esModule", { value: true });
var sql_recovery_tokens_1 = require("./sql_recovery_tokens");
var sql_recovery_parser_1 = require("./sql_recovery_parser");
var tokens_public_1 = require("../../../../src/scan/tokens_public");
var exceptions_public_1 = require("../../../../src/parse/exceptions_public");
var utils_1 = require("../../../../src/utils/utils");
var matchers_1 = require("../../../utils/matchers");
// for side effect if augmenting the Token classes.
new sql_recovery_parser_1.DDLExampleRecoveryParser();
describe("Error Recovery SQL DDL Example", function () {
    var schemaFQN = [
        matchers_1.createRegularToken(sql_recovery_tokens_1.IdentTok, "schema2"),
        matchers_1.createRegularToken(sql_recovery_tokens_1.DotTok),
        matchers_1.createRegularToken(sql_recovery_tokens_1.IdentTok, "Persons")
    ];
    /* tslint:disable:quotemark  */
    var shahar32Record = [
        matchers_1.createRegularToken(sql_recovery_tokens_1.LParenTok),
        matchers_1.createRegularToken(sql_recovery_tokens_1.IntTok, "32"),
        matchers_1.createRegularToken(sql_recovery_tokens_1.CommaTok),
        matchers_1.createRegularToken(sql_recovery_tokens_1.StringTok, "SHAHAR"),
        matchers_1.createRegularToken(sql_recovery_tokens_1.RParenTok)
    ];
    var shahar31Record = [
        matchers_1.createRegularToken(sql_recovery_tokens_1.LParenTok),
        matchers_1.createRegularToken(sql_recovery_tokens_1.IntTok, "31"),
        matchers_1.createRegularToken(sql_recovery_tokens_1.CommaTok),
        matchers_1.createRegularToken(sql_recovery_tokens_1.StringTok, '"SHAHAR"'),
        matchers_1.createRegularToken(sql_recovery_tokens_1.RParenTok)
    ];
    /* tslint:enable:quotemark  */
    it("can parse a series of three statements successfully", function () {
        var input = utils_1.flatten([
            // CREATE TABLE schema2.Persons
            matchers_1.createRegularToken(sql_recovery_tokens_1.CreateTok),
            matchers_1.createRegularToken(sql_recovery_tokens_1.TableTok),
            schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok),
            // INSERT (32, "SHAHAR") INTO schema2.Persons
            matchers_1.createRegularToken(sql_recovery_tokens_1.InsertTok),
            shahar32Record,
            matchers_1.createRegularToken(sql_recovery_tokens_1.IntoTok),
            schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok),
            // DELETE (31, "SHAHAR") FROM schema2.Persons
            matchers_1.createRegularToken(sql_recovery_tokens_1.DeleteTok),
            shahar31Record,
            matchers_1.createRegularToken(sql_recovery_tokens_1.FromTok),
            schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok)
        ]);
        var parser = new sql_recovery_parser_1.DDLExampleRecoveryParser();
        parser.input = input;
        var ptResult = parser.ddl();
        expect(parser.errors.length).to.equal(0);
        assertAllThreeStatementsPresentAndValid(ptResult);
    });
    describe("Single Token insertion recovery mechanism", function () {
        var input = utils_1.flatten([
            // CREATE TABLE schema2.Persons
            matchers_1.createRegularToken(sql_recovery_tokens_1.CreateTok),
            matchers_1.createRegularToken(sql_recovery_tokens_1.TableTok),
            schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok),
            // INSERT (32, "SHAHAR") INTO schema2.Persons
            matchers_1.createRegularToken(sql_recovery_tokens_1.InsertTok),
            shahar32Record,
            matchers_1.createRegularToken(sql_recovery_tokens_1.IntoTok),
            schemaFQN /*createRegularToken(SemiColonTok), <-- missing semicolon!*/,
            // DELETE (31, "SHAHAR") FROM schema2.Persons
            matchers_1.createRegularToken(sql_recovery_tokens_1.DeleteTok),
            shahar31Record,
            matchers_1.createRegularToken(sql_recovery_tokens_1.FromTok),
            schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok)
        ]);
        it("can perform single token insertion for a missing semicolon", function () {
            var parser = new sql_recovery_parser_1.DDLExampleRecoveryParser();
            parser.input = input;
            var ptResult = parser.ddl();
            // one error encountered
            expect(parser.errors.length).to.equal(1);
            // yet the whole input has been parsed
            // and the output parseTree contains ALL three statements
            assertAllThreeStatementsPresentAndValid(ptResult);
            var insertedSemiColon = ptResult.children[1].children[4].payload;
            // the semicolon is present even though it did not exist in the input, magic!
            expect(tokens_public_1.tokenMatcher(insertedSemiColon, sql_recovery_tokens_1.SemiColonTok)).to.be.true;
            expect(insertedSemiColon.isInsertedInRecovery).to.equal(true);
        });
        it("can disable single token insertion for a missing semicolon", function () {
            var parser = new sql_recovery_parser_1.DDLExampleRecoveryParser(false);
            parser.input = input;
            var ptResult = parser.ddl();
            expect(parser.errors.length).to.equal(1);
            expect(ptResult.payload.tokenType).to.equal(sql_recovery_tokens_1.INVALID_DDL);
            expect(ptResult.children).to.have.length(0);
        });
    });
    describe("Single Token deletion recovery mechanism", function () {
        var input = utils_1.flatten([
            // CREATE TABLE schema2.Persons
            matchers_1.createRegularToken(sql_recovery_tokens_1.CreateTok),
            matchers_1.createRegularToken(sql_recovery_tokens_1.TableTok),
            schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok),
            // INSERT (32, "SHAHAR") INTO INTO schema2.Persons
            matchers_1.createRegularToken(sql_recovery_tokens_1.InsertTok),
            shahar32Record,
            matchers_1.createRegularToken(sql_recovery_tokens_1.IntoTok),
            matchers_1.createRegularToken(sql_recovery_tokens_1.IntoTok),
            /* <-- "INTO INTO" oops */ schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok),
            // DELETE (31, "SHAHAR") FROM schema2.Persons
            matchers_1.createRegularToken(sql_recovery_tokens_1.DeleteTok),
            shahar31Record,
            matchers_1.createRegularToken(sql_recovery_tokens_1.FromTok),
            schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok)
        ]);
        it("can perform single token deletion for a redundant keyword", function () {
            var parser = new sql_recovery_parser_1.DDLExampleRecoveryParser();
            parser.input = input;
            var ptResult = parser.ddl();
            // one error encountered
            expect(parser.errors.length).to.equal(1);
            // yet the whole input has been parsed
            // and the output parseTree contains ALL three statements
            assertAllThreeStatementsPresentAndValid(ptResult);
        });
        it("can disable single token deletion for a redundant keyword", function () {
            var parser = new sql_recovery_parser_1.DDLExampleRecoveryParser(false);
            parser.input = input;
            var ptResult = parser.ddl();
            expect(parser.errors.length).to.equal(1);
            expect(ptResult.payload.tokenType).to.equal(sql_recovery_tokens_1.INVALID_DDL);
            expect(ptResult.children).to.have.length(0);
        });
    });
    describe("resync recovery mechanism", function () {
        it("can perform re-sync recovery and only 'lose' part of the input", function () {
            var input = utils_1.flatten([
                // CREATE TABLE schema2.Persons
                matchers_1.createRegularToken(sql_recovery_tokens_1.CreateTok),
                matchers_1.createRegularToken(sql_recovery_tokens_1.TableTok),
                schemaFQN,
                matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok),
                // INSERT (32, "SHAHAR") FROM (( schema2.Persons <-- this can't be recovered with a single token insertion of deletion, must do re-sync
                matchers_1.createRegularToken(sql_recovery_tokens_1.InsertTok),
                shahar32Record,
                matchers_1.createRegularToken(sql_recovery_tokens_1.FromTok),
                matchers_1.createRegularToken(sql_recovery_tokens_1.LParenTok),
                matchers_1.createRegularToken(sql_recovery_tokens_1.LParenTok),
                schemaFQN,
                matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok),
                // DELETE (31, "SHAHAR") FROM schema2.Persons
                matchers_1.createRegularToken(sql_recovery_tokens_1.DeleteTok),
                shahar31Record,
                matchers_1.createRegularToken(sql_recovery_tokens_1.FromTok),
                schemaFQN,
                matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok)
            ]);
            var parser = new sql_recovery_parser_1.DDLExampleRecoveryParser();
            parser.input = input;
            var ptResult = parser.ddl();
            // one error encountered
            expect(parser.errors.length).to.equal(1);
            // yet the whole input has been parsed
            expect(ptResult.payload.tokenType).to.equal(sql_recovery_tokens_1.STATEMENTS);
            // 3 statements found
            expect(ptResult.children.length).to.equal(3);
            expect(ptResult.children[0].payload.tokenType).to.equal(sql_recovery_tokens_1.CREATE_STMT);
            expect(ptResult.children[0].payload.tokenType).to.not.equal(sql_recovery_tokens_1.INVALID_CREATE_STMT);
            // but the second one is marked as invalid
            expect(ptResult.children[1].payload.tokenType).to.equal(sql_recovery_tokens_1.INVALID_INSERT_STMT);
            // yet the third one is still valid!, we recovered and continued parsing.
            expect(ptResult.children[2].payload.tokenType).to.equal(sql_recovery_tokens_1.DELETE_STMT);
            expect(ptResult.children[2].payload.tokenType).to.not.equal(sql_recovery_tokens_1.INVALID_DELETE_STMT);
        });
        // (32, "SHAHAR" ( <-- wrong parenthesis
        var badShahar32Record = [
            matchers_1.createRegularToken(sql_recovery_tokens_1.LParenTok),
            matchers_1.createRegularToken(sql_recovery_tokens_1.IntTok, "32"),
            matchers_1.createRegularToken(sql_recovery_tokens_1.CommaTok),
            matchers_1.createRegularToken(sql_recovery_tokens_1.StringTok, '"SHAHAR"'),
            matchers_1.createRegularToken(sql_recovery_tokens_1.LParenTok)
        ];
        var input = utils_1.flatten([
            // CREATE TABLE schema2.Persons
            matchers_1.createRegularToken(sql_recovery_tokens_1.CreateTok),
            matchers_1.createRegularToken(sql_recovery_tokens_1.TableTok),
            schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok),
            // issues:
            // 1. FromTok instead of IntoTok so this rule also includes a bug
            // 2. using the bad/invalid record Token.
            matchers_1.createRegularToken(sql_recovery_tokens_1.InsertTok),
            badShahar32Record,
            matchers_1.createRegularToken(sql_recovery_tokens_1.FromTok),
            schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok),
            // DELETE (31, "SHAHAR") FROM schema2.Persons
            matchers_1.createRegularToken(sql_recovery_tokens_1.DeleteTok),
            shahar31Record,
            matchers_1.createRegularToken(sql_recovery_tokens_1.FromTok),
            schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok)
        ]);
        it("can perform re-sync recovery and only 'lose' part of the input even when re-syncing to two rules 'above'", function () {
            var parser = new sql_recovery_parser_1.DDLExampleRecoveryParser();
            parser.input = input;
            var ptResult = parser.ddl();
            // one error encountered
            expect(parser.errors.length).to.equal(1);
            // yet the whole input has been parsed
            expect(ptResult.payload.tokenType).to.equal(sql_recovery_tokens_1.STATEMENTS);
            // 3 statements found
            expect(ptResult.children.length).to.equal(3);
            expect(ptResult.children[0].payload.tokenType).to.equal(sql_recovery_tokens_1.CREATE_STMT);
            expect(ptResult.children[0].payload.tokenType).to.not.equal(sql_recovery_tokens_1.INVALID_CREATE_STMT);
            // but the second one is marked as invalid, this means we kept trying to re-sync to an "higher" rule
            expect(ptResult.children[1].payload.tokenType).to.equal(sql_recovery_tokens_1.INVALID_INSERT_STMT);
            // yet the third one is still valid!, we recovered and continued parsing.
            expect(ptResult.children[2].payload.tokenType).to.equal(sql_recovery_tokens_1.DELETE_STMT);
            expect(ptResult.children[2].payload.tokenType).to.not.equal(sql_recovery_tokens_1.INVALID_DELETE_STMT);
        });
        it("can disable re-sync recovery and only 'lose' part of the input even when re-syncing to two rules 'above'", function () {
            var parser = new sql_recovery_parser_1.DDLExampleRecoveryParser(false);
            parser.input = input;
            var ptResult = parser.ddl();
            // one error encountered
            expect(parser.errors.length).to.equal(1);
            // yet the whole input has been parsed
            expect(ptResult.payload.tokenType).to.equal(sql_recovery_tokens_1.INVALID_DDL);
            expect(ptResult.children).to.have.length(0);
        });
    });
    function assertAllThreeStatementsPresentAndValid(ptResult) {
        expect(ptResult.payload.tokenType).to.equal(sql_recovery_tokens_1.STATEMENTS);
        // 3 statements found
        expect(ptResult.children.length).to.equal(3);
        expect(ptResult.children[0].payload.tokenType).to.equal(sql_recovery_tokens_1.CREATE_STMT);
        expect(ptResult.children[0].payload.tokenType).to.not.equal(sql_recovery_tokens_1.INVALID_CREATE_STMT);
        expect(ptResult.children[1].payload.tokenType).to.equal(sql_recovery_tokens_1.INSERT_STMT);
        expect(ptResult.children[1].payload.tokenType).to.not.equal(sql_recovery_tokens_1.INVALID_INSERT_STMT);
        expect(ptResult.children[2].payload.tokenType).to.equal(sql_recovery_tokens_1.DELETE_STMT);
        expect(ptResult.children[2].payload.tokenType).to.not.equal(sql_recovery_tokens_1.INVALID_DELETE_STMT);
    }
    it("will encounter an NotAllInputParsedException when some of the input vector has not been parsed", function () {
        var input = utils_1.flatten([
            // CREATE TABLE schema2.Persons; TABLE <-- redundant "TABLE" token
            matchers_1.createRegularToken(sql_recovery_tokens_1.CreateTok),
            matchers_1.createRegularToken(sql_recovery_tokens_1.TableTok),
            schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok),
            matchers_1.createRegularToken(sql_recovery_tokens_1.TableTok)
        ]);
        var parser = new sql_recovery_parser_1.DDLExampleRecoveryParser();
        parser.input = input;
        parser.ddl();
        expect(parser.errors.length).to.equal(1);
        expect(parser.errors[0]).to.be.an.instanceof(exceptions_public_1.NotAllInputParsedException);
    });
    it("can use the same parser instance to parse multiple inputs", function () {
        var input1 = utils_1.flatten([
            // CREATE TABLE schema2.Persons;
            matchers_1.createRegularToken(sql_recovery_tokens_1.CreateTok),
            matchers_1.createRegularToken(sql_recovery_tokens_1.TableTok),
            schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok)
        ]);
        var parser = new sql_recovery_parser_1.DDLExampleRecoveryParser(input1);
        parser.ddl();
        expect(parser.errors.length).to.equal(0);
        var input2 = utils_1.flatten([
            // DELETE (31, "SHAHAR") FROM schema2.Persons
            matchers_1.createRegularToken(sql_recovery_tokens_1.DeleteTok),
            shahar31Record,
            matchers_1.createRegularToken(sql_recovery_tokens_1.FromTok),
            schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok)
        ]);
        // the parser is being reset instead of creating a new instance for each new input
        parser.reset();
        parser.input = input2;
        var ptResult = parser.ddl();
        expect(parser.errors.length).to.equal(0);
        // verify returned ParseTree
        expect(ptResult.payload.tokenType).to.equal(sql_recovery_tokens_1.STATEMENTS);
        expect(ptResult.children.length).to.equal(1);
        expect(ptResult.children[0].payload.tokenType).to.equal(sql_recovery_tokens_1.DELETE_STMT);
        expect(ptResult.children[0].payload.tokenType).to.not.equal(sql_recovery_tokens_1.INVALID_DELETE_STMT);
    });
    it("can re-sync to the next iteration in a MANY rule", function () {
        var input = utils_1.flatten([
            // CREATE TABLE schema2.Persons
            matchers_1.createRegularToken(sql_recovery_tokens_1.CreateTok),
            matchers_1.createRegularToken(sql_recovery_tokens_1.TableTok),
            schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok),
            // INSERT (32, "SHAHAR") INTO schema2.Persons TABLE <-- the redundant 'TABLE' should trigger in repetition recovery
            matchers_1.createRegularToken(sql_recovery_tokens_1.InsertTok),
            shahar32Record,
            matchers_1.createRegularToken(sql_recovery_tokens_1.IntoTok),
            schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok),
            matchers_1.createRegularToken(sql_recovery_tokens_1.TableTok),
            // DELETE (31, "SHAHAR") FROM schema2.Persons
            matchers_1.createRegularToken(sql_recovery_tokens_1.DeleteTok),
            shahar31Record,
            matchers_1.createRegularToken(sql_recovery_tokens_1.FromTok),
            schemaFQN,
            matchers_1.createRegularToken(sql_recovery_tokens_1.SemiColonTok)
        ]);
        var parser = new sql_recovery_parser_1.DDLExampleRecoveryParser();
        parser.input = input;
        var ptResult = parser.ddl();
        expect(parser.errors.length).to.equal(1);
        assertAllThreeStatementsPresentAndValid(ptResult);
    });
});
//# sourceMappingURL=sql_recovery_spec.js.map