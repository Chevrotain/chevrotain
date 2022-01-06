# Resolving Grammar Errors

- [Common Prefix Ambiguities.](#COMMON_PREFIX)
- [Ambiguous Alternatives Detected.](#AMBIGUOUS_ALTERNATIVES)
- [Terminal Token Name Not Found.](#TERMINAL_NAME_NOT_FOUND)
- [Infinite Loop Detected.](#INFINITE_LOOP)
- [Ignoring Ambiguities.](#IGNORING_AMBIGUITIES)

## Common Prefix Ambiguities

Imagine the following grammar:

```antlr
myRule:
  "A" "B" |
  "A" "B" "C"
```

The first alternative is a prefix of the second alternative.
Now lets consider the input ["A", "B"].
For this input the first alternative would be matched as expected.

However for the input ["A", "B", "C"] the first
alternative would still be matched but this time **incorrectly**
as alternation matches are attempted **in order**.

There are two ways to resolve this:

- Reorder the alternatives so that shorter common prefix lookahead
  paths appears after the longer ones.

  ```antlr
  myRule:
    "A" "B" "C" |
    "A" "B"
  ```

- Refactor the grammar to extract common prefixes.

  ```antlr
    myRule:
      "A" "B" ("C")?
  ```

## Ambiguous Alternatives Detected

An Ambiguous Alternatives Error occurs when Chevrotain cannot decide between two alternatives in
an alternation (OR DSL method).

Chevrotain "looks ahead" at most [K (3 by default)][maxlookahead]
tokens to determine which alternative to pick. An Ambiguous Alternatives Error indicates
that more than K tokens lookahead is needed.

Lets consider a more concrete example:

```antlr
fiveTokensLookahead:
  "A" "B" "C" "D" "1" |
  "A" "B" "C" "D" "2"
```

In order to decide between these two alternatives, Chevrotain must "look ahead" **five** tokens as the
disambiguating tokens are "1" and "2".
Five is a larger than the default [maxLookahead][maxlookahead] of four, so an error will be raised.

We could solve this case by increasing the global [maxLookahead][maxlookahead] to 5, however this is **not** recommended
due to performance and grammar complexity reasons.
From a performance perspective this is particularly problematic as some analysis
done on the grammar (during initialization) may become **exponentially** more complex as the maxLookahead grows.

We could also specify the [MAX_LOOKAHEAD](https://chevrotain.io/documentation/9_1_0/interfaces/OrMethodOpts.html#IGNORE_AMBIGUITIES)
config on the **specific** DSL method invocation where the problem occurs, This is still not the optimal solution in this case.

**_The recommended solution in this case would be to refactor the grammar to require a smaller lookahead_**.
In our trivial example the grammar can be refactored to be LL(1), meaning only one token of lookahead is needed.
The needed change is a simple **extraction of the common prefix before the alternation**.

```antlr
oneTokenLookahead:
  "A" "B" "C" "D"
  (
    "1" |
    "2"
  )
```

Note that the number of lookahead tokens needed to choose between alternatives may in fact be **infinite**, for example:

```antlr
infiniteTokensLookahead:
  ("A")* "1"  |
  ("A")* "2"
```

No matter how large a maxLookahead we choose, the sequence of "A"s could always (potentially) be longer...
The solution in this case is the same as before, **extraction of the common prefix before the alternation**, for example:

```antlr
oneTokenLookahead:
  ("A")*
  (
    "1" |
    "2"
  )
```

In some rare cases refactoring the grammar is not possible, in those cases it is still possible to resolve the
ambiguity using the [backtracking feature](../features/backtracking.md)
Although this is **strongly** discouraged due to performance and complexity reasons...

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

[maxlookahead]: https://chevrotain.io/documentation/9_1_0/interfaces/IParserConfig.html#maxLookAhead
[ignore_ambiguities]: https://chevrotain.io/documentation/9_1_0/interfaces/OrMethodOpts.html#IGNORE_AMBIGUITIES
