import { IParserConfig, Parser, TokenVocabulary } from "../parse/parser_public"
import { genUmdModule, genWrapperFunction } from "./generate"
import { Rule } from "../parse/grammar/gast/gast_public"

/**
 * Will Create a factory function that once invoked with a IParserConfig will return
 * a Parser Object.
 *
 * - Note that this happens using the Function constructor (a type of "eval") so it will not work in environments
 *   where content security policy is enabled, such as certain websites, Chrome extensions ect...
 *
 *   This means this function is best used for development flows to reduce the feedback loops
 *   or for productive flows targeting node.js only.
 *
 *   For productive flows targeting a browser runtime see @link {generation.generateParserModule}
 */
export function generateParserFactory<T extends Parser>(options: {
    name: string
    rules: Rule[]
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
        return constructorWrapper(
            options.tokenVocabulary,
            config,
            // TODO: check how the require is transpiled/webpacked
            require("../api")
        )
    }
}

/**
 * This would generate the string literal for a UMD module (@link {https://github.com/umdjs/umd})
 * That exports a Parser Constructor.
 *
 * Note that the constructor exposed by the generated module must receive the TokenVocabulary as the first
 * argument, the IParser config can be passed as the second argument.
 */
export function generateParserModule(options: {
    name: string
    rules: Rule[]
}): string {
    return genUmdModule({ name: options.name, rules: options.rules })
}
