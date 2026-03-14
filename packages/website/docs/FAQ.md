---
sidebar: auto
---

# FAQ

- [How Does Chevrotain Compare to Other Parsing Tools?](#VS_OTHER_TOOLS)
  - [Grammar Definition: Code vs External Grammar Files](#GRAMMAR_DEFINITION)
  - [Parsing Algorithm and Grammar Class](#PARSING_ALGORITHM)
  - [Performance](#PERFORMANCE)
  - [Error Recovery and Fault Tolerance](#ERROR_RECOVERY)
  - [Developer Experience](#DEVELOPER_EXPERIENCE)
- [Why are Error Recovery / Fault Tolerant capabilities needed in a Parser?](#WHY_ERROR_RECOVERY)
- [How do I debug my parser?](#DEBUGGING)
- [Why are the unique numerical suffixes (CONSUME1/CONSUME2/...) needed for the DSL Rules?](#NUMERICAL_SUFFIXES)
- [Why does Chevrotain not work correctly after I minified my Sources?](#MINIFIED)
- [Why does Chevrotain not work correctly after I webpacked my Sources?](#WEBPACK)
- [Why does my parser appear to be stuck during its initialization?](#STUCK_AMBIGUITY)

## How Does Chevrotain Compare to Other Parsing Tools?

Chevrotain occupies a unique position in the JavaScript parsing ecosystem: it is a **grammar-as-code** library
where grammars are written as pure JavaScript/TypeScript classes using a DSL API, with **no code generation step**.
This section compares Chevrotain to other popular parsing tools across several key dimensions.

### Grammar Definition: Code vs External Grammar Files

The most fundamental difference between Chevrotain and most other parsing tools is **how grammars are defined**.

- **Chevrotain**: Grammars are plain JavaScript/TypeScript classes. You use a fluent DSL API (`CONSUME`, `SUBRULE`, `OR`, `MANY`, etc.)
  inside parser rule methods. There is no separate grammar file and no code generation step.

- **ANTLR4**: Grammars are written in `.g4` files using a dedicated grammar syntax, then a code generator produces
  parser source code in the target language (JavaScript, TypeScript, Java, etc.).

- **PEG.js / Peggy**: Grammars are written in a PEG notation file, then compiled into a JavaScript parser module.

- **Jison**: Grammars are written in a Bison-like notation file, then compiled into a JavaScript parser.

- **nearley**: Grammars are written in a `.ne` file using a BNF-like syntax, then compiled into JavaScript.

- **ohm**: Grammars are defined as string literals using a PEG-like syntax, with semantic actions defined separately.
  This is closer to Chevrotain's philosophy of keeping grammar and actions separate, but the grammar itself
  is still a custom notation rather than host-language code.

**What this means in practice:**

- **Debugging**: With Chevrotain, debugging the grammar **is** debugging your JavaScript code. You set breakpoints in your
  IDE and step through the actual grammar rules you wrote. With parser generators, you must either debug the generated
  code (which is often large and hard to follow) or rely on specialized grammar debugging tools.

- **Build process**: Chevrotain requires no grammar compilation step. Your grammar is ordinary code that gets compiled
  by the same TypeScript/JavaScript toolchain as the rest of your project. Parser generators require an additional
  build step to generate the parser from the grammar file.

- **IDE support**: Because Chevrotain grammars are standard code, you get full IDE support out of the box — autocomplete,
  refactoring, type checking, go-to-definition — with no need for specialized grammar editor plugins.

- **Tradeoff — verbosity**: Grammar-as-code is inherently more verbose than a dedicated grammar notation. A grammar
  expressed in ANTLR's `.g4` syntax or PEG notation will typically be more concise than the equivalent Chevrotain
  parser class.

### Parsing Algorithm and Grammar Class

Different parsing tools use different parsing algorithms, which affects what grammars they can handle and how they perform.

- **Chevrotain** uses **LL(k)** parsing with a configurable lookahead depth (`maxLookahead`, default 3).
  This makes lookahead behavior predictable and keeps performance consistent. For cases that need more power,
  Chevrotain also supports [backtracking](./features/backtracking.md) and [gates](./features/gates.md) as escape hatches.

- **ANTLR4** uses **Adaptive LL(\*)**, which dynamically extends lookahead as needed. This is more powerful than
  fixed LL(k) — it can handle a broader class of grammars without manual intervention — but the adaptive mechanism
  adds runtime overhead.

- **PEG.js / Peggy** and **ohm** use **PEG (Parsing Expression Grammars)** with unlimited lookahead via ordered choice
  and backtracking. PEG grammars are unambiguous by construction (the first matching alternative wins), but this ordered
  choice semantics can be surprising and makes certain grammars difficult to express. PEG parsers also cannot handle
  left recursion.

- **Jison** uses **LALR(1)** (or SLR/LR) parsing, which is efficient and well-suited to programming language grammars
  but limited to a single token of lookahead. Shift/reduce and reduce/reduce conflicts can be difficult to diagnose.

- **nearley** uses the **Earley** algorithm, which can parse **any** context-free grammar, including ambiguous ones. This
  generality comes at a performance cost — Earley parsing is O(n³) in the worst case, though it is O(n) for
  unambiguous grammars.

**Key takeaway**: Chevrotain's LL(k) algorithm offers a practical sweet spot — expressive enough for the vast majority
of real-world grammars, while remaining predictable and fast. If you need to parse a grammar class that LL(k) cannot
handle (e.g., highly ambiguous grammars), tools like ANTLR4 or nearley may be a better fit.

### Performance

Chevrotain treats performance as a first-class feature, not a secondary concern. Significant effort has gone into
profiling and optimizing for the [V8 JavaScript engine](https://github.com/v8/v8/wiki).

- Chevrotain is **generally faster** (often significantly so) than other JavaScript parsing libraries.
  It can compete with the performance of **hand-written recursive descent parsers**.
  See the [Online Benchmark](https://chevrotain.io/performance/) comparing JSON parser implementations.

- Because there is no external grammar interpretation at runtime and no generated-code abstraction layer, the parser
  executes straightforward method calls that JavaScript engines can optimize aggressively (inlining, hidden classes,
  inline caches).

- The Chevrotain Lexer uses **charCode-based optimizations** that can provide a 30% boost for small token sets and
  multiple times improvement for large ones. See the [Runtime Performance Guide](./guide/performance.md) for
  optimization tips.

- **Tradeoff — initialization cost**: The first time a Chevrotain parser is instantiated, it performs lookahead
  computation and grammar validation. For complex grammars with high `maxLookahead` values, this can be noticeable.
  See the [Initialization Performance Guide](./guide/initialization_performance.md) for mitigation strategies.

### Error Recovery and Fault Tolerance

Error recovery is the ability of a parser to continue parsing after encountering a syntax error, producing as many
diagnostics as possible from a single parse rather than stopping at the first error.

- **Chevrotain**: Has **built-in automatic error recovery** using single token insertion, single token deletion, and
  re-sync token heuristics. This is critical for building editor tooling (Language Servers, linters, formatters) where
  the input is often in an incomplete or invalid state. See [Fault Tolerance](./features/fault_tolerance.md).

- **ANTLR4**: Also provides robust error recovery capabilities with a similar approach.

- **PEG.js / Peggy, Jison, nearley, ohm**: Generally do **not** provide built-in error recovery. When a parse fails,
  you typically get a single error pointing to the failure location, with no attempt to recover and continue. Building
  fault-tolerant behavior on top of these tools requires significant custom work.

**Why this matters**: If you are building a compiler for completely valid inputs only, error recovery may not be critical.
But if you are building **editor integrations, IDE features, linters, or any tool that must handle partially-written code**,
built-in error recovery is essential.

### Developer Experience

- **TypeScript support**: Chevrotain is written in TypeScript and provides first-class type definitions. The
  [@chevrotain/cst-dts-gen](https://github.com/chevrotain/chevrotain/tree/master/packages/cst-dts-gen) package
  can automatically generate TypeScript type definitions for your CST (Concrete Syntax Tree), giving you
  type-safe tree traversal.

- **No new syntax to learn**: Chevrotain's grammar API is a JavaScript/TypeScript API. The learning curve is reduced
  to learning a library, not a new language. Parser generators each come with their own grammar syntax and conventions.

- **Syntax diagrams**: Chevrotain can automatically [generate syntax diagrams](./guide/generating_syntax_diagrams.md)
  (railroad diagrams) from your grammar — useful for documentation and visualization.

- **Online playground**: The [Chevrotain Playground](https://chevrotain.io/playground/) lets you experiment with
  grammars in the browser.

- **Tradeoff — ecosystem maturity**: ANTLR4 has a larger ecosystem with extensive IDE support (ANTLRWorks, VS Code
  extensions), a large [grammar repository](https://github.com/antlr/grammars-v4), and more learning resources.
  If you need a ready-made grammar for a well-known language, ANTLR4's ecosystem is hard to beat.

## Why are Error Recovery / Fault Tolerant capabilities needed in a Parser?

When building a standard compiler that should only handle completely valid inputs, these capabilities are indeed irrelevant.
But for the use case of building Editor Tools / Language Services, the parser must be able to handle partially invalid inputs as well.
Some examples:

- All syntax errors should be reported and not just the first one.
- Refactoring should work even if there is a missing comma somewhere.
- Autocomplete / Intellisense should work even if there is a syntax error prior to the requested suggestion position.

## How do I debug my parser?

Just add a breakpoint in your favorite IDE and debug, same as you would for any other JavaScript code.
Chevrotain Grammars are **pure** JavaScript code. No special handling required.

Note that the breakpoints may also trigger during the Parser's initialization.
See the [relevant section](./guide/internals.md#debugging-implications) in the grammar recording phase docs.

## Why are the unique numerical suffixes (CONSUME1/CONSUME2/...) needed for the DSL Rules?

Let's look at an example first:

```javascript
this.RULE("someRule", () => {
  $.OPTION(() => {
    $.CONSUME(MyToken);
  });

  $.OPTION1(() => {
    // A different suffix is not needed because the argument is different!
    $.CONSUME(MyOtherToken);
  });

  // OPTION has no "named" argument so a different suffix is **always** needed
  // within the same top-level rule.
  $.OPTION2(() => {
    $.CONSUME2(MyToken);
  });
});
```

This snippet uses three different variations of OPTION(""|1|2) and two variations of CONSUME(""|2).
This is because during the parsing runtime Chevrotain must be able to **distinguish** between the variations of the **same** Parsing rule.

The combination of the DSL Rule (OPTION/MANY/CONSUME), the DSL Rule's optional numerical suffix, and the DSL rule's parameter (if available)
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

The first time a Chevrotain parser is initialized, additional validations and computations are performed.
Some of these can take a very long time under certain edge cases, specifically the detection of ambiguous alternatives
when the parser uses a larger than the default [maxLookahead](https://chevrotain.io/documentation/12_0_0/interfaces/IParserConfig.html)
and there are many (thousands) of ambiguous paths.

To resolve this, try reducing the maxLookahead and inspect the ambiguity errors to fix
the grammar ambiguity, which is the root cause of the problem.

Also have a look at the [Initialization Performance Guide](./guide/initialization_performance.md).
