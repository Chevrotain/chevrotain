# Cold Start Performance

Chevrotain is (mostly) a runtime tool (No code generation).
This means there is a fair bit of logic happening every time a Chevrotain Parser is initialized.
In some use cases this overhead may need to be reduced as much as possible.

## Enabling Initialization Performance Tracing

Measuring a Parser's cold start performance can be done by enabling the [`traceInitPerf`](https://sap.github.io/chevrotain/documentation/6_3_0/interfaces/iparserconfig.html#traceinitperf)
flag. For example:

```javascript
class InitTracingParser extends CstParser {
    constructor() {
        super([], {
            // Note `traceInitPerf` may also accept numerical values
            traceInitPerf: true
        })

        this.performSelfAnalysis()
    }
}

new InitTracingParser() // Will print tracing info to the console.
```

## Use a smaller Global maxLookahead

Chevrotain is a K tokens lookahead Parser, this means it peeks ahead (at most) K Tokens to
determine the alternative to pick whenever it encounters a "branching" in the grammar.

During initialization Chevrotain pre-computes and caches lookahead functions that would
later be used at runtime. The global [maxLookahead](https://sap.github.io/chevrotain/documentation/6_3_0/interfaces/iparserconfig.html#maxlookahead)
setting can significantly affect the performance of this pre-computation due to the fact the number of possible "paths"
in the grammar can grow **exponentially** as the max length of the possible paths increases.

Example:

```javascript
class LowLookaheadParser extends CstParser {
    constructor() {
        super([], {
            // By default this value is 4
            maxLookahead: 2
        })

        this.performSelfAnalysis()
    }
}
```

Note that the global maxLookahead can be overridden for **individual** DSL methods(OR/OPTION/MANY/...) invocations, For example:

```javascript
class LowLookaheadParser extends CstParser {
    constructor() {
        super([], {
            // Globally **only one** token lookahead.
            maxLookahead: 1
        })

        $.RULE("value", () => {
            $.OR({
                // We need **two** tokens lookahead to distinguish between these two alternatives
                MAX_LOOKAHEAD: 2,
                DEF: [
                    {
                        ALT: () => {
                            $.CONSUME(A)
                            $.CONSUME(B)
                        }
                    },
                    {
                        ALT: () => {
                            $.CONSUME(A)
                            $.CONSUME(C)
                        }
                    }
                ]
            })
        })

        this.performSelfAnalysis()
    }
}
```

## Disabling Grammar Validations

Chevrotain performs many validations during Parser initialization, however those are not really relevant
when the Parser is valid, they validations are a **development time** tool, and not really needed during productive flows.

The [skipValidations](https://sap.github.io/chevrotain/documentation/6_3_0/interfaces/iparserconfig.html#skipvalidations)
config property can be used to avoid running these validations.

```javascript
class NaiveSkippedValidationsParser extends CstParser {
    constructor() {
        super([], {
            // This could reduce 30-50% of the initialization time
            skipValidations: true
        })

        this.performSelfAnalysis()
    }
}
```

The example above is a little naive, as the validations are **always** skipped, while we only need to skip
them under specific conditions, for example:

```javascript
class RealisticSkippedValidationsParser extends CstParser {
    constructor() {
        super([], {
            // only run the validations when a certain env variable is set.
            skipValidations: process.env["IN_MY_PACKAGE_LOCAL_TESTING"] !== true
        })

        this.performSelfAnalysis()
    }
}
```
