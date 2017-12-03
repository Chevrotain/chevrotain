import { gast } from "../parse/grammar/gast_public"
import { IToken } from "../scan/tokens_public"
import { IParserConfig, Parser, TokenVocabulary } from "../parse/parser_public"

export function genParserConstructor(options: {
    name: string
    rules: { [ruleName: string]: gast.IProduction[] }
    tokenVocabulary: TokenVocabulary
}): { new (tokens: IToken[], config: IParserConfig): Parser } {
    const funcText = generateParserText(options)
    const parseFunc = Function(funcText)
    return <any>parseFunc
}

export function generateParserText(options: {
    name: string
    rules: { [ruleName: string]: gast.IProduction[] }
    tokenVocabulary: TokenVocabulary
}): string {
    function genParser(tokenVocabulary) {
        function myParser(input, config) {
            // invoke super constructor
            Parser.call(this, input, tokenVocabulary, config)

            // not mandatory, using <$> (or any other sign) to reduce verbosity (this. this. this. this. .......)
            const $ = this

            this.RULE("json", function() {
                // prettier-ignore
                $.OR([
                    {ALT: function() {$.SUBRULE($.object)}},
                    {ALT: function() {$.SUBRULE($.array)}}
                ])
            })

            // very important to call this after all the rules have been defined.
            // otherwise the parser may not work correctly as it will lack information
            // derived during the self analysis phase.
            ;(<any>Parser).performSelfAnalysis(this)
        }

        // inheritance as implemented in javascript in the previous decade... :(
        myParser.prototype = Object.create(Parser.prototype)
        myParser.prototype.constructor = myParser

        return myParser
    }

    return "x"
}
