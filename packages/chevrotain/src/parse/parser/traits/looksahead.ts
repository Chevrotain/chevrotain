import { DEFAULT_PARSER_CONFIG } from "../parser.js";
import { ILookaheadStrategy, IParserConfig } from "@chevrotain/types";
import { LLkLookaheadStrategy } from "../../grammar/llk_lookahead.js";

/**
 * Trait responsible for lookahead-related configuration.
 *
 * In the speculative backtracking engine, there are no pre-computed lookahead
 * functions — OR alternatives are tried speculatively at runtime via
 * IS_SPECULATING + SPEC_FAIL. This trait now only initialises configuration
 * fields that are:
 *   - `maxLookahead` / `dynamicTokensEnabled`: used by error-message builders
 *     (raiseEarlyExitException, raiseNoAltException) to walk GAST for
 *     expected-token paths.
 *   - `lookaheadStrategy`: used by `validateLookahead` during `performSelfAnalysis`
 *     to run grammar-level ambiguity / validation checks.
 *
 * The previous `lookAheadFuncsCache`, `preComputeLookaheadFunctions`,
 * `computeLookaheadFunc`, `getLaFuncFromCache`, `setLaFuncCache`,
 * `getKeyForAutomaticLookahead`, `DslMethodsCollectorVisitor`, and
 * `collectMethods` have all been removed — they were solely used to build
 * per-production lookahead functions that are no longer needed.
 */
export class LooksAhead {
  maxLookahead: number;
  dynamicTokensEnabled: boolean;
  lookaheadStrategy: ILookaheadStrategy;

  initLooksAhead(config: IParserConfig) {
    this.dynamicTokensEnabled = Object.hasOwn(config, "dynamicTokensEnabled")
      ? (config.dynamicTokensEnabled as boolean) // assumes end user provides the correct type
      : DEFAULT_PARSER_CONFIG.dynamicTokensEnabled;

    this.maxLookahead = Object.hasOwn(config, "maxLookahead")
      ? (config.maxLookahead as number) // assumes end user provides the correct type
      : DEFAULT_PARSER_CONFIG.maxLookahead;

    this.lookaheadStrategy = Object.hasOwn(config, "lookaheadStrategy")
      ? (config.lookaheadStrategy as ILookaheadStrategy) // assumes end user provides the correct type
      : new LLkLookaheadStrategy({ maxLookahead: this.maxLookahead });
  }
}
