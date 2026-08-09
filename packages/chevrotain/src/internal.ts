export {
  areTokenCategoriesNotUsed,
  buildAlternativesLookAheadFunc,
  buildSingleAlternativeLookaheadFunction,
} from "./parse/grammar/lookahead.js";
export {
  buildDfaAlternativesLookAheadFunc,
  buildDfaLookaheadMachine,
  buildDfaSingleAlternativeLookaheadFunction,
  isDfaLookaheadProfitable,
  isDfaSingleLookaheadProfitable,
} from "./parse/grammar/lookahead_dfa.js";
export {
  tokenStructuredMatcher,
  tokenStructuredMatcherNoCategories,
} from "./scan/tokens.js";
