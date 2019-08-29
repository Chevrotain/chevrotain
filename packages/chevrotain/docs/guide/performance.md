# Optimizing a Parser for Performance

## Singleton Parser

Do not create a new Parser instance for each new input
Instead re-use a single instance and reset its state between iterations. For example:

```javascript
// reuse the same parser instance.
const parser = new JsonParser([])

module.exports = function(text) {
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

Avoiding creating new instances is imperative because Chevrotain lazy evaluates and caches
many computations required for its execution, This cache is kept on the instance level
So creating a new Parser instance for each input would lose all advantages of this cache.

Note that this means that if your parser "carries" additional state, that state should also be reset.
Simply override the Parser's [reset](https://sap.github.io/chevrotain/documentation/6_2_0/classes/cstparser.html#reset) method
to accomplish that.

## Lexer Optimizations

Ensure that the lexer's optimizations are enabled.
The Chevrotain Lexer performs optimizations by filtering the potential token matchs
using the next [charCode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt) to be consumed.
These optimizattions can provide anywhere from a **30% boost** for small lexers
to **several multipiles** improvment in large Lexers with many TokenTypes.

To apply this optimization the first possible charCodes for **every** TokenType must be identified.
Sometimes a TokenType's first charCodes cannot be automatically identified.
In that case the lexer will **silently** revert to using the unoptimized algorithims.

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
to the console with details on how to resolve optimiations errors.

## Arrays of Alternatives

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
$.RULE("value", function() {
    // c1 is used as a cache, the short circute "||" will ensure only a single initialization
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

-   This pattern should only be applied on largish number of alternatives, testing on node.js 8.0 showed
    it was only useful when there are at least four alternatives. In cases with fewer alternatives this pattern
    would actually be **slower**!

-   This pattern can only be applied if there are no vars which can be accessed via closures.
    Example:

    ```javascript
    // BAD
    $.RULE("value", function() {
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
    $.RULE("value", function() {
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

    -   Note that gates often use vars from closures.

-   Due to the way Chevrotain is built, the text of the alternatives cannot be completely extracted from the grammar rule

    ```javascript
    // defined outside the rule
    const myAlts = [
        {
            ALT: () => {
                return $.CONSUME(StringLiteral)
            }
        }
    ]

    // Won't work
    $.RULE("value", function() {
        // Chevrotain won't be able to analyze this grammar rule as it relies on Function.prototype.toString
        result = $.OR(myAlts)
    })
    ```

-   Avoid dynamically changing the parser instance. The line:

    > "$.c1 || ($.c1 = ..." (\$ is 'this')

    Will cause a 'c1' property to be assigned to the parser instance.
    This may seem innocent but if enough properties are added dynamically to an instance
    its V8 hidden class will change which could cause a severe performance reduction.

    To avoid this, simply define these "cache properties" in the constructor.
    See an example in the [ECMAScript5 grammar's constructor](https://github.com/SAP/chevrotain/blob/ac21570b97a8de0d6b91f29979aed8041455cacd/examples/grammars/ecma5/ecma5_parser.js#L37-L43).

## Minor Optimizations

// TODO: we should document the performance cost of CSTNodeLocation tracking in this guide
// I am not sure this is Minor or Major section yet (lets see how fast we can get it first)

These are only required if you are trying to squeeze every tiny bit of performance out of your parser.

1.  **Reduce the amount of Token position tracking** the lexer performs.
    See The [ILexerConfig.positionTracking](https://sap.github.io/chevrotain/documentation/6_2_0/interfaces/ilexerconfig.html) property.

2.  **Avoid creating parsing rules which only parse a single Terminal.**

    There is a certain fixed overhead for the invocation of each parsing rule.
    Normally there is no reason to pay it for a Rule which only consumes a single Terminal.
    For example:

    ```javascript
    this.myRedundantRule = this.RULE("myRedundantRule", function() {
        $.CONSUME(StringLiteral)
    })
    ```

    Instead such a rule's contents should be (manually) in-lined in its call sites.

3.  **Avoid \*\_SEP DSL methods (MANY_SEP / AT_LEAST_ONE_SEP).**

    The \*\_SEP DSL methods also collect the separator Tokens parsed. Creating these arrays has a small overhead (several percentage).
    Which is a complete waste in most cases where those separators tokens are not needed for any output data structure.

4.  **Use the returned values of iteration DSL methods (MANY/MANY_SEP/AT_LEAST_ONE/AT_LEAST_ONE_SEP).**

    Consider the following grammar rule:

    ```javascript
    this.RULE("array", function() {
        let myArr = []
        $.CONSUME(LSquare)
        values.push($.SUBRULE($.value))
        $.MANY(() => {
            $.CONSUME(Comma)
            values.push($.SUBRULE2($.value))
        })
        $.CONSUME(RSquare)
    })
    ```

    The values of the array are manually collected inside the "myArr" array.
    However another result array is already created by invoking the iteration DSL method "MANY"
    This is obviously a waste of cpu cycles...

    A slightly more efficient (but syntactically ugly) alternative would be:

    ```javascript
    this.RULE("array", function() {
        let myArr = []
        $.CONSUME(LSquare)
        values.push($.SUBRULE($.value))

        let iterationResult = $.MANY(() => {
            $.CONSUME(Comma)
            return $.SUBRULE2($.value)
        })

        myArr = myArr.concat(iterationResult)
        $.CONSUME(RSquare)
    })
    ```
