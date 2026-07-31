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

Per the mandatory review gate, runtime implementation stopped here pending human feedback. The later Phase 1 potential check below was performed after approval.

## Phase 1 Potential Results

Phase 1 was experimentally evaluated on 2026-07-25. The baseline import was temporarily pinned to `chevrotain@13.0.0`; Phase 0 contains no parser runtime changes relative to that release. An unchanged local build compared neutral with the pinned bundle before the experiments: +0.26% JSON, +0.16% CSS, and -0.06% ECMA5 in one paired run.

The source-level opportunity count per parse was:

| Candidate                               |       JSON |                           CSS |          ECMA5 |
| --------------------------------------- | ---------: | ----------------------------: | -------------: |
| Skip disabled-recovery repetition setup | 133 arrays | 1,449 arrays and 222 closures |   9,297 arrays |
| Remove gated OPTION wrapper             | 0 closures |                    0 closures | 2,711 closures |
| Remove gated MANY/AT_LEAST_ONE wrappers |          0 |                             0 |              0 |
| Remove gated OR predicate array         |          0 |                             0 |              0 |

Three independent headless Chromium runs were collected for each implemented candidate. Each run used the Phase 0 harness's 25 alternating paired samples. The reported confidence intervals are 10,000-sample percentile bootstrap intervals over the 75 pooled paired ratios; RSD is calculated over the candidate parse-time samples.

| Candidate                                | Grammar | Median paired change |           95% CI |   RSD | Independent run medians |
| ---------------------------------------- | ------- | -------------------: | ---------------: | ----: | ----------------------- |
| Guard disabled-recovery repetition setup | JSON    |               +0.09% | -0.09% to +0.18% | 2.02% | +0.09%, +0.09%, -0.09%  |
|                                          | CSS     |               -0.72% | -1.08% to -0.42% | 2.14% | -1.13%, -0.68%, -0.55%  |
|                                          | ECMA5   |               -0.23% | -0.54% to -0.03% | 1.63% | -0.39%, +0.20%, -0.36%  |
| Direct gated OPTION branch               | JSON    |               -3.82% | -3.92% to -3.66% | 2.52% | -3.57%, -3.66%, -4.27%  |
|                                          | CSS     |               +0.21% | +0.11% to +0.37% | 2.00% | +0.05%, +0.05%, +0.59%  |
|                                          | ECMA5   |               +2.25% | +2.10% to +2.31% | 1.32% | +2.30%, +2.21%, +2.25%  |

Environment: Node 26.5.0, Bun 1.3.11, headless Chromium 150, macOS. Every run stabilized and kept worker overhead below 1%.

Both candidates were dropped. The repetition guards were neutral or slower despite making the allocation expressions unreachable. The direct gated OPTION branch produced a repeatable ECMA5 gain but missed the 5% targeted threshold and materially regressed JSON due to the changed shared function shape. A second OPTION layout that preserved the ungated source path produced the same result; the table reports that final layout. No combined candidate was measured because neither isolated candidate passed its acceptance threshold.

Gated MANY, gated AT_LEAST_ONE, and gated OR were not implemented because the current samples execute none of those paths. A synthetic gated-OR probe showed that its kernel can improve, but it is outside the current workload target and direct gate access changes eager `GATE` getter semantics.

The experimental runtime and test changes were reverted. Allocation and minor-GC profiling was not pursued because no throughput candidate survived and the current browser harness does not expose those metrics. Phase 1 therefore produces no parser runtime change.

## Phase 2 Potential Results

Phase 2 was experimentally evaluated on 2026-07-25 against a frozen local `e32c96b4` bundle built with the same toolchain as every candidate. Its SHA-256 was `8781bcb46b1f06cdd687fb19e4d54e01b1b42664557932cd6720d76859184a5a`. An unchanged local A/A run was neutral: -0.13% JSON, +0.41% CSS, and +0.33% ECMA5.

Candidates with a material regression were stopped after one 25-pair screening session:

| Candidate                              |   JSON |    CSS |  ECMA5 | Decision                           |
| -------------------------------------- | -----: | -----: | -----: | ---------------------------------- |
| No-recovery `consumeInternal`          | -3.45% | -0.50% | +0.21% | Dropped: material JSON regression  |
| Combined no-CST terminal/subrule posts | -2.20% | +1.74% | +0.59% | Split because the result was mixed |
| No-CST terminal post only              | -3.49% | -0.55% | -0.27% | Dropped: material JSON regression  |

