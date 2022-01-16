## 10.0.0

- Dropped support for legacy ES5.1 runtimes (e.g: IE11)
  The minimum ECMAScript version needed to run Chevrotain is now ES2015 (ES6).
  This should not affect anyone running on a modern engine,  
  meaning modern NodeJS versions or popular evergreen browsers.

- Various TypeScript signatures are now more accurate and strict which could potentially
  cause compilation errors with some grammars implemented in TypeScript, e.g:
  - `OPTION` methods now return `OUT | undefined` instead of just `OUT`.
  - A `RULE` implementation function in `CstParser` is now defined as returning `void`.
  - The `ARGS` for `SubruleMethodOpts` options type is now better enforced via generics in the `subrule` definition.

## 9.0.0

- **Custom APIs** feature has been deprecated and removed.
  This means the following public APIs no longer exist:
  - `resolveGrammar`
  - `validateGrammar`
  - `assignOccurrenceIndices`
  - `defaultGrammarValidatorErrorProvider`
  - `defaultGrammarResolverErrorProvider`
  - `IGrammarValidatorErrorMessageProvider`
  - `IGrammarResolverErrorMessageProvider`
  - `IParserDefinitionError`
  - `generateParserFactory`
  - `generateParserModule`

## 8.0.0

- Chevrotain now uses the package.json `exports` field, as specified in the [documentation](https://nodejs.org/api/packages.html#packages_package_entry_points):
  > Warning: Introducing the "exports" field prevents consumers of a package from using any entry points that are not defined, including the package.json (e.g. require('your-package/package.json'). This will likely be a breaking change.

## 7.0.0

- The Parser's default `maxLookahead` was reduced to 3. This could cause ambiguity issues in existing
  Parsers. The pre 7.0.0 behavior can be reproduced by passing an explicit `maxLookahead`

  ```javascript
  class MoreLookaheadParser extends CstParser {
    constructor() {
      super([], {
        maxLookahead: 4
      })
      // ...
    }
  }
  ```

  It is also possible (and recommended) to increase the maxLookahead for a specific DSL method rather than globally for all.
  See [relevant issue](https://github.com/chevrotain/chevrotain/issues/1012).

- The soft deprecated `Parser` class has been fully removed, use `CstParser` or `EmbeddedActionsParser` instead.
  The choice depends on if your parser outputs a [CST](https://chevrotain.io/docs/guide/concrete_syntax_tree.html) or not.
  the `outputCst` property of the IParserConfig was also removed as this behavior is now controlled by base Parser class which is
  extended.

- The soft deprecated **static** `performSelfAnalysis` method has been fully removed, use the **instance** method with the same name instead.

- The IParserConfig's `ignoredIssues` property has been deprecated.
  Any Parser still using this property will throw an exception on initialization.
  If any ambiguities need be ignored, the `IGNORE_AMBIGUITIES` property should be used instead on specific DSL rules.

  - see: [Ignoring Ambiguities Docs](https://chevrotain.io/docs/guide/resolving_grammar_errors.html#IGNORING_AMBIGUITIES)

- Nested / In-Lined rules via the `NAME` parameter for DSL rules have been deprecated, e.g:

  ```typescript
  this.RULE("statements", () => {
    this.OR([
      {
        NAME: "$letStatement",
        ALT: () => {
          // ...
        }
      },
      {
        NAME: "$selectStatement",
        ALT: () => {
          // ...
        }
      }
    ])
  })
  ```

  This feature was not orthogonal with other features (e.g error recovery) and added quite a-lot of complexity for the
  small benefit of a little syntactic sugar. Instead of using "nested / in-lined" rules, simply extract the content
  of these rules to "regular" top level rules.

- Reducing the usage of 'any' in the 'OR' method type signature may cause existing code to fail TypeScript compilation.
  In such a case an explicit usage of a generic `any` type will resolve the problem.

  ```typescript
  this.OR<any>(/* ... */)
  ```

- All methods of the Interface `errorMessageProvider` are now **mandatory**.
  To defer to the default error message template behavior, defer to `chevrotain.defaultParserErrorProvider`, e.g:

  ```typescript
  import {
    defaultParserErrorProvider,
    IParserErrorMessageProvider,
    IToken,
    TokenType
  } from "chevrotain"

  class myCustomErrorMsgProvider implements IParserErrorMessageProvider {
    buildNoViableAltMessage(options: {
      expectedPathsPerAlt: TokenType[][][]
      actual: IToken[]
      previous: IToken
      customUserDescription: string
      ruleName: string
    }): string {
      // Custom user error message builder
      return "sad sad panda:" + options.actual[0].image
    }

    buildEarlyExitMessage(options: {
      expectedIterationPaths: TokenType[][]
      actual: IToken[]
      previous: IToken
      customUserDescription: string
      ruleName: string
    }): string {
      // invoking the default error message string builder.
      return defaultParserErrorProvider.buildEarlyExitMessage(options)
    }

    // Implementation of other properties from `IParserErrorMessageProvider`
    // ...
  }
  ```

- The TokenType's `tokenName` property has been deprecated (This actually happened in 6.3.1...) use the `name` property instead.

- The GAST `Flat` class was renamed to `Alternative`.

## 6.0.0

- Due to re-implementation of the grammar analysis via ["grammar recording"](../guide/internals.md#grammar-recording), certain semantics action
  will now need to be wrapped in the new [ACTION](https://chevrotain.io/documentation/6_0_0/classes/baseparser.html#action) Parsing
  DSL method. This will not affect Parsers that output a CST and only affect some of the Parsers which employ embedded semantic actions.
  The Missing `ACTION` wrappers will be automatically detected and throw a descriptive error message to ease migration.

- Grammar de-serialization support has been removed as it is now redundant as Chevrotain no longer relies on `Function.prototype.toString`.
  And the de-serialization feature was a workaround to issues caused by `Function.prototype.toString`.
  This means the [serializedGrammar property](https://chevrotain.io/documentation/5_0_0/interfaces/iparserconfig.html#serializedgrammar)
  of the Parser's configuration was removed, and using it will cause an error to be thrown during initialization.

- The Parser's [getGAstProductions method](https://chevrotain.io/documentation/6_0_0/classes/baseparser.html#getgastproductions)
  now returns a plain JavaScript object representing a Map/Dictionary rather than the Chevrotain's internal HashTable implementation.

## 5.0.0

- Setting the Parser's input **before** `this.performSelfAnalysis` is called will now throw an error.
  This limitation is necessary in order to enable to enable the automatic detection of missing `this.performSelfAnalysis` calls.
  To avoid this issue do **not** pass the input token vector input to the Parser's constructor and instead always set the input
  after the Parser instance was created, This pattern is demonstrated in the tutorial:
  - [Parser Constructor Structure.](../tutorial/step2_parsing.md#structure)
  - [Setting the Token Vector Input.](../tutorial/step2_parsing.md#usage)

## 4.0.0

- The Parser constructor no longer accepts a token vector as an argument.
  The "input" **setter** should be used instead, for example:

  ```javascript
  // Old API
  class MyOldParser extends Parser {
    constructor(input, config) {
      super(input, allTokens, config)
    }
  }

  const oldInstance = new MyOldParser(
    [
      /* token vector */
    ],
    {}
  )

  // New API
  class MyNewParser extends Parser {
    constructor(config) {
      super(allTokens, config)
    }
  }

  const newInstance = new MyNewParser({})
  newInstance.input = [
    /* token vector */
  ]
  ```

  - Note that the input **setter** has existed for a while and has been used
    in the official examples and documentation, therefore it is likely that
    only the constructor need be modified in existing parsers.

- Automatic [Concrete Syntax Tree](https://chevrotain.io/docs/guide/concrete_syntax_tree.html) output is now enabled by default.
  This means that parser which rely on **embedded actions** must **explicitly** disable
  the CST output, for example:

  ```javascript
  class MyNewParser extends Parser {
    constructor() {
      // we have to explicitly disable the CST building for embedded actions to work.
      super(allTokens, { outputCst: false })
    }
  }
  ```

  - If a parser already uses CST output no change is needed in 4.0

- DSL repetitions no longer return any values in **embedded actions** mode:

  - **MANY** / **AT_LEAST_ONE** no longer return an array of the iteration results.
    The iterations results should be collected manually instead:

    ```javascript
    // Before 4.0.0
    const stmts = $.MANY(() => {
      return $.SUBRULE(Statement)
    })

    // After 4.0.0
    const stmts = []
    $.MANY(() => {
      stmts.push($.SUBRULE(Statement))
    })
    ```

  - Similarly **MANY_SEP** / **AT_LEAST_ONE_SEP** also no longer return any results.
    These used to return both the repetition result array and an array of separators Tokens consumed.
    It is still possible to manually collect the repetition results, but not the separator tokens.

  - This change has no effect when using automatic **CST creation**.

## 3.0.0

- A CST Node's children dictionary no longer contains empty arrays
  for unmatched terminals and non-terminals. This means that some existence checks
  conditions in the CST visitor must be refactored, for example:

  ```javascript
  class MyVisitor extends SomeBaseVisitor {
    atomicExpression(ctx) {
      // BAD - will fail due to "TypeError: Cannot read property '0' of undefined"
      if (ctx.Integer[0]) {
        return ctx.Integer[0].image
      }

      // GOOD - safe check
      if (ctx.Integer) {
        // if a property exists it's value is guaranteed to have at least one element.
        return ctx.Identifier[0].image
      }
    }
  }
  ```

## 2.0.0

- The creation of TokenTypes using the class keyword syntax has been soft deprecated.
  and is no longer officially supported.
  e.g:

  ```javascript
  // No longer officially supported
  class Identifier {
    static pattern = /[a-zA-Z_]\w+/
  }

  // Use the createToken API instead
  const Identifier = createToken({
    name: "Identifier",
    pattern: /[a-zA-Z_]\w+/
  })
  ```

  See the reasoning in [this issue](https://github.com/chevrotain/chevrotain/issues/653).

* defaultErrorProvider was renamed to defaultParserErrorProvider

* **All** the gast namespace was flattened into the API's root, e.g:

  ```javascript
  // Old API - using nested namespace.
  chevrotain.gast.Alternation

  // New API - No nested namespaces.
  chevrotain.Alternation
  ```

* The exceptions namespace was also flattened into the API's root.

* The constructors of all the gast (Grammar AST) structure have been
  refactored to use the config object pattern additionally some properties have been renamed or removed.
  See the new SDK docs for details:
  - [Rule](https://chevrotain.io/documentation/2_0_0/classes/rule.html)
  - [Terminal](https://chevrotain.io/documentation/2_0_0/classes/terminal.html)
  - [NonTerminal](https://chevrotain.io/documentation/2_0_0/classes/nonterminal.html)
  - [Alternation](https://chevrotain.io/documentation/2_0_0/classes/alternation.html)
  - [Option](https://chevrotain.io/documentation/2_0_0/classes/option.html)
  - [Repetition](https://chevrotain.io/documentation/2_0_0/classes/repetition.html)
  - [RepetitionWithSeparator](https://chevrotain.io/documentation/2_0_0/classes/repetitionwithseparator.html)
  - [RepetitionMandatory](https://chevrotain.io/documentation/2_0_0/classes/repetitionmandatory.html)
  - [RepetitionMandatoryWithSeparator](https://chevrotain.io/documentation/2_0_0/classes/repetitionmandatorywithseparator.html)
  - [Flat](https://chevrotain.io/documentation/2_0_0/classes/flat.html) (sequence)
