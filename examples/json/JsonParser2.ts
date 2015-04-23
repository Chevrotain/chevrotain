/// <reference path="../../src/parse/recognizer.ts" />
/// <reference path="../../src/scan/tokens.ts" />

module chevrotain.examples.json {

    import recog = chevrotain.recognizer
    import tok = chevrotain.tokens

    // DOCS: all Tokens must be defined as subclass of chevrotain.scan.tokens.Token
    export class StringTok extends tok.Token {}
    export class NumberTok extends tok.Token {}


    // DOCS: additional hierarchies may be defined for categorization purposes, for example
    //       when implementing Syntax highlighting being able to easily identify all the keywords with a simple
    //       "instanceof?" could be convenient.
    export class Keyword extends tok.Token {}

    export class TrueTok extends Keyword {
        constructor(public startLine:number, public startColumn:number) { super(startLine, startColumn, "true") }
    }

    export class FalseTok extends Keyword {
        constructor(public startLine:number, public startColumn:number) { super(startLine, startColumn, "false") }
    }

    export class NullTok extends Keyword {
        constructor(public startLine:number, public startColumn:number) { super(startLine, startColumn, "null") }
    }

    export class LCurlyTok extends tok.Token {
        constructor(public startLine:number, public startColumn:number) { super(startLine, startColumn, "{") }
    }

    export class RCurlyTok extends tok.Token {
        constructor(public startLine:number, public startColumn:number) { super(startLine, startColumn, "}") }
    }

    export class LSquareTok extends tok.Token {
        constructor(public startLine:number, public startColumn:number) { super(startLine, startColumn, "[") }
    }

    export class RSquareTok extends tok.Token {
        constructor(public startLine:number, public startColumn:number) { super(startLine, startColumn, "]") }
    }

    export class CommaTok extends tok.Token {
        constructor(public startLine:number, public startColumn:number) { super(startLine, startColumn, ",") }
    }

    export class ColonTok extends tok.Token {
        constructor(public startLine:number, public startColumn:number) { super(startLine, startColumn, ":") }
    }


    // TODO: convert this to extend the retrospection recognizer
    export class JsonParser extends recog.BaseRecognizer {

        object():void {
            this.CONSUME(LCurlyTok)
            this.OPTION(isString, () => {
                this.objectItem()
                this.MANY(isAdditionalItem, () => {
                    this.CONSUME(CommaTok)
                    this.objectItem()
                })
            })
            this.CONSUME(RCurlyTok)
        }

        objectItem():void {
            this.CONSUME(StringTok)
            this.CONSUME(ColonTok)
            this.value()
        }

        array():void {
            this.CONSUME(LSquareTok)
            this.OPTION(isString, () => {
                this.value()
                this.MANY(isAdditionalItem, () => {
                    this.value()
                })
            })
            this.CONSUME(RSquareTok)
        }

        value():void {
            this.OR(
                [
                    // @formatter:off
                    {WHEN: isString, THEN_DO: () => {
                        this.CONSUME(StringTok)}},
                    {WHEN: isNumber, THEN_DO: () => {
                        this.CONSUME(NumberTok)}},
                    {WHEN: isObject, THEN_DO: () => {
                        this.object()}},
                    {WHEN: isArray, THEN_DO: () => {
                        this.array()}},
                    {WHEN: isTrue, THEN_DO: () => {
                        this.CONSUME(TrueTok)}},
                    {WHEN: isFalse, THEN_DO: () => {
                        this.CONSUME(FalseTok)}},
                    {WHEN: isNull, THEN_DO: () => {
                        this.CONSUME(NullTok)}}
                    // @formatter:off

                ], "a value")
        }
    }

    function isString():boolean {
        return this.NEXT_TOKEN() instanceof StringTok
    }

    function isAdditionalItem():boolean {
        return this.NEXT_TOKEN() instanceof CommaTok
    }

    function isNumber():boolean {
        return this.NEXT_TOKEN() instanceof NumberTok
    }

    function isObject():boolean {
        return this.NEXT_TOKEN() instanceof LCurlyTok
    }

    function isArray():boolean {
        return this.NEXT_TOKEN() instanceof LSquareTok
    }

    function isTrue():boolean {
        return this.NEXT_TOKEN() instanceof TrueTok
    }

    function isFalse():boolean {
        return this.NEXT_TOKEN() instanceof FalseTok
    }

    function isNull():boolean {
        return this.NEXT_TOKEN() instanceof NullTok
    }

}
