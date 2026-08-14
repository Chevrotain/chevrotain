# Profitable Static DFA Results

## Summary

Chevrotain now has two production lookahead paths in this worktree:

1. The unchanged original implementation in `lookahead.ts`.
2. A runtime-built DFA in `@chevrotain/lookahead-dfa` for measured profitable
   shapes.

There is no indexed-static-K2 implementation and no source-code generation.
The DFA is compiled to an in-memory state graph and dense transition table
during parser self-analysis.

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

`packages/lookahead-dfa/src/` contains:

- Profitability selection.
- One DFA compiler shared by OR and single-production lookahead.
- Two small runtime closures mapping DFA terminal results to OR indexes or
  booleans.

`packages/chevrotain/src/parse/grammar/lookahead_dfa.ts` contains only the
integration wrappers that select the DFA or call the original builders.

The compiler emits a flat transition list, which the runtime converts into a
dense `Int32Array` table keyed by concrete `tokenTypeIdx`. Categories are
expanded during construction. Overlapping category transitions advance all
matching candidates. Completed alternatives are retained as state fallbacks so
empty and short-path priority matches the original source-order semantics.

The wrappers retain:

- Predicate and dynamic-token fallback.
- Profitability and dense-table-cap selection.
- Fallback wrappers calling the original builders.

`llk_lookahead.ts` only changes which builder wrappers the default strategy
passes to the existing path-generation functions.

## Selection Policy

The policy is documented beside its implementation in
`packages/lookahead-dfa/src/lookahead_dfa.ts`.

Only multi-token paths participate in profitability selection. Empty and K1
paths do not count as DFA work. The thresholds are:

| Shape                            | Minimum multi-token paths |
| -------------------------------- | ------------------------: |
| Shared first token, OR or Single |                         2 |
| Non-shared OR                    |                         2 |
| Non-shared Single                |                         2 |

First-token sharing does not affect the threshold. Categories are still
expanded by the DFA compiler so concrete tokens and categories overlap
correctly. All-K1 and empty-only path sets remain on Original.

Paths longer than 32 tokens remain on the original implementation. DFA
construction recursively advances one token per state, so this private guard
preserves support for unusually large configured lookahead without risking a
JavaScript call-stack overflow.

The common two-path threshold favors overall throughput. Dense was 45.3% faster
for balanced non-shared OR x2 and 11.4% faster with 80% of inputs matching the
first alternative.

For non-shared Single x2/x3, balanced inputs favored Dense at every measured
depth. With 80% of inputs matching the first path, however, K3 and K4 favored
Original:

| Depth | Balanced x2 | Early-80 x2 | Balanced x3 | Early-80 x3 |
| ----- | ----------: | ----------: | ----------: | ----------: |
| K2    |      +25.9% |       +2.0% |      +49.4% |       +6.1% |
| K3    |      +19.5% |       -6.6% |      +36.6% |       -2.8% |
| K4    |      +12.6% |      -14.0% |      +29.3% |       -9.6% |

The balanced gains are substantially larger than the early-biased losses, so
the selector uses Dense from two paths at every eligible depth. This favors
overall throughput while accepting input-distribution-specific regressions.

## Persistent Microbenchmark

Package: `packages/lookahead-dfa-benchmark`

The benchmark imports the real production modules, compares Path Scan and Dense
DFA, and marks which one the production selector chooses.

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
The latest report contains five selection mistakes over 5%: three selected-Dense
early-biased regressions and two conservative one-multi-path false negatives.
The latter remain in the matrix to inform future selector changes.
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

### Forced-Dense Initialization

This benchmark isolates lookahead construction by comparing two local bundles
from the same source revision:

- Forced Original uses the original builders for every decision.
- Forced Dense ignores profitability and builds Dense for every technically
  eligible decision.

The existing browser benchmark's **Init Parser** mode was used with
`maxLookahead: 2`, CST output disabled, 100 warmup constructions, and
Benchmark.js `minSamples: 25`. Each value below came from a fresh headless
Chrome 151 process on macOS arm64.

| Grammar    | Original times (us)       | Dense times (us)          | Original median | Dense median |          Overhead |
| ---------- | ------------------------- | ------------------------- | --------------: | -----------: | ----------------: |
| JSON       | 1049.39, 975.89, 1042.34  | 1058.23, 1059.56, 1046.62 |      1042.34 us |   1058.23 us |  15.89 us (1.52%) |
| CSS        | 1901.28, 1920.94, 1912.19 | 1971.87, 1983.05, 1976.02 |      1912.19 us |   1976.02 us |  63.83 us (3.34%) |
| ECMAScript | 4207.36, 4177.35, 4254.81 | 4588.88, 4590.01, 4533.27 |      4207.36 us |   4588.88 us | 381.52 us (9.07%) |

JSON and CSS used Dense for every lookahead decision. Neither grammar exceeded
the dense cell cap. ECMAScript used Dense for every decision except the one OR
with a runtime `GATE`, which must retain Original predicate handling. Its four
OPTION gates remain Dense-compatible because those predicates are evaluated
outside the lookahead closure. ECMAScript also had no dense-cap fallback.

These measurements cover repeated parser construction logic, not module loading
or a real process cold start.

### Selector Matrix Initialization

The previous production selector and the new threshold matrix were compared
using the same Init Parser protocol and three fresh Chrome processes per
grammar. The forced-Dense measurements above remain the upper bound; this table
shows the incremental cost of broadening only shared narrow decisions.

| Grammar    | Previous-selector times (us) | Matrix-selector times (us) | Previous median | Matrix median |             Change |
| ---------- | ---------------------------- | -------------------------- | --------------: | ------------: | -----------------: |
| JSON       | 1077.08, 1118.91, 1139.83    | 1132.60, 1100.90, 1128.43  |      1118.91 us |    1128.43 us |    9.52 us (0.85%) |
| CSS        | 1965.96, 2047.78, 1986.67    | 2034.43, 1981.59, 1927.85  |      1986.67 us |    1981.59 us |  -5.08 us (-0.26%) |
| ECMAScript | 4771.31, 4597.36, 4637.23    | 4686.94, 4625.51, 4626.50  |      4637.23 us |    4626.50 us | -10.73 us (-0.23%) |

All three changes are within process-to-process variation; no measurable parser
initialization penalty was observed from the selector change.

The initialization cost is acceptable without recurring per-shape measurement.
Even forcing every technically eligible decision to Dense increased ECMAScript
parser initialization by 9.07%, with smaller increases for CSS and JSON; the
production selector uses Dense for only a subset of decisions. If initialization
later becomes material, an optional code-generation path could precompute the
DFA structures instead of rebuilding them during parser construction.

## Correctness And CI

The package and Chevrotain `lookahead_dfa_spec.ts` suites cover:

- OR and single profitability boundaries.
- Wide shared prefixes.
- Overlapping categories at multiple states.
- Empty and short-path priority.
- Predicate and dynamic-token fallback.
- Miss and EOF behavior.
- Forty deterministic randomized K1-K4 fixtures compared exhaustively with
  the original OR and single builders.

Verification:

- Extracted DFA package suite: 17 passing.
- Full Chevrotain package: 796 passing.
- DFA benchmark smoke: 36 scenarios and 72 variants passing.
- Full monorepo CI: 15 of 15 tasks successful.
- Formatting and TypeScript compilation pass.

## Recommendation

Use Dense for OR and Single decisions with at least two multi-token paths. This
captures the larger balanced gains for deep non-shared Single decisions while
accepting smaller early-biased regressions.
