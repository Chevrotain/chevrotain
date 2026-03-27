// Lookahead keys are small 32-bit integers with this bit layout:
//
//   RRRRRRRRRRRRRRRRRRRRRR-MMM-XXXXX
//   XXXXX (bits 0-4)  → _dslCounter occurrence index (0-31)
//   MMM   (bits 5-7)  → DSL method type (OR=1, OPTION=2, MANY=3, ...)
//   RRR.. (bits 8+)   → rule short index (ruleShortNameIdx << 8)
//
// **Why small keys matter for V8 performance:**
// When `ruleShortNameIdx` started at 256 with a 12-bit shift, keys began at
// 256 << 12 = 1,048,576.  V8 treats objects/arrays with elements above that
// threshold as "slow" (dictionary) elements — a hash-table lookup costing
// ~15 ns per access.  With ruleShortNameIdx starting at 0 and an 8-bit shift,
// the maximum key for 100 rules is 100 << 8 | 192 | 31 ≈ 25,823.  Keys in
// that range stay in V8's "fast" element storage — a direct indexed slot load
// costing ~1–2 ns.  That shift produced a +9 % warm-parse improvement on the
// JSON benchmark (11,913 → 13,014 ops/sec).
//
// **Why BITS_FOR_OCCURRENCE_IDX must be ≥ 5:**
// `_dslCounter` is a flat counter over ALL DSL calls in a rule body (OR,
// MANY, OPTION, CONSUME, SUBRULE, …).  With 10 MANY calls each containing
// one CONSUME the counter reaches 19 at the last MANY — exceeding 4 bits
// (max 15).  At that point `MANY_IDX | 16 == MANY_IDX | 0`, causing MANY9
// to collide with MANY1.  Five bits (max 31) is the safe minimum for
// real-world grammars.
//
// **MAX_METHOD_IDX is hardcoded to 127 in gast_recorder.ts / parser.ts**
// (not derived from BITS_FOR_OCCURRENCE_IDX) because the counter is not
// bounded by the bit width — it is a free-running sequence index.

export const BITS_FOR_METHOD_TYPE = 3;
export const BITS_FOR_OCCURRENCE_IDX = 5;
export const BITS_FOR_RULE_IDX = 8;
// TODO: validation, this means that there may at most 2^8 --> 256 alternatives for an alternation.
export const BITS_FOR_ALT_IDX = 8;

// Method-type offsets in bits 5-7 (values 32, 64, 96, 128, 160, 192).
export const OR_IDX = 1 << BITS_FOR_OCCURRENCE_IDX;
export const OPTION_IDX = 2 << BITS_FOR_OCCURRENCE_IDX;
export const MANY_IDX = 3 << BITS_FOR_OCCURRENCE_IDX;
export const AT_LEAST_ONE_IDX = 4 << BITS_FOR_OCCURRENCE_IDX;
export const MANY_SEP_IDX = 5 << BITS_FOR_OCCURRENCE_IDX;
export const AT_LEAST_ONE_SEP_IDX = 6 << BITS_FOR_OCCURRENCE_IDX;

// this actually returns a number, but it is always used as a string (object prop key)
export function getKeyForAutomaticLookahead(
  ruleIdx: number,
  dslMethodIdx: number,
  occurrence: number,
): number {
  return occurrence | dslMethodIdx | ruleIdx;
}

const BITS_START_FOR_ALT_IDX = 32 - BITS_FOR_ALT_IDX;
