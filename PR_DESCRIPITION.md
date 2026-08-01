# Add Profitable Static DFA Lookahead

## Summary

- Build an in-memory DFA for LL(k) lookahead decisions with wide or deep shared paths.
- Select the DFA only when a conservative profitability heuristic predicts a win.
- Keep the existing lookahead implementation for K1 paths, predicates, dynamic tokens, narrow decisions, and paths longer than 32 tokens.
- Preserve token-category matching and source-order priority for overlapping, short, and empty alternatives.
- Add a browser microbenchmark for comparing the original, selected, and forced-DFA implementations.

## Performance

Chrome 151 parser-only benchmarks showed:

- ECMAScript 5: approximately 17% faster.
- JSON: approximately 1% slower, within benchmark noise.
- CSS: approximately neutral.
- ECMAScript parser initialization: approximately 2% slower, or about 0.1 ms.

## Testing

- Added profitability-boundary and runtime behavior tests.
- Added deterministic differential tests against the original OR and single-production lookahead implementations.
- Covered token categories, empty and short alternatives, predicates, dynamic tokens, EOF, and misses.
- Full Chevrotain package: 799 passing tests.
- Full monorepo CI: 13 of 13 tasks successful.
