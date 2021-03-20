---
sidebar: auto
---

# FAQ

- [Why should I use a Parsing DSL instead of a Parser Generator?](#VS_GENERATORS)
- [What Differentiates Chevrotain from other Parsing Libraries?](#VS_OTHERS)
- [Why are Error Recovery / Fault Tolerant capabilities needed in a Parser?](#WHY_ERROR_RECOVERY)
- [How do I debug my parser?](#DEBUGGING)
- [Why are the unique numerical suffixes (CONSUME1/CONSUME2/...) needed for the DSL Rules?](#NUMERICAL_SUFFIXES)
- [Why does Chevrotain not work correctly after I minified my Sources?](#MINIFIED)
- [Why does Chevrotain not work correctly after I webpacked my Sources?](#WEBPACK)
- [Why does my parser appear to be stuck during its initialization?](#STUCK_AMBIGUITY)

## Why should I use a Parsing DSL instead of a Parser Generator?

A Parser Generator adds an (unnecessary) level of abstraction between the grammar implementation and the actual parser.
This is because the grammar is written in a **different** language than the target runtime.

- Debugging a generated parser means looking at **different** code than the actual grammar specifications.
  This generated code is often huge, verbose and hard to understand. On the other hand, when debugging a Parser
  implemented using a Parsing DSL, The **actual Grammar's code** the implementer wrote(not generated code) is debugged.
  So debugging Chevrotain is **just like** debugging any other JavaScript code.

- No need to handle grammar generation as part of the build process or commit generated files to the source code.

- No need to learn a new syntax, as Chevrotain is a **Pure** JavasScript Library. instead the problem is reduced to learning a new API.

- No need for a special editor to write the Grammar, just use your favorite JavaScript editor.

## What Differentiates Chevrotain from other JavaScript Parsing Solutions?

- **Performance**: Chevrotain is generally faster (often much more so) than other existing JavaScript Parsing Solutions.
  And can even compete with the performance of hand built parsers.
  See an [Online Benchmark](https://chevrotain.io/performance/) that compares the performance of JSON Parsers implemented using multiple JavaScript Parsing solutions.

- **Error Recovery / Fault Tolerance**: With the exception of Antlr4, other JavaScript Parsing Solutions usually do not have Error Recovery capabilities.

## Why are Error Recovery / Fault Tolerant capabilities needed in a Parser?

When building a standard compiler that should only handle completely valid inputs these capabilities are indeed irrelevant.
But for the use case of building Editor Tools / Language Services the parser must be able to handle partially invalid inputs as well.
Some examples:

- All syntax errors should be reported and not just the first one.
- Refactoring should work even if there is a missing comma somewhere.
- Autocomplete / Intellisense should work even if there is a syntax error prior to the requested suggestion position.

## How do I debug my parser?

Just add a breakpoint in your favorites IDE and debug, same as you would for any other JavaScript code.
Chevrotain Grammars are **pure** javascript code. No special handling required.

Note that the breakpoints may also trigger during the Parser's initialization.
See: the [relevant section](./guide/internals.md#debugging-implications) in grammar recording phase docs.

## Why are the unique numerical suffixes (CONSUME1/CONSUME2/...) needed for the DSL Rules?

Lets look at an example first:

```javascript
this.RULE("someRule", () => {
  $.OPTION(() => {
    $.CONSUME(MyToken)
  })

  $.OPTION1(() => {
    // A different suffix is not needed because the argument is different!
    $.CONSUME(MyOtherToken)
  })

  // OPTION has no "named" argument so a different suffix is **always** needed
  // within the same top level rule.
  $.OPTION2(() => {
    $.CONSUME2(MyToken)
  })
})
```

This snippet uses three different variations of OPTION(""|1|2) and two variations of CONSUME(""|2).
This is because during the parsing runtime Chevrotain must be able to **distinguish** between the variations of the **same** Parsing rule.

The combination of the DSL Rule(OPTION/MANY/CONSUME), the DSL Rule's optional numerical suffix and the DSL rule's parameter (if available)
are mapped to a **unique** key which Chevrotain uses to **figure out** the current location in the grammar. This location information is then
used for many things such as:

- Computing the lookahead function which decides if a DSL rule should be entered or which alternatives should be taken.
- Computing an appropriate error message which includes the list of next valid possible tokens.
- Performing automatic Error Recovery by figuring out "re-sync" tokens.

## Why does Chevrotain not work correctly after I minified my Grammar?

~~Chevrotain relies on **Function.prototype.toString()**.
This means that certain aggressive minification options can break Chevrotain grammars.~~

The dependence on `Function.prototype.toString` was removed in
[version 6.0.0](http://chevrotain.io/docs/changes/CHANGELOG.html#_6-0-0-8-20-2019) of Chevrotain.
Special handling is no longer needed during minification scenarios.

## Why does Chevrotain not work correctly after I webpacked my Grammar?

~~Chevrotain relies on **Function.prototype.toString()**.
This means that certain webpack optimizations can break Chevrotain grammars.~~

The dependence on `Function.prototype.toString` was removed in
[version 6.0.0](http://chevrotain.io/docs/changes/CHANGELOG.html#_6-0-0-8-20-2019) of Chevrotain.
Special handling is no longer needed during WebPacking scenarios.

## Why does my parser appear to be stuck during its initialization?

The first time a Chevrotain parser is initialized additional validations and computations are performed.
Some of these can take a very long time under certain edge cases. Specifically the detection of ambiguous alternatives
when the parser uses a larger than the default [maxLookahead](https://chevrotain.io/documentation/9_0_0/interfaces/iparserconfig.html#maxlookahead)
and there are many (thousands) of ambiguous paths.

To resolve this try reducing the maxLookahead and inspect the ambiguity errors to fix
the grammar ambiguity which is the root cause of the problem.

Also have a look at the [Initialization Performance Guide](./guide/initialization_performance.md)
