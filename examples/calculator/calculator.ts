/// <reference path="../../src/parse/recognizer.ts" />
/// <reference path="../../src/scan/tokens.ts" />
/// <reference path="../../src/scan/lexer.ts" />

module chevrotain.examples.calculator {

    import recog = chevrotain.recognizer
    import tok = chevrotain.tokens
    import lex = chevrotain.lexer

    // DOCS: all Tokens must be defined as subclass of chevrotain.tokens.Token
    export class AdditionOperator extends tok.Token { static PATTERN = lex.NA }
    export class Plus extends AdditionOperator { static PATTERN = /\+/ }
    export class Minus extends AdditionOperator { static PATTERN = /-/ }

    export class MultiplicationOperator extends tok.Token { static PATTERN = lex.NA }
    export class Multi extends MultiplicationOperator { static PATTERN = /\*/ }
    export class Div extends MultiplicationOperator { static PATTERN = /\// }

    export class LParen extends tok.Token { static PATTERN = /\(/ }
    export class RParen extends tok.Token { static PATTERN = /\)/ }
    export class NumberLiteral extends tok.Token {
        static PATTERN = /[1-9]\d*/
    }
    export class WhiteSpace extends tok.Token {
        static PATTERN = / |\t|\n|\r|\r\n/
        static IGNORE = true
    }

    // DOCS: The lexer should be used as a singleton as using it does not change it's state and the validations
    //       performed by it's constructor only need to be done once.
    export var CalculatorLexer = new lex.SimpleLexer(
        [Plus, Minus, Multi, Div, LParen, RParen, NumberLiteral, WhiteSpace])


    export class Calculator extends recog.BaseIntrospectionRecognizer {

        constructor(input:tok.Token[] = []) {
            // DOCS: note the second parameter in the super class. this is the namespace in which the token constructors are defined.
            //       it is mandatory to provide this map to be able to perform self analysis
            //       and allow the framework to "understand" the implemented grammar.
            super(input, <any>chevrotain.examples.calculator)
            // DOCS: The call to performSelfAnalysis needs to happen after all the RULEs have been defined
            //       The typescript compiler places the constructor body last after initializations in the class's body
            //       which is why place the call here meets the criteria.
            recog.BaseIntrospectionRecognizer.performSelfAnalysis(this)
        }

        // avoids inserting number literals as these can have multiple(and infinite) semantic values, thus it is unlikely
        // we can choose the correct number value to insert.
        protected canTokenTypeBeInsertedInRecovery(tokClass:Function) {
            return tokClass !== NumberLiteral
        }

        // DOCS: the parsing rules
        public expression = this.RULE("expression", () => {
            return this.SUBRULE(this.additionExpression)
        })

        // DOCS: lowest precedence thus it is first in the rule chain
        // The precedence of binary expressions is determined by how far down the Parse Tree
        // The binary expression appears.
        public additionExpression = this.RULE("additionExpression", () => {
            var value, op, rhsVal

            // parsing part
            value = this.SUBRULE(this.multiplicationExpression)
            this.MANY(() => {
                op = this.CONSUME(AdditionOperator)
                // DOCS: the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
                rhsVal = this.SUBRULE2(this.multiplicationExpression)

                // interpreter part
                if (op instanceof Plus) {
                    value += rhsVal
                } else { // op instanceof Minus
                    value -= rhsVal
                }
            })

            return value
        })


        public multiplicationExpression = this.RULE("multiplicationExpression", () => {
            var value, op, rhsVal

            // parsing part
            value = this.SUBRULE(this.atomicExpression)
            this.MANY(() => {
                op = this.CONSUME(MultiplicationOperator)
                // DOCS: the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
                rhsVal = this.SUBRULE2(this.atomicExpression)

                // interpreter part
                if (op instanceof Multi) {
                    value *= rhsVal
                } else { // op instanceof Div
                    value /= rhsVal
                }
            })

            return value
        })


        public atomicExpression = this.RULE("atomicExpression", () => {
            // @formatter:off
            return this.OR([
                // parenthesisExpression has the highest precedence and thus it appears
                // in the "lowest" leaf in the expression ParseTree.
                {ALT: () => { return this.SUBRULE(this.parenthesisExpression)}},
                {ALT: () => {
                    var numLit = this.CONSUME(NumberLiteral)
                    return parseInt(numLit.image, 10)}},
            ], "a number or parenthesis expression")
            // @formatter:on
        })

        public parenthesisExpression = this.RULE("parenthesisExpression", () => {
            var expValue

            this.CONSUME(LParen)
            expValue = this.SUBRULE(this.expression)
            this.CONSUME(RParen)

            return expValue
        })
    }
}
