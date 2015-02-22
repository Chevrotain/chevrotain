/// <reference path="../../src/parse/Recognizer.ts" />
/// <reference path="../../src/scan/Tokens.ts" />

module chevrotain.examples.json {

    import recog = chevrotain.parse.infra.recognizer;
    import tok = chevrotain.scan.tokens;

    export class StringTok extends tok.Token {}
    export class NumberTok extends tok.Token {}
    export class TrueTok extends tok.Token {}
    export class FalseTok extends tok.Token {}
    export class NullTok extends tok.Token {}
    export class LCurlyTok extends tok.Token {}
    export class RCurlyTok extends tok.Token {}
    export class LSquareTok extends tok.Token {}
    export class RSquareTok extends tok.Token {}
    export class CommaTok extends tok.Token {}
    export class SemiColonTok extends tok.Token {}


    export class JsonParser extends recog.BaseRecognizer {

        object():void {
            this.CONSUME(LCurlyTok);
            this.OPTION(isString, ()=> {
                this.objectItem();
                this.MANY(isAdditionalItem, ()=> {
                    this.CONSUME(CommaTok);
                    this.objectItem();
                });
            });
            this.CONSUME(RCurlyTok);
        }

        objectItem():void {
            this.CONSUME(StringTok);
            this.CONSUME(SemiColonTok);
            this.value();
        }

        array():void {
            this.CONSUME(LSquareTok);
            this.OPTION(isString, ()=> {
                this.value();
                this.MANY(isAdditionalItem, ()=> {
                    this.value();
                });
            });
            this.CONSUME(RSquareTok);
        }

        value():void {
            this.OR(
                [
                    // @formatter:off
                    {WHEN: isString, THEN_DO: ()=> {
                        this.CONSUME(StringTok)}},
                    {WHEN: isNumber, THEN_DO: ()=> {
                        this.CONSUME(NumberTok)}},
                    {WHEN: isObject, THEN_DO: ()=> {
                        this.object()}},
                    {WHEN: isArray, THEN_DO: ()=> {
                        this.array()}},
                    {WHEN: isTrue, THEN_DO: ()=> {
                        this.CONSUME(TrueTok)}},
                    {WHEN: isFalse, THEN_DO: ()=> {
                        this.CONSUME(FalseTok)}},
                    {WHEN: isNull, THEN_DO: ()=> {
                        this.CONSUME(NullTok)}}
                    // @formatter:off

                ], 'add error message')
        }
    }

    function isString():boolean {
        return this.NEXT_TOKEN() instanceof StringTok;
    }

    function isAdditionalItem():boolean {
        return this.NEXT_TOKEN() instanceof CommaTok;
    }

    function isNumber():boolean {
        return this.NEXT_TOKEN() instanceof NumberTok;
    }

    function isObject():boolean {
        return this.NEXT_TOKEN() instanceof LCurlyTok;
    }

    function isArray():boolean {
        return this.NEXT_TOKEN() instanceof LSquareTok;
    }

    function isTrue():boolean {
        return this.NEXT_TOKEN() instanceof TrueTok;
    }

    function isFalse():boolean {
        return this.NEXT_TOKEN() instanceof FalseTok;
    }

    function isNull():boolean {
        return this.NEXT_TOKEN() instanceof NullTok;
    }

}
