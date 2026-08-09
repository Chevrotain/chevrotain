# Profitable Static DFA Results

## Summary

Chevrotain now has two production lookahead paths in this worktree:

1. The unchanged original implementation in `lookahead.ts`.
2. A runtime-built DFA in `lookahead_dfa.ts` for measured profitable shapes.

There is no indexed-static-K2 implementation and no source-code generation.
The DFA is built as in-memory state and transition objects during parser
self-analysis.

Chrome 151 results:

- ECMAScript 5 parser-only throughput: approximately 17% faster.
- JSON parser-only throughput: within noise, approximately 1% slower.
- CSS parser-only throughput: within noise, approximately neutral.
- ECMAScript parser initialization: approximately 2% slower, about 0.1 ms.

Full repository CI passes.

## Worktree

- Path: `/Users/shacharsoel/SAPDevelop/github.com/bd82/chevrotain/.worktrees/profitable-static-dfa`
- Branch: `perf/profitable-static-dfa`
- Base: `master` at `36a813ff`

## Production Design

### Original Fallback

`packages/chevrotain/src/parse/grammar/lookahead.ts` is unchanged.

The original implementation remains active for:

- K1 lookahead.
- Predicate OR decisions.
- Dynamic tokens.
- Static decisions below the profitability threshold.

### DFA

`packages/chevrotain/src/parse/grammar/lookahead_dfa.ts` contains:

- Profitability selection.
- One DFA compiler shared by OR and single-production lookahead.
- Two small runtime closures mapping DFA terminal results to OR indexes or
  booleans.
- Fallback wrappers calling the original builders.

States use null-prototype transition objects keyed by concrete
`tokenTypeIdx`. Categories are expanded during construction. Overlapping
category transitions advance all matching candidates. Completed alternatives
are retained as state fallbacks so empty and short-path priority matches the
original source-order semantics.

`llk_lookahead.ts` only changes which builder wrappers the default strategy
passes to the existing path-generation functions.

## Selection Policy

The policy is documented beside its implementation in `lookahead_dfa.ts`.

For each concrete first-token bucket:

```text
candidateCount = matching non-empty paths
score = sum(path.length - 1)
```

OR selects DFA when:

```text
candidateCount >= 2 && score >= 5
```

Single/optional/repetition lookahead selects DFA when:

```text
candidateCount >= 5 && score >= 5
```

All-K1 path sets exit before allocating bucket data. Threshold evaluation also
returns immediately once a qualifying bucket is found.

Paths longer than 32 tokens remain on the original implementation. DFA
construction recursively advances one token per state, so this private guard
preserves support for unusually large configured lookahead without risking a
JavaScript call-stack overflow.

The different OR and single candidate thresholds are intentional. The
original OR scanner pays for preceding alternatives, while the original
single scanner is cheaper. Chrome measurements found single K3 x3 regressed
about 22%, K3 x4 was neutral, and K3 x5 improved about 17%.

## Persistent Microbenchmark

Package: `packages/lookahead-dfa-benchmark`

The benchmark imports the real production modules, compares the original and
DFA implementations, and marks which one the production selector chooses.

Run it with:

```sh
bun --filter @chevrotain/lookahead-dfa-benchmark benchmark
```

The full benchmark takes roughly 20 seconds. CI runs a short smoke mode that
verifies every scenario and timing path without collecting sustained
measurements or asserting noisy throughput thresholds. Full results overwrite
the ignored
`packages/lookahead-dfa-benchmark/report/lookahead_dfa_benchmark.md` report.
The report separately lists production choices that are more than the
configurable `MAX_SELECTION_REGRESSION_PERCENT` slower than the alternative.
The results below were measured using the original Chrome 151 browser harness
and are retained as historical data; they are not directly comparable to
Node.js measurements.

### OR Results

Forced-DFA throughput relative to the original implementation:

