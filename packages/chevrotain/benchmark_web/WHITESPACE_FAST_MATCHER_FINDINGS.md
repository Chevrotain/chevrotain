# Whitespace Fast Matcher Findings

## Context

This document records the investigation of a specialized matcher for skipped
whitespace-like tokens, focused on the JSON lexer used by the performance
benchmark parser at:

`https://github.com/Chevrotain/chevrotain/tree/gh-pages/performance/jsonParsers/chevrotain`

That parser constructs its lexer with:

```js
new Lexer(jsonTokens, { positionTracking: "onlyOffset" });
```

The relevant whitespace token is:

```js
const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /[ \t\n\r]+/,
  group: Lexer.SKIPPED,
});
```

Because `positionTracking` is `"onlyOffset"`, line/column tracking is disabled.
The optimization target is therefore the RegExp matching cost of skipped
whitespace, not line terminator counting.

The investigation started with temporary compiled-lib patches outside the source
tree. A small source implementation was later produced for review using the W3
approach: skipped-token-only, simple character class detection.

## Variants Evaluated

All variants were checked for token/error equivalence against stock under:

- `positionTracking: "onlyOffset"`;
- `positionTracking: "full"`;
- `positionTracking: "onlyStart"`.

Inputs included:

- the JSON benchmark sample;
- spaces only;
- tabs only;
- LF only;
- CR only;
- CRLF;
- mixed whitespace;
- trailing whitespace;
- malformed input.

### W1 — Exact JSON whitespace matcher

Hard-coded an internal fast path for the exact JSON whitespace source:

```js
/[ \t\n\r]+/;
```

The matcher scanned using direct `charCodeAt` checks for:

- space (`32`);
- tab (`9`);
- LF (`10`);
- CR (`13`).

### W2 — Generic simple ASCII char-class matcher

Added a conservative detector for simple positive repeated ASCII char classes
containing only:

- space;
- `\t`;
- `\n`;
- `\r`.

Conceptually this added a config field like:

```ts
simpleCharCodes: number[] | undefined;
```

The runtime matcher scanned with a generic small list membership loop.

### W3 — Skipped-token-only simple char-class matcher

Same as W2, but only applies to skipped tokens.

This narrows the applicability and risk surface because skipped tokens do not
need an emitted token image.

## Lexer-only Results

Separate-process A/B benchmark, JSON `lexerOnly`,
`positionTracking: "onlyOffset"`, 10 pairs, 5 seconds per run.

| Variant |    Stock Median |  Variant Median | Median Delta | Notes                         |
| ------- | --------------: | --------------: | -----------: | ----------------------------- |
| W1      | `7189.60 ops/s` | `7026.25 ops/s` |     `-2.27%` | Exact branch regressed        |
| W2      | `7213.92 ops/s` | `7458.34 ops/s` |     `+3.39%` | Generic simple char-code list |
| W3      | `7190.52 ops/s` | `7438.71 ops/s` |     `+3.45%` | Skipped-token-only variant    |

W2 and W3 showed stable lexer-only wins, but the magnitude is small.

## End-to-end Parser Result

W3 was measured with a local EmbeddedActions JSON parser matching the referenced
benchmark shape:

- singleton parser instance;
- `outputCst: false`;
- lexer config: `positionTracking: "onlyOffset"`.

Separate-process A/B benchmark, 10 pairs, 5 seconds per run:

| Build |          Median |
| ----- | --------------: |
| stock | `4770.80 ops/s` |
| W3    | `4570.37 ops/s` |

Median delta: `-4.20%`.

The pair deltas were noisy (`-9.77%` to `+9.45%`), but the end-to-end parser
result did not show a reliable benefit from the whitespace matcher.

## Interpretation

The whitespace fast matcher can improve JSON lexer-only throughput by roughly
`3–3.5%` when implemented as a generic or skipped-token-only simple char-class
matcher.

However:

- the exact JSON-specific branch regressed;
- the lexer-only gain is small;
- the end-to-end parser benchmark did not improve;
- the implementation would add another specialized matching path in the lexer
  hot loop;
- supporting broader whitespace definitions like `\s+` would require careful
  JavaScript whitespace semantics and is not covered by this experiment.

## Generality

The W2/W3 detector can be generalized safely for a narrow class of patterns:

```js
/[ \t\n\r]+/
/[ \t]+/
/[ ]+/
/[\t ]+/
```

The detector should remain conservative:

- one positive character class;
- `+` quantifier;
- no complement classes;
- no ranges initially;
- no groups, alternation, assertions, captures, or anchors;
- no semantic-changing flags;
- ASCII character codes only.

Do not include `\s+` unless the full JavaScript whitespace set is implemented
and tested.

## Source Implementation Status

A source implementation was produced for review with the following shape:

- adds an internal `simpleSkippedCharCodes` field to lexer pattern configs;
- detects only skipped tokens (`Lexer.SKIPPED`);
- manually parses `RegExp.source`;
- supports only literal space plus escaped `\t`, `\n`, and `\r`;
- keeps non-skipped tokens on the existing RegExp path;
- keeps unsupported patterns on the existing RegExp path.

The implementation is intentionally narrow and is best understood as a measured
proof of concept rather than a production-quality general detector.

Review concern: this implementation is simplistic. The supported character set
is very limited, and manual `RegExp.source` parsing is brittle. Chevrotain
already uses `@chevrotain/regexp-to-ast` for first-character optimization and
line-break analysis, so a more robust implementation should probably reuse that
existing parser instead of adding another source-string parser.

## If Revisited: Use `regexp-to-ast`

Using the existing regexp parser could improve correctness and generality while
keeping the runtime matcher narrow.

Potential improvements:

- structurally detect exactly one positive repeated `Set` atom;
- safely support equivalent whitespace definitions using `\x..`, `\u....`, or
  ranges such as `[\u0009-\u000d ]+`;
- safely support escaped literal characters without hand-written source parsing;
- support small bounded ranges;
- choose better runtime representations, such as direct comparisons, range
  checks, or an ASCII lookup table.

Recommended boundaries if this is revisited:

- start with skipped tokens only;
- avoid `\s+` until the full ECMAScript whitespace set is implemented and
  tested;
- avoid complement classes initially;
- avoid turning this into a regex interpreter;
- keep all unsupported patterns on the existing RegExp path.

Using `regexp-to-ast` would mainly improve maintainability and supported pattern
coverage. It would not automatically increase JSON benchmark speed by itself;
extra speed would likely come from better runtime membership representation, not
from AST detection.

## Conclusion

Do **not** expand or polish the current source implementation now.

The best lexer-only result was about `+3.45%`, and the parser-level benchmark
did not show a reliable improvement. This is likely too small for the added
hot-loop complexity.

This path may be worth revisiting only if:

- a broader benchmark suite shows many grammars benefit;
- the implementation can avoid adding cost to non-whitespace token matching;
- the optimization can be combined with another whitespace-related improvement
  to produce a larger end-to-end gain.

If revisited, first replace the manual detector with a `regexp-to-ast` based
detector, then re-measure before broadening supported patterns.

## Next Direction

Move on to a different lexer optimization candidate. Better candidates may be:

- reducing hot RegExp match overhead for `StringLiteral` or other high-cost
  token types;
- improving first-character dispatch for punctuation/single-candidate buckets;
- reducing token object allocation cost;
- browser-specific benchmarking of hot paths in the public performance page.
