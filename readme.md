[![Build Status](https://travis-ci.org/SAP/chevrotain.svg?branch=master)](https://travis-ci.org/SAP/chevrotain)
[![Coverage Status](https://coveralls.io/repos/SAP/chevrotain/badge.svg?branch=master)](https://coveralls.io/r/SAP/chevrotain?branch=master)

#Chevrotain

Chevrotain is a Javascript/Typescript parsing framework which aims to make it easier to write "hand built" recursive decent parsers.
   
###Features
  * **DSL** for creating the parsing rules.
    * Automatic lookahead calculation for LL(1) grammars
    * For other grammars custom lookahead functions can be provided.
    * Backtracking support.  
  * Strong **Error Recovery** capabilities based on Antlr3's algorithms.
  * **Grammar Introspection**, the grammar's structure is known and **exposed** this can be used to implement features such     
    as automatically generated syntax diagrams or Syntactic error recovery 
  * **No generated code** - what you write is what will be run, this makes debugging easier and provides great flexibility. For example this could be used to implement grammar composition.
   * Well tested with **100% code coverage** 
   
###At a Glance, simple json parsing rules

   * using ES6 fat arrow '=>'

   ```JavaScript
   
           var object = this.RULE("object", () => {
               this.CONSUME(LCurlyTok)
               this.OPTION(() => {
                   this.SUBRULE(this.objectItem)
                   this.MANY(() => {
                       this.CONSUME(CommaTok)
                       this.SUBRULE1(this.objectItem)
                   })
               })
               this.CONSUME(RCurlyTok)
           })
   
           var objectItem = this.RULE("objectItem", () => {
               this.CONSUME(StringTok)
               this.CONSUME(ColonTok)
               this.SUBRULE(this.value)
           })
   
           var array = this.RULE("array", () => {
               this.CONSUME(LSquareTok)
               this.OPTION(() => {
                   this.SUBRULE(this.value)
                   this.MANY(() => {
                       this.CONSUME(CommaTok)
                       this.SUBRULE2(this.value)
                   })
               })
               this.CONSUME(RSquareTok)
           })
   
           var value = this.RULE("value", () => {
               this.OR([
                   {ALT: () => {this.CONSUME(StringTok)}},
                   {ALT: () => {this.CONSUME(NumberTok)}},
                   {ALT: () => {this.SUBRULE(this.object)}},
                   {ALT: () => {this.SUBRULE(this.array)}},
                   {ALT: () => {this.CONSUME(TrueTok)}},
                   {ALT: () => {this.CONSUME(FalseTok)}},
                   {ALT: () => {this.CONSUME(NullTok)}}
               ], "a value")
           })
   ```      

###Getting Started
The best place to start is the examples folder.
The most basic one is: [Json Parser](https://github.com/SAP/chevrotain/blob/master/examples/json/json_parser.ts)
A more complex one is: [ECMAScript5 Parser](https://github.com/SAP/chevrotain/blob/master/examples/examples/ecmascript5_parser.ts)

Note that the examples are written in Typescript.
To see the generated(readable) javascript code: 

only once:
* $ npm install -g grunt (only once)
* $ npm install -g bower
* $ npm install

to run the dev build and generate the javascript sources:
* $ grunt dev_build
* now look in: bin\gen\examples folder

To debug the example's tests using chrome developer tools:

* $ npm install -g karma (only once)
* $ karma start
* in the karma chrome window press the debug button   
* open developer tools(F12), add breakpoints and refresh the page to rerun the tests

Installation
------------
**TODO**

Dependencies
-------------
Only a single dependency to [lodash](https://lodash.com/).

Compatibility
-------------
The Generated artifact(chevrotain.js) should run any modern Javascript ES5 runtime. 
* The CI build runs the tests under Node.js.
* additionally local testing is done on latest versions of Chrome/Firefox/IE.
* The dependency to lodash is imported via [UMD](https://github.com/umdjs/umd),
  in order to make chevrotain.js portable to multiple environments.
  

Development
-----------
Chevrotain was originally developed and is maintained by Shahar Soel