[![npm](https://img.shields.io/npm/v/chevrotain.svg)](https://www.npmjs.com/package/chevrotain)
[![Bower](https://img.shields.io/bower/v/chevrotain.svg)](https://github.com/SAP/chevrotain)
[![Build Status](https://travis-ci.org/SAP/chevrotain.svg?branch=master)](https://travis-ci.org/SAP/chevrotain)
[![Coverage Status](https://coveralls.io/repos/SAP/chevrotain/badge.svg?branch=master)](https://coveralls.io/r/SAP/chevrotain?branch=master)
[![Dependency status](https://img.shields.io/david/SAP/chevrotain.svg)](https://david-dm.org/SAP/chevrotain)

[![Browser Status](https://badges.herokuapp.com/sauce/shahars)](https://saucelabs.com/u/shahars)

# Chevrotain

Chevrotain is a **Javascript parsing DSL** for building [**high performance**][benchmark] **fault-tolerant** recursive decent parsers.

Chevrotain is **NOT** a parser generator. It solves the same kind of problems as a parser generator, just without
any code generation phase.

## [---> Try it online <---](http://sap.github.io/chevrotain/playground/)
## Features
  1. **Lexer Engine** based on Regular Expressions.
    * Full Token position information.
    * Token skipping (whitespace/comments/...).
    * Prioritise shorter matches ([Keywords vs Identifiers][keywords_vs_idents]).
    * [Multiple Lexer Modes][lexer_modes] depending on the context.
    * [Tokens Grouping][lexer_groups].
    * **No code generation** The Lexer does not require any code generation phase. 
   
  2. **Parsing DSL**.
    * **LL(k)** grammars support.  
    * **Error Reporting** with full location information. 
    * Strong **Error Recovery/Fault-Tolerance** capabilities based on Antlr3's algorithms.
    * Supports [gates/predicates][gates].
    * Backtracking support.
    * [Grammar Inheritance.][grammar_inheritance]
    * [Multiple starting rules.][starting_rules]
    * [Parametrized Rules.][parametrized_rules]
    * **No code generation**.
      * The DSL is just Javascript, not an external language.
      * Easily debuggable.
      * Short feedback loops.
      * Allows great flexibility for inserting custom Parser actions

  3. [**High performance**][benchmark].
  
  4. Generated [**Railroad Diagrams**](https://github.com/SAP/chevrotain/tree/master/diagrams).

  5. **Grammar Reflection/Introspection**.
    * The Grammar's structure is known and **exposed** at runtime.
    * Can be used to implement advanced features such as dynamically generated syntax diagrams or Syntactic error recovery.
  
  6. Well tested with **~100% code coverage**, Unit & Integration tests
   
## Installation
* **npm**: ```npm install chevrotain```
* **Bower** ```bower install chevrotain```

## Getting Started

**Online tutorial**
 * Step #1 - Building a Lexer: [online version](http://sap.github.io/chevrotain/playground/?example=tutorial%20lexer) / [written version](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step1_lexing.md).
 * Step #2 - Building a Parser: [online version](http://sap.github.io/chevrotain/playground/?example=tutorial%20grammar) / [written version](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step2_parsing.md).
 * Step #3 - Adding actions to the Parser: [online version](http://sap.github.io/chevrotain/playground/?example=tutorial%20actions) / [written version](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step3_adding_actions.md).
 * Step #4 - Fault tolerance and Error recovery: [online version](http://sap.github.io/chevrotain/playground/?example=tutorial%20fault%20tolerance) / [written version](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step4_fault_tolerance.md).

## Documentation
* **[Examples Folder](https://github.com/SAP/chevrotain/blob/master/examples)**

* [HTML docs](http://sap.github.io/chevrotain/documentation)
   * [The Parsing DSL Docs](http://sap.github.io/chevrotain/documentation/0_11_4/classes/parser.html#at_least_one)
   
* Annotated source code (dev version):
   *  [tokens_public.ts](https://github.com/SAP/chevrotain/blob/master/src/scan/tokens_public.ts)
   *  [lexer_public.ts](https://github.com/SAP/chevrotain/blob/master/src/scan/lexer_public.ts)
   *  [parser_public.ts](https://github.com/SAP/chevrotain/blob/master/src/parse/parser_public.ts)
   *  [gast_public.ts](https://github.com/SAP/chevrotain/blob/master/src/parse/grammar/gast.ts)
   
*  The aggregated Typescript definitions :
   * [chevrotain.d.ts](https://github.com/SAP/chevrotain/blob/master/lib/chevrotain.d.ts) (latest version)

## Dependencies
None.

## Compatibility
Chevrotain should run on any modern Javascript ES5.1 runtime. 
* The CI build runs the tests under: 
  * Node.js (0.12 / 4 / 5).
  * Latest stable: Chrome, FireFox, IE Edge, IE 11 and Safari 9.
  
* Uses [UMD](https://github.com/umdjs/umd) to work with common module loaders (browser global / amd / commonjs).
  
[benchmark]: http://sap.github.io/chevrotain/performance/
[lexer_modes]: https://github.com/SAP/chevrotain/blob/master/examples/lexer/multi_mode_lexer/multi_mode_lexer.js
[lexer_groups]: https://github.com/SAP/chevrotain/blob/master/examples/lexer/token_groups/token_groups.js
[keywords_vs_idents]: https://github.com/SAP/Chevrotain/blob/master/examples/lexer/keywords_vs_identifiers/keywords_vs_identifiers.js
[gates]: https://github.com/SAP/chevrotain/blob/master/examples/parser/predicate_lookahead/predicate_lookahead.js
[grammar_inheritance]: https://github.com/SAP/chevrotain/blob/master/examples/parser/versioning/versioning.js
[starting_rules]: https://github.com/SAP/chevrotain/blob/master/examples/parser/multi_start_rules/multi_start_rules.js
[parametrized_rules]: https://github.com/SAP/chevrotain/blob/master/examples/parser/parametrized_rules/parametrized.js
