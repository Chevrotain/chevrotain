# Resolving Grammar Errors

-   [Common Prefix Ambiguities.](#COMMON_PREFIX)
-   [Terminal Token Name Not Found.](#TERMINAL_NAME_NOT_FOUND)
-   [Infinite Loop Detected.](#INFINITE_LOOP)

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

-   Reorder the alternatives so that shorter common prefix lookahead
    paths appears after the longer ones.

    ```antlr
    myRule:
      "A" "B" "C" |
      "A" "B"
    ```

-   Refactor the grammar to extract common prefixes.

    ```antlr
      myRule:
        "A" "B" ("C")?
    ```

## Terminal Token Name Not Found

This error occurs when Chevrotain cannot find a TokenType used in a CONSUME call.
Note that Chevrotain identifies the TokenType **literally** that is to say
Chevrotain **reads** the parser's source code (static analysis) not the value at runtime.

Keeping this property in mind lets look at a few common causes of such an error
This parser

-   The TokenType's name does not match its literal form.

    ```javascript
    import { createToken, Parser } from "chevrotain"

    // note the name property "copyPastaMistake" is different that the variable name "Integer"
    const Integer = createToken({ name: "copyPastaMistake", pattern: /\d+/ })
    const allTokens = [Integer]

    class MyParser extends Parser {
        constructor(input, config) {
            super(input, allTokens, config)

            $.RULE("MyRule", () => {
                // Will cause "Terminal Token Name Not Found"
                this.CONSUME(Integer)
            })
        }
    }
    ```

-   The TokenType's was not provided to the parser in the tokenDictionary argument.

    ```javascript
    import { createToken, Parser } from "chevrotain"

    const Integer = createToken({ name: "Integer", pattern: /\d+/ })
    // Opps we forgot to add the Integer Token to the TokenDictionary
    const allTokens = []

    class MyParser extends Parser {
        constructor(input, config) {
            super(input, allTokens, config)

            $.RULE("MyRule", () => {
                // Will cause "Terminal Token Name Not Found"
                this.CONSUME(Integer)
            })
        }
    }
    ```

-   This error may also occur due to source code transformations of the parser.
    See: [Minification](https://sap.github.io/chevrotain/docs/FAQ.html#MINIFIED)
    and [Webpack](https://sap.github.io/chevrotain/docs/FAQ.html#WEBPACK) FAQ sections.

    Basically if a code snippet such as:

    ```javascript
    const Integer = createToken({ name: "Integer", pattern: /\d+/ })
    // ...
    this.CONSUME(Integer)
    ```

    gets transformed to something like

    ```javascript
    const v14 = createToken({ name: "Integer", pattern: /\d+/ })
    // ...
    this.CONSUME(v14)
    ```

    Then the literal form no longer matches the name property...

## Infinite Loop Detected

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
such as OPTION and/or [GATE](https://sap.github.io/chevrotain/docs/features/gates.html).

For example the above example should be written as:

```javascript
$.MANY(() => {
    $.OPTION(() => {
      $.CONSUME(Plus)
    )
})
```
