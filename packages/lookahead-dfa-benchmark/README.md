# @chevrotain/lookahead-dfa-benchmark

Private contributor benchmark for Chevrotain lookahead implementations. This
package is not published.

## Purpose

The benchmark:

- Compares the production **Path Scan** and **Dense DFA** implementations.
- Verifies equivalent results before collecting timing samples.
- Measures runtime throughput across representative input distributions.
- Records which implementation the production selector chooses.

It requires Node.js 22.18 or newer.

## Commands

Run commands from the repository root:

```sh
# Sustained benchmark, currently roughly 50 seconds
bun --filter @chevrotain/lookahead-dfa-benchmark benchmark

# Short equivalence and execution smoke test
bun --filter @chevrotain/lookahead-dfa-benchmark test

# Typecheck and smoke test
bun --filter @chevrotain/lookahead-dfa-benchmark ci
```

The smoke test verifies benchmark behavior without collecting sustained timing
samples or asserting noisy throughput thresholds.

## Report

The sustained benchmark overwrites the ignored report at
`packages/lookahead-dfa-benchmark/report/lookahead_dfa_benchmark.md`.

The report contains:

- A scenario and metric legend.
- Production selection wins, mistakes, and near ties.
- Runtime results grouped by Dense DFA wins, Path Scan wins, and results within
  the configured threshold.

Higher `M/s` values are better. Sustained timing is sensitive to the Node.js and
V8 versions, platform, background load, and input distribution recorded in the
report.

## Adding Scenarios

Scenarios live in `src/scenarios.ts`. Each scenario defines:

- `shape`: the grammar structure, such as `Single K3 non-shared x2`.
- `workload`: an optional input distribution; omitted workloads render as
  `representative`.
- `kind`: `or` or `single`.
- `paths`: Chevrotain lookahead paths.
- `inputs`: representative token-type sequences.

Run the smoke test after changing scenarios. It compares both implementations
before timing them, so a throughput result is not meaningful until equivalence
passes.

## Browser Macrobenchmark

This package isolates lookahead behavior under Node.js. It complements, rather
than replaces, the
[browser macrobenchmark](../chevrotain/benchmark_web/README.md) for end-to-end
JSON, CSS, and ECMAScript runtime and initialization measurements.
