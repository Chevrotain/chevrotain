import { gast } from "../parse/grammar/gast_public"
import { IToken } from "../scan/tokens_public"
import { IParserConfig, Parser, TokenVocabulary } from "../parse/parser_public"
import { genUmdModule, genWrapperFunction } from "./generate"

export function genParserfactory(options: {
    name: string
    rules: gast.Rule[]
    tokenVocabulary: TokenVocabulary
}): (config: IParserConfig) => Parser {
    const wrapperText = genWrapperFunction({
        name: options.name,
        rules: options.rules
    })

    const testWrapper = new Function(
        "tokenVocabulary",
        "config",
        "chevrotain",
        wrapperText
    )

    return function(config) {
        // TODO: check how the require is transpiled/webpacked
        return new (<any>testWrapper(
            options.tokenVocabulary,
            config,
            require("../api")
        ))()
    }
}

export function generateParserModule(options: {
    name: string
    rules: gast.Rule[]
    tokenVocabulary: TokenVocabulary
}): string {
    // TODO: any better manner to pass the tokenVocabulary?
    return genUmdModule({ name: options.name, rules: options.rules })
}
