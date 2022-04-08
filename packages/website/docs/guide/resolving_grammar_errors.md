# Resolving Grammar Errors

- [Common Prefix Ambiguities.](#COMMON_PREFIX)
- [Ambiguous Alternatives Detected.](#AMBIGUOUS_ALTERNATIVES)
- [Terminal Token Name Not Found.](#TERMINAL_NAME_NOT_FOUND)
- [Infinite Loop Detected.](#INFINITE_LOOP)
- [Ignoring Ambiguities.](#IGNORING_AMBIGUITIES)

## Common Prefix Ambiguities

This problem can no longer occur in versions of Chevrotain after (and including) 11.0.0.
See [V10 of these Docs](https://github.com/chevrotain/chevrotain/blob/v10.0.0/packages/chevrotain/docs/guide/resolving_grammar_errors.md#COMMON_PREFIX) if you have not yet upgraded.

## Ambiguous Alternatives Detected

The way this grammar error is detected and handled has changed in versions of Chevrotain after (and including) 11.0.0.
See [V10 of these Docs](https://github.com/chevrotain/chevrotain/blob/v10.0.0/packages/chevrotain/docs/guide/resolving_grammar_errors.md#AMBIGUOUS_ALTERNATIVES) if you have not yet upgraded.

An Ambiguous Alternatives Error occurs when Chevrotain cannot decide between two alternatives in
an alternation (OR DSL method).

Chevrotain "looks ahead" an unlimited amount of tokens to determine which alternative to pick. An Ambiguous Alternatives Error indicates that two alternatives can be parsed using the exact same path of tokens.

Lets consider a simple example:

```antlr
ambiguousLookahead:
  "A" "B" "C" "D" |
  "A" "B" "C" "D"
```

If Chevrotain encounters such an alternative during the runtime, an error message will be printed to the console. This error **cannot be caught** with the static parser validation. Chevrotain will resolve the ambiguity in favor of the matching alternative with the lowest index. You can usually avoid lookahead ambiguities by removing the ambiguous alternative. Alternatively, a [GATE](https://chevrotain.io/docs/features/gates.html) which makes the alternatives mutually exclusive can deal with this issue as well.

In some rare cases the grammar depends on the use of nested `GATEs` to predict the correct alternative, in those cases it is necessary to resolve the ambiguity using the [backtracking feature](../features/backtracking.md), although this is **strongly** discouraged due to performance and complexity reasons.

Grammars employing backtracking to artificially increase the lookahead for Versions of Chevrotain prior to 11 can usually remove it completely.

## Terminal Token Name Not Found

This problem can no longer occur in versions of Chevrotain after (and including) 6.0.0.
See [V5 of these Docs](https://github.com/chevrotain/chevrotain/blob/v5.0.0/packages/chevrotain/docs/guide/resolving_grammar_errors.md#terminal-token-name-not-found)
if you have not yet upgraded.

## Infinite Loop Detected

- Note **This error is only relevant in versions prior to 4.4.0**
  See: https://github.com/chevrotain/chevrotain/issues/958

A repetition must consume at least one token in each iteration.
Entering an iteration while failing to do so would cause an **infinite loop** because
the condition to entering the next iteration would still be true while the parser state has
not been changed. essentially this creates a flow that looks like:

```javascript
// iteration lookahead condition (always true)
while (true) {
  // single iteration grammar
}
```

Lets look at a few real examples that can cause this error

```javascript
$.MANY(() => {
  return
  // unreachable code
  $.CONSUME(Plus)
})
```

By returning early in the iteration grammar we prevent the parser from consuming
The plus token and thus the next time the parser checks if it should enter the iteration
The condition (nextToken === Plus) would still be true.

```javascript
$.MANY(() => {
  // Never wrap Chevrotain grammar in JavaScript control flow constructs.
  if (condition) {
    $.CONSUME(Plus)
  }
})
```

This is similar to the previous example as if the condition is false, once
again the parser will consume nothing in the iteration.
Modeling conditional grammar paths must be done using Chevrotain grammar constructs
such as OPTION and/or [GATE](https://chevrotain.io/docs/features/gates.html).

For example the above example should be written as:

```javascript
$.MANY(() => {
  $.OPTION(() => {
    $.CONSUME(Plus)
  })
})
```

## Ignoring Ambiguities

In some rare cases the Parser may detect ambiguities that are not actually possible or are perhaps implicitly resolved, e.g:

- by the order of alternatives (an alternation alternative is attempted in the order listed).

In such cases the ambiguities may be ignored explicitly by using the [IGNORE_AMBIGUITIES][ignore_ambiguities] property
on the relevant DSL method.

For example:

- Ignoring all ambiguities of an alternation.

  ```javascript
  $.OR({
    IGNORE_AMBIGUITIES: true,
    DEF: [
      { ALT: () => $.SUBRULE($.myRule) },
      { ALT: () => $.SUBRULE($.myOtherRule) }
    ]
  })
  ```

- Ignoring ambiguities related to a **specific alternative** of an alternation:

  ```javascript
  $.OR([
    { ALT: () => $.SUBRULE($.myRule), IGNORE_AMBIGUITIES: true },
    { ALT: () => $.SUBRULE($.myOtherRule) }
  ])
  ```

[maxlookahead]: https://chevrotain.io/documentation/10_1_1/interfaces/IParserConfig.html#maxLookAhead
[ignore_ambiguities]: https://chevrotain.io/documentation/10_1_1/interfaces/OrMethodOpts.html#IGNORE_AMBIGUITIES
