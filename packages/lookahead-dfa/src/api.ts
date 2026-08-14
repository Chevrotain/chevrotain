export {
  buildDfaLookaheadMachine,
  isDfaLookaheadProfitable,
  isDfaSingleLookaheadProfitable,
} from "./lookahead_dfa.js";
export type { DfaLookaheadMachine, DfaTransition } from "./lookahead_dfa.js";

export {
  buildDenseDfaAlternativesLookAheadFunc,
  buildDenseDfaSingleAlternativeLookaheadFunction,
  denseDfaCellCount,
  MAX_DENSE_DFA_CELLS,
} from "./dense.js";
