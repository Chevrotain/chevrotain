# Initialization Performance

Chevrotain is (mostly) a runtime tool (No code generation).
This means there is a fair bit of logic happening every time a Chevrotain Parser or Lexer are initialized.
In some use cases this overhead may need to be reduced as much as possible.

## Enabling Initialization Performance Tracing

Measuring a Parser's initialization performance can be done by enabling the
[`IParserConfig.traceInitPerf`](https://chevrotain.io/documentation/10_4_1/interfaces/IParserConfig.html#traceInitPerf)
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

A Lexer's initialization performance can similarly be measured by enabling the
[`ILexerConfig.traceInitPerf`](https://chevrotain.io/documentation/10_4_1/interfaces/ILexerConfig.html#traceInitPerf)
flag:

```javascript
// Will print tracing info to the console.
new Lexer([], {
  // Note `traceInitPerf` may also accept numerical values
  traceInitPerf: true
})
```

## Use a smaller Global maxLookahead

Chevrotain is a K tokens lookahead Parser, this means it peeks ahead (at most) K Tokens to
determine the alternative to pick whenever it encounters a "branching" in the grammar.

During initialization Chevrotain pre-computes and caches lookahead functions that would
later be used at runtime. The global [maxLookahead](https://chevrotain.io/documentation/10_4_1/interfaces/IParserConfig.html#maxLookAhead)
setting can significantly affect the performance of this pre-computation due to the fact the number of possible "paths"
in the grammar can grow **exponentially** as the max length of the possible paths increases.

Example:

```javascript
class LowLookaheadParser extends CstParser {
  constructor() {
    super([], {
      // By default this value is 3
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

Chevrotain performs many validations during Lexer & Parser initialization, however those are not really relevant
when the Lexer & Parser are known to be valid, These validations are a **development time** tool, and not really needed during productive flows.

The [IParserConfig.skipValidations](https://chevrotain.io/documentation/10_4_1/interfaces/IParserConfig.html#skipValidations)
config property can be used to avoid running these validations during **Parser** initialization.

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

Similarly the [ILexerConfig.skipValidations](https://chevrotain.io/documentation/10_4_1/interfaces/ILexerConfig.html#skipValidations)
config property can be used to skip the optional validations during **Lexer** initialization.

```javascript
new Lexer([], {
  skipValidations: true
})
```

The examples above are a little naive, as the validations are **always** skipped, while we only need to skip
them under specific conditions, for example:

```javascript
class MoreRealisticSkippedValidationsParser extends CstParser {
  constructor() {
    super([], {
      // only run the validations when a certain env variable is set.
      skipValidations: process.env["IN_MY_PACKAGE_LOCAL_TESTING"] !== true,
      // Always Trace init logs when in local testing to hopefully spot regressions.
      traceInitPerf: process.env["IN_MY_PACKAGE_LOCAL_TESTING"] === true
    })

    this.performSelfAnalysis()
  }
}
```

Note that in a real world scenario the special condition to enable validations/tracing could be anything:

- env variable.
- command line argument.
- existence of a certain config file in the CWD.
- ...
