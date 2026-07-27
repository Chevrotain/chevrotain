# perf(parser): use per-rule lookahead tables

## Summary

Replace the global lookahead-function `Map` and rule-qualified 32-bit keys with direct per-rule arrays. Runtime DSL operations read their lookahead function from the active rule table using a local method/occurrence key.

## Implementation

- Store lookahead functions as `[rule index][DSL method | occurrence]`.
- Number rules densely from zero and select their table directly.
- Keep rule identity separate from the bounded method/occurrence key.
- Remove all rule-key shifts and masks.
- Store repetition-recovery metadata using the same two dimensions.
- Cache the active rule's inner table to avoid the outer lookup on each DSL operation.
- Keep the cached table synchronized on rule entry, nested-rule exit, backtracking-state reload, and parser reset.

## Correctness

Returning from a subrule restores the parent rule's lookahead table before the parent executes another DSL operation. Backtracking reload derives the active table from the restored rule stack rather than adding redundant state to parser snapshots.

Regression tests verify parent-table restoration after a nested rule, isolation of all six DSL methods sharing occurrence zero, and separate recovery metadata for repetition methods sharing an occurrence.

## Verification

- `bun compile`
- `bun run ci` in `packages/chevrotain`
- `bun run ci` at the repository root
- 787 tests passing
- 100% statement coverage for the changed runtime traits