| Shape               | Forced DFA | Production selection |
| ------------------- | ---------: | -------------------- |
| K1 x8               |        31% | Original             |
| K2 x2               |       104% | Original             |
| K2 x3               |       140% | Original             |
| K2 x4               |       188% | Original             |
| K2 x5               |       230% | DFA                  |
| K2 x8               |       443% | DFA                  |
| K2 x22              |     2,156% | DFA                  |
| K2 x36              |     3,401% | DFA                  |
| K3 x2               |        88% | Original             |
| K3 x3               |       117% | DFA                  |
| K3 x4               |       168% | DFA                  |
| K3 x5               |       219% | DFA                  |
| K3 x8               |       454% | DFA                  |
| Mixed K1-K3         |       177% | DFA                  |
| K2 category overlap |       191% | Original             |
| K2 final empty      |       115% | Original             |

The policy deliberately leaves several synthetic wins unused. K2 x3/x4,
category overlap, and final-empty results are not enough evidence to broaden
selection without real grammar distributions.

### Single Results

Forced-DFA throughput relative to the original implementation:

| Shape       | Forced DFA | Production selection |
| ----------- | ---------: | -------------------- |
| K1 x8       |        34% | Original             |
| K2 x2       |        71% | Original             |
| K2 x3       |        93% | Original             |
| K2 x4       |       120% | Original             |
| K2 x5       |       140% | DFA                  |
| K2 x8       |       212% | DFA                  |
| K2 x22      |       583% | DFA                  |
| K2 x36      |       982% | DFA                  |
| K3 x2       |        60% | Original             |
| K3 x3       |        78% | Original             |
| K3 x4       |       101% | Original             |
| K3 x5       |       117% | DFA                  |
| K3 x8       |       183% | DFA                  |
| Mixed K1-K3 |       117% | Original             |

Selected-but-ineligible cases execute the original closure and remained within
benchmark noise of the direct original variant.

## Browser Macrobenchmarks

Environment:

- Google Chrome 151.0.7922.71
- Headless V8 on macOS
- Locally built master and candidate bundles
- Parser-only, `maxLookahead: 2`, CST output disabled

### ECMAScript 5

Two fresh baseline/candidate process pairs, two runs per process:

| Session | Master ops/s   | DFA ops/s      | Session midpoint change |
| ------- | -------------- | -------------- | ----------------------: |
| 1       | 806.45, 819.97 | 927.30, 975.22 |                  +17.0% |
| 2       | 783.37, 828.08 | 921.81, 968.93 |                  +17.3% |

The selected DFA covers the hot `Statement` buckets with x22 `Identifier`
paths and x36 `LCurly` paths. Narrow x3/x4 decisions remain original.

### JSON Control

| Master ops/s         | DFA ops/s            |
| -------------------- | -------------------- |
| 12,832.69, 12,995.48 | 12,927.69, 12,688.21 |

The midpoint change is approximately -0.8%, within reported run uncertainty.

### CSS Control

| Master ops/s       | DFA ops/s          |
| ------------------ | ------------------ |
| 4,604.73, 4,719.67 | 4,526.25, 4,830.07 |

The midpoint change is approximately +0.3%, within reported run uncertainty.

### Initialization

ECMAScript parser initialization after adding a no-allocation K1 selector
precheck:

| Master               | DFA candidate        |
| -------------------- | -------------------- |
| 228.88, 232.19 ops/s | 221.61, 229.53 ops/s |
| 4.31-4.37 ms         | 4.36-4.51 ms         |

The midpoint difference is approximately 2.2%, or about 0.1 ms per parser
construction.

## Correctness And CI

`lookahead_dfa_spec.ts` covers:

- OR and single profitability boundaries.
- Wide shared prefixes.
- Overlapping categories at multiple states.
- Empty and short-path priority.
- Predicate and dynamic-token fallback.
- Miss and EOF behavior.
- Forty deterministic randomized K1-K4 fixtures compared exhaustively with
  the original OR and single builders.

Verification:

- Focused DFA suite: 12 passing.
- Full Chevrotain package: 803 passing.
- DFA benchmark smoke: 30 scenarios and 60 variants passing.
- Full monorepo CI: 14 of 14 tasks successful.
- Formatting and TypeScript compilation pass.

## Recommendation

Keep the conservative thresholds for the initial production version. They
capture the real ECMAScript x22/x36 gain while every measured regression stays
on the original implementation.

Use the retained microbenchmark before changing either threshold. A lower OR
threshold may eventually capture x3/x4 wins, but should be justified by actual
grammar frequency distributions rather than synthetic fanout alone.
