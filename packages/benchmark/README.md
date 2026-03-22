# Chevrotain Benchmark

Private benchmark workspace for measuring phase-specific performance against the local build or an optional baseline build.

Run from the repo root:

```bash
bun run --cwd packages/benchmark bench --mode all --parser all
```

Compare a baseline bundle to the current local build:

```bash
bun run --cwd packages/benchmark bench \
  --baseline-lib packages/chevrotain/lib/chevrotain.mjs \
  --baseline-label v12.0.0 \
  --mode all \
  --parser all
```

Compare mode is intentionally heavier than single-build mode:

- it runs baseline and current in separate subprocesses
- it alternates order across rounds to reduce warmer-process bias
- it repeats rounds and aggregates paired deltas instead of trusting a single run
- tiny millisecond deltas are marked as parity instead of being overstated
