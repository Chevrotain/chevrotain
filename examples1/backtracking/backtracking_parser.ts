/// <reference path="../../src1/parse/recognizer.ts" />
/// <reference path="../../src1/scan/tokens.ts" />

module chevrotain.examples.backtracking {


    // DOCS: simple language with two statements which require backtracking to differentiate during parse time
    //       element A:ns1.ns2...nsN = 5;
    //       element B:ns1.ns2...nsN default 5;
    // generally one should avoid having to use backtracking, and this specific example can be resolved by parsing
    // both statements in a single rule and only distinguishing between them later, but lets see an example of using backtracking :)
    import recog = chevrotain.recognizer
    import tok = chevrotain.tokens

    export enum RET_TYPE {
        WITH_DEFAULT,
        WITH_EQUALS,
        QUALIFED_NAME,
        INVALID_WITH_DEFAULT,
        INVALID_WITH_EQUALS,
        INVALID_STATEMENT,
        INVALID_FQN
    }

    export class NumberTok extends tok.Token {}
    export class ElementTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super(startLine, startColumn, "true") }
    }

    export class DefaultTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super(startLine, startColumn, "default") }
    }

    export class DotTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super(startLine, startColumn, ".") }
    }

    export class ColonTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super(startLine, startColumn, ":") }
    }

    export class EqualsTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super(startLine, startColumn, "=") }
    }

    export class SemiColonTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super(startLine, startColumn, ";") }
    }

    export class IdentTok extends tok.Token {}


    // extending the BaseErrorRecoveryRecognizer in this example because it too has logic related to backtracking
    // that needs to be tested too.
    export class BackTrackingParser extends recog.BaseErrorRecoveryRecognizer {

        constructor(input:tok.Token[] = []) {
            // DOCS: note the second parameter in the super class. this is the namespace in which the token constructors are defined.
            //       it is mandatory to provide this map to be able to perform self analysis
            //       and allow the framework to "understand" the implemented grammar.
            super(input, <any>chevrotain.examples.backtracking)
            // DOCS: The call to performSelfAnalysis needs to happen after all the RULEs have been defined
            //       The typescript compiler places the constructor body last after initializations in the class's body
            //       which is why place the call here meets the criteria.
            recog.BaseErrorRecoveryRecognizer.performSelfAnalysis(this)
        }


        public statement = this.RULE("statement", this.parseStatement, INVALID(RET_TYPE.INVALID_STATEMENT))
        public withEqualsStatement = this.RULE("withEqualsStatement", this.parseWithEqualsStatement, INVALID(RET_TYPE.INVALID_WITH_EQUALS))
        public withDefaultStatement = this.RULE("withDefaultStatement",
            this.parseWithDefaultStatement, INVALID(RET_TYPE.INVALID_WITH_DEFAULT))
        // DOCs: example for a rule which will never try re-sync recovery as it is defined with 'RULE_NO_RESYNC'
        public qualifiedName = this.RULE_NO_RESYNC("qualifiedName", this.parseQualifiedName, INVALID(RET_TYPE.INVALID_FQN))

        private parseStatement():RET_TYPE {
            var statementTypeFound:RET_TYPE = undefined;
            this.OR(
                [
                    // both statements have the same prefix which may be of "infinite" length, this means there is no K for which
                    // we can build an LL(K) parser that can distinguish the two alternatives as a negative example
                    // would be to simply create a qualifiedName with a length of k+1.
                    {
                        WHEN: this.BACKTRACK(this.withEqualsStatement, (result) => { return result === RET_TYPE.WITH_EQUALS }),
                        THEN_DO: () => { statementTypeFound = this.SUBRULE(this.withEqualsStatement(1)) }
                    },
                    {
                        WHEN: this.BACKTRACK(this.withDefaultStatement, (result) => { return result === RET_TYPE.WITH_DEFAULT }),
                        THEN_DO: () => { statementTypeFound = this.SUBRULE(this.withDefaultStatement(1)) }
                    },
                ], " a statement")

            return statementTypeFound
        }

        private parseWithEqualsStatement():RET_TYPE {
            this.CONSUME1(ElementTok)
            this.CONSUME1(IdentTok)
            this.CONSUME1(ColonTok)
            this.SUBRULE(this.qualifiedName(1)) // this rule creates the no fixed look ahead issue
            this.CONSUME1(EqualsTok)
            this.CONSUME1(NumberTok)
            this.CONSUME1(SemiColonTok)

            return RET_TYPE.WITH_EQUALS
        }

        private parseWithDefaultStatement():RET_TYPE {
            this.CONSUME1(ElementTok)
            this.CONSUME1(IdentTok)
            this.CONSUME1(ColonTok)
            this.SUBRULE(this.qualifiedName(1)) // this rule creates the no fixed look ahead issue
            this.CONSUME1(DefaultTok)
            this.CONSUME1(NumberTok)
            this.CONSUME1(SemiColonTok)

            return RET_TYPE.WITH_DEFAULT
        }

        private parseQualifiedName():RET_TYPE {
            this.CONSUME1(IdentTok)
            this.MANY(() => {
                this.CONSUME1(DotTok)
                this.CONSUME2(IdentTok)
            })
            return RET_TYPE.QUALIFED_NAME
        }

    }

    export function INVALID(stmtType:RET_TYPE):() => RET_TYPE {
        return () => {return stmtType}
    }

}
