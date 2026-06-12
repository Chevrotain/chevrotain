# Hot-Flow Performance Analysis — Lexer

Scope: **lexer flow only**, investigated in small groups of suggestions.
This iteration covers only the first group:

> **L1 — Multi-char literal fast path** (extend the single-char `short`
> optimization to keyword-like patterns).

The remaining candidates are listed as an un-analyzed backlog at the end.
Parser-flow analysis is deferred entirely to a later stage.

All measurements were taken on the current `master` (post #2182 lexer
micro-optimizations), Node.js v22.22.0, macOS (Apple Silicon). No library
source was modified; the L1 prototype was applied to a throwaway copy of the
compiled `lib/` output.

---

## 1. Methodology

Three complementary measurement layers were used (in increasing order of
realism):

1. **Isolated micro-benchmark** — per-attempt cost of the three candidate
   matching strategies, including the _miss_ path (Appendix A.2).
2. **Node `--cpu-prof` harness** — tokenizes the 1K JSON web-benchmark sample
   (`parsers/json/1K_json.js`, 31.5 KB, 2,949 tokens) in a loop and attributes
   self-time per function / per RegExp (Appendix A.1).
3. **End-to-end A/B** — an L1 prototype patch applied to a _copy_ of the
   compiled `lib/`, validated for token-stream equivalence, then benchmarked
   against stock on two scenarios (Appendix A.3):
   - **JSON** — the exact token set of `parsers/json/json_parser.js`
     (mirrors the web benchmark's `lexerOnly` variant).
   - **SYNTH-KW** — a synthetic "keyword-heavy" grammar: 28 JS-like keywords
     defined as string patterns with `longer_alt: Identifier`, plus an
     `Identifier` rule. 30 KB sample: ~70 % identifiers / ~15 % keywords.
     This represents every typical programming-language lexer.

For final validation of an actual implementation, use the existing web
benchmark workflow (`index_latest.html` vs `index_next.html`, `lexerOnly`
variant) — but note the caveat in §3.6 about the JSON-only blind spot.

---

## 2. Anatomy of the relevant hot path

### Init phase — pattern transformation (`src/scan/lexer.ts:81-153`)

`analyzeTokenTypes` transforms each `PATTERN` into the form used by the hot
loop:

| Input pattern                          | Transformed into                                            | Hot-loop branch         |
| -------------------------------------- | ----------------------------------------------------------- | ----------------------- |
| string, length 1 (`"{"`)               | the string itself; `short = charCode` (lexer.ts:951-957)    | charCode compare (fast) |
| string, length > 1 (`"true"`)          | escaped + wrapped in a **sticky RegExp** (lexer.ts:137-147) | RegExp engine           |
| RegExp, literal-only source (`/true/`) | sticky RegExp (lexer.ts:127)                                | RegExp engine           |
| RegExp, real pattern (`/\d+/`)         | sticky RegExp                                               | RegExp engine           |
| custom function/object                 | `{ exec }` wrapper                                          | custom call             |

So today every keyword — whether written as `"true"` or `/true/` — pays for a
full RegExp engine invocation **per match attempt**.

### Run phase — the match loop (`src/scan/lexer_public.ts:498-603`)

Per input position, the first-char optimization
(`charCodeToPatternIdxToConfig`, lexer.ts:264-338) selects the candidate
configs whose pattern can start with the current char code. Each candidate is
then tried in definition order (lexer_public.ts:515-547):

1. `short !== false` → single charCode compare — _already optimal_.
2. `isCustom === true` → custom exec call.
3. otherwise → `lastIndex = offset` write + `matchLength()` →
   `RegExp.prototype.test` (lexer_public.ts:910-920).

Two distinct cost profiles for keyword patterns:

- **Hit**: the keyword is actually at this position — one regex invocation.
- **Miss**: another token (typically an identifier) merely _starts with the
  same character_ — the keyword regex is invoked and fails. With `K` keywords
  sharing a first-char bucket with `Identifier`, every such identifier pays
  `K` wasted regex invocations.

---

## 3. L1 deep dive — multi-char literal fast path

### 3.1 Proposal

Extend `IPatternConfig` (lexer.ts:27-38) with a `literal: string | false`
field, analogous to `short`:

- **Detection (init, conservative)**:
  - plain string patterns with `length > 1` — stop wrapping them in a RegExp
    (lexer.ts:137-147), keep the string;
  - RegExp patterns whose `source` contains only `[a-zA-Z0-9_]` characters
    and no semantics-changing flags (`i`, `u`, `m`, ...) — use the source
    string. (The character whitelist can be widened later; starting strict
    keeps correctness trivially provable.)
- **Matching (hot loop)**: insert a branch between `short` and `isCustom`:

  ```js
  else if (currConfig.literal !== false) {
    if (orgText.startsWith(currPattern, offset)) {
      imageLength = currPattern.length;
      matchedImage = currPattern;
    }
  }
  ```

  The same branch is needed in the longer-alt loop
  (lexer_public.ts:581-588) and the error-resync loop
  (lexer_public.ts:707-710), which also dispatch on pattern kind. **This is
  not optional**: once string patterns are no longer wrapped in RegExps,
  the existing `else` branches would call `.lastIndex =` / `.exec()` on a
  string and throw.

### 3.2 Evidence 1 — per-attempt micro-benchmark

Matching the literal `"function"` at given offsets, 50 % hits / 50 % misses
on the 2nd char (the realistic identifier-miss case); 40 M attempts per
strategy (Appendix A.2):

| Strategy                                          | ns / attempt | relative    |
| ------------------------------------------------- | ------------ | ----------- |
| sticky RegExp `test()` + `lastIndex` (status quo) | **15.0**     | 1.0×        |
| `String.prototype.startsWith(lit, offset)`        | **6.8**      | 2.2× faster |
| manual `charCodeAt` loop                          | **6.0**      | 2.5× faster |

→ ~8–9 ns saved per attempt. `startsWith` is recommended over the manual
loop: nearly as fast, no per-pattern charcode-array allocation, simpler code.

### 3.3 Evidence 2 — where JSON lexing time actually goes

CPU profile of the 1K JSON `lexerOnly` loop (5.5 s sampled, Appendix A.1):

| self %    | function                                             |
| --------- | ---------------------------------------------------- |
| 59.9 %    | `tokenizeInternal` (loop body incl. inlined helpers) |
| 13.9 %    | RegExp `StringLiteral`                               |
| 6.5 %     | RegExp `WhiteSpace`                                  |
| 6.1 %     | `matchLength`                                        |
| 3.9 %     | GC                                                   |
| 1.4 %     | RegExp `NumberLiteral`                               |
| **0.1 %** | **RegExp `true`**                                    |
| **0.1 %** | **RegExp `false`**                                   |

Keyword regexes are ~**0.2 %** of JSON lexing time. Reason: the first-char
optimization already restricts keyword attempts to positions where a keyword
actually occurs — JSON has no identifiers competing for `t`/`f`/`n` buckets.

Attempt counting confirms this (Appendix A.4):

| Scenario | tokens / pass | keyword attempts / pass | misses | attempts per token |
| -------- | ------------- | ----------------------- | ------ | ------------------ |
| JSON 1K  | 2,949         | 22                      | 0      | **0.01**           |
| SYNTH-KW | 4,577         | 10,277                  | 9,610  | **2.25**           |

### 3.4 Evidence 3 — end-to-end A/B (prototype patch)

The prototype (Appendix A.3) produces **byte-identical token streams**
(images, offsets, lines, columns) on both scenarios and identical
error-recovery results on malformed input. Throughput (tokenizations/s of the
~30 KB samples, 3 interleaved runs):

| Scenario | stock (median) | L1 patched (median) | delta             |
| -------- | -------------- | ------------------- | ----------------- |
| JSON 1K  | 4,266 ops/s    | 4,261 ops/s         | **±1 % (noise)**  |
| SYNTH-KW | 1,680 ops/s    | 1,878 ops/s         | **+12 % … +16 %** |

The SYNTH-KW result matches the analytical prediction: 10,277 attempts ×
~9 ns ≈ 92 µs saved on a ~595 µs/pass baseline ≈ 15 %.

### 3.5 Interactions reviewed

- **`LONGER_ALT`** (keyword vs identifier): unaffected — the literal branch
  sets `matchedImage`/`imageLength` exactly like the regex branch, and the
  longer-alt loop runs afterwards as before. Covered by the SYNTH-KW
  equivalence check (667 keyword hits, each with `Identifier` longer-alt).
- **First-char optimization buckets**: string patterns already feed the
  buckets via `PATTERN.charCodeAt(0)` (lexer.ts:267-270); literal-only
  RegExps go through `getOptimizedStartCodesIndices` — both unchanged.
- **Line-terminator analysis** (`canMatchCharCode`) operates on the original
  `PATTERN`, not the transformed one — unchanged.
- **Error resync loop** re-tests patterns — needs the literal branch (§3.1);
  verified on malformed input.
- **Multi-mode lexers**: configs are per-mode; the new field is computed in
  `analyzeTokenTypes` which runs per mode — no special handling.
- **Case-insensitive / unicode keyword regexes** (`/true/i`): excluded by the
  conservative detector, keep the regex path.

### 3.6 Verdict & go/no-go

**GO — recommended for implementation.**

- Keyword-heavy grammars (i.e., essentially every programming-language
  lexer): **+12–16 %** lexing throughput, stable across runs.
- JSON-style grammars: neutral (±1 %, within noise) — the new branch in the
  match loop does not penalize grammars that don't benefit.
- Risk is low: detection is conservative, the transformation is init-time
  only, and the prototype already demonstrated token-stream equivalence
  including positions and error recovery.

Implementation checklist (for the future task):

1. `literal` field on `IPatternConfig` + detection in `analyzeTokenTypes`
   (string patterns and `/^[a-zA-Z0-9_]+$/` regex sources, no flags).
2. Literal branches in the main match loop, longer-alt loop, and resync loop.
3. Tests: keyword-as-string, keyword-as-regex, `LONGER_ALT` interplay,
   multi-mode, error recovery, case-insensitive regex exclusion.
4. **Benchmark blind spot**: the web benchmark's only Chevrotain-lexer
   grammars are JSON and CSS, neither of which exercises keyword-vs-identifier
   buckets. Add a keyword+identifier lexer scenario (or an ECMA5
   Chevrotain-lexer variant) to `benchmark_web` so this class of optimization
   is visible in `lexerOnly` runs.

---

## 4. Backlog (not analyzed in this iteration)

One-liner index of remaining lexer candidates, to be investigated in small
groups in follow-up iterations:

- **L2** — substring-free line-terminator counting for skipped tokens
  (lexer_public.ts:638-673); the JSON profile above shows WhiteSpace regex +
  GC ≈ 10 % of lexing time, making this the most promising next group.
- **L3** — hoist dynamically-selected methods (`matchLength`,
  `createTokenInstance`, `addToken`, `handlePayload`, `computeNewColumn`,
  `handleModes`) into locals at `tokenizeInternal` entry.
- **L4** — single-candidate first-char bucket specialization.
- **L5** — structure-of-arrays experiment for `IPatternConfig` buckets.
- **L6** — token-vector size heuristic (`text.length / 10`,
  lexer_public.ts:405-408).
- **L7** — custom-pattern `payload` hidden-class transition.
- **Parser flow** — deferred entirely to a later stage.

---

## Appendix A — Reproduction

All scripts run against the compiled output (`bun install && bun compile`).
They are small enough to be recreated from the descriptions below; key
snippets are included inline.

### A.1 CPU profile harness

Tokenize the web-benchmark sample in a loop under the profiler:

```js
// lex_profile.mjs (essentials)
const chevrotain = await import("<repo>/packages/chevrotain/lib/src/api.js");
const lexer = new chevrotain.Lexer(jsonTokens); // token set from parsers/json/json_parser.js
const sample = loadSample("parsers/json/1K_json.js"); // eval `self.sample = ...`
for (let i = 0; i < 2000; i++) lexer.tokenize(sample); // warmup
// timed loop ~5s, then:  node --cpu-prof --cpu-prof-dir=out lex_profile.mjs
```

Summarize with any `.cpuprofile` viewer (Chrome DevTools / speedscope) or by
aggregating `samples`/`timeDeltas` per `callFrame`.

### A.2 Matching-strategy micro-benchmark

2,000 offsets into a text of alternating `function` (hit) and `f...`-prefixed
identifiers (miss on 2nd char), 20,000 iterations:

```js
// status quo                       // L1 candidate
re.lastIndex = offset;
text.startsWith("function", offset);
re.test(text); /* sticky /function/y */
```

Results on Node v22.22.0: 15.0 ns vs 6.8 ns (startsWith) vs 6.0 ns
(charCodeAt loop) per attempt.

### A.3 L1 prototype patch (compiled-lib copy)

Copy `packages/chevrotain/lib` to a scratch dir (plus a `node_modules` shim
linking `@chevrotain/*` and `lodash-es`), then:

- `lexer.js`: string patterns len > 1 → return the string (skip RegExp
  wrapping); regex sources matching `/^[a-zA-Z0-9_]+$/` without `ignoreCase`
  → return the source string; add
  `literal: typeof p === "string" && p.length > 1 ? p : false` to the config.
- `lexer_public.js`: literal branches in the match loop, longer-alt loop and
  resync loop, as shown in §3.1.

Equivalence check: serialize every token as
`name|image|startOffset|endOffset|startLine|startColumn|endLine|endColumn`
for stock vs patched on both scenarios + one malformed input → identical.

### A.4 Keyword-attempt counter

Replicates the first-char bucket dispatch offline: for each emitted token,
counts keyword configs sharing its first-char bucket that are tried before
the matching config. Yields 22 attempts/pass (JSON) vs 10,277 attempts/pass
(SYNTH-KW, of which 9,610 are misses).

### SYNTH-KW grammar definition

28 keywords (`break`, `case`, ..., `true`, `false`, `null`) as string
patterns with `longer_alt: Identifier`, listed before
`Identifier: /[a-zA-Z_]\w*/`, plus whitespace (SKIPPED), numbers and 9
single-char punctuation tokens. Deterministic 30 KB sample: 70 % identifiers
(several sharing keyword prefixes, e.g. `transform`, `truthy`, `falsy`,
`doneFlag`), 15 % keywords, 15 % numbers/punctuation.
