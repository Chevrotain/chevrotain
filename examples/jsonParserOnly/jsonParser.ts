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
    export class LParenTok extends tok.Token {}
    export class RParenTok extends tok.Token {}
    export class LSquareTok extends tok.Token {}
    export class RSquareTok extends tok.Token {}
    export class CommaTok extends tok.Token {}
    export class SemiColonTok extends tok.Token {}


    export class JsonParser extends recog.BaseRecognizer {


        object():void {
            this.CONSUME(LParenTok);
            this.OPTION(isString, ()=> {
                this.objectItem();
                this.MANY(isAdditionalItem, ()=> {
                    this.CONSUME(CommaTok);
                    this.objectItem();
                });
            });
            this.CONSUME(RParenTok);
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
                [{
                    WHEN: null, THEN_DO: ()=> {
                    }
                },
                    {
                        WHEN: null, THEN_DO: ()=> {

                    }
                    },
                    {
                        WHEN: null, THEN_DO: ()=> {

                    }
                    }
                ], 'bamba')
        }

    }


    function isString():boolean {
        return this.NEXT_TOKEN() instanceof StringTok;
    }

    function isAdditionalItem():boolean {
        return this.NEXT_TOKEN() instanceof CommaTok;
    }

    function isValue():boolean {
        // TODO: impel
        return false
    }


}
