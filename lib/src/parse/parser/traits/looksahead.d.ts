import { lookAheadSequence, TokenMatcher } from "../parser";
import { IAnyOrAlt, IParserConfig } from "../../../../api";
import { MixedInParser } from "./parser_traits";
/**
 * Trait responsible for the lookahead related utilities and optimizations.
 */
export declare class LooksAhead {
    maxLookahead: number;
    lookAheadFuncsCache: any;
    dynamicTokensEnabled: boolean;
    initLooksAhead(config: IParserConfig): void;
    lookAheadBuilderForOptional(this: MixedInParser, alt: lookAheadSequence, tokenMatcher: TokenMatcher, dynamicTokensEnabled: boolean): () => boolean;
    lookAheadBuilderForAlternatives(this: MixedInParser, alts: lookAheadSequence[], hasPredicates: boolean, tokenMatcher: TokenMatcher, dynamicTokensEnabled: boolean): (orAlts?: IAnyOrAlt<any>[]) => number | undefined;
    getKeyForAutomaticLookahead(this: MixedInParser, dslMethodIdx: number, occurrence: number): number;
    getLookaheadFuncForOr(this: MixedInParser, occurrence: number, alts: IAnyOrAlt<any>[]): () => number;
    getLookaheadFuncForOption(this: MixedInParser, key: number, occurrence: number): () => boolean;
    getLookaheadFuncForMany(this: MixedInParser, key: number, occurrence: number): () => boolean;
    getLookaheadFuncForManySep(this: MixedInParser, key: number, occurrence: number): () => boolean;
    getLookaheadFuncForAtLeastOne(this: MixedInParser, key: number, occurrence: number): () => boolean;
    getLookaheadFuncForAtLeastOneSep(this: MixedInParser, key: number, occurrence: number): () => boolean;
    getLookaheadFuncFor(this: MixedInParser, key: number, occurrence: number, maxLookahead: number, prodType: any): () => boolean;
    getLaFuncFromCache(this: MixedInParser, key: number): Function;
    getLaFuncFromMap(this: MixedInParser, key: number): Function;
    getLaFuncFromObj(this: MixedInParser, key: number): Function;
    setLaFuncCache(this: MixedInParser, key: number, value: Function): void;
    setLaFuncCacheUsingMap(this: MixedInParser, key: number, value: Function): void;
    setLaFuncUsingObj(this: MixedInParser, key: number, value: Function): void;
}
