# Chevrotain Benchmark

Private benchmark workspace for measuring phase-specific performance against the local build or an optional baseline build.

This benchmark is authored in TypeScript, but the measured runtime defaults to Node.js, not Bun. In local runs, Bun produced materially different throughput on these regex-heavy lexer workloads, which would confound comparisons with previous Node-based measurements.

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

Compare runtimes on the same current build:

```bash
bun run --cwd packages/benchmark bench --compare-runtime --mode all --parser all
```

Compare mode is intentionally heavier than single-build mode:

- it runs baseline and current in separate subprocesses
- it alternates order across rounds to reduce warmer-process bias
- it repeats rounds and aggregates paired deltas instead of trusting a single run
- tiny millisecond deltas are marked as parity instead of being overstated
- fixture workload stats are shown separately so shared `tokens/op` is not repeated in every row
- warm lexing also prints normalized `tokens/sec` so cross-fixture comparisons are not just raw `ops/sec`

Notes:

- `bench` recompiles the local TypeScript files and then runs the benchmark under Node.js
- `bench:built` skips the rebuild and runs the already-emitted Node.js CLI
- `--compare-runtime` compares `Node` vs `Bun` on the same build
- `--runtime bun` is available for single-runtime experiments, but Node remains the default measurement runtime
