## Summary

- Optimize static `K=2` lookahead with indexed candidates when paths share a first token.
- Fall back to the existing lookahead implementation for unsupported cases.

## Performance

- Approximately 20% faster on the ECMAScript 5 parser-only benchmark.
- JSON and CSS benchmarks are unaffected as they don't use the `K=2` lookahead with shared first tokens.

## Testing

- Add regression coverage for empty-alternative priority in `K=2` lookahead.