The remaining candidates completed three independent headless Chromium sessions. Each session used 25 alternating paired samples. Confidence intervals use 10,000 stratified paired bootstrap resamples within sessions; RSD is calculated over candidate parse-time samples.

| Candidate                   | Grammar | Median paired change |           95% CI |   RSD | Independent run medians |
| --------------------------- | ------- | -------------------: | ---------------: | ----: | ----------------------- |
| No-CST subrule post only    | JSON    |               +1.05% | +0.86% to +1.30% | 1.14% | +1.04%, +1.46%, +0.68%  |
|                             | CSS     |               +2.12% | +1.83% to +2.25% | 1.46% | +2.54%, +1.80%, +2.13%  |
|                             | ECMA5   |               +1.22% | +0.75% to +1.61% | 1.09% | +2.78%, +0.35%, +0.63%  |
| No-CST subrule catch        | JSON    |               -0.30% | -0.51% to -0.04% | 1.68% | -0.00%, +0.00%, -0.70%  |
|                             | CSS     |               +0.36% | +0.16% to +0.42% | 1.31% | +0.77%, -0.10%, +0.26%  |
|                             | ECMA5   |               +0.12% | +0.00% to +0.30% | 0.91% | +0.09%, +0.27%, +0.09%  |
| No-CST rule lifecycle hooks | JSON    |               +0.26% | +0.00% to +0.52% | 1.38% | +0.26%, +0.61%, -0.00%  |
|                             | CSS     |               +0.89% | +0.57% to +1.28% | 1.19% | +1.71%, +1.26%, +0.41%  |
|                             | ECMA5   |               +0.52% | +0.12% to +0.79% | 1.38% | +0.12%, +0.03%, +1.75%  |

Environment: Node 26.5.0, Bun 1.3.11, headless Chromium 150, macOS. Every warmup stabilized. Candidate worker overhead checks remained below 1%; the A/A CSS post-measurement check was 1.03% after calibration had met the threshold.

No candidate met the broad acceptance requirement of at least 2% on two workloads. The strongest result, removing successful no-CST subrule posting, reached +2.12% on CSS but only +1.05% on JSON and +1.22% on ECMA5. Removing terminal posting caused the same large JSON regression seen when changing other shared hot function shapes. Removing subrule catches and rule CST hooks was neutral to small.

Because no isolated candidate survived, no combined or Node acceptance benchmark was run. The experimental runtime and test changes, local baseline artifact, and temporary baseline import were reverted. Allocation and minor-GC profiling was again skipped because no throughput candidate survived. Phase 2 therefore produces no parser runtime change.

## Phase 3 Potential Results

Phase 3 was experimentally evaluated on 2026-07-25 against the same frozen local `e32c96b4` bundle and toolchain used for Phase 2. Its SHA-256 was `8781bcb46b1f06cdd687fb19e4d54e01b1b42664557932cd6720d76859184a5a`. An unchanged local A/A run was neutral: +0.00% JSON, +0.67% CSS, and +0.21% ECMA5.

Instrumentation showed that every timed nested rule invocation was zero-argument:

| Opportunity per parse                 |  JSON |   CSS |  ECMA5 |
| ------------------------------------- | ----: | ----: | -----: |
| Root calls without arguments          |     1 |     1 |      1 |
| Nested `SUBRULE` calls without `ARGS` | 1,607 | 4,122 | 20,301 |
| Nested calls with `ARGS`              |     0 |     0 |      0 |

Each candidate completed one stabilized Chromium screening session with 25 alternating paired samples:

| Candidate                                |   JSON |    CSS |  ECMA5 | Decision                                           |
| ---------------------------------------- | -----: | -----: | -----: | -------------------------------------------------- |
| Direct no-argument `SUBRULE` dispatch    | +0.17% | -0.59% | +0.58% | Dropped: fewer than two plausible 1% gains         |
| Additive zero-argument core wrapper      | -0.69% | -0.41% | +0.72% | Dropped: fewer than two plausible 1% gains         |
| No-recovery nested wrapper without catch | +0.00% | +0.51% | +0.09% | Dropped: neutral; CSS overhead check reached 1.02% |

Environment: Node 26.5.0, Bun 1.3.11, headless Chromium 150, macOS. Every warmup stabilized. Candidate S and W worker overhead checks remained below 1%; candidate N's CSS post-measurement check was 1.02% after calibration had met the threshold.

The direct dispatch result shows that V8 already optimizes `apply(this, undefined)` effectively. Adding one zero-argument core wrapper per grammar rule, then replacing both the outer `apply` and inner rest/`impl.apply` path, remained neutral and increased wrapper count. Removing nested catches while retaining `finally` state unwinding was also neutral.

