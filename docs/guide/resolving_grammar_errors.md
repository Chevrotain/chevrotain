# Resolving Grammar Errors

*   [Common Prefix Ambiguities.](#COMMON_PREFIX)
*   [None Unique Grammar Name Found.](#UNIQUE_GRAMMAR_NAME)

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

*   Reorder the alternatives so that shorter common prefix lookahead
    paths appears after the longer ones.

    ```antlr
    myRule:
      "A" "B" "C" |
      "A" "B"
    ```

*   Refactor the grammar to extract common prefixes.

    ```antlr
      myRule:
        "A" "B" ("C")?
    ```

## None Unique Grammar Name Found

Chevrotain uses a grammar's constructor name as a **key**
for caching the results of heavy computations.

This means that every grammar must have a unique name:

```javascript
// File1
// unique name "MyParser"
class MyParser extends Parser {
    // ...
}

// File2
// another unique name: "MyOtherParser"
class MyParser extends Parser {
    // ...
}

// File3
// None unique name, "MyParser" is already defined in File1
class MyParser extends Parser {
    // ...
}
```
