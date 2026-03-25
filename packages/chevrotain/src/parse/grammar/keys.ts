// Lookahead keys are 32Bit integers in the form
// ZZZZZZZZZZZZ-YYYY-XXXXXXXX
// XXXXXXXX -> Occurrence Index bitmap (8 bits, up to 256 occurrences).
// YYYY -> DSL Method Type bitmap (4 bits, up to 16 method types).
// ZZZZZZZZZZZZ -> Rule short Index bitmap (12 bits, up to 4096 rules).

export const BITS_FOR_METHOD_TYPE = 4;
export const BITS_FOR_OCCURRENCE_IDX = 8;
export const BITS_FOR_RULE_IDX = 12;
// short string used as part of mapping keys.
// being short improves the performance when composing KEYS for maps out of these
// The 5 - 8 bits (16 possible values, are reserved for the DSL method indices)
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
  const result = occurrence | dslMethodIdx | ruleIdx;
  return result;
}
