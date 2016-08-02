## FAQ

* [Why should I use Chevrotain instead of some other Javascript Parsing solution?](#Q1)
* [Why are Error Recovery / Fault Tolerant capabilities needed in a Parser?](#Q2)
* [How do I debug my parser?](#Q3)
* [Why are the unique numerical suffixes (CONSUME1/CONSUME2/...) needed for the DSL Rules?](Q4)
* [Why does Chevrotain now work correctly after I minified my Sources?](#Q5)

### <a name="Q1"></a> Why should I use Chevrotain Parsing DSL instead of a Parser Generator?
A Parser Generator adds an (unnecessary) level of abstraction between the grammar implementation and the actual parser.
This is because the grammar is written in a **different** language than the target runtime. 
 
* Debugging a generated parser means looking at **different** code than the actual grammar specifications.
  This generated generated code is often huge, verbose and hard to understand. On the other hand, when debugging a Parser 
  implemented using Chevrotain, The **actual Grammar's code** the implementer wrote(not generated code) is debugged.
  So debugging Chevrotain is **just like** debugging any other JavaScript code.
  
* No need to handle grammar generation as part of the build process or commit generated files to the source code. 
  
* No need to learn a new syntax, as Chevrotain a **Pure** JavasScript Library. instead the problem is reduced to learning a new API.
  
* No need for a special editor to write the Grammar, just use your favorites JavaScript editor.    

### <a name="Q2"></a> Why are Error Recovery / Fault Tolerant capabilities needed in a Parser?
For building a standard compiler that should only handle completely valid inputs these capabilities are indeed irrelevant.
But for the use case of building Editor Tools / Language Services the parser must be able to handle partially invalid inputs as well.
Some examples:
* All syntax errors should be reported and not just the first one.
* Refactoring should work even if there is a missing comma somewhere.
* Autocomplete / Intellisense should work even if there is a syntax error prior to the requested suggestion position. 

### <a name="Q3"></a> How do I debug my parser?
Just add a breakpoint and debug, same as you would for any other JavaScript code.
Chevrotain Grammars are **pure** javascript code. No special handling required.

### <a name="Q4"></a> Why are the unique numerical suffixes (CONSUME1/CONSUME2/...) needed for the DSL Rules?
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

### <a name="Q5"></a> Why does Chevrotain not work correctly after I minified my Grammar?
Chevrotain relies on **Function.name** property and **Function.toString()**.
This means that certain aggressive minification options can break Chevrotain grammars.

See [related documentation](../examples/parser/minification/README.md) for details & workarounds.