The root-only fast path was not implemented because it has one event per parse and cannot meet the broad acceptance threshold without changing a shared wrapper shape. No candidate reached the promotion rule for three-session confidence intervals, so no combination, Node acceptance benchmark, or allocation profiling was run.

The experimental runtime and test changes, local baseline artifact, and temporary baseline import were reverted. Phase 3 therefore produces no parser runtime change.

## Phase 4 Potential Results

Phase 4 was experimentally evaluated on 2026-07-25 against the same frozen local `e32c96b4` bundle and toolchain used for Phases 2-3. Its SHA-256 was `8781bcb46b1f06cdd687fb19e4d54e01b1b42664557932cd6720d76859184a5a`. An unchanged local A/A run was neutral: +0.26% JSON, +0.87% CSS, and -0.18% ECMA5.

The exact valid-workload opportunities were:

| Opportunity per parse                             |  JSON |   CSS |  ECMA5 |
| ------------------------------------------------- | ----: | ----: | -----: |
| Non-separated repetition bodies                   |   725 | 1,002 |  3,596 |
| Progress-helper method calls removable            | 2,900 | 4,008 | 14,384 |
| Proven `MANY_SEP` separators consumed generically |     0 |   336 |      0 |
| Stuck/zero-progress bodies                        |     0 |     0 |      0 |

Each implemented candidate completed one stabilized Chromium screening session with 25 alternating paired samples:

| Candidate                             |   JSON |    CSS |  ECMA5 | Decision                                                    |
| ------------------------------------- | -----: | -----: | -----: | ----------------------------------------------------------- |
| Known-match `MANY_SEP` consumption    | +0.09% | -1.05% | -0.97% | Dropped: CSS missed the targeted 5% threshold and regressed |
| Direct `currIdx` progress upper bound | +0.13% | +1.04% | -1.32% | Dropped: fewer than two plausible 1% gains                  |

Environment: Node 26.5.0, Bun 1.3.11, headless Chromium 150, macOS. Every warmup stabilized and worker overhead checks remained below 1%.

The separator candidate successfully removed the second category-aware token match for all 336 CSS separators while preserving token advancement and CST posting, but the changed loop shape was slower. The progress candidate removed the complete default `getLexerPosition -> exportLexerState` method chain, yet only CSS reached +1%; V8 already inlines the default path effectively. Because this unsafe upper bound was not promising, the custom-adapter-safe selector was not implemented.

Progress-before-lookahead ordering was intentionally skipped. Valid benchmark actions never get stuck, so it removes no work and would change observable gate/custom-lookahead callback counts only for invalid or runtime-conditional grammar flow.

No candidate reached promotion to three-session confidence intervals. No combination, Node acceptance benchmark, or allocation profiling was run. The experimental runtime and test changes, local baseline artifact, and temporary baseline import were reverted. Phase 4 therefore produces no parser runtime change.

## Phase 5 Potential Results

Phase 5 was experimentally evaluated on 2026-07-26 against the same frozen local `e32c96b4` bundle used for Phases 2-4. An unchanged local Chromium A/A run was neutral: +0.17% JSON, -0.16% CSS, and +0.32% ECMA5.

The measured opportunities per parse were:

| Opportunity                                    |  JSON |   CSS |          ECMA5 |
| ---------------------------------------------- | ----: | ----: | -------------: |
| Lookahead-cache reads                          | 1,125 | 4,848 |         26,512 |
| Current K>1 `LA_FAST` reads                    |     - |     - |         44,474 |
| Modeled indexed K=2 `LA_FAST` reads            |     - |     - |          2,321 |
| Generic concrete/category-parent token matches |     - |     - | 37,228 / 7,246 |

Three candidates were screened independently in headless Chromium with 25 alternating paired samples per session:

| Candidate                                      |   JSON |    CSS |   ECMA5 | Decision                                     |
| ---------------------------------------------- | -----: | -----: | ------: | -------------------------------------------- |
| Compact per-rule lookahead tables, median of 3 | +5.36% | +9.32% | +11.28% | Cross-engine validation                      |
| Indexed static K=2 paths                       | -0.51% | +0.50% | +17.54% | Cross-engine validation                      |
| Per-expected-token direct matching             | -0.25% | -0.20% |  +0.50% | Dropped: neutral                             |
| Combined tables and indexed K=2 paths          | +6.27% | +2.88% | +24.97% | Not retained independently of its components |

