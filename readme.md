[![Build Status](https://travis-ci.org/SAP/chevrotain.svg?branch=master)](https://travis-ci.org/SAP/chevrotain)
[![Coverage Status](https://coveralls.io/repos/SAP/chevrotain/badge.svg?branch=master)](https://coveralls.io/r/SAP/chevrotain?branch=master)
[![npm version](https://badge.fury.io/js/chevrotain.svg)](http://badge.fury.io/js/chevrotain)

# Chevrotain

Chevrotain is a high performance fault Tolerant Javascript parsing DSL for building recursive decent parsers.

Chevrotain is **NOT** a parser generator. it solves the same kind of problems as a parser generator, just without
the code generation phase.

## [---> Try it online <---](http://sap.github.io/chevrotain/playground/)
   
## Features
  * **Lexer engine** based on RexExps.
    * Supports Token location tracking.
    * Supports Token skipping (whitespace/comments/...)
    * Allows prioritising shorter matches (Keywords vs Identifiers).
    * **No code generation** The Lexer does not require any code generation phase. 
   
  * **Parsing DSL** for creating the parsing rules.
    * **No code generation** - the DSL is just javascript not a new external language, what is written is what will be run, this speeds up development, 
         makes debugging trivial and provides great flexibility for inserting custom actions into the grammar.
    * Strong **Error Recovery** capabilities based on Antlr3's algorithms.
    * Automatic lookahead calculation for LL(1) grammars.
    * In addition custom lookahead logic can be provided explicitly.
    * Backtracking support.  

  * **High performance** see: 
    * [performance comparison](http://sap.github.io/chevrotain/performance/)
    * [and on jsPerf](http://jsperf.com/json-parsers-comparison/13)
  
  * **Grammar Introspection**, the grammar's structure is known and **exposed** this can be used to implement features such as automatically generated syntax diagrams or Syntactic error recovery.
  
  * Well tested with **~100% code coverage** 
   
## Installation
* **npm**: ```npm install chevrotain```
* **Bower** ```bower install chevrotain```
* or download directly from [github releases](https://github.com/SAP/chevrotain/releases/latest):
  * the 'chevrotain-binaries-...' files contain the compiled javascript code.

## Getting Started

**Online tutorial**
 * [step #1 Building a lexer](http://sap.github.io/chevrotain/playground/?example=tutorial%20lexer)
 * [step #2 Implementing a grammar](http://sap.github.io/chevrotain/playground/?example=tutorial%20grammar)
 * [step #3 Adding actions to the grammar](http://sap.github.io/chevrotain/playground/?example=tutorial%20actions)

**[Examples](https://github.com/SAP/chevrotain/blob/master/examples)**

## Documentation
* [Latest released version's HTML docs](http://sap.github.io/chevrotain/documentation)
   * [Parsing DSL](http://sap.github.io/chevrotain/documentation/0_5_3/classes/chevrotain.parser.html#at_least_one)
   
* Annotated source code (dev version):
   *  [tokens_public.ts](https://github.com/SAP/chevrotain/blob/master/src/scan/tokens_public.ts)
   *  [lexer_public.ts](https://github.com/SAP/chevrotain/blob/master/src/scan/lexer_public.ts)
   *  [parser_public.ts](https://github.com/SAP/chevrotain/blob/master/src/parse/parser_public.ts)
   *  [gast_public.ts](https://github.com/SAP/chevrotain/blob/master/src/parse/grammar/gast.ts)
   
*  The aggregated Typescript definitions :
   * [chevrotain.d.ts](https://github.com/SAP/chevrotain/blob/master/release/chevrotain.d.ts) (dev version)
   * Also packaged in both the github and npm releases.
   
## Dependencies
Only a single dependency to [lodash](https://lodash.com/).

## Compatibility
The Generated artifact(chevrotain.js) should run on any modern Javascript ES5.1 runtime. 
* The CI build runs the tests under Node.js.
* Additionally local testing is done on latest versions of Chrome/Firefox/IE.
* The dependency to lodash is imported via [UMD](https://github.com/umdjs/umd),
  in order to make chevrotain.js portable to multiple environments (browser global / require.js / node.js)
  
