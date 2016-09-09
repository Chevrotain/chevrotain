## FAQ

* [Why should I use Chevrotain instead of some other Javascript Parsing solution?](#VS_GENERATORS)
* [Why are Error Recovery / Fault Tolerant capabilities needed in a Parser?](#WHY_ERROR_RECOVERY)
* [How do I debug my parser?](#DEBUGGING)
* [Why are the unique numerical suffixes (CONSUME1/CONSUME2/...) needed for the DSL Rules?](NUMERICAL_SUFFIXES)
* [Why does Chevrotain now work correctly after I minified my Sources?](#MINIFIED)
* [How do I Maximize my parser's performance?](#PERFORMANCE)


### <a name="VS_GENERATORS"></a> Why should I use a Parsing DSL instead of a Parser Generator?
A Parser Generator adds an (unnecessary) level of abstraction between the grammar implementation and the actual parser.
This is because the grammar is written in a **different** language than the target runtime. 
 
* Debugging a generated parser means looking at **different** code than the actual grammar specifications.
  This generated code is often huge, verbose and hard to understand. On the other hand, when debugging a Parser 
  implemented using Chevrotain, The **actual Grammar's code** the implementer wrote(not generated code) is debugged.
  So debugging Chevrotain is **just like** debugging any other JavaScript code.
  
* No need to handle grammar generation as part of the build process or commit generated files to the source code. 
  
* No need to learn a new syntax, as Chevrotain a **Pure** JavasScript Library. instead the problem is reduced to learning a new API.
  
* No need for a special editor to write the Grammar, just use your favorites JavaScript editor.    


### <a name="WHY_ERROR_RECOVERY"></a> Why are Error Recovery / Fault Tolerant capabilities needed in a Parser?
For building a standard compiler that should only handle completely valid inputs these capabilities are indeed irrelevant.
But for the use case of building Editor Tools / Language Services the parser must be able to handle partially invalid inputs as well.
Some examples:
* All syntax errors should be reported and not just the first one.
* Refactoring should work even if there is a missing comma somewhere.
* Autocomplete / Intellisense should work even if there is a syntax error prior to the requested suggestion position. 


### <a name="DEBUGGING"></a> How do I debug my parser?
Just add a breakpoint and debug, same as you would for any other JavaScript code.
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

See [related documentation](../examples/parser/minification/README.md) for details & workarounds.


### <a name="PERFORMANCE"></a> How do I Maximize my parser's performance?

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
   Simply override the Parser's [reset](http://sap.github.io/chevrotain/documentation/0_14_0/classes/parser.html#reset) method
   to accomplish that.
    
2. **Use Lazy Tokens.**

   "Lazy" Tokens avoid computing their state (mostly location information) until it is needed.
   This preserves both memory **and** CPU cycles. Therefor unless your use case **always** requires all the details from every single
   Token (for example a formatter/beautifier) Use of Lazy Tokens can provide a large boost to your parser's performance.
   Differences of 10-25% have been measured on Node.js V6 (depending on the specific grammar used).
   
   note that: the larger (and more numerous) your inputs are the greater the benefit as CPU cycles wasted on garbage collection
   may also be avoided due to the reduction in memory consumption.
   
   [Example of creating a Lazy Tokens Lexer](../examples/lexer/lazy_tokens/)
    
3. **Avoid creating parsing rules which only parse a single Terminal.**

   There is a certain fixed overhead for the invocation of each parsing rule.
   Normally there is no reason to pay it for a Rule which only consumes a single Terminal.
   For example:
    
   ```javascript
       this.myRedundantRule = this.RULE("myRedundantRule", function() {
           $.CONSUME(StringLiteral);
       });
   ``` 
   
   Instead such a rule's contents should be (manually) in-lined in its call sites.
    
   