The compact-table candidate failed under Bun 1.3.11: -0.76% JSON, -1.66% CSS, and -2.10% ECMA5. It was dropped despite its repeatable Chromium gains.

The K=2 candidate was narrowed to shared first-token prefixes and dispatched outside the existing generic builders to preserve their runtime shape. Its final cross-engine screening results were:

| Engine       |   JSON |    CSS |   ECMA5 |
| ------------ | -----: | -----: | ------: |
| Chromium 150 | +0.26% | +1.04% | +16.78% |
| Node 26.5.0  | -2.71% | -0.44% |  +6.72% |
| Bun 1.3.11   | -0.11% | +0.53% | +12.85% |

The K=2 specialization exceeded the targeted 5% ECMA5 threshold in every engine, but Node's material JSON regression violated the non-target neutrality requirement. All 791 unit tests, including an empty-alternative priority regression test, passed while the candidate was present.

No Phase 5 candidate met the cross-engine acceptance gate. The experimental runtime and test changes, local baseline artifact, and temporary baseline import were reverted. Phase 5 therefore produces no parser runtime change.

## V8-First Lookahead Follow-Up

Lookahead experiments were revisited on 2026-07-26 with Chromium and Node treated as acceptance engines and Bun performance made advisory. A retained Node parser-only runner now executes both artifacts in isolated VM contexts on one thread, reuses the Chromium calibration/statistics code, and reverses setup order between runs. Balanced A/A sessions were within 1% after pooling on Node 24.18.0 and Node 26.5.0.

A runtime-weighted census reduced the candidate set:

| Grammar | LL(1) decisions/calls | Shared K=2 decisions/calls | Other executed shapes |
| ------- | --------------------: | -------------------------: | --------------------: |
| JSON    |             6 / 1,850 |                      0 / 0 |                     0 |
| CSS     |            34 / 5,850 |                      0 / 0 |                     0 |
| ECMA5   |           54 / 28,433 |                  5 / 1,621 |                     0 |

One-path K>1, mixed K=2, and gated decisions were not implemented because the benchmark executes none of them. The remaining independent candidates completed one screening session per engine unless noted:

| Candidate                           |  Chromium JSON/CSS/ECMA5 |   Node 24 JSON/CSS/ECMA5 |   Node 26 JSON/CSS/ECMA5 | Decision                                                                                    |
| ----------------------------------- | -----------------------: | -----------------------: | -----------------------: | ------------------------------------------------------------------------------------------- |
| Compact per-rule tables             | +6.41% / +3.64% / +5.84% | +2.05% / +0.31% / +0.43% | +1.28% / -1.09% / -1.42% | Dropped: Chromium win did not generalize to Node; medians of 3 Chromium and 2 Node sessions |
| Cache shared K=2 token reads        | +1.79% / +0.10% / -0.94% | -0.26% / -0.59% / +1.23% | -0.19% / +0.35% / +0.23% | Dropped: neutral                                                                            |
| Direct numeric key composition      | -4.36% / +0.36% / -0.81% | -0.84% / -0.46% / +2.50% | -0.74% / +1.04% / +0.67% | Dropped: Chromium JSON regression                                                           |
| Direct `Map.get` at DSL call sites  | -4.00% / +0.05% / +0.30% | -0.25% / +0.25% / +1.30% | -1.89% / +1.29% / +1.96% | Dropped: JSON regression                                                                    |
| Fixed comparisons for 1-4 LL(1) IDs | +7.20% / +0.87% / +1.21% | +0.35% / -1.58% / -0.28% | +1.84% / -3.79% / +3.34% | Dropped: Node CSS regression                                                                |
| Dense typed LL(1) tables            | -2.82% / -0.10% / -1.69% | -0.94% / -0.60% / +0.71% | -1.88% / -0.77% / -1.51% | Dropped: broad regressions                                                                  |
| Current-rule inner-table pointer    | -0.26% / +1.52% / +4.89% | -4.16% / -7.81% / +2.06% | -0.08% / -0.07% / +1.88% | Dropped: Chrome gains did not generalize to Node 24                                         |

The current-rule pointer candidate moved the outer table lookup to rule entry and restored the parent table on rule exit and backtracking-state reload. It passed all 791 unit tests, including a focused nested-rule restoration case. Results are medians of three Chromium and two balanced Node sessions; the advisory Bun screen was -6.39% JSON, -7.41% CSS, and -5.08% ECMA5.

All experimental runtime and focused test changes were reverted. The Node benchmark runner and its documentation were retained; this follow-up produces no parser runtime change.
