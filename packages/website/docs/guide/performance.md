# Runtime Performance

This document lists tips and tricks to optimize runtime performance.

## Using a Singleton Parser

Do not create a new Parser instance for each new input
Instead re-use a single instance and reset its state between iterations. For example:

```javascript
// reuse the same parser instance.
const parser = new JsonParser([])

module.exports = function (text) {
  const lexResult = JsonLexer.tokenize(text)

  // setting a new input will RESET the parser instance's state.
  parser.input = lexResult.tokens

  const value = parser.json()

  return {
    value: value,
    lexErrors: lexResult.errors,
    parseErrors: parser.errors
  }
}
```

Avoiding the creation of new instances is important to avoid re-paying the Parser's initialization costs
Additionally, re-using the same instance may leverage hot-spot optimizations of the respective JavaScript engine.

Note that this means that if your parser "carries" additional state, that state should also be reset.
Simply override the Parser's [reset](https://chevrotain.io/documentation/10_1_2/classes/CstParser.html#reset) method
to accomplish that.

## Ensuring Lexer Optimizations

Ensure that the lexer's optimizations are enabled.
The Chevrotain Lexer performs optimizations by filtering the potential token matches
using the next [charCode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt) to be consumed.
These optimizations can provide anywhere from a **30% boost** for small lexers
to **several multiples** improvement in large Lexers with many TokenTypes.

To apply this optimization the first possible charCodes for **every** TokenType must be identified.
Sometimes a TokenType's first charCodes cannot be automatically identified.
In that case the lexer will **silently** revert to using the unoptimized algorithms.

If the TokenType's first charCodes cannot be automatically identified, you can set the [`start_chars_hint`](https://chevrotain.io/documentation/10_1_2/interfaces/ITokenConfig.html#start_chars_hint) property when calling `createToken()`. If you define a custom [pattern](https://chevrotain.io/documentation/10_1_2/interfaces/ITokenConfig.html#pattern) for your token, then you should set `start_chars_hint` manually for optimal performance.

It it possible to configure the Lexer **throw** an error
in case the optimizations cannot be enabled by turning on the
"ensureOptimizations" flag:

```javascript
const { Lexer } = require("chevrotain")
const myLexer = new Lexer(
  [
    /* tokens */
  ],
  { ensureOptimizations: true }
)
```

With the "ensureOptimizations" flag enabled the Lexer will also print error messages
to the console with details on how to resolve optimizations errors.

## Caching Arrays of Alternatives

The syntax for alternatives (OR) requires creating an array on every **single** invocation.
For large enough arrays and in rules which are called often this can cause quite a large performance penalty.

```javascript
$.RULE("value", () => {
  $.OR([
    // an array with seven alternatives
    { ALT: () => $.CONSUME(StringLiteral) },
    { ALT: () => $.CONSUME(NumberLiteral) },
    { ALT: () => $.SUBRULE($.object) },
    { ALT: () => $.SUBRULE($.array) },
    { ALT: () => $.CONSUME(True) },
    { ALT: () => $.CONSUME(False) },
    { ALT: () => $.CONSUME(Null) }
  ])
})
```

A simple JavaScript pattern can avoid this costly re-initialization:

```javascript
$.RULE("value", function () {
  // c1 is used as a cache, the short circuit "||" will ensure only a single initialization
  $.OR(
    $.c1 ||
      ($.c1 = [
        { ALT: () => $.CONSUME(StringLiteral) },
        { ALT: () => $.CONSUME(NumberLiteral) },
        { ALT: () => $.SUBRULE($.object) },
        { ALT: () => $.SUBRULE($.array) },
        { ALT: () => $.CONSUME(True) },
        { ALT: () => $.CONSUME(False) },
        { ALT: () => $.CONSUME(Null) }
      ])
  )
})
```

Applying this pattern (in just a single location) on a JSON grammar provided 25-30% performance boost
(Node.js 8), For a CSS grammar (2 locations) this resulted in about 20% speed boost.

It is important to note that:

- This pattern should only be applied on largish number of alternatives, testing on node.js 8.0 showed
  it was only useful when there are at least four alternatives. In cases with fewer alternatives this pattern
  would actually be **slower**!

- This pattern can only be applied if there are no vars which can be accessed via closures.
  Example:

  ```javascript
  // BAD
  $.RULE("value", function () {
    let result
    // We reference the "result" variable via a closure.
    // So a new function is needed each time this grammar rule is invoked.
    $.OR(
      $.c1 ||
        ($.c1 = [
          {
            ALT: () => {
              result = $.CONSUME(StringLiteral)
            }
          }
        ])
    )
  })

  // GOOD
  $.RULE("value", function () {
    let result
    // no closure for the result variable, we use the returned value of the OR instead.
    result = $.OR(
      $.c1 ||
        ($.c1 = [
          {
            ALT: () => {
              return $.CONSUME(StringLiteral)
            }
          }
        ])
    )
  })
  ```

  - Note that gates often use vars from closures.

- Avoid dynamically changing the parser instance. The line:

  > "$.c1 || ($.c1 = ..." (\$ is 'this')

  Will cause a 'c1' property to be assigned to the parser instance.
  This may seem innocent but if enough properties are added dynamically to an instance
  its V8 hidden class will change which could cause a severe performance reduction.

  To avoid this, simply define these "cache properties" in the constructor.
  See an example in the [ECMAScript5 grammar's constructor](https://github.com/chevrotain/chevrotain/blob/ac21570b97a8de0d6b91f29979aed8041455cacd/examples/grammars/ecma5/ecma5_parser.js#L37-L43).

## Minor Runtime Optimizations

These are only required if you are trying to squeeze every tiny bit of performance out of your parser.

1.  **Reduce the amount of Token position tracking** the lexer performs.
    See The [ILexerConfig.positionTracking](https://chevrotain.io/documentation/10_1_2/interfaces/ILexerConfig.html) property.

2.  **Avoid creating parsing rules which only parse a single Terminal.**

    There is a certain fixed overhead for the invocation of each parsing rule.
    Normally there is no reason to pay it for a Rule which only consumes a single Terminal.
    For example:

    ```javascript
    this.myRedundantRule = this.RULE("myRedundantRule", function () {
      $.CONSUME(StringLiteral)
    })
    ```

    Instead such a rule's contents should be (manually) in-lined in its call sites.

3.  **Avoid \*\_SEP DSL methods (MANY_SEP / AT_LEAST_ONE_SEP).**

    The \*\_SEP DSL methods also collect the separator Tokens parsed. Creating these arrays has a small overhead (several percentage).
    Which is a complete waste in most cases where those separators tokens are not needed for any output data structure.
