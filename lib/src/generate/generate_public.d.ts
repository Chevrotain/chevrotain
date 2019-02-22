import { Parser, Rule, IParserConfig, TokenVocabulary } from "../../api";
export declare function generateParserFactory(options: {
    name: string;
    rules: Rule[];
    tokenVocabulary: TokenVocabulary;
}): (config?: IParserConfig) => Parser;
export declare function generateParserModule(options: {
    name: string;
    rules: Rule[];
}): string;
