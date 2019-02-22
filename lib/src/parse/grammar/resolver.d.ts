import { HashTable } from "../../lang/lang_extensions";
import { IParserUnresolvedRefDefinitionError } from "../parser/parser";
import { NonTerminal, Rule } from "./gast/gast_public";
import { GAstVisitor } from "./gast/gast_visitor_public";
import { IGrammarResolverErrorMessageProvider, IParserDefinitionError } from "../../../api";
export declare function resolveGrammar(topLevels: HashTable<Rule>, errMsgProvider: IGrammarResolverErrorMessageProvider): IParserDefinitionError[];
export declare class GastRefResolverVisitor extends GAstVisitor {
    private nameToTopRule;
    private errMsgProvider;
    errors: IParserUnresolvedRefDefinitionError[];
    private currTopLevel;
    constructor(nameToTopRule: HashTable<Rule>, errMsgProvider: IGrammarResolverErrorMessageProvider);
    resolveRefs(): void;
    visitNonTerminal(node: NonTerminal): void;
}
