import { AtLeastOneSepMethodOpts, ConsumeMethodOpts, DSLMethodOpts, DSLMethodOptsWithErr, GrammarAction, IAnyOrAlt, IRuleConfig, ISerializedGast, IToken, ManySepMethodOpts, OrMethodOpts, SubruleMethodOpts, TokenType } from "../../../../api";
import { MixedInParser } from "./parser_traits";
import { Rule } from "../../grammar/gast/gast_public";
import { HashTable } from "../../../lang/lang_extensions";
/**
 * This trait is responsible for implementing the offical API
 * for defining Chevrotain parsers, i.e:
 * - CONSUME
 * - RULE
 * - OPTION
 * - ...
 */
export declare class RecognizerApi {
    CONSUME(this: MixedInParser, tokType: TokenType, options?: ConsumeMethodOpts): IToken;
    CONSUME1(this: MixedInParser, tokType: TokenType, options?: ConsumeMethodOpts): IToken;
    CONSUME2(this: MixedInParser, tokType: TokenType, options?: ConsumeMethodOpts): IToken;
    CONSUME3(this: MixedInParser, tokType: TokenType, options?: ConsumeMethodOpts): IToken;
    CONSUME4(this: MixedInParser, tokType: TokenType, options?: ConsumeMethodOpts): IToken;
    CONSUME5(this: MixedInParser, tokType: TokenType, options?: ConsumeMethodOpts): IToken;
    CONSUME6(this: MixedInParser, tokType: TokenType, options?: ConsumeMethodOpts): IToken;
    CONSUME7(this: MixedInParser, tokType: TokenType, options?: ConsumeMethodOpts): IToken;
    CONSUME8(this: MixedInParser, tokType: TokenType, options?: ConsumeMethodOpts): IToken;
    CONSUME9(this: MixedInParser, tokType: TokenType, options?: ConsumeMethodOpts): IToken;
    SUBRULE<T>(this: MixedInParser, ruleToCall: (idx: number) => T, options?: SubruleMethodOpts): T;
    SUBRULE1<T>(this: MixedInParser, ruleToCall: (idx: number) => T, options?: SubruleMethodOpts): T;
    SUBRULE2<T>(this: MixedInParser, ruleToCall: (idx: number) => T, options?: SubruleMethodOpts): T;
    SUBRULE3<T>(this: MixedInParser, ruleToCall: (idx: number) => T, options?: SubruleMethodOpts): T;
    SUBRULE4<T>(this: MixedInParser, ruleToCall: (idx: number) => T, options?: SubruleMethodOpts): T;
    SUBRULE5<T>(this: MixedInParser, ruleToCall: (idx: number) => T, options?: SubruleMethodOpts): T;
    SUBRULE6<T>(this: MixedInParser, ruleToCall: (idx: number) => T, options?: SubruleMethodOpts): T;
    SUBRULE7<T>(this: MixedInParser, ruleToCall: (idx: number) => T, options?: SubruleMethodOpts): T;
    SUBRULE8<T>(this: MixedInParser, ruleToCall: (idx: number) => T, options?: SubruleMethodOpts): T;
    SUBRULE9<T>(this: MixedInParser, ruleToCall: (idx: number) => T, options?: SubruleMethodOpts): T;
    OPTION<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): OUT;
    OPTION1<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): OUT;
    OPTION2<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): OUT;
    OPTION3<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): OUT;
    OPTION4<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): OUT;
    OPTION5<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): OUT;
    OPTION6<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): OUT;
    OPTION7<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): OUT;
    OPTION8<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): OUT;
    OPTION9<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): OUT;
    OR<T>(this: MixedInParser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T;
    OR1<T>(this: MixedInParser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T;
    OR2<T>(this: MixedInParser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T;
    OR3<T>(this: MixedInParser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T;
    OR4<T>(this: MixedInParser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T;
    OR5<T>(this: MixedInParser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T;
    OR6<T>(this: MixedInParser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T;
    OR7<T>(this: MixedInParser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T;
    OR8<T>(this: MixedInParser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T;
    OR9<T>(this: MixedInParser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T;
    MANY<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void;
    MANY1<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void;
    MANY2<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void;
    MANY3<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void;
    MANY4<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void;
    MANY5<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void;
    MANY6<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void;
    MANY7<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void;
    MANY8<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void;
    MANY9<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void;
    MANY_SEP<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void;
    MANY_SEP1<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void;
    MANY_SEP2<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void;
    MANY_SEP3<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void;
    MANY_SEP4<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void;
    MANY_SEP5<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void;
    MANY_SEP6<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void;
    MANY_SEP7<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void;
    MANY_SEP8<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void;
    MANY_SEP9<OUT>(this: MixedInParser, options: ManySepMethodOpts<OUT>): void;
    AT_LEAST_ONE<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>): void;
    AT_LEAST_ONE1<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>): void;
    AT_LEAST_ONE2<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>): void;
    AT_LEAST_ONE3<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>): void;
    AT_LEAST_ONE4<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>): void;
    AT_LEAST_ONE5<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>): void;
    AT_LEAST_ONE6<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>): void;
    AT_LEAST_ONE7<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>): void;
    AT_LEAST_ONE8<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>): void;
    AT_LEAST_ONE9<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>): void;
    AT_LEAST_ONE_SEP<OUT>(this: MixedInParser, options: AtLeastOneSepMethodOpts<OUT>): void;
    AT_LEAST_ONE_SEP1<OUT>(this: MixedInParser, options: AtLeastOneSepMethodOpts<OUT>): void;
    AT_LEAST_ONE_SEP2<OUT>(this: MixedInParser, options: AtLeastOneSepMethodOpts<OUT>): void;
    AT_LEAST_ONE_SEP3<OUT>(this: MixedInParser, options: AtLeastOneSepMethodOpts<OUT>): void;
    AT_LEAST_ONE_SEP4<OUT>(this: MixedInParser, options: AtLeastOneSepMethodOpts<OUT>): void;
    AT_LEAST_ONE_SEP5<OUT>(this: MixedInParser, options: AtLeastOneSepMethodOpts<OUT>): void;
    AT_LEAST_ONE_SEP6<OUT>(this: MixedInParser, options: AtLeastOneSepMethodOpts<OUT>): void;
    AT_LEAST_ONE_SEP7<OUT>(this: MixedInParser, options: AtLeastOneSepMethodOpts<OUT>): void;
    AT_LEAST_ONE_SEP8<OUT>(this: MixedInParser, options: AtLeastOneSepMethodOpts<OUT>): void;
    AT_LEAST_ONE_SEP9<OUT>(this: MixedInParser, options: AtLeastOneSepMethodOpts<OUT>): void;
    RULE<T>(this: MixedInParser, name: string, implementation: (...implArgs: any[]) => T, config?: IRuleConfig<T>): (idxInCallingRule?: number, ...args: any[]) => T | any;
    OVERRIDE_RULE<T>(this: MixedInParser, name: string, impl: (...implArgs: any[]) => T, config?: IRuleConfig<T>): (idxInCallingRule?: number, ...args: any[]) => T;
    BACKTRACK<T>(this: MixedInParser, grammarRule: (...args: any[]) => T, args?: any[]): () => boolean;
    getGAstProductions(this: MixedInParser): HashTable<Rule>;
    getSerializedGastProductions(this: MixedInParser): ISerializedGast[];
}
