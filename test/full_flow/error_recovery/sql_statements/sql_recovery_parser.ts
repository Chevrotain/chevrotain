
module chevrotain.examples.recovery.sql {

    /**
     * a language made of a series of statements terminated by semicolons
     *
     * CREATE TABLE schema2.Persons
     * INSERT (32, "SHAHAR") INTO schema2.Persons
     * DELETE (31, "SHAHAR") FROM schema2.Persons
     */
    import pt = chevrotain.tree
    import gast = chevrotain.gast
    import gastBuilder = chevrotain.gastBuilder
    import follows = chevrotain.follow


    // DOCS: to enable error recovery functionality one must extend BaseErrorRecoveryRecognizer
    export class DDLExampleRecoveryParser extends Parser {

        constructor(input:Token[] = []) {
            // DOCS: note the second parameter in the super class. this is the namespace in which the token constructors are defined.
            //       it is mandatory to provide this map to be able to perform self analysis
            //       and allow the framework to "understand" the implemented grammar.
            super(input, <any>chevrotain.examples.recovery.sql)
            // DOCS: The call to performSelfAnalysis needs to happen after all the RULEs have been defined
            //       The typescript compiler places the constructor body last after initializations in the class's body
            //       which is why place the call here meets the criteria.
            Parser.performSelfAnalysis(this)
        }

        // DOCS: the invocation to RULE(...) is what wraps our parsing implementation method
        // with the error recovery re-sync behavior.
        // note that when one parsing rule calls another (via SUBRULE) the invoked rule is the one defined here,
        // without the "parse" prefix.
        public ddl = this.RULE("ddl", this.parseDdl, INVALID(INVALID_DDL))
        // DOCS: a specific return type has been provided in case of re-sync recovery.
        public createStmt = this.RULE("createStmt", this.parseCreateStmt, INVALID(INVALID_CREATE_STMT))
        public insertStmt = this.RULE("insertStmt", this.parseInsertStmt, INVALID(INVALID_INSERT_STMT))
        public deleteStmt = this.RULE("deleteStmt", this.parseDeleteStmt, INVALID(INVALID_DELETE_STMT))
        public qualifiedName = this.RULE("qualifiedName", this.parseQualifiedName, INVALID(INVALID_QUALIFIED_NAME))
        public recordValue = this.RULE("recordValue", this.parseRecordValue, INVALID())
        // DOCS: A Parsing rule may also be private and not part of the public API
        private value = this.RULE("value", this.parseValue, INVALID())

        // DOCS: note how all the parsing rules in this example return a ParseTree, we require some output from the parser
        // to demonstrate the error recovery mechanisms. otherwise it is harder to prove we have indeed recovered.
        private parseDdl():pt.ParseTree {
            var stmts = []

            this.MANY(() => {
                this.OR([
                    // @formatter:off
                    {ALT: () => { stmts.push(this.SUBRULE(this.createStmt)) }},
                    {ALT: () => { stmts.push(this.SUBRULE(this.insertStmt)) }},
                    {ALT: () => { stmts.push(this.SUBRULE(this.deleteStmt)) }},
                    // @formatter:on
                ], "A Statement")
            })

            return PT(new STATEMENTS(), stmts)
        }

        private parseCreateStmt():pt.ParseTree {
            var createKW, tableKW, qn, semiColon

            createKW = this.CONSUME1(CreateTok)
            tableKW = this.CONSUME1(TableTok)
            qn = this.SUBRULE(this.qualifiedName)
            semiColon = this.CONSUME1(SemiColonTok)

            return PT(new CREATE_STMT(),
                [PT(createKW), PT(tableKW), qn, PT(semiColon)])
        }

        private parseInsertStmt():pt.ParseTree {
            var insertKW, recordValue, intoKW, qn, semiColon

            // parse
            insertKW = this.CONSUME1(InsertTok)
            recordValue = this.SUBRULE(this.recordValue)
            intoKW = this.CONSUME1(IntoTok)
            qn = this.SUBRULE(this.qualifiedName)
            semiColon = this.CONSUME1(SemiColonTok)

            // tree rewrite
            return PT(new INSERT_STMT(),
                [PT(insertKW), recordValue, PT(intoKW), qn, PT(semiColon)])
        }

        private parseDeleteStmt():pt.ParseTree {
            var deleteKW, recordValue, fromKW, qn, semiColon

            // parse
            deleteKW = this.CONSUME1(DeleteTok)
            recordValue = this.SUBRULE(this.recordValue)
            fromKW = this.CONSUME1(FromTok)
            qn = this.SUBRULE(this.qualifiedName)
            semiColon = this.CONSUME1(SemiColonTok)

            // tree rewrite
            return PT(new DELETE_STMT(),
                [PT(deleteKW), recordValue, PT(fromKW), qn, PT(semiColon)])
        }

        private parseQualifiedName():pt.ParseTree {
            var dots = []
            var idents = []

            // parse
            // DOCS: note how we use CONSUME1(IdentTok) here
            idents.push(this.CONSUME1(IdentTok))
            this.MANY(() => {
                dots.push(this.CONSUME1(DotTok))
                // DOCS: yet here we use CONSUME2(IdentTok)
                //       The number indicates the occurrence number of the consumption of the specific Token in the current
                //       parse rule.
                idents.push(this.CONSUME2(IdentTok))
            })

            // tree rewrite
            var allIdentsPts = WRAP_IN_PT(idents)
            var dotsPt = PT(new DOTS(), WRAP_IN_PT(dots))
            var allPtChildren = allIdentsPts.concat([dotsPt])
            return PT(new QUALIFIED_NAME(), <any>allPtChildren)
        }

        private parseRecordValue():pt.ParseTree {
            var values = []
            var commas = []

            // parse
            this.CONSUME1(LParenTok)
            this.SUBRULE1(this.value)
            this.MANY(() => {
                commas.push(this.CONSUME1(CommaTok))
                values.push(this.SUBRULE2(this.value))
            })
            this.CONSUME1(RParenTok)
            // tree rewrite
            var commasPt = PT(new COMMAS(), WRAP_IN_PT(commas))
            var allPtChildren = values.concat([commasPt])
            return PT(new QUALIFIED_NAME(), allPtChildren)
        }

        private parseValue():pt.ParseTree {
            var value:Token = null
            this.OR(
                [   // @formatter:off
                    {ALT: () => {value = this.CONSUME1(StringTok)}},
                    {ALT: () => {value = this.CONSUME1(IntTok)}}
                ], "a String or an Integer")
                    // @formatter:on
            return PT(value)
        }
    }

    // TODO: maybe extract to parse.tree module?
    // HELPER FUNCTIONS
    function PT(token:Token, children:pt.ParseTree[] = []):pt.ParseTree {
        return new pt.ParseTree(token, children)
    }

    export function WRAP_IN_PT(toks:Token[]):pt.ParseTree[] {
        var parseTrees = new Array(toks.length)
        for (var i = 0; i < toks.length; i++) {
            parseTrees[i] = (PT(toks[i]))
        }
        return parseTrees
    }


    /* tslint:disable:class-name */
    export class INVALID_INPUT extends VirtualToken {}
    /* tslint:enable:class-name */
    export function INVALID(tokType:Function = INVALID_INPUT):() => pt.ParseTree {
        // virtual invalid tokens should have no parameters...
        return () => {return PT(new (<any>tokType)()) }
    }

}
