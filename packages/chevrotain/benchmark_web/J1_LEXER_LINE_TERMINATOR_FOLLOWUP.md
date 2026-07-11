# J1 Lexer Line Terminator Follow-up

## Context

This note documents the J1 lexer optimization exploration for future follow-up.

The target was the JSON lexer benchmark in `packages/chevrotain/benchmark_web`.
The specific idea was to avoid creating a substring solely to count default
line terminators (`\n|\r\n?`) in the lexer hot loop.

The explored hot path is in `packages/chevrotain/src/scan/lexer_public.ts`, in
`tokenizeInternal`, around line terminator handling after a successful match.
For skipped whitespace tokens, `matchedImage` is otherwise unused, so the
existing code may allocate a substring only to run the line terminator tester.

## Prototype Summary

A temporary compiled-lib prototype was created outside the source tree. It
marked the built-in `LineTerminatorOptimizedTester` and added a direct
`orgText.charCodeAt` scan for default LF/CRLF line terminator counting.

The prototype preserved the existing fallback path for custom
`lineTerminatorsPattern` values.

## Correctness Checks

The prototype was compared against stock behavior and passed these checks:

- JSON benchmark sample token stream equivalence: images, offsets, lines, and
  columns matched.
- Malformed input recovery behavior matched.
- LF, CR, CRLF, and mixed whitespace behavior matched.
- `positionTracking: "full"` behavior matched.
- `positionTracking: "onlyStart"` behavior matched.
- `positionTracking: "onlyOffset"` behavior matched and was not expected to be
  affected because line tracking is disabled.

## Mechanism Check

For one JSON benchmark sample lex pass:

| Build                       | substring calls | substring chars |
| --------------------------- | --------------: | --------------: |
| stock                       |            2949 |           29910 |
| J1 prototype/source variant |            1342 |           22340 |

This confirmed the intended mechanism: the optimization removes substring
allocation work in the skipped-whitespace line terminator path.

## Benchmark Evidence

Separate-process interleaved JSON `lexerOnly` benchmark, 10 pairs, 6 seconds
per run:

| Metric |         Stock | J1 source variant |
| ------ | ------------: | ----------------: |
| median | 4305.30 ops/s |     4715.54 ops/s |
| mean   | 4282.95 ops/s |     4722.80 ops/s |
| min    | 4200.53 ops/s |     4637.80 ops/s |
| max    | 4353.37 ops/s |     4804.25 ops/s |
| RSD    |         1.18% |             1.13% |

Median delta: `+9.53%`.

Pair deltas:

| Metric |   Delta |
| ------ | ------: |
| median | +10.56% |
| mean   | +10.28% |
| min    |  +8.22% |
| max    | +11.99% |

Earlier in-process A/B runs were noisy and sometimes misleading because both
stock and patched builds were loaded into the same V8 process. The
separate-process benchmark was more stable and should be preferred for this
kind of comparison.

## Review Concern

The branch-based source implementation added a conditional inside the lexer hot
loop to choose between:

- default line terminator direct scanning, and
- custom line terminator fallback behavior.

This is a valid design concern. Even if the benchmark shows a win for JSON,
adding another conditional to `tokenizeInternal` may be undesirable because:

- the lexer hot loop is highly optimized and should remain as simple as
  possible;
- the branch is evaluated for every matched token with possible line
  terminators;
- added branching can perturb JIT optimization and inline-cache behavior;
- it increases maintenance complexity in already performance-sensitive code.

Therefore, the current branch-based implementation should not be considered
the final design if avoiding new hot-loop conditionals is a priority.

## Branch-free Follow-up Directions

Future work should keep the measured opportunity but explore designs that avoid
adding a conditional branch in the hot path.

### 1. Split `tokenizeInternal` Variants

Choose the tokenization implementation at lexer construction time:

- default line terminator fast variant;
- custom line terminator variant;
- possibly `onlyOffset` / no-line-tracking variant.

This follows the existing Chevrotain style of selecting specialized methods in
the constructor, e.g. token creation and payload handling variants.

Tradeoff: code duplication in `tokenizeInternal`, but the hot path stays
branch-free for each lexer instance.

### 2. Specialize a Line Counting Function at Construction Time

Assign a line-counting function during construction:

- direct source-text scanner for the built-in default;
- existing substring + tester implementation for custom patterns.

This removes the explicit branch but introduces a function call in the hot
path. It must be benchmarked against both the branch and the status quo; an
indirect call may be worse than the branch.

### 3. Specialize by Lexer Configuration

Create a dedicated common-case path for:

- default line terminators;
- line/start tracking enabled;
- no custom `lineTerminatorsPattern`.

Keep all custom behavior in the existing generic path. This may produce most
of the JSON win while limiting complexity to common/default configuration.

### 4. Combine Whitespace Matching and Line Counting

A larger follow-up could detect simple repeated ASCII whitespace patterns like
`/[ \n\r\t]+/` and scan once for both match length and line terminators.

This could avoid both the whitespace RegExp and the later line-count pass, but
it is more complex and should only be explored after the branch-free J1 design
question is resolved.

## Recommendation

Do not treat the branch-based implementation as the desired final form if
hot-loop branch avoidance is a design goal.

The exploration is still useful: it shows that skipped-whitespace line
terminator counting is a real JSON lexer benchmark opportunity, with measurable
substring reduction and a stable separate-process throughput improvement.

Recommended next step: prototype a branch-free variant, preferably by choosing
a specialized tokenization implementation at lexer construction time, and
measure it with the same separate-process benchmark protocol.
