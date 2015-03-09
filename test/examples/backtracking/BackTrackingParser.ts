/// <reference path="../../../src/parse/Recognizer.ts" />
/// <reference path="../../../src/scan/Tokens.ts" />

module chevrotain.examples.backtracking {


    // DOCS: simple language with two statements which require backtracking to differentiate during parse time
    //       element A:ns1.ns2...nsN = 5;
    //       element B:ns1.ns2...nsN default 5;
    // generally one should avoid having to use backtracking, and this specific example can be resolved by parsing
    // both statements in a single rule and only distinguishing between them later, but lets see an example of using backtracking :)
    import recog = chevrotain.parse.infra.recognizer
    import tok = chevrotain.scan.tokens

    export enum StatementType {WITH_DEFAULT, WITH_EQUALS}

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


    export class BackTrackingParser extends recog.BaseRecognizer {


        public statement():StatementType {
            var statementTypeFound:StatementType = undefined;
            this.OR(
                [
                    // both statements have the same prefix which may be of "infinite" length, this means there is no K for which
                    // we can build an LL(K) parser that can distinguish the two alternatives as a negative example
                    // would be to simply create a qualifiedName with a length of k+1.
                    {
                        WHEN:    this.BACKTRACK(this.withEqualsStatement, (result) => { return result === StatementType.WITH_EQUALS }),
                        THEN_DO: () => { statementTypeFound = this.withEqualsStatement() }
                    },
                    {
                        WHEN:    this.BACKTRACK(this.withDefaultStatement, (result) => { return result === StatementType.WITH_DEFAULT }),
                        THEN_DO: () => { statementTypeFound = this.withDefaultStatement() }
                    },
                ], " a statement")

            return statementTypeFound
        }

        public withEqualsStatement():StatementType {
            this.CONSUME(ElementTok)
            this.CONSUME(IdentTok)
            this.CONSUME(ColonTok)
            this.qualifiedName() // this rule creates the no fixed look ahead issue
            this.CONSUME(EqualsTok)
            this.CONSUME(NumberTok)
            this.CONSUME(SemiColonTok)

            return StatementType.WITH_EQUALS
        }

        public withDefaultStatement():StatementType {
            this.CONSUME(ElementTok)
            this.CONSUME(IdentTok)
            this.CONSUME(ColonTok)
            this.qualifiedName() // this rule creates the no fixed look ahead issue
            this.CONSUME(DefaultTok)
            this.CONSUME(NumberTok)
            this.CONSUME(SemiColonTok)

            return StatementType.WITH_DEFAULT
        }

        public qualifiedName():void {
            this.CONSUME(IdentTok)
            this.MANY(isQualifiedNamePart, () => {
                this.CONSUME(DotTok)
                this.CONSUME(IdentTok)
            })
        }

    }

    function isQualifiedNamePart():boolean {
        return this.NEXT_TOKEN() instanceof  DotTok
    }


}
