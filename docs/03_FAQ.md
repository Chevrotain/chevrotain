## FAQ

* [Why should I use a Parsing DSL instead of a Parser Generator?](#VS_GENERATORS)
* [What Differentiates Chevrotain from other Parsing Libraries?](#VS_OTHERS)
* [Why are Error Recovery / Fault Tolerant capabilities needed in a Parser?](#WHY_ERROR_RECOVERY)
* [How do I debug my parser?](#DEBUGGING)
* [Why are the unique numerical suffixes (CONSUME1/CONSUME2/...) needed for the DSL Rules?](#NUMERICAL_SUFFIXES)
* [Why does Chevrotain not work correctly after I minified my Sources?](#MINIFIED)
* [Why does Chevrotain not work correctly after I webpacked my Sources?](#WEBPACK)
* [Why does my parser appear to be stuck during it's initialization?](#STUCK_AMBIGUITY)
* [How do I Maximize my parser's performance?](#PERFORMANCE)


### <a name="VS_GENERATORS"></a> Why should I use a Parsing DSL instead of a Parser Generator?
A Parser Generator adds an (unnecessary) level of abstraction between the grammar implementation and the actual parser.
This is because the grammar is written in a **different** language than the target runtime. 
 
* Debugging a generated parser means looking at **different** code than the actual grammar specifications.
  This generated code is often huge, verbose and hard to understand. On the other hand, when debugging a Parser 
  implemented using a Parsing DSL, The **actual Grammar's code** the implementer wrote(not generated code) is debugged.
  So debugging Chevrotain is **just like** debugging any other JavaScript code.
  
* No need to handle grammar generation as part of the build process or commit generated files to the source code. 
  
* No need to learn a new syntax, as Chevrotain is a **Pure** JavasScript Library. instead the problem is reduced to learning a new API.
  
* No need for a special editor to write the Grammar, just use your favorite JavaScript editor.    


### <a name="VS_OTHERS"></a> What Differentiates Chevrotain from other JavaScript Parsing Solutions?
* **Performance**: Chevrotain is generally faster (often much more so) than other existing JavaScript Parsing Solutions.
  And can even compete with the performance of hand built parsers.
  See an [Online Benchmark](http://sap.github.io/chevrotain/performance/) that compares the performance of JSON Parsers implemented using multiple JavaScript Parsing solutions.

* **Error Recovery / Fault Tolerance**: With the exception of Antlr4, other JavaScript Parsing Solutions usually do not have Error Recovery capabilities.


### <a name="WHY_ERROR_RECOVERY"></a> Why are Error Recovery / Fault Tolerant capabilities needed in a Parser?
When building a standard compiler that should only handle completely valid inputs these capabilities are indeed irrelevant.
But for the use case of building Editor Tools / Language Services the parser must be able to handle partially invalid inputs as well.
Some examples:
* All syntax errors should be reported and not just the first one.
* Refactoring should work even if there is a missing comma somewhere.
* Autocomplete / Intellisense should work even if there is a syntax error prior to the requested suggestion position. 


### <a name="DEBUGGING"></a> How do I debug my parser?
Just add a breakpoint in your favorites IDE and debug, same as you would for any other JavaScript code.
Chevrotain Grammars are **pure** javascript code. No special handling required.


### <a name="NUMERICAL_SUFFIXES"></a> Why are the unique numerical suffixes (CONSUME1/CONSUME2/...) needed for the DSL Rules?
Lets look at an example first:
```javascript
this.RULE("someRule", function() {
        $.OPTION(function() {
           $.CONSUME(MyToken); 
        });
        
        $.OPTION2(function() {
            $.CONSUME(MyOtherToken);
        });
        
        $.OPTION3(function() {
            $.CONSUME2(MyToken);
        });
    });
```

As you can see this example uses three different variations of OPTION(1|2|3) and two variations of CONSUME(1|2).
This is because during parsing runtime Chevrotain must be able to **distinguish** between the variations of the **same** Parsing rule.

The combination of the DSL Rule(OPTION/MANY/CONSUME), the DSL Rule's optional numerical suffix and the DSL rule's parameter (if available) 
defines a **unique** key which Chevrotain uses to **figure out** the current location in the grammar. This location information is then 
used for many things such as: 
* Computing the lookahead function which decides if a DSL rule should be entered or which alternatives should be taken.
* Computing an appropriate error message which includes the list of next valid possible tokens.
* Performing automatic Error Recovery by figuring out "re-sync" tokens. 


### <a name="MINIFIED"></a> Why does Chevrotain not work correctly after I minified my Grammar?
Chevrotain relies on **Function.name** property and **Function.toString()**.
This means that certain aggressive minification options can break Chevrotain grammars.

See [related documentation](https://github.com/SAP/chevrotain/blob/master/examples/parser/minification/README.md) for details & workarounds.


### <a name="WEBPACK"></a> Why does Chevrotain not work correctly after I webpacked my Grammar?
Chevrotain relies on **Function.name** property and **Function.toString()**.
This means that certain aggressive webpack 2 optimizations (tree shaking) can break Chevrotain grammars under
certain conditions.

See [related documentation](https://github.com/SAP/chevrotain/blob/master/examples/parser/webpack/README.md) for details & workarounds.


### <a name="STUCK_AMBIGUITY"></a> Why does my parser appear to be stuck during it's initialization?
The first time a Chevrotain parser is initialized additional validations and computations are performed.
Some of these can take a very long time under certain edge cases. Specifically the detection of ambiguous alternatives
when the parser uses a larger than the default [maxLookahead](http://sap.github.io/chevrotain/documentation/1_0_1/interfaces/iparserconfig.html#maxlookahead)
and there are many (thousands) of ambiguous paths.

To resolve this try reducing the maxLookahead and inspect the ambiguity errors to fix
the grammar ambiguity which is the root cause of the problem. 


### <a name="PERFORMANCE"></a> How do I Maximize my parser's performance?

#### Major Performance Benefits

These are highly recommended for each and every parser.

1. **Do not create a new Parser instance for each new input**.

   Instead re-use a single instance and reset its state between iterations. For example:
   
   ```javascript
   // reuse the same parser instance.
   var parser = new JsonParserES5([]);
   
   module.exports = function (text) {
       var lexResult = JsonLexer.tokenize(text);
    
       // setting a new input will RESET the parser instance's state.
       parser.input = lexResult.tokens;
    
       var value = parser.json();
   
       return {
           value:       value, 
           lexErrors:   lexResult.errors,
           parseErrors: parser.errors
       };
   };
   ```
   
   This will avoid the fixed cost of reinitializing a parser instance.
   But more importantly this pattern seems to help V8 Engine to avoid de-optimizations.
   Such a pattern can lead to 15%-100% performance boost on V8 (Node.js/Chrome) depending on the grammar used.
   
   Note that this means that if your parser "carries" additional state, that state should also be reset.
   Simply override the Parser's [reset](http://sap.github.io/chevrotain/documentation/1_0_1/classes/parser.html#reset) method
   to accomplish that.

2. **Avoid reinitializing large arrays of alternatives**.

   The syntax for alternatives (OR) requires creating an array on every **single** invocation.
   For large enough arrays and in rules which are called often this can cause quite a large performance penalty.

   ```javascript
   $.RULE("value", () => {
        $.OR(
          [ // an array with seven alternatives
            { ALT: () => { $.CONSUME(StringLiteral) }},
            { ALT: () => { $.CONSUME(NumberLiteral) }},
            { ALT: () => { $.SUBRULE($.object) }},
            { ALT: () => { $.SUBRULE($.array) }},
            { ALT: () => { $.CONSUME(True) }},
            { ALT: () => { $.CONSUME(False) }},
            { ALT: () => { $.CONSUME(Null) }}
          ]);
    });
   ```
   
   A simple JavaScript pattern can avoid this costly re-initilization:
   
   ```javascript
       $.RULE("value", function () {
        // c1 is used as a cache, the short circute "||" will ensure only a single initilization
        $.OR($.c1 || ($.c1  = [
            { ALT: () => { $.CONSUME(StringLiteral) }},
            { ALT: () => { $.CONSUME(NumberLiteral) }},
            { ALT: () => { $.SUBRULE($.object) }},
            { ALT: () => { $.SUBRULE($.array) }},
            { ALT: () => { $.CONSUME(True) }},
            { ALT: () => { $.CONSUME(False) }},
            { ALT: () => { $.CONSUME(Null) }}
        ]));
    });
   ```
   
   Applying this pattern (in just a single location) on a JSON grammar provided 25-30% performance boost
   (Node.js 8), For a CSS grammar (2 locations) this resulted in about 20% speed boost.
   
   
   It is important to note that:
   
   - This pattern should only be applied on largish number of alternatives, testing on node.js 8.0 showed
     it was only useful when there are at least four alternatives. In cases with fewer alternatives this pattern
     would actually be **slower**!
     
   - This pattern can only be applied if there are no vars which can change accessed via closures.
     Example:
     ```javascript
      // BAD
      $.RULE("value", function () {
        let result
        // We reference the "result" variable via a closure.
        // So a new function is needed each time this grammar rule is invoked.
        $.OR($.c1 || ($.c1  = [
            { ALT: () => { result = $.CONSUME(StringLiteral) }},
      ]))})
      
      // GOOD
      $.RULE("value", function () {
        let result
        // no closure for the result variable, we use the returned value of the OR instead.
        result = $.OR($.c1 || ($.c1  = [
            { ALT: () => { return $.CONSUME(StringLiteral) }},
      ]))})
     ```
     * Note that gates / predicaetes often use vars from closures.
     
   - Due to the way Chevrotain is built, the text of the alternatives cannot be completly extracted from the grammar rule
     ```javascript
     let myAlts = [
            { ALT: () => { return $.CONSUME(StringLiteral) }},
     ]
     // Won't work
      $.RULE("value", function () {
        // Chevrotain won't be able to analyze this grammar rule as it relies on Function.prototype.toString
        result = $.OR(myAlts);
     })
     ```
     
   - Avoid dynamically changing the parser instance. The line:
     > "$.c1 || ($.c1 = ..." ($ is 'this')
     
     Will cause a 'c1' property to be assigned to the parser instance.
     This may seem innocent but if enough properties are added dynamically to an instance
     its V8 hidden class will change which could cause a severe performance reduction.
     
     To avoid this, simpliy define these "cache properties" in the constructor.
     See an example in the [ECMAScript5 grammar's constructor](https://github.com/SAP/chevrotain/blob/ac21570b97a8de0d6b91f29979aed8041455cacd/examples/grammars/ecma5/ecma5_parser.js#L37-L43).
   
      

#### Minor Performance Benefits  
  
These are only required if you are trying to squeeze every tiny bit of performance out of your parser.
   
1. Reduce the amount of Token position tracking the lexer performs.
   See The [ILexerConfig.positionTracking](http://sap.github.io/chevrotain/documentation/1_0_1/interfaces/ilexerconfig.html) property.
   
2. **Avoid creating parsing rules which only parse a single Terminal.**

   There is a certain fixed overhead for the invocation of each parsing rule.
   Normally there is no reason to pay it for a Rule which only consumes a single Terminal.
   For example:
    
   ```javascript
       this.myRedundantRule = this.RULE("myRedundantRule", function() {
           $.CONSUME(StringLiteral);
       });
   ``` 
   
   Instead such a rule's contents should be (manually) in-lined in its call sites.
   
3. **Avoid *_SEP DSL methods (MANY_SEP / AT_LEAST_ONE_SEP).**
   
   The *_SEP DSL methods also collect the separator Tokens parsed. Creating these arrays has a small overhead (several percentage).
   Which is a complete waste in most cases where those separators tokens are not needed for any output data structure.
   
4. **Use the returned values of iteration DSL methods (MANY/MANY_SEP/AT_LEAST_ONE/AT_LEAST_ONE_SEP).**
   
   Consider the following grammar rule:
   
   ```javascript
   this.RULE("array", function() {
           let myArr = []        
           $.CONSUME(LSquare);
           values.push($.SUBRULE($.value));
           $.MANY(() => {
             $.CONSUME(Comma);
             values.push($.SUBRULE2($.value));
           });
           $.CONSUME(RSquare);
       });
   ```
   
   The values of the array are manually collected inside the "myArr" array.
   However another result array is already created by invoking the iteration DSL method "MANY"
   This is obviously a waste of cpu cycles... 
   
   A slightly more efficient (but syntactically ugly) alternative would be:
    ```javascript
       this.RULE("array", function() {
               let myArr = []        
               $.CONSUME(LSquare);
               values.push($.SUBRULE($.value));
               
               let iterationResult = 
                 $.MANY(() => {
                   $.CONSUME(Comma);
                   return $.SUBRULE2($.value);
                 });
              
                myArr = myArr.concat(iterationResult)
               $.CONSUME(RSquare);
           });
     ```
