/// <reference path="SqlRecoveryTokens.ts" />
/// <reference path="../../src/parse/Recognizer.ts" />
/// <reference path="../../src/scan/Tokens.ts" />
/// <reference path="../../src/parse/ParseTree.ts" />
/// <reference path="../../src/parse/grammar/GAst.ts" />
/// <reference path="../../src/parse/grammar/Follow.ts" />

module chevrotain.examples.recovery.sql {

    /**
     * a language made of a series of statements terminated by semicolons
     *
     * CREATE TABLE schema2.Persons;
     * INSERT (32, "SHAHAR") INTO schema2.Persons;
     * DELETE (31, "SHAHAR") FROM schema2.Persons;
     */
    import recog = chevrotain.parse.infra.recognizer;
    import tok = chevrotain.scan.tokens;
    import pt = chevrotain.parse.tree;
    import gast = chevrotain.parse.grammar.gast;
    import gastBuilder = chevrotain.parse.gast.builder;
    import follows = chevrotain.parse.grammar.follow;



    // DOCS: to enable error recovery functionality one must extend BaseErrorRecoveryRecognizer
    export class DDLExampleRecoveryParser extends recog.BaseErrorRecoveryRecognizer {

        // TODO: perhaps all these dealing with the GAST/FOLLOWS information can be hidden from the implementers.
        // instead the BaseErrorRecoveryRecognizer can save the information using the constructor name as the key (transparently)
        // flags to only compute this extra information once
        static self_analysis_done = false;

        private static RESYNC_FOLLOW_SETS = new Hashtable<string, Function[]>();

        constructor(input:tok.Token[] = []) {
            // DOCS: note the second parameter in the super class. this is the namespace in which the token constructors are defined
            //       it is mandatory to provide this map to be able to perform self analysis and allow the framework to "understand" the implemented
            //       grammar.
            super(input, <any>chevrotain.examples.recovery.sql);
            // DOCS: The call to performSelfAnalysis needs to happen after all the RULEs have been defined
            //       The typescript compiler places the constructor body last after initializations in the class's body
            //       which is why place the call here meets the criteria.
            recog.BaseErrorRecoveryRecognizer.performSelfAnalysis(this);
        }

        // DOCS: the invocation to RULE(...) is what wraps our parsing implementation method with the error recovery re-sync behavior.
        //       note that when one parsing rule calls another (via SUBRULE) the invoked rule is the one defined here, without the "parse" prefix.
        public ddl = this.RULE("ddl", this.parseDdl, INVALID(INVALID_DDL));
        // TODO: is RULE_NO_RESYNC applicable here?
        public statement = this.RULE("statement", this.parseStatement, INVALID(INVALID_STATEMENT));
        public createStmt = this.RULE("createStmt", this.parseCreateStmt, INVALID(INVALID_CREATE_STMT)); // DOCS: a specific return type has been provided in case of re-sync recovery.
        public insertStmt = this.RULE("insertStmt", this.parseInsertStmt, INVALID(INVALID_INSERT_STMT));
        public deleteStmt = this.RULE("deleteStmt", this.parseDeleteStmt, INVALID(INVALID_DELETE_STMT));
        public qualifiedName = this.RULE("qualifiedName", this.parseQualifiedName, INVALID(INVALID_QUALIFIED_NAME));
        public recordValue = this.RULE("recordValue", this.parseRecordValue, INVALID());
        // DOCS: A Parsing rule may also be private and not part of the public API
        private value = this.RULE("value", this.parseValue, INVALID());

        // DOCS: note how all the parsing rules in this example return a ParseTree, we require some output from the parser
        // to demonstrate the error recovery mechanisms. otherwise it is harder to prove we have indeed recovered.
        private parseDdl():pt.ParseTree {
            var stmts = [];

            this.MANY(isStatement, ()=> {
                // DOCS: note the usage of the SUBRULE wrapper, it does not actually do anything but it is needed
                // as a textual marker to help perform self parsing of the rule and build the runtime grammar information.
                stmts.push(this.SUBRULE(this.statement(1)));
            });

            return PT(new STATEMENTS(), stmts)
        }

        private parseStatement():pt.ParseTree {
            var stmt:pt.ParseTree = null;

            this.OR(
                [
                    // @formatter:off
                    {WHEN: isCreate, THEN_DO: ()=> {
                        // DOCS: note how the invocation of another parseRule also adds the occurrence index
                        //       if we had another invocation of this.createStmt inside this rule, we would have had to use
                        //       "this.createStmt(2)" and the next one this.createStmt(3) ...
                        stmt = this.SUBRULE(this.createStmt(1))}},
                    {WHEN: isInsert, THEN_DO: ()=> {
                        stmt = this.SUBRULE(this.insertStmt(1))}},
                    {WHEN: isDelete, THEN_DO: ()=> {
                        stmt = this.SUBRULE(this.deleteStmt(1))}}
                // @formatter:on
                ], 'add error message');

            return stmt;
        }

        private parseCreateStmt():pt.ParseTree {
            var createKW, tableKW, qn, semiColon;

            createKW = this.CONSUME1(CreateTok);
            tableKW = this.CONSUME1(TableTok);
            qn = this.SUBRULE(this.qualifiedName(1));
            semiColon = this.CONSUME1(SemiColonTok);

            return PT(new CREATE_STMT(),
                [PT(createKW), PT(tableKW), qn, PT(semiColon)])
        }

