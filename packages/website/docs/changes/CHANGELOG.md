## X.Y.Z (INSERT_DATE_HERE)

#### Bug Fixes

- [chore: add types at package.json exports](https://github.com/Chevrotain/chevrotain/pull/1881)

  - Thanks to [@msujew](https://github.com/mshima) :thumbsup:

## 10.4.1 (11-4-2022)

#### Bug Fixes

- [fix: missing call to lookahead initialization for **experimental** lookahead plugins](https://github.com/Chevrotain/chevrotain/pull/1878)

  - Thanks to [@msujew](https://github.com/msujew) :thumbsup:

#### Documentation

- [docs: fix broken links to protected props](https://github.com/Chevrotain/chevrotain/issues/1874)

## 10.4.0 (10-23-2022)

#### Minor Changes

- [feat: support pluggable lookahead strategy](https://github.com/Chevrotain/chevrotain/issues/1852)
  - **experimental** API subject to potential changes...
  - Thanks to [@msujew](https://github.com/msujew) :thumbsup:

#### Documentation

- [docs: IRecognitionException should extend 'Error'](https://github.com/Chevrotain/chevrotain/pull/1850)

  - Thanks to [@benhohner](https://github.com/benhohner) :thumbsup:

## 10.3.0 (8-21-2022)

#### Minor Changes

- [Removed validating of redundant methods from `validateVisitor()`](https://github.com/Chevrotain/chevrotain/pull/1847)

#### Bug Fixes

- [runtime exception: `Class constructor GAstVisitor cannot be invoked without 'new'`](https://github.com/Chevrotain/chevrotain/issues/1845)

## 10.2.0 (8-19-2022)

#### Minor Changes

- [Capability to fail fast on first lexer error via ILexerConfig `recoveryEnabled` config](https://github.com/Chevrotain/chevrotain/pull/1839)
  - Thanks to [@jonestristand](https://github.com/jonestristand) :thumbsup:

#### Bug Fixes

- [Lexer throws uncaught error when longer_alt token is not in mode](https://github.com/Chevrotain/chevrotain/issues/1825)

  - Thanks to [@msujew](https://github.com/msujew) :thumbsup:

- ["unreachable code after return statement" warning in Firefox](https://github.com/Chevrotain/chevrotain/issues/1787)
  - Thanks to [@medihack](https://github.com/medihack) :thumbsup:

#### Documentation

- [TypeScript Signatures: add generics to `getBaseCstVisitorConstructor` functions](https://github.com/Chevrotain/chevrotain/pull/1774)

  - Thanks to [@jackhenry](https://github.com/jackhenry) :thumbsup:

- [docs: document SKIP_TOKEN()](https://github.com/Chevrotain/chevrotain/issues/1699)

- Various broken links fixes in chevrotain.io/docs website.

## 10.1.2 (3-6-2022)

#### Bug Fixes

- [missing \*.ts source referenced by source maps in sub-packages](https://github.com/Chevrotain/chevrotain/issues/1773)

#### Documentation

- [docs(api.d.ts): add generics for getBaseCstVisitorConstructor functions](https://github.com/Chevrotain/chevrotain/pull/1774)
  - Thanks to [@jackhenry](https://github.com/jackhenry) :thumbsup:

## 10.1.1 (2-15-2022)

Patch release as a workaround for release process issues...

## 10.1.0 (2-15-2022)

#### Minor Changes

- [customizing automatic token deletion recovery by exposing `canRecoverWithSingleTokenDeletion` API](https://github.com/Chevrotain/chevrotain/issues/1753)
  - Thanks to [@medihack](https://github.com/medihack) :thumbsup:

#### Bug Fixes

- [Wrong CST d.ts type generation with same label for different alternatives](https://github.com/Chevrotain/chevrotain/issues/1745)

  - Thanks to [@medihack](https://github.com/medihack) :thumbsup:

- [Recovery Re-Sync logic ignores Token Categories](https://github.com/Chevrotain/chevrotain/issues/1055)
  - Thanks to [@medihack](https://github.com/medihack) :thumbsup:

#### Documentation

- [various fixes to broken links in docs](https://github.com/Chevrotain/chevrotain/commits?author=kevinkhill&since=2022-01-24&until=2022-01-24)
  - Thanks to [@kevinkhill](https://github.com/kevinkhill) :thumbsup:
- [Update the "where used" list ](https://github.com/Chevrotain/chevrotain/issues/1711)
- [additional description on token location attributes](https://github.com/Chevrotain/chevrotain/pull/1762)
  - Thanks to [@NaridaL](https://github.com/NaridaL) :thumbsup:

## 10.0.0 (1-17-2022)

#### Breaking Changes

- [BREAKING_CHANGES For V10](https://chevrotain.io/docs/changes/BREAKING_CHANGES.html#_10-0-0)

#### Minor Changes

- [Generating TypeScript Signatures(d.ts) for CST constructs.](https://chevrotain.io/docs/guide/concrete_syntax_tree.html#cst-typescript-signatures)
  - See [relevant documentation](https://chevrotain.io/docs/guide/concrete_syntax_tree.html#cst-typescript-signatures)
  - Thanks to [@mbett7](https://github.com/mbett7) :thumbsup:
- [refactor(utils): replace internal utils with lodash](https://github.com/Chevrotain/chevrotain/pull/1694)
  - This adds a new **3rd party** dependency (lodash).
  - This was done to reduce the amount of code being maintained, but at the cost of increased bundle size,
    for example: `chevrotain.min.js` is now 189kb instead of 156kb.

#### Bug Fixes

- [CST naming conflicts with built-in Object prototype props](https://github.com/Chevrotain/chevrotain/issues/1724)

## 9.1.0 (10-9-2021)

#### Minor Changes

- [Support multiple longer_alt tokens](https://github.com/Chevrotain/chevrotain/issues/1602)
  - Thanks to [@msujew](https://github.com/msujew) :thumbsup:

## 9.0.2 (6-13-2021)

#### Bug Fixes

- [esm bundle: the export name "\_\_esModule" is reserved and cannot be used](https://github.com/Chevrotain/chevrotain/issues/1537)

## 9.0.1 (3-29-2021)

#### Bug Fixes

- [fix: missing d.ts definitions in npm package](https://github.com/chevrotain/chevrotain/issues/1453)

## 9.0.0 (3-21-2021)

#### Breaking Changes

- [BREAKING_CHANGES For V9.0](https://chevrotain.io/docs/changes/BREAKING_CHANGES.html#_9-0-0)

#### Bug Fixes

- [fix: missing "./lib_esm/api_esm.mjs" file in npm package](https://github.com/chevrotain/chevrotain/issues/1441)

## 8.0.1 (2-28-2021)

#### Bug Fixes

- [fix: resolve multiple issues with bundled artifacts](https://github.com/chevrotain/chevrotain/issues/1387)

## 8.0.0 (2-28-202)

#### Breaking Changes

- [BREAKING_CHANGES For V8.0](https://chevrotain.io/docs/changes/BREAKING_CHANGES.html#_8-0-0)

#### Minor Changes

- [feat: improve ESM compatibility](https://github.com/Chevrotain/chevrotain/issues/1383)

#### Documentation

- [docs: update "under the hood" section in tutorial](https://github.com/Chevrotain/chevrotain/commit/7d2bb119d4009ef7954c5aa18cbad29a5a3a0760)
- [docs: add clarification for longer_alt chaining](https://github.com/Chevrotain/chevrotain/commit/5a508199632f787a4ac3d2b9000f6a6bed04d31f)

## 7.1.2 (2-23-2021)

Patch release after migration to new github org with updated metadata in package.json

## 7.1.1 (2-5-2021)

#### Minor Changes

- [fix: add missing members to parser exception type declarations](https://github.com/chevrotain/chevrotain/pull/1322)

  - Thanks to [@mbett7](https://github.com/mbett7) :thumbsup

- [fix: update type declaration for CstChildrenDictionary](https://github.com/chevrotain/chevrotain/pull/1315)
  - Thanks to [@raineszm](https://github.com/raineszm) :thumbsup

## 7.1.0 (1-2-2021)

#### Minor Changes

- [feat: remove constraints on rules and token names](https://github.com/chevrotain/chevrotain/pull/1293)
  - Thanks to [@jlguenego](https://github.com/jlguenego) :thumbsup
- [Add generics to getBaseCSTVisitorConstructor](https://github.com/chevrotain/chevrotain/pull/1303)
  - Thanks to [@ryanleecode](https://github.com/ryanleecode) :thumbsup

## 7.0.3 (10-30-2020)

#### Bug Fixes

- [Runtime errors after Webpack minification.](https://github.com/chevrotain/chevrotain/issues/1265)

## 7.0.2 (9-4-2020)

#### Bug Fixes

- [Empty Alternative inside Nested Repetitions causes infinite loops on Parser initialization.](https://github.com/chevrotain/chevrotain/issues/1200)

## 7.0.1 (4-22-2020)

#### Bug Fixes

- [Broken diagram generation in 7.0.0.](https://github.com/chevrotain/chevrotain/issues/1186)

## 7.0.0 (4-18-2020)

#### Breaking Changes

- [BREAKING_CHANGES For V7.0](https://chevrotain.io/docs/changes/BREAKING_CHANGES.html#_7-0-0)

#### Minor Changes

- [Improved Type Signature for 'OR' method](https://github.com/chevrotain/chevrotain/issues/970)

  - Thanks to [@OmarTawfik](https://github.com/OmarTawfik) :thumbsup

- [Include source maps and original \*.ts sources in npm package](https://github.com/chevrotain/chevrotain/issues/1167)

#### Bug Fixes

- [Literal single token character "ignore case" flag bug.](https://github.com/chevrotain/chevrotain/issues/1141)

  - Thanks to [@janisdd](https://github.com/janisdd) :thumbsup

- [IParserErrorMessageProvider properties must be implemented as **own** properties.](https://github.com/chevrotain/chevrotain/issues/1129)

#### Documentation

- [Clarify Lexer Limitation: "Complement Sets cannot be automatically optimized" Docs.](https://github.com/chevrotain/chevrotain/issues/1044)
- [document `recoveredNode` property on CST Nodes.](https://github.com/chevrotain/chevrotain/commit/09afb8d5187c596def3932625b53aac84e6d2d02)

## 6.5.0 (9-20-2019)

- [Optimize Certain Complex Lexers Initialization Performance](https://github.com/chevrotain/chevrotain/commit/e25222dcd2ce29f2c5352599dd55f3432a145316)
- [Lexer Initialization Performance Tracing](https://github.com/chevrotain/chevrotain/issues/1045)
- [Lexer Initialization: Optionally Skip Validations](https://github.com/chevrotain/chevrotain/issues/1048)

## 6.4.0 (9-15-2019)

#### Minor Changes

- [Larger Max numerical suffix/idx for the DSL Methods](https://github.com/chevrotain/chevrotain/issues/802)
- [Improve duplicate DSL methods suffix error message](https://github.com/chevrotain/chevrotain/issues/1020)

#### Bug Fixes

- [Unexpected Side Effects When backtracking in a CstParser](https://github.com/chevrotain/chevrotain/issues/789)

## 6.3.1 (9-10-2019)

#### Bug Fixes

- [Runtime Error thrown when trying to build an Early Exit Parsing Error with maxLookahead 1](https://github.com/chevrotain/chevrotain/commit/e044b8f9bc6acc58bfe2f238c6fc224b263547c4)

## 6.3.0 (9-8-2019)

#### Minor Changes

- [Improved Lookahead functions and maxLookahead handling](https://github.com/chevrotain/chevrotain/issues/1012)
- [Parser Initialization Performance Tracing](https://github.com/chevrotain/chevrotain/issues/1035)
- [Ability to Optionally Skip Grammar Validations in Production](https://github.com/chevrotain/chevrotain/issues/1036)

#### Documentation

- [Cold Start Performance Guide](https://github.com/chevrotain/chevrotain/issues/1037)
- [Deprecate: "Terminal Token Name Not Found" Error](https://github.com/chevrotain/chevrotain/issues/1017)
- [Update Performance Guide](https://github.com/chevrotain/chevrotain/issues/1038)
- [Incorrect Perf Docs](https://github.com/chevrotain/chevrotain/issues/885)
- Several TypeScript API fixes for [IToken](https://chevrotain.io/documentation/6_3_0/interfaces/itoken.html)
  and [TokenType](https://chevrotain.io/documentation/6_3_0/interfaces/tokentype.html)
  - [1](https://github.com/chevrotain/chevrotain/pull/1021)
  - [2](https://github.com/chevrotain/chevrotain/pull/1024)
  - Thanks to [@HoldYourWaffle](https://github.com/HoldYourWaffle) :thumbsup

#### Dev-Ops

- [Integrate Algolia Search in the docs website](https://github.com/chevrotain/chevrotain/issues/1031)

## 6.2.0 (8-30-2019)

#### Minor Changes

- [Improved handling of alternation ambiguities](https://github.com/chevrotain/chevrotain/issues/869)

#### Documentation

- [Documentation for ambiguous alternatives](https://github.com/chevrotain/chevrotain/issues/853)

- Several TypeScript API fixes for [CustomPatternMatcherFunc](https://chevrotain.io/documentation/6_2_0/globals.html#custompatternmatcherfunc)
  - [1](https://github.com/chevrotain/chevrotain/pull/1018)
  - [2](https://github.com/chevrotain/chevrotain/pull/1015)
  - Thanks to [@HoldYourWaffle](https://github.com/HoldYourWaffle) :thumbsup

## 6.1.0 (8-25-2019)

#### Minor Changes

- [Improve Complex Lexers initialization time.](https://github.com/chevrotain/chevrotain/issues/1005)

#### Performance

- A resolved performance related bug and a couple of new micro optimizations have produced
  minor performance improvements in the JSON(5%) and CSS(15%) benchmarks.

#### Documentation

- [Document the Parser.LA method.](https://github.com/chevrotain/chevrotain/issues/996)

#### Dev-Ops

- [Create Cold Start Performance benchmark.](https://github.com/chevrotain/chevrotain/issues/907)

## 6.0.0 (8-20-2019)

#### Breaking Changes

- [BREAKING_CHANGES For V6.0](https://chevrotain.io/docs/changes/BREAKING_CHANGES.html#_6-0-0)

#### Major Changes

- [Remove usage of Function.prototype.toString().](https://github.com/chevrotain/chevrotain/issues/998)

  - Means **no more bundling/minification/transpiling issues!** with WebPack/Babel/UglifyJS/other...
  - Provides a ~20% performance boost to most parsers initialization time.
  - These improved analysis capabilities will also enable multiple new features in future versions.
  - Thanks to [@EqualMa](https://github.com/EqualMa) for inspiration & proof of concept :thumbsup

#### Minor Changes

- [Parsing Exceptions should be declared as classes.](https://github.com/chevrotain/chevrotain/issues/990)

## 5.0.0 (8-1-2019)

#### Breaking Changes

- [BREAKING_CHANGES For V5.0](https://chevrotain.io/docs/changes/BREAKING_CHANGES.html#_5-0-0)

#### Minor Changes

- [Detect missing "performSelfAnalysis" during a parser's input setter.](https://github.com/chevrotain/chevrotain/issues/987)
- [Provide an ES6 build.](https://github.com/chevrotain/chevrotain/issues/976)
  - Thanks to [@EqualMa](https://github.com/EqualMa) :thumbsup
- [Restructure api.ts to be ESM compatible.](https://github.com/chevrotain/chevrotain/pull/984)
  - Thanks to [@EqualMa](https://github.com/EqualMa) :thumbsup

## 4.8.1 (6-21-2019)

#### Bug Fixes

- [Resolved edge case in repetition error recovery which may cause "Maximum call stack size exceeded".](https://github.com/chevrotain/chevrotain/commit/211d410bd456934809298da791283b0723e3b22a)

## 4.8.0 (6-14-2019)

#### Minor Changes

- [Custom Token Patterns and "Custom Payloads".](https://github.com/chevrotain/chevrotain/issues/888)

## 4.7.0 (6-8-2019)

#### Minor Changes

- [CST location information.](https://github.com/chevrotain/chevrotain/issues/932)

## 4.6.0 (6-1-2019)

#### Minor Changes

- [Expose two base Parser classes: CstParser and EmbeddedActionsParser.](https://github.com/chevrotain/chevrotain/issues/967)

## 4.5.0 (5-25-2019)

#### Minor Changes

- [Consider Token Categories in Lookahead Functions Calculation.](https://github.com/chevrotain/chevrotain/issues/962)

## 4.4.0 (5-24-2019)

#### Minor Changes

- [Better handling of infinite loops in repetitions.](https://github.com/chevrotain/chevrotain/issues/958)

## 4.3.3 (4-12-2019)

#### Bug Fixes

- [Performance regressions in Chrome Beta (74)](https://github.com/chevrotain/chevrotain/issues/942)

## 4.3.2 (4-2-2019)

#### Bug Fixes

- [Failure Lexing RegExp patterns starting with empty or "fully optional" groups](https://github.com/chevrotain/chevrotain/pull/934).
  - Thanks to [@jmrog](https://github.com/jmrog) :thumbsup

## 4.3.1 (3-18-2019)

#### Bug Fixes

- [Missing README.md in the npm package](https://github.com/chevrotain/chevrotain/issues/926).

## 4.3.0 (3-16-2019)

#### Minor Changes

- [Updated regexp-to-ast to version 0.4.0](https://github.com/chevrotain/chevrotain/issues/877).

  - This should provide a performance boost to the initialization time of large lexers.
  - Thanks to [@morwen](https://github.com/morwen) :thumbsup

#### Bug Fixes

- [Fix broken link to docs in lexer disallowed anchors error message](https://github.com/chevrotain/chevrotain/pull/903).

  - Thanks [@triplepointfive](https://github.com/triplepointfive) :thumbsup

## 4.2.0 (1-26-2019)

#### Minor Changes

- [Support Custom Lexer Error Messages](https://github.com/chevrotain/chevrotain/issues/877) Thanks @morwen!

#### Bug Fixes

- [Error when building a noAltException with maxLookahead === 1.](https://github.com/chevrotain/chevrotain/issues/887)

## 4.1.1 (12-14-2018)

#### Bug Fixes

- [Alternations ambiguity may not be detected when short repetitions.](https://github.com/chevrotain/chevrotain/issues/854)

## 4.1.0 (9-28-2018)

#### Minor Changes

- [Runtime check for removed Token vector argument in Parser constructor.](https://github.com/chevrotain/chevrotain/issues/825)

## 4.0.0 (9-26-2018)

#### Breaking Changes

- [BREAKING_CHANGES For V4.0](https://chevrotain.io/docs/changes/BREAKING_CHANGES.html#_4-0-0)

#### Major Changes

- [Concrete Syntax Tree creation is now enabled by default.](https://github.com/chevrotain/chevrotain/issues/819)

#### Minor Changes

- [The Parser's constructor no longer accepts a Token vector as the first argument.](https://github.com/chevrotain/chevrotain/issues/785)
- [Runtime infinite loop detection in iterations.](https://github.com/chevrotain/chevrotain/issues/625)
- Small (~5-10%) performance improvements and optimizations.
  - [Use ES6 Maps(if available) for faster lookahead functions caching.](https://github.com/chevrotain/chevrotain/issues/812)
  - [Remove automatic collection of return values for iterations.](https://github.com/chevrotain/chevrotain/issues/784)

#### Bug Fixes

- [Stack overflow during grammar analysis.](https://github.com/chevrotain/chevrotain/pull/816).

## 3.7.4 (7-30-2018)

#### Bug Fixes

- [OVERRIDE_RULE bugs](https://github.com/chevrotain/chevrotain/issues/795).

## 3.7.3 (7-21-2018)

#### Bug Fixes

- [CST - Labels of nonTerminals are lost during error recovery](https://github.com/chevrotain/chevrotain/issues/786).

## 3.7.2 (7-19-2018)

#### Bug Fixes

- [Performance Regressions under Chrome Canary 69](https://github.com/chevrotain/chevrotain/issues/783).

#### Examples

- [GraphQL Grammar Example](https://github.com/chevrotain/chevrotain/blob/master/examples/grammars/graphql/graphql.js)

## 3.7.1 (7-12-2018)

#### Bug Fixes

- [Potential Very Slow Lexer Initialization](https://github.com/chevrotain/chevrotain/issues/768).

## 3.7.0 (6-27-2018)

#### Minor Changes

- [Remove global cache (state) and use instance level cache instead](https://github.com/chevrotain/chevrotain/issues/754).

#### Bug Fixes

- [`mocha --watch` breaks the parser](https://github.com/chevrotain/chevrotain/issues/605).

## 3.6.1 (6-21-2018)

#### Bug Fixes

- [Runtime exception when checking custom patterns line break issues](https://github.com/chevrotain/chevrotain/issues/759).

## 3.6.0 (6-21-2018)

#### Minor Changes

- [Simplify Handling of line terminators in Lexers](https://github.com/chevrotain/chevrotain/issues/709).
- [Ability to de-serialize and serialize the GST instead of rebuilding it using Function.toString](https://github.com/chevrotain/chevrotain/issues/706).

#### Bug Fixes

- [Types - fixed groups parameter type in CustomPatternMatcherFunc](https://github.com/chevrotain/chevrotain/pull/751).
- [Types - CustomPatternMatcherFunc return type now allows null value](https://github.com/chevrotain/chevrotain/pull/746).

## 3.5.0 (6-10-2018)

#### Minor Changes

- [PerformSelfAnalysis can be an instance method.](https://github.com/chevrotain/chevrotain/issues/737).
- [Previous Token Information on Parser Runtime Errors.](https://github.com/chevrotain/chevrotain/issues/613).
- Updated regexp-to-ast to 0.3.3.
- [Lexer Validations now use regexp-to-ast library when appropriate](https://github.com/chevrotain/chevrotain/issues/710).

## 3.4.0 (6-6-2018)

#### Minor Changes

- [Detect grammars with none unique names](https://github.com/chevrotain/chevrotain/issues/715).
- [Better error message for: "Terminal Token name not found"](https://github.com/chevrotain/chevrotain/issues/656).
- Updated regexp-to-ast to 0.2.4.

#### Bug Fixes

- [Fixed UMD bundle to work on commonjs](https://github.com/chevrotain/chevrotain/commit/cd8951594adc6daca44e6294f7d4e61e908b2773).

#### Examples

- [Update WebPack example to webpack 4](https://github.com/chevrotain/chevrotain/issues/629).

## 3.3.0 (5-20-2018)

#### Documentation

- [Define APIs separately from the source code](https://github.com/chevrotain/chevrotain/issues/704).

## 3.2.1 (5-9-2018)

#### Bug Fixes

- [Failure Lexing Case Insensetive Patterns.](https://github.com/chevrotain/chevrotain/issues/708)

- [Version of regexp-to-ast library printed incorrectly.](https://github.com/chevrotain/chevrotain/commit/3798385c5365cee8156d2d642e864de930c37068)

## 3.2.0 (4-24-2018)

#### Minor Changes

- [Micro Optimizations.](https://github.com/chevrotain/chevrotain/commit/41543670d6cb46b151f214bc38285eb144b94fe0)

#### Documentation

- [New documentation website generated using vuepress.](https://chevrotain.io/docs/)

## 3.1.0 (4-13-2018)

#### Major Changes

- [Lexer optimizations using the next charCode in the remaining text.](https://github.com/chevrotain/chevrotain/issues/679)

## 3.0.1 (2-23-2018)

#### Bug Fixes

- [Easier handling of optional CST Nodes.](https://github.com/chevrotain/chevrotain/issues/666)

## 3.0.0 (2-23-2018)

#### Breaking Changes

- [BREAKING_CHANGES for V3.0](https://chevrotain.io/docs/changes/BREAKING_CHANGES.html#_3-0-0)

#### Major Changes

- [Optional Labels for CST Nodes](https://github.com/chevrotain/chevrotain/issues/666)

- [Performance Improvements for CST Creation](https://github.com/chevrotain/chevrotain/issues/572)

#### Minor Changes

- The CST creation no longer relies on "new Function()" calls and can thus be used
  in environments with [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) enabled.

## 2.0.2 (2-21-2018)

#### Bug Fixes

- [Runtime Error During re-sync Recovery](https://github.com/chevrotain/chevrotain/issues/668).

## 2.0.1 (2-11-2018)

#### Bug Fixes

- Removed redundant dependency.

## 2.0.0 (2-11-2018)

#### Breaking Changes

- [BREAKING_CHANGES for V2.0](https://chevrotain.io/docs/changes/BREAKING_CHANGES.html#_2-0-0)

#### Major Changes

- Support custom user defined declarative APIs

#### Minor Changes

- [Increase DSL methods suffix indices.](https://github.com/chevrotain/chevrotain/issues/606)

#### Bug Fixes

- [Added missing link to deprecated TokenType parent property error message.](https://github.com/chevrotain/chevrotain/issues/640)

## 1.0.1 (12-27-2017)

#### Documentation

- [New Documentation Website.](https://chevrotain.io/website/)

#### Bug Fixes

- Parser exceptions will now reference the new docs page.

## 1.0.0 (12-8-2017)

#### Breaking Changes

- [Rework token single inheritance into multiple classifications/ categories.](https://github.com/chevrotain/chevrotain/issues/564#issuecomment-349062346)
- [Tokens properties renaming.](https://github.com/chevrotain/chevrotain/issues/610#issuecomment-350244423)

#### Minor Changes

- [Custom Error Message argument for CONSUME.](https://github.com/chevrotain/chevrotain/issues/543)
- [Improved empty empty alternatives detection.](https://github.com/chevrotain/chevrotain/issues/196)
- [previousToken information for EarlyExitException.](https://github.com/chevrotain/chevrotain/pull/616)

#### Bug Fixes

- [Missing token location in EarlyExitException if token is EOF.](https://github.com/chevrotain/chevrotain/issues/613)

## 0.35.0 (11-15-2017)

#### Minor Changes

- ["Type" Property on Tokens "instances" for easier debugging.](https://github.com/chevrotain/chevrotain/issues/542)
- [Support both "push_mode" and "pop_mode" on a Token to support transitions.](https://github.com/chevrotain/chevrotain/issues/597)
- [Validation to check for too many alternatives.](https://github.com/chevrotain/chevrotain/issues/388)

#### Examples

- [TinyC Grammar Example](https://github.com/chevrotain/chevrotain/blob/master/examples/grammars/tinyc/tinyc.js)
- [Backtracking Example.](https://github.com/chevrotain/chevrotain/blob/master/examples/parser/backtracking/backtracking.js)

## 0.34.0 (10-15-2017)

#### Minor Changes

- [Rework syntax diagrams creation for ease of use and simplicity.](https://github.com/chevrotain/chevrotain/issues/583)

## 0.33.0 (10-2-2017)

#### Breaking Changes

- Removed "extendToken" and "NEXT\*TOKEN" deprecated APIs.
  Use createToken
  and LA(1) instead.

#### Minor Changes

- Tiny performance improvements and optimizations.
  - [1](https://github.com/chevrotain/chevrotain/commit/0567813bea6c2d32d01fc2aaf39f5290c7e02f0b)
  - [2](https://github.com/chevrotain/chevrotain/commit/26703756b17c71391f51fbecf08d06cba6c8734e)
  - [3](https://github.com/chevrotain/chevrotain/commit/d82fb7afdc386005995a58b5d192641403931c16)

## 0.32.1 (7-8-2017)

#### Bug Fixes

- [Fixed diagrams sample.](https://github.com/chevrotain/chevrotain/commit/d28eb378d5704e82e189f05ff3333cf29601b27c)

## 0.32.0 (7-6-2017)

#### Major Changes

Lexer Performance oriented release.
10%+ performance boost measured under V8.

- [Lexer Perf boost - .test + lastIndex vs .exec.](https://github.com/chevrotain/chevrotain/issues/522)
- [Reduce token vector resizing using a simple heuristic](https://github.com/chevrotain/chevrotain/commit/530a1fe5fe0bb24233d1ff9759bae073e07365fe)

## 0.31.0 (7-1-2017)

#### Breaking Changes

- [Token patterns which may include line terminators must be explicitly flagged with the "line_breaks" property.](https://chevrotain.io/docs/guide/resolving_lexer_errors.html#LINE_BREAKS)

#### Major Changes

- [Support for user defined line terminators.](https://github.com/chevrotain/chevrotain/issues/523)

## 0.30.0 (6-23-2017)

#### Major Changes

- [Customizable error messages.](https://github.com/chevrotain/chevrotain/issues/500)

#### Minor Changes

- [Validate that user Token Patterns cannot match an empty string.](https://github.com/chevrotain/chevrotain/issues/379)

## 0.29.0 (6-13-2017)

#### Breaking Changes

- [Default maxLookahead changed to 4](https://github.com/chevrotain/chevrotain/issues/472)
  - Originally the default maxLookahead was 5, This could cause very slow parser initialization
    under certain edge case during ambiguity detection, however the vast majority of grammars do not
    require five tokens of lookahead. A smaller default avoids these potential slow downs while still allows
    overriding in unique cases which require a large lookahead.

#### Bug Fixes

- [Separator DSL methods lookahead issue.](https://github.com/chevrotain/chevrotain/issues/391)

## 0.28.3 (5-1-2017)

#### Bug Fixes

- [Diagrams drawing bug when using custom Token patterns.](https://github.com/chevrotain/chevrotain/issues/462)

## 0.28.2 (4-28-2017)

#### Minor Changes

- [Upgrade to TypeScript 2.3.1](https://github.com/chevrotain/chevrotain/pull/458)

#### Documentation

- [Ensure chevrotain.d.ts is compatiable with noImplicitAny.](https://github.com/chevrotain/chevrotain/issues/459)

## 0.28.1 (4-18-2017)

#### Minor Changes

- [Major performance boost for CST Creation.](https://github.com/chevrotain/chevrotain/issues/446)
  - **50%** speed boost measured on V8 when CST output is enabled.

## 0.28.0 (4-16-2017)

#### Major Changes

- [Concrete Syntax Tree / Semantic Actions Visitor.](https://github.com/chevrotain/chevrotain/issues/381)

#### Documentation

- [Runnable offline tutorial source code.](https://github.com/chevrotain/chevrotain/pull/410)

#### Bug Fixes

- [Definitions: Chevrotain don't support literal string as Token PATTERN in TypeScript.](https://github.com/chevrotain/chevrotain/pull/448)

## 0.27.3 (3-31-2017)

#### Minor Changes

- [Support MultiMode Lexer definitions in Parser Constructor.](https://github.com/chevrotain/chevrotain/issues/395)

## 0.27.2 (3-31-2017)

#### Minor Changes

- [Detect alternation prefix ambiguities.](https://github.com/chevrotain/chevrotain/issues/186)

## 0.27.1 (3-29-2017)

#### Minor Changes

- [Refactor Lexer for minor performance boost.](https://github.com/chevrotain/chevrotain/commit/e91fc7e7b4f3a000ed9e3fa359b8fe6c3a6fd873)

#### Bug Fixes

- [Certain RegExp meta characters won't be handled correctly in small RegExps.](https://github.com/chevrotain/chevrotain/issues/433)

## 0.27.0 (3-27-]62017)

#### Major Changes

- [Support string Literals as Token patterns.](https://github.com/chevrotain/chevrotain/issues/431)
- [Lexer Performance optimizations 0.27.0](https://github.com/chevrotain/chevrotain/issues/432)

## 0.26.0 (3-26-2017)

#### Breaking Changes

- [Major Refactoring to Lexer & Token APIs](https://github.com/chevrotain/chevrotain/issues/423#issuecomment-289225219)

#### Major Changes

- [Simplify Lexer & Tokens APIs.](https://github.com/chevrotain/chevrotain/issues/423)

#### Minor Changes

- [Detection of infinite loops caused by grammars with "empty" repetitions.](https://github.com/chevrotain/chevrotain/pull/410)
  - Thanks @kdex!

## 0.25.1 (3-21-2017)

#### Bug Fixes

- [Fix Performance regression in Regular Tokens 0.25.0.](https://github.com/chevrotain/chevrotain/commit/52f3f1a4a7214b2b75c2ca95b58a1ec28ccbcfbd)

## 0.25.0 (3-19-2017)

#### Breaking Changes

- [Custom Token Patterns API change](https://github.com/chevrotain/chevrotain/issues/380#issuecomment-287629918)

#### Major Changes

- [Use RegExp sticky flag for lexer performance boost.](https://github.com/chevrotain/chevrotain/issues/380)
  - Up to **30%** Lexer performance boost measured.

#### Bug Fixes

- [0.24.0: Regression: Terminal token name: {name} not found.](https://github.com/chevrotain/chevrotain/issues/406)

## 0.24.0 (3-17-2017)

#### Breaking Changes

- [DSL Methods Improved optional arguments syntax.](https://github.com/chevrotain/chevrotain/issues/367)

#### Major Changes

- [Automatic creation of a Concrete Syntax Tree.](https://github.com/chevrotain/chevrotain/issues/215)
  - See [Relevant Docs](https://chevrotain.io/docs/guide/concrete_syntax_tree.html).

#### Minor Changes

- [Clear error message if rules have been defined after performSelfAnalysis has been called.](https://github.com/chevrotain/chevrotain/issues/385)
- [Micro performance boost on subrule array init.](https://github.com/chevrotain/chevrotain/issues/378)

#### Bug Fixes

- [Avoid Possible internal unique key conflicts.](https://github.com/chevrotain/chevrotain/commit/393f2a97cd109c239ced67931586afe5034df713)
- [Infinite loop during GAST builder.](https://github.com/chevrotain/chevrotain/issues/392)

## 0.23.0 (2-3-2017)

#### Major Changes

- [Custom Token Patterns to Support Lexer Context.](https://github.com/chevrotain/chevrotain/issues/360)

#### Documentation

- [Example of lexing python style indentation.](https://github.com/chevrotain/chevrotain/issues/352)

## 0.22.0 (1-27-2017)

#### Minor Changes

- [Lexer performance improvements.](https://github.com/chevrotain/chevrotain/issues/354)

## 0.21.1 (1-26-2017)

#### Bug Fixes

- [Fix issue with tokens that both pop and push a mode.](https://github.com/chevrotain/chevrotain/issues/351)
- [Avoid infinite loops during validations caused by left recursion.](https://github.com/chevrotain/chevrotain/commit/b796ffb8a95046fa331e6f7c6c2504557b794096)

## 0.21.0 (12-24-2016)

#### Major Changes

- [New "createToken" helper functions.](https://github.com/chevrotain/chevrotain/issues/329)
- [Support for custom implementations of Token patterns.](https://github.com/chevrotain/chevrotain/issues/331)

## 0.20.0 (12-11-2016)

#### Breaking Changes

- [More Functional Parsing DSL API.](https://github.com/chevrotain/chevrotain/issues/324)
  - This change **broke** a couple of APIS:
    - "OPTION" now returns the value of the inner grammar implementation or undefined otherwise instead of a boolean.
    - The "\*\_SEP" methods now return an object made up of two arrays, separators and values instead of a single array of separators.

## 0.19.0 (12-3-2016)

#### Minor Changes

- [Improve formatting of NoViableAlt exception message.](https://github.com/chevrotain/chevrotain/issues/297)
- [Less verbose syntax for defining grammar rules.](https://github.com/chevrotain/chevrotain/issues/316)

## 0.18.0 (10-27-2016)

#### Major Changes

- [Syntactic Content Assist Support.](https://github.com/chevrotain/chevrotain/issues/291)

## 0.17.1 (10-12-2016)

#### Bug Fixes

- [Lexer "Groups" state persists between different inputs tokenization.](https://github.com/chevrotain/chevrotain/issues/287)

#### Minor Changes

- [Parsers without error recovery should fail faster on invalid inputs.](https://github.com/chevrotain/chevrotain/issues/256)

## 0.17.0 (10-3-2016)

#### Major Changes

- [Grammar serialization and de-serialization.](https://github.com/chevrotain/chevrotain/issues/139)
- [Separate Railroad Diagram Generation into Scriptable Function.](https://github.com/chevrotain/chevrotain/issues/134)

## 0.16.1 (9-28-2016)

#### Minor Changes

- [Simple Lazy Tokens should support Token inheritance.](https://github.com/chevrotain/chevrotain/issues/282)

## 0.16.0 (9-24-2016)

#### Breaking Changes

The chevrotain TypeScript definitions file is now **only** compatible with TypeScript 2.0 and later versions.
For older versions of TypeScript use Chevrotain versions <= 0.15.0.

#### Minor Changes

- [Add "typings" field to package.json.](https://github.com/chevrotain/chevrotain/issues/251)

## 0.15.0 (9-23-2016)

#### Major Changes

- [Performance Improvements: Lookahead functions.](#274)
- [Performance: SimpleLazyTokens.](#277)
- ["Smart" Map based lookahead for K = 1 with Token inheritance.](#279)

This release is focused on performance improvements, with **~20%** boost on V8
and potentially **~100%** (double) performance on SpiderMonkey (FireFox 49).

To enjoy the maximum performance boost the new **SimpleLazyTokens** should be used.

#### Breaking Changes

Certain advanced uses cases of [dynamically defined Tokens](https://github.com/chevrotain/chevrotain/blob/master/examples/parser/dynamic_tokens/dynamic_delimiters.js)
Will break if some of new lookahead optimizations are enabled.

To resolve this a new property **dynamicTokensEnabled** has been defined on the [IParserConfig](https://chevrotain.io/documentation/0_15_0/interfaces/iparserconfig.html)
interface. This configuration property is disabled by default, but can be enabled to support the use case of dynamically defined tokens.
See the [dynamically defined Tokens](https://github.com/chevrotain/chevrotain/blob/master/examples/parser/dynamic_tokens/dynamic_delimiters.js)
example for details.

## 0.14.0 (9-3-2016)

#### Breaking Changes

- [OR DSL method Syntax should be more consistent.](https://github.com/chevrotain/chevrotain/issues/192)

#### Minor Changes

- [Performance Optimizations for 0.14.0 release.](https://github.com/chevrotain/chevrotain/pull/272)

## 0.13.4 (9-1-2016)

#### Minor Changes

- [Change NPMCDN links to use UNPKG domain name.](https://github.com/chevrotain/chevrotain/issues/270)

## 0.13.3 (8-28-2016)

#### Bug Fixes

- [Slow Parser Initialization.](https://github.com/chevrotain/chevrotain/issues/243)

## 0.13.2 (8-23-2016)

#### Bug Fixes

- [Diagrams with nodejs fail on instanceof check.](https://github.com/chevrotain/chevrotain/issues/268)

## 0.13.1 (8-15-2016)

#### Major Changes

- [Lexer: Lazy Tokens support.](https://github.com/chevrotain/chevrotain/issues/258)
- [Token "startOffset" and "endOffset" properties.](https://github.com/chevrotain/chevrotain/issues/259)

This Release includes a new **performance** feature called **"Lazy Tokens"**.
These tokens contain less actual state and defer the calculation of their properties
until needed. Considering most of the time this information is never needed (full position information)
the overall speed boost can be as much as **10-25%** (depending on the grammar used).

See "2. Use Lazy Tokens"
for more details.

## 0.13.0 (8-6-2016)

#### Major Changes

- [0.13.0 Performance Optimizations.](https://github.com/chevrotain/chevrotain/issues/248)
- Performance FAQ section docs.

This release includes **major performance optimizations and guidelines**.
Anywhere from 20% to 100% was measured (on V8) depending on the grammar used.
Please read the Performance FAQ section, as much of the performance gain is achieved by changing
the way a Chevrotain parser is initialized which will require code changes (not mandatory)
in user's code.

## 0.12.1 (8-3-2016)

#### Bug Fixes

- [Diagrams do not work with custom lexers.](https://github.com/chevrotain/chevrotain/issues/242)

#### Documentation

- [Improve support for running minified in the browser.](https://github.com/chevrotain/chevrotain/issues/239)

## 0.12.0 (7-21-2016)

#### Breaking Changes

- [Removed Bower support.](https://github.com/chevrotain/chevrotain/issues/226)

#### Bug Fixes

- [Predicates / Gates using closures to parameters will cause unexpected behavior.](https://github.com/chevrotain/chevrotain/issues/221)
- [Diagrams highlights issues under IE Edge.](https://github.com/chevrotain/chevrotain/issues/229)

#### Documentation

- [Example using parametrized sub-rules.](https://github.com/chevrotain/chevrotain/issues/218)

## 0.11.4 (7-16-2016)

- Fixes issue with previous release automation.

## 0.11.3 (7-16-2016)

#### Bug Fixes

- [AmbiguousAlternatives error's \<occurence\> property was always undefined.](https://github.com/chevrotain/chevrotain/issues/212)

#### Quality

- [Use SauceLabs for browser matrix testing](https://github.com/chevrotain/chevrotain/issues/217)

## 0.11.2 (7-5-2016)

#### Minor Changes

- [Unresolved subrule references can cause none descriptive exceptions during follow up validations.](https://github.com/chevrotain/chevrotain/issues/209)
- [More descriptive unresolved grammar error message.](https://github.com/chevrotain/chevrotain/issues/210)

#### Documentation

- [Dynamically defined Tokens example.](https://github.com/chevrotain/chevrotain/issues/208)

## 0.11.1 (6-16-2016)

#### Minor Changes

- [extendToken should create constructor functions with meaningful names](https://github.com/chevrotain/chevrotain/issues/206)

## 0.11.0 (6-7-2016)

- Minor version release as the previous version included a breaking change in a patch version.

#### Minor Changes

- [Better runtime checks for Invalid Lexer definitions.](https://github.com/chevrotain/chevrotain/issues/204)

## 0.10.2 (6-6-2016)

#### Breaking Changes

- [MultiMode Lexer defaultMode should not be implicitly defined.](https://github.com/chevrotain/chevrotain/issues/202)

#### Documentation

- [XML grammar example.](https://github.com/chevrotain/chevrotain/issues/201)

## 0.10.1 (5-30-2016)

- Fixes issue with previous release automation.

## 0.10.0 (5-29-2016)

#### Major Changes

- [Predicates / Gates on productions should be in addition to standard lookahead.](https://github.com/chevrotain/chevrotain/issues/189)

- [Capability to ignore parser definition issues at construction time.](https://github.com/chevrotain/chevrotain/issues/197)

#### Breaking Changes

- **IsNextRule** method was removed from the Parser class. It's functionality is no longer needed as usage of predicates / gates
  no longer requires manually (re)implementing the lookahead function.

- [DSL methods with separators should not support predicates.](https://github.com/chevrotain/chevrotain/issues/191)

- [Move all "parse time" grammar validations to the initialization phase (grammar construction).](https://github.com/chevrotain/chevrotain/issues/103)

#### Documentation

- [Example implementing syntactic & semantic content assist.](https://github.com/chevrotain/chevrotain/issues/194)

## 0.9.0 (4-29-2016)

#### Major Changes

- [Support LL(k) grammars.](https://github.com/chevrotain/chevrotain/issues/184)

## 0.8.1 (4-11-2016)

#### Minor Changes

- [Avoid rebuilding the GAST on parser construction when using RULE_OVERRIDE.](https://github.com/chevrotain/chevrotain/issues/171)

#### Bug Fixes

- [GAST Production cache does not take into account grammar inheritance](https://github.com/chevrotain/chevrotain/issues/181)

## 0.8.0 (4-8-2016)

#### Breaking Changes

Some breaking API changes in this version. Most have the changes have been to optional arguments,
so not many changes will be needed (if at all) for most users.

- [Use a config object for RULE DSL method.](https://github.com/chevrotain/chevrotain/issues/168)

  The [RULE method's](https://chevrotain.io/documentation/0_7_2/classes/parser.html#rule) optional third and fourth parameters
  have been been replaced with a single configuration object of the type [IRuleConfig](https://chevrotain.io/documentation/0_8_0/interfaces/iruleconfig.html).
  Therefore any RULE invocation with more than two arguments must be refactored to the new form.
  For example:

  ```Typescript
      // old deprecated form
      this.RULE("createStmt", function(){ /* ... */}, function(){ return 666 })

      // new form
      this.RULE("createStmt", function(){ /* ... */}, {recoveryValueFunc: function(){ return 666 }})
  ```

- [Remove RULE_NO_RESYNC DSL method.](https://github.com/chevrotain/chevrotain/issues/172)

  The RULE_NO_RESYNC convenience method has been removed.
  All usages of it must be replaced with an equivalent RULE call using the IRuleConfig [resyncEnabled](https://chevrotain.io/documentation/0_8_0/interfaces/iruleconfig.html#resyncenabled)
  property.

  For example:

  ```javascript
  // old deprecated form
  this.RULE_NO_RESYNC("createStmt", function () {
    /* ... */
  })

  // new form
  this.RULE(
    "createStmt",
    function () {
      /* ... */
    },
    { resyncEnabled: false }
  )
  ```

- [Parser Configuration should be done using a "Config" Object instead of constructor parameters.](https://github.com/chevrotain/chevrotain/issues/175)
- [Error Recovery / Fault Tolerance abilities should be disabled by default.](https://github.com/chevrotain/chevrotain/issues/174)

  The [Parser constructors's](https://chevrotain.io/documentation/0_7_2/classes/parser.html#rule) third (optional) parameter
  has been been replaced with a single configuration object of the type [IParserConfig](https://chevrotain.io/documentation/0_8_0/interfaces/iparserconfig.html)
  Therefore any Base Parser super invocation which uses the optional parameter must be updated.
  Additionally The Error recovery functionality is now **disabled** by default, it can be enabled via the parser's configuration.
  For example:

  ```javascript
  // old deprecated form
  function JsonParser(input) {
    // The third argument was used to enable/disable error recovery
    // and was **true** by default.
    Parser.call(this, input, true)
  }

  // new form
  function JsonParser(input) {
    // invoke super constructor
    Parser.call(this, input, allTokens, {
      // by default the error recovery flag is **false**
      // use recoveryEnabled flag in the IParserConfig object to enable enable it.
      recoveryEnabled: true
    })
  }
  ```

## 0.7.2 (4-7-2016)

#### Minor Changes

- [Support Overriding Rule implementations in inheriting grammars.](https://github.com/chevrotain/chevrotain/issues/169)

#### Documentation

- [Bring order to the chaos of the examples folder.](https://github.com/chevrotain/chevrotain/tree/master/examples)

## 0.7.1 (4-3-2016)

#### Minor Changes

- [Parsing Errors should include Parser context information.](https://github.com/chevrotain/chevrotain/issues/165)
- [AT_LEAST_ONE dsl rule, errMsg param should be optional.](https://github.com/chevrotain/chevrotain/issues/91)

## 0.7.0 (4-2-2016)

#### Major Changes

- [Lexer multi "modes" support.](https://github.com/chevrotain/chevrotain/issues/134)

## 0.6.3 (3-28-2016)

#### Minor Changes

- [Re-synced tokens should be reported to the user.](https://github.com/chevrotain/chevrotain/issues/154)

## 0.6.2 (3-25-2016)

#### Bug Fixes

- [LexerDefinitionErrorType enum was not exported as part of the public API.](https://github.com/chevrotain/chevrotain/issues/158)

## 0.6.1 (3-25-2016)

#### Bug Fixes

- [ParserDefinitionError enum was not exported.](https://github.com/chevrotain/chevrotain/commit/96edf7fe26d41f25272ea2a39d27fd7eb27991b2)

## 0.6.0 (3-20-2016)

#### Breaking Changes

- [Reorganized projected structure to be consistent and use "lib" folder](#155)
  Chevrotain's aggregated artifacts are now located under the **lib** folder instead of the **bin** folder in the npm package
  or the **release** folder in the bower pacakge.

  This means that references to "bower_components/chevrotain/**release**/..." or "node_modules/chevrotain/**bin**/..."
  Will have to be replaced with references to ".../**lib**/...".

  [For example - modified diagrams.html](https://github.com/chevrotain/chevrotain/pull/155/files#diff-c5283f95a0a6408c8016dcaff5abe0fa)

  Note that no changes are needed for standard consumption of chevrotain under node.js (**require('chevrotain')**).

#### Bug Fixes

- [Diagrams - Fixed global references to permit UMD loading.](https://github.com/chevrotain/chevrotain/issues/152)

## 0.5.23 (3-17-2016)

#### Bug Fixes

- [Syntax Diagrams usage highlights issues.](https://github.com/chevrotain/chevrotain/issues/149)

## 0.5.22 (3-15-2016)

#### Minor Changes

- [Human Readable Token Labels in Syntax Diagrams.](https://github.com/chevrotain/chevrotain/issues/144)
- [Use Token Labels in error messages.](#https://github.com/chevrotain/chevrotain/issues/146)

#### Bug Fixes

- [Diagrams template resources were not fully included in bower "package".](https://github.com/chevrotain/chevrotain/issues/145)

**Older Releases** changelog is available on [Github Releases.](https://github.com/chevrotain/chevrotain/releases)
