/// <reference path="../../../src/parse/recognizer.ts" />
/// <reference path="../../../src/scan/tokens.ts" />

module chevrotain.examples.backtracking {


    // DOCS: simple language with two statements which require backtracking to differentiate during parse time
    //       element A:ns1.ns2...nsN = 5;
    //       element B:ns1.ns2...nsN default 5;
    // generally one should avoid having to use backtracking, and this specific example can be resolved by parsing
    // both statements in a single rule and only distinguishing between them later, but lets see an example of using backtracking :)

    export enum RET_TYPE {
        WITH_DEFAULT,
        WITH_EQUALS,
        QUALIFED_NAME,
        INVALID_WITH_DEFAULT,
        INVALID_WITH_EQUALS,
        INVALID_STATEMENT,
        INVALID_FQN
    }

    export class NumberTok extends Token {}
    export class ElementTok extends Token {}
    export class DefaultTok extends Token {}
    export class DotTok extends Token {}
    export class ColonTok extends Token {}
    export class EqualsTok extends Token {}
    export class SemiColonTok extends Token {}
    export class IdentTok extends Token {}


    // extending the BaseErrorRecoveryRecognizer in this example because it too has logic related to backtracking
    // that needs to be tested too.
    export class BackTrackingParser extends Parser {

        constructor(input:Token[] = []) {
            // DOCS: note the second parameter in the super class. this is the namespace in which the token constructors are defined.
            //       it is mandatory to provide this map to be able to perform self analysis
            //       and allow the framework to "understand" the implemented grammar.
            super(input, <any>chevrotain.examples.backtracking)
            // DOCS: The call to performSelfAnalysis needs to happen after all the RULEs have been defined
            //       The typescript compiler places the constructor body last after initializations in the class's body
            //       which is why place the call here meets the criteria.
            Parser.performSelfAnalysis(this)
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
                        WHEN:    this.BACKTRACK(this.withEqualsStatement, (result) => { return result === RET_TYPE.WITH_EQUALS }),
                        THEN_DO: () => { statementTypeFound = this.SUBRULE(this.withEqualsStatement) }
                    },
                    {
                        WHEN:    this.BACKTRACK(this.withDefaultStatement, (result) => { return result === RET_TYPE.WITH_DEFAULT }),
                        THEN_DO: () => { statementTypeFound = this.SUBRULE(this.withDefaultStatement) }
                    },
                ], " a statement")

            return statementTypeFound
        }

        private parseWithEqualsStatement():RET_TYPE {
            this.CONSUME(ElementTok)
            this.CONSUME(IdentTok)
            this.CONSUME(ColonTok)
            this.SUBRULE(this.qualifiedName) // this rule creates the no fixed look ahead issue
            this.CONSUME(EqualsTok)
            this.CONSUME(NumberTok)
            this.CONSUME(SemiColonTok)

            return RET_TYPE.WITH_EQUALS
        }

        private parseWithDefaultStatement():RET_TYPE {
            this.CONSUME(ElementTok)
            this.CONSUME(IdentTok)
            this.CONSUME(ColonTok)
            this.SUBRULE(this.qualifiedName) // this rule creates the no fixed look ahead issue
            this.CONSUME(DefaultTok)
            this.CONSUME(NumberTok)
            this.CONSUME(SemiColonTok)

            return RET_TYPE.WITH_DEFAULT
        }

        private parseQualifiedName():RET_TYPE {
            this.CONSUME(IdentTok)
            this.MANY(() => {
                this.CONSUME(DotTok)
                this.CONSUME2(IdentTok)
            })
            return RET_TYPE.QUALIFED_NAME
        }

    }

    export function INVALID(stmtType:RET_TYPE):() => RET_TYPE {
        return () => {return stmtType}
    }

}
