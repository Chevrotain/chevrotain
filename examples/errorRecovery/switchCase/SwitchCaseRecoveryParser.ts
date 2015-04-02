/// <reference path="SwitchCaseRecoveryTokens.ts" />
/// <reference path="../../../src/parse/Recognizer.ts" />
/// <reference path="../../../src/scan/Tokens.ts" />
/// <reference path="../../../src/parse/ParseTree.ts" />
/// <reference path="../../../src/parse/grammar/GAst.ts" />
/// <reference path="../../../src/parse/grammar/Follow.ts" />

module chevrotain.examples.recovery.switchcase {

    /**
     * a simple language made up of only
     * switch/case/return identifiers strings and integers
     *
     * example:
     * switch (name) {
     *    case "Terry" : return 2;
     *    case "Robert" : return 4;
     *    case "Brandon" : return 6;
     * }
     *
     * In this case the parser result is a "JSON" object representing the switch case:
     * for the above example the result would be:
     *
     * {
     *    "Terry"    : 2,
     *    "Robert"   : 4,
     *    "Brandon"   : 6
     * }
     *
     * forEach invalid case statement an invalidN property will be added
     * with an undefined value. for example :
     *
     * {
     *    "Terry"    : 2,
     *    "invalid1  : undefined
     *    "Brandon"   : 6
     * }
     */

    export interface RetType { [caseValue: string] : number }

    import recog = chevrotain.parse.infra.recognizer
    import tok = chevrotain.scan.tokens
    import pt = chevrotain.parse.tree
    import gast = chevrotain.parse.grammar.gast
    import gastBuilder = chevrotain.parse.gast.builder
    import follows = chevrotain.parse.grammar.follow

    // DOCS: to enable error recovery functionality one must extend BaseErrorRecoveryRecognizer
    export class SwitchCaseRecoveryParser extends recog.BaseErrorRecoveryRecognizer {

        constructor(input:tok.Token[] = []) {
            // DOCS: note the second parameter in the super class. this is the namespace in which the token constructors are defined.
            //       it is mandatory to provide this map to be able to perform self analysis
            //       and allow the framework to "understand" the implemented grammar.
            super(input, <any>chevrotain.examples.recovery.switchcase)
            // DOCS: The call to performSelfAnalysis needs to happen after all the RULEs have been defined
            //       The typescript compiler places the constructor body last after initializations in the class's body
            //       which is why place the call here meets the criteria.
            recog.BaseErrorRecoveryRecognizer.performSelfAnalysis(this)
        }

        public switchStmt = this.RULE("switchStmt", this.parseSwitchStmt, () => { return {} })
        public caseStmt = this.RULE("caseStmt", this.parseCaseStmt, this.INVALID())


        // DOCS: in this example we avoid automatic missing token insertion for tokens that have additional semantic meaning.
        //       to understand this first consider the positive case, which tokens can we safely insert?
        //       a missing colon / semicolon ? yes a missing parenthesis ? yes
        //       but what about a missing StringToken? if we insert one, what will be its string value?
        //       an empty string? in the grammar this could lead to an empty key in the created object...
        //       what about a string with some random value? this could still lead to duplicate keys in the returned parse result
        private tokTypesThatCannotBeInsertedInRecovery = [IdentTok, StringTok, IntTok]


        // DOCS: overriding this method allows us to customize the logic for which tokens may not be automaticaly inserted
        // during error recovery.
        public canTokenTypeBeInsertedInRecovery(tokType:Function) {
            return !_.contains(this.tokTypesThatCannotBeInsertedInRecovery, tokType)
        }

        public parseSwitchStmt():RetType {
            // house keeping so the invalid property names will not be dependent on
            // previous grammar rule invocations.
            this.invalidIdx = 1;

            var retObj:RetType = {}

            this.CONSUME1(SwitchTok)
            this.CONSUME1(LParenTok)
            this.CONSUME1(IdentTok)
            this.CONSUME1(RParenTok)
            this.CONSUME1(LCurlyTok)

            this.AT_LEAST_ONE(isCaseStmt, () => {
                    _.assign(retObj, this.SUBRULE(this.caseStmt(1)))
                }
                // DOCS: currently the following token and its index must be specified to enable error recovery
                //       inside repetition rules (MANY/AT_LEAST_ONCE), if this information is not provided
                //       a re-sync recovery trigger inside the rules called by the repetition may cause the whole
                //       rule containing the repetition to fail.
                //       ** this may be automatically inferred in a future version.
                , "case Stmt", RCurlyTok, 1)

            this.CONSUME1(RCurlyTok)

            return retObj
        }

        private parseCaseStmt():RetType {
            var keyTok, valueTok, key, value

            this.CONSUME1(CaseTok)
            keyTok = this.CONSUME1(StringTok)
            this.CONSUME1(ColonTok)
            this.CONSUME1(ReturnTok)
            valueTok = this.CONSUME1(IntTok)
            this.OPTION(isSemiColon, () => {
                this.CONSUME1(SemiColonTok)
            })

            key = keyTok.image
            value = parseInt(valueTok.image, 10)
            var caseKeyValue:RetType = {}
            caseKeyValue[key] = value
            return caseKeyValue
        }

        // because we are building a javascript object we must not have any duplications
        // in the name of the keys, the index below is used to solve this.
        private invalidIdx = 1

        private INVALID():() => RetType {
            return () => {
                var retObj:RetType = {}
                retObj["invalid" + this.invalidIdx++] = undefined;
                return retObj
            }
        }
    }

    function isCaseStmt() {
        return this.NEXT_TOKEN() instanceof CaseTok
    }

    function isSemiColon() {
        return this.NEXT_TOKEN() instanceof SemiColonTok
    }

}
