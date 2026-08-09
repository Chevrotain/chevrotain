export {
  areTokenCategoriesNotUsed,
  buildAlternativesLookAheadFunc,
  buildSingleAlternativeLookaheadFunction,
} from "./parse/grammar/lookahead.js";
export {
  buildDenseDfaAlternativesLookAheadFunc,
  buildDenseDfaSingleAlternativeLookaheadFunction,
  denseDfaCellCount,
  MAX_DENSE_DFA_CELLS,
} from "./parse/grammar/dfa/dense.js";
export {
  buildDfaLookaheadMachine,
  isDfaLookaheadProfitable,
  isDfaSingleLookaheadProfitable,
} from "./parse/grammar/lookahead_dfa.js";
export {
  tokenStructuredMatcher,
  tokenStructuredMatcherNoCategories,
} from "./scan/tokens.js";
