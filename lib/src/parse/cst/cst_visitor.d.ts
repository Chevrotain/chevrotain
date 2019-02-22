import { ICstVisitor } from "../../../api";
export declare function defaultVisit<IN, OUT>(ctx: any, param: IN): OUT;
export declare function createBaseSemanticVisitorConstructor(grammarName: string, ruleNames: string[]): {
    new (...args: any[]): ICstVisitor<any, any>;
};
export declare function createBaseVisitorConstructorWithDefaults(grammarName: string, ruleNames: string[], baseConstructor: Function): {
    new (...args: any[]): ICstVisitor<any, any>;
};
export declare enum CstVisitorDefinitionError {
    REDUNDANT_METHOD = 0,
    MISSING_METHOD = 1
}
export interface IVisitorDefinitionError {
    msg: string;
    type: CstVisitorDefinitionError;
    methodName: string;
}
export declare function validateVisitor(visitorInstance: Function, ruleNames: string[]): IVisitorDefinitionError[];
export declare function validateMissingCstMethods(visitorInstance: Function, ruleNames: string[]): IVisitorDefinitionError[];
export declare function validateRedundantMethods(visitorInstance: Function, ruleNames: string[]): IVisitorDefinitionError[];
