const BITS_FOR_OCCURRENCE_IDX = 8;

// Method offsets in each rule's lookahead table. The lower 8 bits hold the
// occurrence index.
export const OR_IDX = 1 << BITS_FOR_OCCURRENCE_IDX;
export const OPTION_IDX = 2 << BITS_FOR_OCCURRENCE_IDX;
export const MANY_IDX = 3 << BITS_FOR_OCCURRENCE_IDX;
export const AT_LEAST_ONE_IDX = 4 << BITS_FOR_OCCURRENCE_IDX;
export const MANY_SEP_IDX = 5 << BITS_FOR_OCCURRENCE_IDX;
export const AT_LEAST_ONE_SEP_IDX = 6 << BITS_FOR_OCCURRENCE_IDX;
