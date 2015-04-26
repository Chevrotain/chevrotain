/// <reference path="../../src/parse/recognizer.ts" />
/// <reference path="../../src/scan/tokens.ts" />

module chevrotain.examples.json {

    import recog = chevrotain.recognizer
    import tok = chevrotain.tokens

    // DOCS: all Tokens must be defined as subclass of chevrotain.tokens.Token
    export class StringTok extends tok.Token {}
    export class NumberTok extends tok.Token {}

    // DOCS: additional hierarchies may be defined for categorization purposes, for example
    //       when implementing Syntax highlighting being able to easily identify all the keywords with a simple
    //       "instanceof?" could be convenient.
    export class Keyword extends tok.Token {}

    export class TrueTok extends Keyword {
        constructor(startLine:number, startColumn:number) { super(startLine, startColumn, "true") }
    }

    export class FalseTok extends Keyword {
        constructor(startLine:number, startColumn:number) { super(startLine, startColumn, "false") }
    }

    export class NullTok extends Keyword {
        constructor(startLine:number, startColumn:number) { super(startLine, startColumn, "null") }
    }

    export class LCurlyTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super(startLine, startColumn, "{") }
    }

    export class RCurlyTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super(startLine, startColumn, "}") }
    }

    export class LSquareTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super(startLine, startColumn, "[") }
    }

    export class RSquareTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super(startLine, startColumn, "]") }
    }

    export class CommaTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super(startLine, startColumn, ",") }
    }

    export class ColonTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super(startLine, startColumn, ":") }
    }


    export class JsonParser extends recog.BaseIntrospectionRecognizer {

        constructor(input:tok.Token[] = []) {
            // DOCS: note the second parameter in the super class. this is the namespace in which the token constructors are defined.
            //       it is mandatory to provide this map to be able to perform self analysis
            //       and allow the framework to "understand" the implemented grammar.
            super(input, <any>chevrotain.examples.json)
            // DOCS: The call to performSelfAnalysis needs to happen after all the RULEs have been defined
            //       The typescript compiler places the constructor body last after initializations in the class's body
            //       which is why place the call here meets the criteria.
            recog.BaseIntrospectionRecognizer.performSelfAnalysis(this)
        }

        // DOCS: the parsing rules
        public object = this.RULE("object", () => {
            this.CONSUME(LCurlyTok)
            this.OPTION(() => {
                this.SUBRULE(this.objectItem)
                this.MANY(() => {
                    this.CONSUME(CommaTok)
                    this.SUBRULE1(this.objectItem) // DOCS: the index "2" in SUBRULE2 is needed to identify
                })                                 //       the unique position in the grammar during runtime
            })
            this.CONSUME(RCurlyTok)
        })

        public objectItem = this.RULE("objectItem", () => {
            this.CONSUME(StringTok)
            this.CONSUME(ColonTok)
            this.SUBRULE(this.value)
        })

        public array = this.RULE("array", () => {
            this.CONSUME(LSquareTok)
            this.OPTION(() => {
                this.SUBRULE(this.value)
                this.MANY(() => {
                    this.CONSUME(CommaTok)
                    this.SUBRULE2(this.value)
                })
            })
            this.CONSUME(RSquareTok)
        })

        public value = this.RULE("value", () => {
            this.OR([
                {ALT: () => {this.CONSUME(StringTok)}},
                {ALT: () => {this.CONSUME(NumberTok)}},
                {ALT: () => {this.SUBRULE(this.object)}},
                {ALT: () => {this.SUBRULE(this.array)}},
                {ALT: () => {this.CONSUME(TrueTok)}},
                {ALT: () => {this.CONSUME(FalseTok)}},
                {ALT: () => {this.CONSUME(NullTok)}}
            ], "a value")
        })
    }
}
