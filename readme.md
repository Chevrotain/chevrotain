[![npm](https://img.shields.io/npm/v/chevrotain.svg)](https://www.npmjs.com/package/chevrotain)
[![Build Status](https://travis-ci.org/SAP/chevrotain.svg?branch=master)](https://travis-ci.org/SAP/chevrotain)
[![Coverage Status](https://coveralls.io/repos/SAP/chevrotain/badge.svg?branch=master)](https://coveralls.io/r/SAP/chevrotain?branch=master)
[![Dependency status](https://img.shields.io/david/SAP/chevrotain.svg)](https://david-dm.org/SAP/chevrotain)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/shahars.svg)](https://saucelabs.com/u/shahars)


# Chevrotain

Chevrotain is a [**very fast**][benchmark] and **feature rich** JavaScript LL(k) **Parsing DSL**.
It can be used to build parsers/compilers/interperters for various use cases ranging from simple configuration files, 
to full fledged programing languages.

It is important to note that Chevrotain is **NOT** a parser generator. It solves the same kind of problems as a parser generator, just without any code generation. Chevrotain Grammars are pure JavaScript code which can be created/debugged/edited
as any other JavaScript code without requiring any new tools or processes.

## [---> Try it online <---](http://sap.github.io/chevrotain/playground/)
## Features
  1. **Parsing DSL**.
    * **LL(k)** grammars support.  
    * **Error Reporting** with full location information. 
    * Strong **Error Recovery/Fault-Tolerance** capabilities based on Antlr3's algorithms.
    * Supports [gates/predicates][gates].
    * Backtracking support.
    * [Grammar Inheritance.][grammar_inheritance]
    * [Multiple starting rules.][starting_rules]
    * [Parametrized Rules.][parametrized_rules]
    * [Syntactic Content Assist][content assist]
    * **No code generation**.
      * The DSL is just JavaScript, not an external language.
      * The grammar is directly debuggable as plain JavaScript source.
      * Short feedback loops.
      * Allows great flexibility for inserting custom Parser actions 
   
  2.  **Lexer Engine** based on Regular Expressions.
    * Full Token position information.
    * Token skipping (whitespace/comments/...).
    * Prioritise shorter matches ([Keywords vs Identifiers][keywords_vs_idents]).
    * [Multiple Lexer Modes][lexer_modes] depending on the context.
    * [Tokens Grouping][lexer_groups].
    * [Different Token types for balancing performance, memory usage and ease of use](docs/token_types.md).
    * [Custom Token patterns(none RegExp) support](docs/custom_token_patterns.md)
    * **No code generation** The Lexer does not require any code generation phase. 

  3. [**High Performance**][benchmark].
  
  4. [**Railroad Diagrams Generation**](https://github.com/SAP/chevrotain/tree/master/diagrams).

  5. **Grammar Reflection/Introspection**.
    * The Grammar's structure is known and **exposed** at runtime.
    * Can be used to implement advanced features such as dynamically generated syntax diagrams or Syntactic error recovery.
  
  6. Well tested with **~100% code coverage**, Unit & Integration tests
   
## Installation
* **npm**: ```npm install chevrotain```
* **Browser**:
  The npm package contains Chevrotain as concatenated and minified files ready for use in a browser.
  These can also be accessed directly via [UNPKG](https://unpkg.com/) in a script tag.
  - Latest:
    * ```https://unpkg.com/chevrotain/lib/chevrotain.js```
    * ```https://unpkg.com/chevrotain/lib/chevrotain.min.js``` 
  - Explicit version number:
    * ```https://unpkg.com/chevrotain@0.23.0/lib/chevrotain.js```
    * ```https://unpkg.com/chevrotain@0.23.0/lib/chevrotain.min.js```


## Documentation & Resources

* **[FAQ](docs/faq.md).**

* **[Getting Started Tutorial](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/)**.

* **[Sample Grammars](https://github.com/SAP/chevrotain/blob/master/examples/grammars)**.
 
* **[Other Examples](https://github.com/SAP/chevrotain/blob/master/examples)**.

* **[Chevrotain Google Group](https://groups.google.com/forum/#!forum/chevrotain)** for questions and discussions.

* **[HTML docs](http://sap.github.io/chevrotain/documentation).**
   * [The Parsing DSL Docs](http://sap.github.io/chevrotain/documentation/0_23_0/classes/parser.html#at_least_one).
   
* **[Token Types Docs](docs/token_types.md)**.

   
## Dependencies
None.


## Compatibility
Chevrotain should run on any modern JavaScript ES5.1 runtime. 
* The CI build runs the tests under: 
  * Node.js (4 / 6 / 7).
  * Latest stable: Chrome, FireFox, IE Edge, IE 11 and Safari 9.
  
* Uses [UMD](https://github.com/umdjs/umd) to work with common module loaders (browser global / amd / commonjs).
  
  
## Contributions
Contributions are **greatly** appreciated.
See [CONTRIBUTING.md](./CONTRIBUTING.md) for details
  

[benchmark]: http://sap.github.io/chevrotain/performance/
[lexer_modes]: https://github.com/SAP/chevrotain/blob/master/examples/lexer/multi_mode_lexer/multi_mode_lexer.js
[lexer_groups]: https://github.com/SAP/chevrotain/blob/master/examples/lexer/token_groups/token_groups.js
[keywords_vs_idents]: https://github.com/SAP/Chevrotain/blob/master/examples/lexer/keywords_vs_identifiers/keywords_vs_identifiers.js
[gates]: https://github.com/SAP/chevrotain/blob/master/examples/parser/predicate_lookahead/predicate_lookahead.js
[grammar_inheritance]: https://github.com/SAP/chevrotain/blob/master/examples/parser/versioning/versioning.js
[starting_rules]: https://github.com/SAP/chevrotain/blob/master/examples/parser/multi_start_rules/multi_start_rules.js
[parametrized_rules]: https://github.com/SAP/chevrotain/blob/master/examples/parser/parametrized_rules/parametrized.js
[content assist]: https://github.com/SAP/chevrotain/blob/master/docs/syntactic_content_assist.md