        private parseInsertStmt():pt.ParseTree {
            var insertKW, recordValue, intoKW, qn, semiColon;

            // parse
            insertKW = this.CONSUME1(InsertTok);
            recordValue = this.SUBRULE(this.recordValue(1));
            intoKW = this.CONSUME1(IntoTok);
            qn = this.SUBRULE(this.qualifiedName(1));
            semiColon = this.CONSUME1(SemiColonTok);

            // tree rewrite
            return PT(new INSERT_STMT(),
                [PT(insertKW), recordValue, PT(intoKW), qn, PT(semiColon)])
        }

        private parseDeleteStmt():pt.ParseTree {
            var deleteKW, recordValue, fromKW, qn, semiColon;

            // parse
            deleteKW = this.CONSUME1(DeleteTok);
            recordValue = this.SUBRULE(this.recordValue(1));
            fromKW = this.CONSUME1(FromTok);
            qn = this.SUBRULE(this.qualifiedName(1));
            semiColon = this.CONSUME1(SemiColonTok);

            // tree rewrite
            return PT(new DELETE_STMT(),
                [PT(deleteKW), recordValue, PT(fromKW), qn, PT(semiColon)])
        }

        private parseQualifiedName():pt.ParseTree {
            var dots = [];
            var idents = [];

            // parse
            // DOCS: note how we use CONSUME1(IdentTok) here
            idents.push(this.CONSUME1(IdentTok));
            this.MANY(isQualifiedNamePart, ()=> {
                dots.push(this.CONSUME1(DotTok));
                // DOCS: yet here we use CONSUME2(IdentTok)
                //       The number indicates the occurrence number of the consumption of the specific Token in the current
                //       parse rule.
                idents.push(this.CONSUME2(IdentTok));
            });

            // tree rewrite
            var allIdentsPts = WRAP_IN_PT(idents);
            var dotsPt = PT(new DOTS(), WRAP_IN_PT(dots));
            var allPtChildren = allIdentsPts.concat([dotsPt]);
            return PT(new QUALIFIED_NAME(), allPtChildren);
        }

        private parseRecordValue():pt.ParseTree {
            var values = [];
            var commas = [];

            // parse
            this.CONSUME1(LParenTok);
            this.SUBRULE(this.value(1));
            this.MANY(isAdditionalValue, ()=> {
                commas.push(this.CONSUME1(CommaTok));
                values.push(this.SUBRULE(this.value(1)));
            });
            this.CONSUME1(RParenTok);

            // tree rewrite
            var commasPt = PT(new COMMAS(), WRAP_IN_PT(commas));
            var allPtChildren = values.concat([commasPt]);
            return PT(new QUALIFIED_NAME(), allPtChildren);
        }

        private parseValue():pt.ParseTree {
            var value:tok.Token = null;
            this.OR(
                [   // @formatter:off
                    {WHEN: isString, THEN_DO: ()=> {
                        value = this.CONSUME1(StringTok)}},
                    {WHEN: isInteger, THEN_DO: ()=> {
                        value = this.CONSUME1(IntTok)}}
                ], 'add error message');
                    // @formatter:on
            return PT(value);
        }
    }

    // LOOK-AHEAD functions
    function isStatement():boolean {
        // DOCS: the look-ahead functions are invoked with the parser instance as the "this" context
        // when calling them ourselves and not via the DSL, we must pass on the correct context, hence the usage
        // of ".call(this)"
        return isCreate.call(this) || isInsert.call(this) || isDelete.call(this);
    }

    function isCreate():boolean {
        return this.NEXT_TOKEN() instanceof CreateTok;
    }

    function isInsert():boolean {
        return this.NEXT_TOKEN() instanceof InsertTok;
    }

    function isDelete():boolean {
        return this.NEXT_TOKEN() instanceof DeleteTok;
    }

    function isQualifiedNamePart():boolean {
        return this.NEXT_TOKEN() instanceof  DotTok;
    }

    function isAdditionalValue():boolean {
        return this.NEXT_TOKEN() instanceof CommaTok;
    }

    function isInteger():boolean {
        return this.NEXT_TOKEN() instanceof IntTok;
    }

    function isString():boolean {
        return this.NEXT_TOKEN() instanceof StringTok;
    }


    // TODO: maybe extract to parse.tree module?
    // HELPER FUNCTIONS
    function PT(token:tok.Token, children:pt.ParseTree[] = []):pt.ParseTree {
        return new pt.ParseTree(token, children);
    }

    export function WRAP_IN_PT(toks:tok.Token[]):pt.ParseTree[] {
        var parseTrees = new Array(toks.length);
        for (var i = 0; i < toks.length; i++) {
            parseTrees[i] = (PT(toks[i]));
        }
        return parseTrees;
    }

    export class INVALID_INPUT extends tok.VirtualToken {}
    export function INVALID(tokType:Function = INVALID_INPUT):()=> pt.ParseTree {
        // virtual invalid tokens should have no parameters...
        return () => {return PT(new (<any>tokType)());};
    }

}
