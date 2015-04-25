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


        // DOCS: Each line here defines a public parsing rule
        public object = this.RULE("object", this.parseObject)
        public objectItem = this.RULE("objectItem", this.parseObjectItem)
        public array = this.RULE("array", this.parseArray)
        public value = this.RULE("value", this.parseValue)


        // actual parsing rules implementation
        private parseObject():void {
            this.CONSUME(LCurlyTok)
            this.OPTION(() => {
                this.SUBRULE(this.objectItem(1))
                this.MANY(() => {
                    this.CONSUME(CommaTok)
                    this.SUBRULE(this.objectItem(2)) // DOCS: the index "2" is needed to identify
                })                                   //       the unique position in the grammar
            })
            this.CONSUME(RCurlyTok)
        }

        private parseObjectItem():void {
            this.CONSUME(StringTok)
            this.CONSUME(ColonTok)
            this.SUBRULE(this.value(1))
        }

        private parseArray():void {
            this.CONSUME(LSquareTok)
            this.OPTION(() => {
                this.SUBRULE(this.value(1))
                this.MANY(() => {
                    this.SUBRULE(this.value(2))
                })
            })
            this.CONSUME(RSquareTok)
        }

        private parseValue():void {
            this.OR([
                {ALT: () => {this.CONSUME(StringTok)}},
                {ALT: () => {this.CONSUME(NumberTok)}},
                {ALT: () => {this.SUBRULE(this.object(1))}},
                {ALT: () => {this.SUBRULE(this.array(1))}},
                {ALT: () => {this.CONSUME(TrueTok)}},
                {ALT: () => {this.CONSUME(FalseTok)}},
                {ALT: () => {this.CONSUME(NullTok)}}
            ], "a value")
        }
    }
}
