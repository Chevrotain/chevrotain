# Internal Implementation Details

Chevrotain provides an abstraction for building Parsers, however no abstraction is prefect
and at some point understand the implementation details may become necessary.

## Grammar Recording

#### TLDR

Wrap any semantic actions that cause runtime errors during the recording phase
or have global side effects with the [ACTION DSL method](https://sap.github.io/chevrotain/documentation/5_0_0/classes/baseparser.html#action) to
resolve issues.

### The Problem

**_Chevrotain needs to "understand" the grammar structure in order to run._**

For example, in an alternation Chevrotain must able to choose the right alternative
to being processing, but in order to do so the **contents** (Grammar) of each alternative
must be known in advance.

```javascript
$.RULE("value", () => {
    // The choice of which alternative to pick
    // is done by the "OR" (alternation) method, by **looking ahead** in the token vector.
    // But making this choice requires **knowing** in advance the full structure of the grammar.
    $.OR([
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

### The Solution

Chevrotain solves the problem of "understanding" the grammar structure by running the Parser in a "Recording Mode"
with different implementations of the parsing methods (OR/MANY/OPTION/...), the result of these "recordings" are saved
on the Parser instance and are accessible via the [getGastProductions](https://sap.github.io/chevrotain/documentation/5_0_0/classes/baseparser.html#getgastproductions)
method. However there are a couple of assumptions inherent in this approach.

### Assumption 1 - The Parser won't throw errors during recording.

Any error thrown during the recording phase will obviously fail the recording and thus make the parser un-usable.
These are normally easy to fix and identify as the runtime error message will be modified to indicate it occurred during the "recording phase"
and the stack trace will easily point us towards the source of the problem.

However lets first consider situations where an error might be thrown to fully understand the problem.
The root issue is making assumptions on the structure and values returned by the Parsing DSL methods.
Lets first consider an example that will not cause an error.

```javascript
class SafeEmbeddedActionsExample extends EmbeddedActionsParser {
    constructor() {
        /* ... */
        $.RULE("objectItem", () => {
            const keyTok = $.CONSUME(StringLiteral)
            $.CONSUME(Colon)
            const valAst = $.SUBRULE($.value)

            // strip away the quotes from the string literal
            // Note that even during the "recording phase" the CONSUME method will return an object that matches the IToken interface
            // to reduce potential runtime errors.
            const keyName = keyTok.image.substring(1, keyTok.image.length - 1)

            // Assembling this JS object literal won't cause any issues because
            // we are not actually doing anything with the returned values.
            // Only assigning them to properties in a new object (which is always safe)
            return {
                type: "keyValuePair",
                key: keyName,
                value: valAst
            }
        })
    }
}
```

So we saw that a common use case of using embedded semantic actions to construct an AST is normally safe during the recording phase.
Let's consider some situations that will actually cause errors.

#### Example 1: Making assumptions on the returned structure by a SUBRULE call

```javascript
class ErrorEmbeddedActions1 extends EmbeddedActionsParser {
    constructor() {
        /* ... */
        $.RULE("topRule", () => {
            // During the recording phase `SUBRULE` will return a "dummy" value
            // Which would not match the structure `otherRule` normally returns.
            const otherRuleVal = $.SUBRULE($.otherRule)

            // Will cause "undefined is not an object" runtime error
            // because during the recording phase `SUBRULE` will not returned the expected value.
            return otherRuleVal.foo.bar
        })

        $.RULE("otherRule", () => {
            const myTok = $.CONSUME(MyTok)

            return {
                foo: {
                    bar: myTok.image
                }
            }
        })
    }
}
```

#### Example 2: Making assumptions on the returned value by DSL Method calls

```javascript
class ErrorSemanticChecks extends EmbeddedActionsParser {
    constructor() {
        /* ... */
        $.RULE("semanticCheckRule", () => {
            // During the recording phase `CONSUME` will return a "dummy" IToken value.
            const myNumTok = $.CONSUME(NumberTok)
            // The "dummy" IToken `image` is not a number so this will evaluate to NaN.
            const numValue = parseInt(myNumTok.image)

            // Our embedded semantic check will **always** throw during the recording phase because
            // the "mocked" IToken returned by `CONSUME` would never be a valid integer.
            if (isNaN(numValue)) {
                throw Error("Unexpected Number Value!")
            }

            return numValue
        })
    }
}
```

#### Common Denominator: Embedded Actions

Before moving on to possible solutions, note that all the examples and centered around using Parsers with **embedded actions**.
When using a Parser that outputs a [Concrete Syntax Tree](./concrete_syntax_tree.md) which is the [recommended approach](../tutorial/step3_adding_actions_root.md#alternatives),
there would be very few (if any) embedded actions in the grammar.
Thus it is a lot less likely that a CSTParser would raise errors during the recording phase, e.g:

```javascript
class JsonParser extends CstParser {
    constructor() {
        /* ... */
        // This Grammar rule has no custom user semantic actions
        // So it would not throw an unexpected exception during the recording phase...
        $.RULE("objectItem", () => {
            $.CONSUME(StringLiteral)
            $.CONSUME(Colon)
            $.SUBRULE($.value)
        })
    }
}
```

#### The Solution

The solution is to simply **avoid executing any code that could raise such exceptions during the recording phase**.
This can be achieved by wrapping the relevant semantic actions with the [ACTION DSL method](https://sap.github.io/chevrotain/documentation/5_0_0/classes/baseparser.html#action)
for example lets resolve the two scenarios shown above:

```javascript
class JsonParser extends EmbeddedActionsParser {
    constructor() {
        /* ... */
        $.RULE("topRule", () => {
            // During the recording phase `SUBRULE` will return a "dummy" value
            // Which would not match the structure `otherRule` normally returns.
            const otherRuleVal = $.SUBRULE($.otherRule)

            return $.ACTION(() => {
                // Code inside `ACTION` will not be executed during the grammar recording phase.
                // Therefore an error will **not** be thrown...
                otherRuleVal.foo.bar
            })
        })

        $.RULE("otherRule", () => {
            const myTok = $.CONSUME(MyTok)

            return {
                foo: {
                    bar: myTok.image
                }
            }
        })
    }
}
```

```javascript
class SolvedSemanticChecks extends EmbeddedActionsParser {
    constructor() {
        /* ... */
        $.RULE("semanticCheckRule", () => {
            // During the recording phase `CONSUME` will return a "dummy" IToken value.
            const myNumTok = $.CONSUME(NumberTok)
            // The "dummy" IToken `image` is not a number so this will evaluate to NaN.
            const numValue = parseInt(myNumTok.image)

            $.ACTION(() => {
                // Code inside `ACTION` will not be executed during the grammar recording phase.
                // Therefore an error will **not** be thrown...
                if (isNaN(numValue)) {
                    throw Error("Unexpected Number Value!")
                }
            })

            return numValue
        })
    }
}
```

Note:

-   Not all semantic actions require wrapping in `ACTION`, only those that would throw errors during the
    grammar recording phase.
-   Embedded actions reduce separation of concerns between parsing and semantics but we can still maintain some separation
    by performing the Parsing bits at the beginning of the rule and the semantic actions at the end of the rule.

### Assumption 2 - There are no lasting side effects due to running the recording phase.

If

#### Solution

####
