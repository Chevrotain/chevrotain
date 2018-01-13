import { gast } from "../parse/grammar/gast_public"
import { IParserConfig, Parser, TokenVocabulary } from "../parse/parser_public"
import { genUmdModule, genWrapperFunction } from "./generate"

export namespace generation {
    export function genParserFactory<T extends Parser>(options: {
        name: string
        rules: gast.Rule[]
        tokenVocabulary: TokenVocabulary
    }): (config?: IParserConfig) => T {
        const wrapperText = genWrapperFunction({
            name: options.name,
            rules: options.rules
        })

        const constructorWrapper = new Function(
            "tokenVocabulary",
            "config",
            "chevrotain",
            wrapperText
        )

        return function(config) {
            // TODO: check how the require is transpiled/webpacked
            return constructorWrapper(
                options.tokenVocabulary,
                config,
                require("../api")
            )
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
}
