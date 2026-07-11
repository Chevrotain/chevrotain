# Specialized `tokenizeInternal` Findings

## Context

This document records the evaluation of a specialized/custom
`tokenizeInternal` flow for the JSON parser benchmark at:

`https://github.com/Chevrotain/chevrotain/tree/gh-pages/performance/jsonParsers/chevrotain`

The referenced benchmark parser uses the standard JSON token vocabulary and
constructs its lexer with:

```js
new Lexer(jsonTokens, { positionTracking: "onlyOffset" });
```

Important implications:

- line/column tracking is disabled;
- J1 line-terminator-counting optimizations do not apply to this benchmark;
- the relevant lexer shape is `onlyOffset`, single mode, no custom token
  patterns, no named token groups, and default first-char optimizations.

The evaluation was performed using temporary compiled-lib patches outside the
source tree. No source implementation was attempted.

## Variants Evaluated

All variants were checked for token stream equivalence against stock using the
JSON sample, mixed whitespace input, and malformed input. Equivalence included
token type name, image, `startOffset`, `endOffset`, and lexer errors.

### V1 — Offset-only specialization

Removed line-tracking work for the `onlyOffset` benchmark shape:

- no line terminator handling block;
- no `computeNewColumn` calls;
- no line/column state updates.

### V123 — Offset-only + no custom/mode/group plumbing

Built on V1 and additionally removed generic machinery irrelevant to this JSON
lexer shape:

- direct offset-only token object creation;
- direct `matchedTokens[matchedTokensIndex++] = newToken`;
- no payload handling;
- no lexer mode transition call.

### V1234 — V123 + single-candidate short bucket fast path

Built on V123 and added a fast path for optimized buckets containing exactly
one single-character token config with no `longer_alt`.

This targets the JSON punctuation-heavy case (`{`, `}`, `[`, `]`, `,`, `:`).

### `fast` — separate custom `tokenizeInternal`

Added a separate dispatch to a custom `tokenizeInternal` variant for this
specific generic lexer shape:

- `positionTracking: "onlyOffset"`;
- single lexer mode;
- no custom token patterns;
- no named token groups.

This was still generic over the token configs. It was not a JSON-specific
hand-coded tokenizer.

## Lexer-only Results

Separate-process A/B benchmark, JSON `lexerOnly`, `positionTracking:
"onlyOffset"`.

| Variant                          | Median Improvement |
| -------------------------------- | -----------------: |
| V1                               |           `+1.54%` |
| V123                             |           `+4.48%` |
| V1234                            |           `+5.30%` |
| `fast` custom `tokenizeInternal` |           `+3.80%` |

Best measured realistic temp patch: **V1234, +5.30% median lexer-only**.

The separate custom `tokenizeInternal` was positive but did not beat the
smaller in-place specializations.

## End-to-end Parser Result

The `fast` custom `tokenizeInternal` variant was also measured against a local
EmbeddedActions JSON parser matching the referenced benchmark shape:

- singleton parser instance;
- `outputCst: false`;
- lexer config: `positionTracking: "onlyOffset"`.

Result:

| Build  |          Median |
| ------ | --------------: |
| stock  | `4856.70 ops/s` |
| `fast` | `5046.27 ops/s` |

Median end-to-end improvement: **`+3.90%`**.

## Interpretation

The optimization opportunity is real but small.

Expected benefit for the referenced parser:

- lexer-only: roughly **4–6%** in the best measured realistic variants;
- end-to-end parser benchmark: roughly **3–4%**.

The measured gains are not large enough to justify the complexity of a custom
or duplicated `tokenizeInternal` implementation at this point.

## Complexity Cost

A production implementation would add meaningful maintenance burden:

- duplicated hot-loop logic or a new dispatching path;
- more code paths to test across lexer modes, custom patterns, token groups,
  `longer_alt`, error recovery, and position tracking configs;
- higher risk of future lexer optimizations needing to be duplicated across
  variants;
- additional JIT behavior risk from changing the structure of an already
  highly optimized loop.

Even limiting the production design to one extra fast path, such as
`onlyOffset + single-mode + no-custom + no-named-groups`, would still add a
large amount of specialized code for a small benchmark gain.

## Conclusion

Do **not** prioritize source implementation of specialized/custom
`tokenizeInternal` variants for the JSON parser benchmark at this time.

The best measured lexer-only boost was about `+5.3%`, and the measured
end-to-end parser boost was about `+3.9%`. This is likely too small relative to
the complexity and maintenance cost.

This document should serve as prior evidence so the same specialization path
does not need to be re-evaluated unless future benchmark data or implementation
constraints change.

## Next Direction

Move on to other lexer optimization candidates with a better complexity / gain
tradeoff. Potential areas to revisit separately:

- reducing regex match overhead for hot token types;
- improving first-character dispatch without duplicating the full tokenizer;
- optimizing token object allocation or token array handling;
- evaluating browser-specific behavior in the actual performance page.
