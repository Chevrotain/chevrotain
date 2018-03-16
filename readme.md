[![Join the chat at https://gitter.im/chevrotain-parser/Lobby](https://badges.gitter.im/chevrotain-parser/Lobby.svg)](https://gitter.im/chevrotain-parser/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![npm](https://img.shields.io/npm/v/chevrotain.svg)](https://www.npmjs.com/package/chevrotain)
[![Build Status](https://travis-ci.org/SAP/chevrotain.svg?branch=master)](https://travis-ci.org/SAP/chevrotain)
[![Coverage Status](https://coveralls.io/repos/SAP/chevrotain/badge.svg?branch=master)](https://coveralls.io/r/SAP/chevrotain?branch=master)
[![Dependency status](https://img.shields.io/david/SAP/chevrotain.svg)](https://david-dm.org/SAP/chevrotain)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/shahars.svg)](https://saucelabs.com/u/shahars)


# Chevrotain


## Introduction
Chevrotain is a [**very fast**][benchmark] and **feature rich** **Parser Building Toolkit** for **JavaScript**.
It can be used to build parsers/compilers/interpreters for various use cases ranging from simple configuration files, 
to full fledged programing languages.

A more in depth description of Chevrotain can be found in this great article on: [Parsing in JavaScript: Tools and Libraries](https://tomassetti.me/parsing-in-javascript/#chevrotain).

It is important to note that Chevrotain is **NOT** a parser generator. It solves the same kind of problems as a parser generator, just **without any code generation**. Chevrotain Grammars are pure code which can be created/debugged/edited
as any other pure code without requiring any new tools or processes.

## TLDR
* [**Online Playground**](http://sap.github.io/chevrotain/playground/)
* **[Getting Started Tutorial](http://sap.github.io/chevrotain/website/Tutorial/step1_lexing.html)**
* [**Performance benchmark**][benchmark] 

## Features
  1. **Parsing DSL**.
      * **LL(k)** grammars support.  
      * Useable from [JavaScript / TypeScript / CoffeeScript][languages].
      * [**Separation** of grammar and semantics.][separation]
      * [Customizable][custom_errors] **Error Reporting** with full location information. 
      * Strong **Error Recovery/Fault-Tolerance** capabilities based on Antlr3's algorithms.
      * Supports [gates/predicates][gates].
      * [Backtracking][backtracking] support.
      * [Grammar Inheritance.][grammar_inheritance]
      * [Multiple starting rules.][starting_rules]
      * [Parameterized Rules.][parametrized_rules]
      * [Syntactic Content Assist.][content assist]
      * **No code generation**.
         * The DSL is just JavaScript, not an external language.
         * The grammar is directly debuggable as plain JavaScript source.
         * Short feedback loops.
         * Allows great flexibility for inserting custom Parser actions.
      * [Custom APIs][custom_apis].
   
  2.  **Lexer Engine** 
      * Based on Regular Expressions.
      * Full position information tracking (lines/columns/offsets).
      * Token skipping (whitespace/comments/...).
      * Prioritise longest match ([Keywords vs Identifiers][keywords_vs_idents]).
      * [Multiple Lexer Modes][lexer_modes] depending on the context.
      * [Tokens Grouping][lexer_groups].
      * [Custom Token patterns(none RegExp) support](http://sap.github.io/chevrotain/website/Deep_Dive/custom_token_patterns.html)
      * **No code generation** The Lexer does not require any code generation phase. 

  3. [**High Performance**][benchmark].
  
  4. [**Railroad Diagrams Generation**](http://sap.github.io/chevrotain/website/Building_Grammars/generating_syntax_diagrams.html).

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
    * ```https://unpkg.com/chevrotain@3.0.1/lib/chevrotain.js```
    * ```https://unpkg.com/chevrotain@3.0.1/lib/chevrotain.min.js```


## Documentation & Resources

* **[Getting Started Tutorial](http://sap.github.io/chevrotain/website/Tutorial/step1_lexing.html)**.

* **[Sample Grammars](https://github.com/SAP/chevrotain/blob/master/examples/grammars)**.

* **[FAQ](http://sap.github.io/chevrotain/website/FAQ.html).**
 
* **[Other Examples](https://github.com/SAP/chevrotain/blob/master/examples)**.

* **[HTML docs](http://sap.github.io/chevrotain/documentation).**
   * [The Parsing DSL Docs](http://sap.github.io/chevrotain/documentation/3_0_1/classes/parser.html#at_least_one).

* **[RoadMap](http://sap.github.io/chevrotain/website/Roadmap.html)**.
   
   
## Dependencies
None.


## Compatibility
Chevrotain should run on any modern JavaScript ES5.1 runtime. 
* The CI build runs the tests under: 
  * Node.js (6 / 8 / 9).
  * Latest stable: Chrome, FireFox, Safari, IE Edge and IE 11.
  
* Uses [UMD](https://github.com/umdjs/umd) to work with common module loaders (browser global / amd / commonjs).
  
  
## Contributions
Contributions are **greatly** appreciated.
See [CONTRIBUTING.md](./CONTRIBUTING.md) for details

## Where used
Some interesting samples:
* [Metabase BI expression parser][sample_metabase].
* [Eve Programing Language][sample_eve].
* [BioModelAnalyzer's ChatBot parser][sample_biomodel].
* [Bombadil Toml Parser][sample_bombadil]


[benchmark]: http://sap.github.io/chevrotain/performance/
[lexer_modes]: https://github.com/SAP/chevrotain/blob/master/examples/lexer/multi_mode_lexer/multi_mode_lexer.js
[lexer_groups]: https://github.com/SAP/chevrotain/blob/master/examples/lexer/token_groups/token_groups.js
[keywords_vs_idents]: https://github.com/SAP/Chevrotain/blob/master/examples/lexer/keywords_vs_identifiers/keywords_vs_identifiers.js
[gates]: https://github.com/SAP/chevrotain/blob/master/examples/parser/predicate_lookahead/predicate_lookahead.js
[grammar_inheritance]: https://github.com/SAP/chevrotain/blob/master/examples/parser/versioning/versioning.js
[starting_rules]: https://github.com/SAP/chevrotain/blob/master/examples/parser/multi_start_rules/multi_start_rules.js
[parametrized_rules]: https://github.com/SAP/chevrotain/blob/master/examples/parser/parametrized_rules/parametrized.js
[content assist]: http://sap.github.io/chevrotain/website/Deep_Dive/syntactic_content_assist.html
[separation]: https://github.com/SAP/chevrotain/blob/master/examples/grammars/calculator/calculator_pure_grammar.js
[custom_errors]: https://github.com/SAP/chevrotain/blob/master/examples/parser/custom_errors/custom_errors.js
[sample_metabase]: https://github.com/metabase/metabase/blob/136dfb17954f4e4302b3bf2fee99ff7b7b12fd7c/frontend/src/metabase/lib/expressions/parser.js
[sample_eve]: https://github.com/witheve/Eve/blob/master/src/parser/parser.ts
[sample_biomodel]: https://github.com/Microsoft/BioModelAnalyzer/blob/master/ChatBot/src/NLParser/NLParser.ts
[sample_bombadil]: https://github.com/sgarciac/bombadil/blob/master/src/parser.ts
[languages]: https://github.com/SAP/chevrotain/tree/master/examples/implementation_languages
[backtracking]: https://github.com/SAP/chevrotain/blob/master/examples/parser/backtracking/backtracking.js
[custom_apis]: http://sap.github.io/chevrotain/website/Deep_Dive/custom_apis.html
