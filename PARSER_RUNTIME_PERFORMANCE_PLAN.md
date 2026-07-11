# Parsing Runtime Performance Plan

Plan file: `PARSER_RUNTIME_PERFORMANCE_PLAN.md` at the repository root.

## Goal And Scope

Improve valid-input parser throughput for the existing JSON, CSS, and ECMAScript 5 workloads while reusing a singleton parser and pre-tokenized input. The primary target is the benchmark's current configuration: `EmbeddedActionsParser`, `outputCst: false`, `recoveryEnabled: false`, and `maxLookahead: 2` (`benchmark_web/parsers/options.js:1-22`). Lexing, parser construction/self-analysis, and grammar-specific semantic work are out of scope except where benchmark correctness requires setup changes.

The expected percentages below are hypotheses, not measured promises. They are non-additive because several changes remove overlapping call/allocation overhead. Confidence describes confidence that the optimization opportunity is real; confidence in the exact percentage is one level lower unless stated otherwise. **Only Phase 0 is approved for the first implementation cycle; all runtime phases remain a deferred candidate backlog.**

## Investigation Summary

- Parser-only mode already tokenizes once and reuses the token vector (`benchmark_web/parsers/api.js:29-59`), so it conceptually targets the requested flow.
- Its timing is not currently parser-only: every parse includes two worker messages, event-loop scheduling, deferred Benchmark.js resolution, reset/input assignment, result allocation, and error inspection (`benchmark_web/parsers/worker_impel.js:28-55`, `benchmark_web/lib/iframe_loader.js:15-31`).
- Worker failures are posted as `1` but ignored by the iframe, so a parser that fails quickly can look faster (`worker_impel.js:50-55`).
- ECMA5 does not set `parserInstance.orgText`, so line-terminator/ASI checks inspect an empty string and omit intended parse work (`benchmark_web/parsers/ecma5/ecma5_parser.js:19-21`, `:867-885`).
- JSON stresses `CONSUME`, `SUBRULE`, `OPTION`, `MANY`, and one large cached OR (`json_parser.js:65-154`). CSS is repetition-, rule-, and OR-heavy and includes `MANY_SEP` (`css_parser.js:255-588`). ECMA5 is rule-heavy and uniquely exercises GATE predicates and K>1 decisions.
- The runtime still eagerly creates repetition-recovery argument arrays and separator closures even when recovery is disabled (`recognizer_engine.ts:430-442`, `:472-501`, `:547-561`, `:590-616`).
- Embedded-actions parsing still evaluates CST labels and calls CST no-ops for every terminal/subrule/rule (`recognizer_engine.ts:687-723`, `:745-775`, `:859-871`; `tree_builder.ts:55-60`).
- Gated OPTION/MANY/AT_LEAST_ONE create wrapper closures per DSL invocation, and gated OR creates a predicate array per decision (`recognizer_engine.ts:354-365`, `:398-409`, `:526-537`; `lookahead.ts:171-216`).
- Rules use rest parameters plus `apply`, and subrules use the same generic path even though most invocations have no `ARGS` (`recognizer_engine.ts:226-279`, `:702-724`).
- Separated repetitions match the separator, then `CONSUME` reads and matches the same token again (`recognizer_engine.ts:474-485`, `:590-600`).
- Multi-token lookahead linearly rechecks shared prefixes, while every decision also composes a numeric key and performs `Map.get` (`lookahead.ts:248-279`, `:325-345`; `looksahead.ts:174-194`).
- Historical parser wins came from the same strategy proposed here: specialize the common case once at initialization. Recent work reports a 12-15% pure-parse gain, and older changes report up to 12% from optional-feature specialization (`packages/website/docs/changes/CHANGELOG.md:26-33`; commits `8ccedfbf`, `cea2be02`, `719598c9`).

## Phase 0: Make Parser Measurements Trustworthy

1. Add an explicit worker setup step that constructs the parser, tokenizes once, validates a complete successful parse, and records input bytes, token count, token-stream checksum, grammar identity, parser config, build/version, and browser engine.
2. Time a batch of parses inside the worker with `performance.now()`, returning elapsed time and completed iteration count once per batch. Keep `parser.input = tokens` and the root-rule call in each iteration because that is the supported singleton parser lifecycle; move messaging, deferred resolution, result-object creation, and UI work outside per-parse timing.
3. Propagate `{ok, error, requestId}` responses and abort a sample on any lex/parse/worker error. Verify token-vector length/checksum before and after each batch because root parsing temporarily appends EOF sentinels (`recognizer_engine.ts:914-949`).
4. Give each grammar/configuration an isolated worker and warm it by elapsed time until throughput stabilizes. Alternate baseline and candidate trials rather than comparing stale localStorage point estimates.
5. Fetch the ECMA source from the versioned `benchmark@2.1.4` URL, set `parserInstance.orgText = text`, and add a small ASI/line-terminator correctness check before timing.
6. Keep the existing three grammars unchanged apart from correctness/setup fixes. Add focused microbenchmarks for individual kernels so grammar callback allocations do not hide library changes.

