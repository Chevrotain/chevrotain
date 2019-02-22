import { CstNode, ICstVisitor, IParserConfig, IToken } from "../../../../api";
import { MixedInParser } from "./parser_traits";
/**
 * This trait is responsible for the CST building logic.
 */
export declare class TreeBuilder {
    outputCst: boolean;
    CST_STACK: CstNode[];
    baseCstVisitorConstructor: Function;
    baseCstVisitorWithDefaultsConstructor: Function;
    LAST_EXPLICIT_RULE_STACK: number[];
    initTreeBuilder(this: MixedInParser, config: IParserConfig): void;
    cstNestedInvocationStateUpdate(this: MixedInParser, nestedName: string, shortName: string | number): void;
    cstInvocationStateUpdate(this: MixedInParser, fullRuleName: string, shortName: string | number): void;
    cstFinallyStateUpdate(this: MixedInParser): void;
    cstNestedFinallyStateUpdate(this: MixedInParser): void;
    cstPostTerminal(this: MixedInParser, key: string, consumedToken: IToken): void;
    cstPostNonTerminal(this: MixedInParser, ruleCstResult: CstNode, ruleName: string): void;
    getBaseCstVisitorConstructor(this: MixedInParser): {
        new (...args: any[]): ICstVisitor<any, any>;
    };
    getBaseCstVisitorConstructorWithDefaults(this: MixedInParser): {
        new (...args: any[]): ICstVisitor<any, any>;
    };
    nestedRuleBeforeClause(this: MixedInParser, methodOpts: {
        NAME?: string;
    }, laKey: number): string;
    nestedAltBeforeClause(this: MixedInParser, methodOpts: {
        NAME?: string;
    }, occurrence: number, methodKeyIdx: number, altIdx: number): {
        shortName?: number;
        nestedName?: string;
    };
    nestedRuleFinallyClause(this: MixedInParser, laKey: number, nestedName: string): void;
    getLastExplicitRuleShortName(this: MixedInParser): string;
    getLastExplicitRuleShortNameNoCst(this: MixedInParser): string;
    getPreviousExplicitRuleShortName(this: MixedInParser): string;
    getPreviousExplicitRuleShortNameNoCst(this: MixedInParser): string;
    getLastExplicitRuleOccurrenceIndex(this: MixedInParser): number;
    getLastExplicitRuleOccurrenceIndexNoCst(this: MixedInParser): number;
    nestedRuleInvocationStateUpdate(this: MixedInParser, nestedRuleName: string, shortNameKey: number): void;
    nestedRuleFinallyStateUpdate(this: MixedInParser): void;
}
