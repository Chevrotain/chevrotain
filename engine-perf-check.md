## Engine-Level Optimization Recommendations for `tokenizeInternal()`

### 1. Skip token object creation for SKIPPED tokens

At `lexer_public.ts:628-656`, the current flow is:

```
if (matchedImage !== null) {
    group = currConfig.group;
    if (group !== undefined) {       // <-- `undefined` means SKIPPED
        newToken = this.createTokenInstance(...);
        ...
    }
    // offset/column/line tracking happens AFTER the group block
```

SKIPPED tokens (`group === undefined`) already skip `createTokenInstance`, so that's fine. **However**, the `matchedImage` string is still extracted for SKIPPED tokens. In `matchWithTest` (`lexer_public.ts:938-940`):

```js
const found = pattern.test(text);
if (found === true) {
  return text.substring(offset, pattern.lastIndex); // allocates a string
}
```

For SKIPPED tokens (typically whitespace — the most frequent "token"), you're allocating a string that's only used for `imageLength` computation. You could instead return only the **match length** in the SKIPPED path and avoid the `substring` entirely. This would require a two-tier matching strategy:

- `matchLength(pattern, text, offset) → number` — returns `pattern.lastIndex - offset` (no allocation)
- `matchImage(pattern, text, offset) → string` — the current behavior

At the call site (`lexer_public.ts:567-570`), you know `currConfig.group` before calling `match`. You could branch:

```js
if (currConfig.group === undefined) {
    // SKIPPED: only need the length
    this.updateLastIndex(currPattern, offset);
    const len = this.matchLength(currPattern, text, offset);
    if (len > 0) { matchedImage = len as any; /* or a sentinel */ }
} else {
    this.updateLastIndex(currPattern, offset);
    matchedImage = this.match(currPattern, text, offset);
}
```

The complication is that `matchedImage` is also used for line-terminator scanning (`lexer_public.ts:670`) and `longerAlt` length comparisons (`lexer_public.ts:613`). Both of these can work with lengths instead of strings, but it requires refactoring the downstream code to work with `(offset, length)` pairs instead of string values. The line-terminator scan could use `orgText` with `(offset, imageLength)` instead of `matchedImage`.

This avoids one string allocation per SKIPPED token, which is typically 30-50% of all matches.

### 2. Use `charCodeAt` probing before regex for common multi-char tokens

The single-char fast path (`lexer_public.ts:547-551`) is great. You could extend this idea to **two-char** and **three-char** tokens (e.g., `==`, `!=`, `===`, `!==`, `<=`, `>=`, `>>`, `<<`). Many grammars have a dense set of 2-3 char operator tokens.

At init time, detect patterns that are fixed strings of length 2-3 and store them as `shortN` (e.g., `short2: [charCode1, charCode2]`). At runtime, check via `charCodeAt` comparisons instead of regex. This would be a new branch alongside the existing `singleCharCode` check at line 546.

### 3. Avoid `getPossiblePatternsOptimized` function call overhead

`getPossiblePatterns` is called via an indirect function reference (`lexer_public.ts:537`), which V8 may or may not inline depending on the polymorphic state. Since `getPossiblePatternsOptimized` (`lexer_public.ts:455-464`) is the hot case, you could inline it directly in the while loop:

```js
const optimizedCharIdx =
  nextCharCode < 256 ? nextCharCode : charCodeToOptimizedIdxMap[nextCharCode];
const chosenPatternIdxToConfig =
  currCharCodeToPatternIdxToConfig[optimizedCharIdx] || emptyArray;
```

This removes one indirect function call + the `charCodeToOptimizedIndex` function call per token. For ASCII-only input (the common case), this collapses to a single branch + array lookup.

### 4. Batch line-terminator tracking

The line-terminator `do...while` loop at `lexer_public.ts:669-675` calls `lineTerminatorPattern.test(matchedImage)` repeatedly — once per line terminator found in the image. For the common case (single-line tokens), `canLineTerminator` is `false` and this is skipped entirely.

But for multi-line tokens (block comments, template literals), you could replace the `test()` loop with a single-pass `charCodeAt` scan that counts `\n` and `\r` simultaneously and records the last terminator position — rather than invoking the tester object method repeatedly. The `LineTerminatorOptimizedTester` already does character-by-character scanning internally, but the wrapping `do...while` loop in `tokenizeInternal` calls `.test()` multiple times, paying the method call overhead each time. A dedicated `countLineTerminators(text, startOffset, length)` function that returns `{ count, lastOffset }` in a single pass would be faster.

### 5. Error recovery: use first-char dispatch

At `lexer_public.ts:700-731`, the error recovery loop tests **all** patterns in the current mode (`patternIdxToConfig[j]`) at each dropped character position. It should use `getPossiblePatterns(orgText.charCodeAt(offset))` instead, the same first-char optimization used in the happy path. This is the same optimization the main loop already benefits from but is missing in recovery. For long error spans, this is a significant difference.

### 6. Replace `matchedImage.length` with pre-computed length

At `lexer_public.ts:613`:

```js
if (matchAltImage && matchAltImage.length > matchedImage.length)
```

`matchedImage.length` is accessed multiple times across the hot path (lines 613, 629, 662, 679, etc.). In the sticky-flag case, you already know the match length from `pattern.lastIndex - offset` without needing to go through the string. If you store `imageLength` immediately when the match is found (not just at line 629), you avoid repeated `.length` property accesses on the string, and the `longerAlt` comparison at line 613 becomes an integer comparison.

---

### Summary (ordered by likely impact)

| #   | Change                                              | Impact               | Complexity |
| --- | --------------------------------------------------- | -------------------- | ---------- |
| 1   | Skip string allocation for SKIPPED tokens           | Medium-High          | Medium     |
| 3   | Inline `getPossiblePatternsOptimized` into hot loop | Medium               | Low        |
| 5   | Use first-char dispatch in error recovery           | Medium (error paths) | Low        |
| 4   | Single-pass line-terminator counting                | Low-Medium           | Low        |
| 6   | Pre-compute `imageLength` from `lastIndex`          | Low                  | Low        |
| 2   | Extend short-circuit to 2-3 char fixed strings      | Low-Medium           | Medium     |

Items 3 and 5 are straightforward and low-risk. Item 1 has the highest potential payoff but requires the most refactoring since `matchedImage` is used as both a string and a signal throughout the loop.