Expected result: no library speedup; worker overhead becomes amortized to below 1% of a sufficiently sized batch, failed parses cannot produce false wins, and run-to-run noise should fall materially. Confidence: **high**.

Phase 0 verification:

1. Exercise successful and intentionally failing setup/batch requests for all three grammars.
2. Verify each batch completes the requested parse count, produces no parser errors, and leaves the reusable token vector unchanged.
3. Compare repeated-run variance before and after batching and report worker overhead as a fraction of measured batch time.
4. Run the parser-only benchmark on Node 26 and current Chromium and record the reproducibility metadata emitted by the harness.

## Mandatory Review Gate

Implement **only Phase 0** first. When it is complete, report the harness changes, correctness checks, baseline JSON/CSS/ECMA5 results, variance, and any remaining measurement limitations, then stop and wait for human feedback and explicit approval. Do not modify parser runtime code or prototype Phases 1-6 during that implementation cycle.

## Deferred Phase 1: Remove Eager Hot-Path Allocations

Implement and benchmark each item independently:

1. Guard repetition recovery before constructing recursive argument arrays and separator lookahead closures. Preserve the existing recovery implementation unchanged when recovery is enabled.
2. Replace gated OPTION/MANY/AT_LEAST_ONE wrapper closures with explicit predicate-plus-lookahead branches. Predicates must still be evaluated on every repetition iteration.
3. Remove gated OR's `orAlts.map(...)`; read each current alternative's `GATE` directly while preserving alternative order and parameter-dependent closures.

Expected result: **2-6% aggregate** across the three current workloads, likely strongest on CSS and ECMA5; lower young-generation allocation and minor-GC frequency. Confidence: **high** that allocations are removed, **medium** for the aggregate gain.

Correctness focus: recovery on/off, GATE getters and closure variables, gates that alternate truth values, stuck-loop prevention, all repetition forms, categories, and dynamic tokens.

## Deferred Phase 2: Specialize The Default No-CST/No-Recovery Kernel

Select implementations once during parser initialization instead of branching or calling no-ops at every event:

1. Add a no-recovery `consumeInternal` fast path for successful token consumption that does not enter recovery catch logic. Mismatches must still create the same recognition error and be converted at the root as today.
2. Add no-CST terminal and subrule paths that do not resolve `LABEL`, call `cstPostTerminal`, call `cstPostNonTerminal`, or execute partial-CST exception handling.
3. Remove no-CST rule entry/exit no-op calls where doing so does not change supported override behavior.
4. Keep existing generic CST/recovery paths intact and select them for `CstParser` or recovery-enabled configurations.

Expected result: **4-10% aggregate** for the benchmark's default mode because this affects every consumed token and nested rule. Confidence: **medium-high** for a gain, **medium** for the range because current V8 may inline some no-ops and try blocks.

Correctness focus: exact errors, custom error providers, token categories, labels, recovery insertion/deletion/resync, partial CSTs, public `currCSTNode`, arbitrary root rules, and subclass/custom adapter behavior.

## Deferred Phase 3: Add Zero-Argument Rule Fast Paths

1. Create a zero-argument core/root rule wrapper that uses a direct `call` rather than rest arguments plus `apply`.
2. Have `SUBRULE` select that path when `options?.ARGS` is absent; retain the generic path for parameterized rules.
3. Experiment separately with a no-recovery nested-rule wrapper that lets recognition exceptions bubble to the root while preserving `finally` state unwinding. Do not combine this riskier change with the zero-argument patch until the simpler result is measured.

Expected result: **2-6%** on rule-dense CSS/ECMA5 and **1-4% aggregate**; reduced arrays/indirect calls and better inlining. Confidence: **medium**.

Correctness focus: root arguments, `SUBRULE(..., {ARGS})`, `recoveryValueFunc`, rule inheritance/`OVERRIDE_RULE`, user-thrown exceptions, backtracking, hooks, and stack restoration.

## Deferred Phase 4: Tighten Repetition Loops

1. In `MANY_SEP`/`AT_LEAST_ONE_SEP`, consume a separator already proven to match through an internal known-match path instead of running generic `CONSUME` matching again. Still perform required CST posting in CST mode.
2. Benchmark a standard-token-vector progress-check specialization that snapshots `currIdx` directly instead of calling `getLexerPosition -> exportLexerState` twice per repetition. Select it only when those adapter methods have not been overridden.
3. Check repetition progress before evaluating the next lookahead so a stuck action does not trigger one extra GATE/lookahead evaluation.

Expected result: **2-6% on CSS separated/repetition-heavy cases**, **1-4% aggregate**, and little effect on grammars without separated lists. Confidence: **high** for duplicate separator work, **medium-low** for progress-check gains.

Correctness focus: custom/lazy/context-sensitive lexer adapters, category separators, recovery-enabled repetitions, zero-consumption actions, gates, and CST labels.

## Deferred Phase 5: Run Lookahead Experiments, Keep Only Cross-Engine Wins

