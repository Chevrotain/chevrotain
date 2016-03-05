[![npm version](https://badge.fury.io/js/chevrotain.svg)](http://badge.fury.io/js/chevrotain)
[![Build Status](https://travis-ci.org/SAP/chevrotain.svg?branch=master)](https://travis-ci.org/SAP/chevrotain)
[![Coverage Status](https://coveralls.io/repos/SAP/chevrotain/badge.svg?branch=master)](https://coveralls.io/r/SAP/chevrotain?branch=master)
[![Dependency status](https://img.shields.io/david/SAP/chevrotain.svg)](https://david-dm.org/SAP/chevrotain)
[![devDependency Status](https://img.shields.io/david/dev/SAP/chevrotain.svg)](https://david-dm.org/SAP/chevrotain#info=devDependencies)

# Chevrotain

Chevrotain is a **Javascript parsing DSL** for building fault tolerant recursive decent parsers.

Chevrotain is **NOT** a parser generator. it solves the same kind of problems as a parser generator, just without
any code generation phase.

## [---> Try it online <---](http://sap.github.io/chevrotain/playground/)
   
## Features
  * **Lexer engine** based on RexExps.
    * Supports Token location tracking.
    * Supports Token skipping (whitespace/comments/...).
    * Allows prioritising shorter matches (Keywords vs Identifiers).
    * **No code generation** The Lexer does not require any code generation phase. 
   
  * **Parsing DSL** for creating the parsing rules.
    * **No code generation**
      * The DSL is just javascript not an external language, what is written is what will be run.
      * Speeds up development, 
      * Makes debugging trivial. 
      * Allows great flexibility for inserting custom Parser actions.
    * **Error Reporting** with full location information. 
    * Strong **Error Recovery/fault tolerance** capabilities based on Antlr3's algorithms.
    * Automatic lookahead calculation for LL(1) grammars.
    * Supports Custom lookahead logic for LL(k) grammars.
    * Backtracking support.  

  * [**High performance.**](http://jsperf.com/json-parsers-comparison/21)

  * **Grammar Reflection/Introspection**
    * A Parser's grammar's structure is known and **exposed** at runtime.
    * Can be used to implement advanced features such as dynamically generated syntax diagrams or Syntactic error recovery.
  
  * Well tested with **~100% code coverage**, Unit & Integration tests
   
## Installation
* **npm**: ```npm install chevrotain```
* **Bower** ```bower install chevrotain```
* or download directly from [github releases](https://github.com/SAP/chevrotain/releases/latest):
  * the 'chevrotain-binaries-...' files contain the compiled javascript code.

## Getting Started

**Online tutorial**
 * Step #1 - Building a Lexer: [online version](http://sap.github.io/chevrotain/playground/?example=tutorial%20lexer) / [written version](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step1_lexing.md).
 * Step #2 - Building a Parser: [online version](http://sap.github.io/chevrotain/playground/?example=tutorial%20grammar) / [written version](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step2_parsing.md).
 * Step #3 - Adding actions to the Parser: [online version](http://sap.github.io/chevrotain/playground/?example=tutorial%20actions) / [written version](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step3_adding_actions.md).
 * Step #4 - Fault tolerance and Error recovery: [online version](http://sap.github.io/chevrotain/playground/?example=tutorial%20fault%20tolerance) / [written version](https://github.com/SAP/chevrotain/edit/master/docs/tutorial/step4_fault_tolerance.md).

**[Examples Folder](https://github.com/SAP/chevrotain/blob/master/examples)**

## Documentation
* [Latest released version's HTML docs](http://sap.github.io/chevrotain/documentation)
   * [Parsing DSL](http://sap.github.io/chevrotain/documentation/0_5_18/classes/parser.html#at_least_one)
   
* Annotated source code (dev version):
   *  [tokens_public.ts](https://github.com/SAP/chevrotain/blob/master/src/scan/tokens_public.ts)
   *  [lexer_public.ts](https://github.com/SAP/chevrotain/blob/master/src/scan/lexer_public.ts)
   *  [parser_public.ts](https://github.com/SAP/chevrotain/blob/master/src/parse/parser_public.ts)
   *  [gast_public.ts](https://github.com/SAP/chevrotain/blob/master/src/parse/grammar/gast.ts)
   
*  The aggregated Typescript definitions :
   * [chevrotain.d.ts](https://github.com/SAP/chevrotain/blob/master/release/chevrotain.d.ts) (latest version)

## Dependencies
None.

## Compatibility
Chevrotain should run on any modern Javascript ES5.1 runtime. 
* The CI build runs the tests under: 
  * Node.js (0.12 / 4 / 5).
  * latest stable Chrome.
  * latest stable Firefox.
* Additionally local testing is done on latest versions of Chrome/Firefox/IE.
* Uses [UMD](https://github.com/umdjs/umd) to work with common module loaders (browser global / amd / commonjs).
  
