[![Build Status](https://travis-ci.org/SAP/chevrotain.svg?branch=master)](https://travis-ci.org/SAP/chevrotain)
[![Coverage Status](https://coveralls.io/repos/SAP/chevrotain/badge.svg?branch=master)](https://coveralls.io/r/SAP/chevrotain?branch=master)
[![NPM](https://nodei.co/npm/chevrotain.png?mini=true)](https://npmjs.org/package/chevrotain)

# Chevrotain

Chevrotain is a high performance fault Tolerant Javascript parsing DSL for building recursive decent parsers.

Chevrotain is **NOT** a parser generator. it solves the same kind of problems as a parser generator, just without
the code generation phase.
   
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
    * [performance comparison](http://chevrotain.github.io/performance/)
    * [and on jsPerf](http://jsperf.com/json-parsers-comparison/10)
  
  * **Grammar Introspection**, the grammar's structure is known and **exposed** this can be used to implement features such as automatically generated syntax diagrams or Syntactic error recovery.
  
  * Well tested with **~100% code coverage** 
   

## Installation
* **npm**: ```npm install chevrotain```
* **Bower** ```bower install chevrotain```
* or download directly from [github releases](https://github.com/SAP/chevrotain/releases/latest):
  * the 'chevrotain-binaries-...' files contain the compiled javascript code.


## Usage example JSON Parser:

* The following example uses several features of ES6 (fat arrow/classes).
  These are not mandatory for using Chevrotain, they just make the example clearer.
  The example is also provided in [ES5 syntax](https://github.com/Chevrotain/examples_nodejs)

#### step 1: define your Tokens:

```JavaScript

    var Token = require("chevrotain").Token
      
    class Keyword extends Token { static PATTERN = NA }
    class True extends Keyword { static PATTERN = /true/ }
    class False extends Keyword { static PATTERN = /false/ }
    class Null extends Keyword { static PATTERN = /null/ }
    class LCurly extends Token { static PATTERN = /{/ }
    class RCurly extends Token { static PATTERN = /}/ }
    class LSquare extends Token { static PATTERN = /\[/ }
    class RSquare extends Token { static PATTERN = /]/ }
    class Comma extends Token { static PATTERN = /,/ }
    class Colon extends Token { static PATTERN = /:/ }
    class StringLiteral extends Token { static PATTERN = /"(:?[^\\"]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/}
    class NumberLiteral extends Token { static PATTERN = /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/ }
    class WhiteSpace extends Token {
        static PATTERN = /\s+/
        static GROUP = SKIPPED
    }
```

#### step 2: create a lexer from the Token definitions:
```JavaScript

    var Lexer = require("chevrotain").Lexer
    
    var JsonLexer = new chevrotain.Lexer([WhiteSpace, NumberLiteral, StringLiteral,
        RCurly, LCurly, LSquare, RSquare, Comma, Colon, True, False, Null])

```

#### step 3: define the parsing rules:


```JavaScript
   
    var Parser = require("chevrotain").Parser

    class JsonParser extends Parser {
   
       constructor(input) {
           Parser.performSelfAnalysis(this)
       }

       public object = this.RULE("object", () => {
           this.CONSUME(LCurly)
           this.OPTION(() => {
               this.SUBRULE(this.objectItem)
               this.MANY(() => {
                   this.CONSUME(Comma)
                   this.SUBRULE2(this.objectItem) 
               })
           })
           this.CONSUME(RCurly)
       })

       public objectItem = this.RULE("objectItem", () => {
           this.CONSUME(StringLiteral)
           this.CONSUME(Colon)
           this.SUBRULE(this.value)
       })

       public array = this.RULE("array", () => {
           this.CONSUME(LSquare)
           this.OPTION(() => {
               this.SUBRULE(this.value)
               this.MANY(() => {
                   this.CONSUME(Comma)
                   this.SUBRULE2(this.value)
               })
           })
           this.CONSUME(RSquare)
       })

       public value = this.RULE("value", () => {
           this.OR([
               {ALT: () => {this.CONSUME(StringLiteral)}},
               {ALT: () => {this.CONSUME(NumberLiteral)}},
               {ALT: () => {this.SUBRULE(this.object)}},
               {ALT: () => {this.SUBRULE(this.array)}},
               {ALT: () => {this.CONSUME(True)}},
               {ALT: () => {this.CONSUME(False)}},
               {ALT: () => {this.CONSUME(Null)}}
           ], "a value")
       })
    }
   ```      

#### step 4: add custom actions to the grammar defined in step 3

* this shows the modification for just two grammar rules.

```JavaScript

    public object = this.RULE("object", () => {
       var items = []
       
       this.CONSUME(LCurly)
       this.OPTION(() => {
           items.push(this.SUBRULE(this.objectItem))  // .push to collect the objectItems
           this.MANY(() => {
               this.CONSUME(Comma)
               items.push(this.SUBRULE2(this.objectItem))  // .push to collect the objectItems 
           })
       })
       this.CONSUME(RCurly)
       
       // merge all the objectItems
       var obj = {}
       items.forEach((item) => {
          obj[item.itemName] = item.itemValue      
       })
       return obj
    })
       
    public objectItem = this.RULE("objectItem", () => {
       var nameToken = this.CONSUME(StringLiteral)
       this.CONSUME(Colon)
       var value = this.SUBRULE(this.value) // assumes SUBRULE(this.value) returns the JS value (null/number/string/...)
       
       var itemNameString = nameToken.image // nameToken.image to get the literalString the lexer consumed
       var itemName = itemNameString.substr(1, itemNameString.length - 2) // chop off the string quotes
       return {itemName:itemName, itemValue:value}  
    })
     ...

```

#### step 5: wrap it all together


```JavaScript

    function lexAndParse(text) {
        var lexResult = JsonLexer.tokenize(text)
        var parser = new JsonParser(lexResult.tokens)
        return parser.object()
    }

```

## Getting Started
The best way to start is by looking at some runable (and debugable) examples:

* [Json Parser](https://github.com/Chevrotain/examples_nodejs/blob/master/jsonParser.js)
* [Simple Calculator](https://github.com/Chevrotain/examples_nodejs/blob/master/calculator.js)
* [ECMAScript5 Parser](https://github.com/Chevrotain/examples_ecma5_typescript/blob/master/src/ecmascript5_parser.ts)
* [Lexer advanced features](https://github.com/Chevrotain/examples_lexer)
* [and more](https://github.com/Chevrotain)

## Documentation
* [Latest released version's HTML docs](http://chevrotain.github.io/documentation)
   * Also packaged in both the github and npm releases.
   
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
  in order to make chevrotain.js portable to multiple environments.
  