These are experiments rather than committed architecture changes:

1. Compare the current numeric-key `Map` with a compact per-rule lookup table and cached current-rule table pointer. Avoid sparse global arrays because rule/lookahead keys are intentionally large.
2. Compile static predicate-free K>1 paths into an initialization-time token-index trie that reads shared prefixes once. Preserve the current linear path for dynamic tokens and custom lookahead strategies.
3. Evaluate per-expected-token matching so grammars with a few category parents can use direct token-index equality for ordinary concrete tokens.

Expected result: **0-5% aggregate**; potentially **2-8% on ECMA5 or synthetic shared-prefix LL(K) grammars**, but neutral on mostly LL(1) JSON/CSS. Confidence: **medium-low** because engine behavior and workload shape dominate.

Correctness focus: category expansion, dynamic tokens, alternative priority, empty alternatives, predicates, production-level `MAX_LOOKAHEAD`, custom strategies, and misses at every trie depth.

## Deferred Phase 6: Secondary Parsing Modes

These do not improve the current default benchmark, so perform them only after Phases 1-5:

1. CST mode: maintain an internal current-CST-node pointer/index and specialize terminal/nonterminal posting by location mode and recovery mode, while preserving the public `currCSTNode` accessor. Expected **3-8% CST-only**. Confidence: **medium**.
2. Small-input lifecycle: retain safely internal reset arrays and restore token-vector length directly instead of repeated EOF `pop` calls. Expected **less than 1%** on the three large workloads, **3-8%** for tiny repeated parses. Confidence: **medium**.
3. Backtracking: replace cloned state arrays with scalar/index checkpoints and truncate speculative errors. Expected a large targeted gain but no effect on the three current samples. Confidence: **low-medium**, risk **high**.
4. Malformed-input recovery: cache static error lookahead paths and reduce follow/resync allocations. Expected a large malformed-input latency gain but no valid-input throughput gain. Confidence: **high** for the opportunity; explicitly outside the first performance target.

## Deferred Runtime Verification And Acceptance

After separate human approval to proceed beyond Phase 0, apply these checks to every runtime candidate:

1. Add focused tests before changing the hot path, including recovery/CST/custom-adapter variants even when the optimized configuration disables those features.
2. Run package compilation and the complete Chevrotain test suite.
3. Run at least seven alternating baseline/candidate trials after stabilization on Node 26 and current Chromium.
4. Report median parse time, paired percentage delta, confidence interval, relative standard deviation, allocated bytes/parse, and minor-GC count. Compare returned values/errors and final parser/token-vector state.
5. Accept a broad optimization when its median gain is at least 2% with a confidence interval excluding zero on at least two of JSON/CSS/ECMA5 and no material regression elsewhere. Accept targeted changes only when the target workload gains at least 5%, the applicability is documented, and non-target workloads remain neutral.
6. Keep each optimization as a separate commit/benchmark result so regressions and engine-sensitive changes can be dropped independently.

## Deferred Expected Outcome

The realistic target for Phases 1-4 is **8-15% faster parser-only throughput** in the current no-CST/no-recovery benchmark, with the largest gains expected in CSS and ECMA5. A **15-20%** result is a stretch target if rule specialization and lookahead experiments both produce independent wins. These totals are intentionally lower than the sum of individual ranges because their savings overlap.

## Phase 0 Results

Phase 0 was implemented on 2026-07-11 without modifying the library parser runtime. Parser-only runs now use explicit worker setup, worker-timed batches, request IDs and structured failures, input/token checksums, stability-based warmup, paired latest/next sampling, and reproducibility metadata. The ECMA5 source is fetched from the versioned unpkg URL, its parser receives the original source text, and untimed setup validates both return-statement ASI and the illegal newline-after-throw case.

Validation:

- TypeScript compilation and all 786 Chevrotain unit tests pass on Node 26.5.0, including six focused benchmark-harness tests.
- Three complete paired runs pass in headless Chromium 150 on macOS.
- All latest/next input and token metadata match.
- Every warmup reached the stability threshold.
- Worker overhead remained below 1% for every grammar and run.

Representative median local-build results across three independent runs:

| Grammar | Parses/sec | Run-to-run CV | Worker overhead range | Paired speed vs latest |
| ------- | ---------: | ------------: | --------------------: | ---------------------: |
| JSON    |     17,757 |         0.30% |            0.39-0.76% |                100.04% |
| CSS     |      5,301 |         1.01% |            0.41-0.92% |                100.30% |
| ECMA5   |        761 |         0.41% |            0.81-0.86% |                100.44% |

The prior one-message-per-parse path reported 13,248 JSON, 4,772 CSS, and 747 ECMA5 operations/sec in the same Chromium session. The difference is measurement overhead, not a library speedup: transport understated parser throughput by approximately 25% for JSON, 10% for CSS, and 2% for ECMA5.

Per the mandatory review gate, implementation stops here pending human feedback. Deferred Phases 1-6 have not been started.
