## Automatic Concrete Syntax Tree Creation
Chevrotain has the capability to **automatically** create a concrete syntax tree (CST)
during parsing. A CST is a simple structure which represents the entire parse tree.
It contains information on every token parsed.
 
The main advantage of using the automatic CST creation is that it enables writing "pure" grammars.
This means that the semantic actions are **not** embedded into the grammar implementation but are instead
completely separated from it.

This separation of concerns makes the grammar easier to maintain and makes it easier to implement different capabilities on the grammar, for example: separate logic for compilation and for IDE support.


### Differences between an AST and a CST.
There are two major differences.
1. An Abstract Syntax Tree would not normally contain all the syntactic information.
   This mean the **exact original** text could not be re-constructed from the AST.
   
2. An Abstract Syntax Tree would not represent the whole syntactic parse tree.
   It would normally only contain nodes related to specific parse tree nodes, but not all of those (mostly leaf nodes).
   

### How to enable CST output?
   
In the future this capability will be enabled by default.
Currently this feature must be explicitly enabled by setting the **outputCst** flag.

In the parser [configuration object](http://sap.github.io/chevrotain/documentation/0_27_1/interfaces/_chevrotain_d_.iparserconfig.html).

```JavaScript
class MyParser extends chevrotain.Parser {

    constructor(input) {
        super(input, allTokens, {outputCst : true})
    }
}        
```

### The structure of the CST

The structure of the CST is very simple.
* Try CST creation in the [**online playground**](http://sap.github.io/chevrotain/playground/?example=JSON%20grammar%20and%20automatic%20CST%20output).

* Note that the following examples are not runnable or contain the full information.
These are just snippets to explain the core concepts.
 
```TypeScript
export type CstElement = ISimpleTokenOrIToken | CstNode
export type CstChildrenDictionary = { [elementName:string]:CstElement[] }

export interface CstNode {
    readonly name:string

    readonly children:CstChildrenDictionary

    readonly recoveredNode?:boolean
}
``` 

A single CstNode corresponds to a single rammar rule's invocation result.

```JavaScript
$.RULE("qualifiedName", () => {
    
})

input = ""

output = {
  name: "qualifiedName",  
  children: {}
}
```

Each Terminal will appear in the children dictionary using the terminal's name
as the key and an **array** of ISimpleTokenOrIToken as the value. These array items will be either 
a Token instance of a Token structure depending on the [Token type](docs/token_types.md) used.


```JavaScript
$.RULE("qualifiedName", () => {
    $.CONSUME(Identifier)
    $.CONSUME(Dot)
    $.CONSUME2(Identifier)
})

input = "foo.bar"

output = {
  name: "qualifiedName",  
  children: {
      Dot : ["."],
      Identifier : ["foo", "bar"]
  }
}
```

Non-Terminals are handled similarly to Terminals except each item in the value's array
Is the CstNode of the corresponding Grammar Rule (Non-Terminal).

```JavaScript
$.RULE("qualifiedName", () => {
    $.SUBRULE($.singleIdent)      
})

$.RULE("singleIdent", () => {
    $.CONSUME(Identifier)            
})

input = "foo"

output = {
  name: "qualifiedName",  
  children: {
      singleIdent : [
          {
            name: "singleIdent",  
            children: {
               Identifier : ["foo"]
            }
        }
      ]
  }
}
```

### In-Lined Rules

So far the CST structure is quite simple, but how would a more complex grammar be handled?
```JavaScript
$.RULE("statements", () => {
    $.OR([
        // let x = 5
        {ALT: () => {
            $.CONSUME(Let)
            $.CONSUME(Identifer)
            $.CONSUME(Equals)
            $.SUBRULE($.expression)
        }},
        // select age from employee where age = 120
        {ALT: () => {
            $.CONSUME(Select)
            $.CONSUME2(Identifer)
            $.CONSUME(From)
            $.CONSUME3(Identifer)
            $.CONSUME(Where)
            $.SUBRULE($.expression)
        }}
    ])
})
````

Some of the Terminals and Non-Terminals are used in **both** alternatives.
It is possible to check for the existence of distinguishing terminals such as the "Let" and "Select".
But this is not a robust approach.

```javaScript
let cstResult = parser.qualifiedName()

if (cstResult.children.Let.length > 0) {
    // Let statement
    // do something...
}
else if (cstResult.children.Select.length > 0) {
    // Select statement
    // do something else.
}

```

Alternatively it is possible to refactor the grammar in such a way that both alternatives
Would be completely wrapped in their own Non-Terminal rules.

```javascript
$.RULE("statements", () => {
    $.OR([
        {ALT: () => $.SUBRULE($.letStatement)},
        {ALT: () => $.SUBRULE($.selectStatement)}
    ])
})
```

This is the recommended approach in this case as more and more alternations are added the grammar rule
will become too difficult to understand and maintain due to verbosity.   

However sometimes refactoring out rules is too much, this is where **in-lined** rules arrive to the rescue.

```JavaScript
$.RULE("statements", () => {
    $.OR([
        // let x = 5
        {
         NAME: "$letStatement",   
         ALT: () => {
            $.CONSUME(Let)
            $.CONSUME(Identifer)
            $.CONSUME(Equals)
            $.SUBRULE($.expression)
        }},
        // select age from employee where age = 120
        {
         NAME: "$selectStatement",   
         ALT: () => {
            $.CONSUME(Select)
            $.CONSUME2(Identifer)
            $.CONSUME(From)
            $.CONSUME3(Identifer)
            $.CONSUME(Where)
            $.SUBRULE($.expression)
        }}
    ])
})

output = {
  name: "statements",  
  children: {
      $letStatement : [/*...*/],
      $$selectStatement : [/*...*/]
  }
}
```

Providing a **NAME** property to the DSL methods will create an in-lined rule.
It is equivalent to extraction to a separate grammar rule with two differences:

* To avoid naming conflicts in-lined rules **must** start with a dollar($) sign.
* In-lined rules do not posses error recovery (re-sync) capabilities as do regular rules.

Syntax Limitation:
 * The **NAME** property of an in-lined rule must appear as the **first** property
   of the **DSLMethodOpts** object.
   
   ```javascript
   // GOOD
   $.RULE("field", () => {
       $.OPTION({
           NAME:"$modifier",
           DEF: () => {
               $.CONSUME(Static) 
           }
       })
   })

   // Bad - won't work.
   $.RULE("field", () => {
      $.OPTION({
          DEF: () => {
              $.CONSUME(Static) 
          },
          NAME:"$modifier"
      })
   })
   ```
   
   
### CST And Error Recovery

CST output is also supported in combination with automatic error recovery.
This combination is actually stronger than regular error recovery because
even partially formed CstNodes will be present on the CST output and be marked 
using the **recoveredNode"** boolean property.

For example given this grammar and assuming the parser re-synced after a token mismatch at
the "Where" token:

```JavaScript
$.RULE("statements", () => {    
    $.CONSUME(Select)
    $.CONSUME2(Identifer)
    $.CONSUME(From)
    $.CONSUME3(Identifer)
    $.CONSUME(Where)
    $.SUBRULE($.expression)
})

// mismatch token due to typo at "wherrrre", parsing halts and re-syncs to upper rule so 
// the suffix "wherrrre age > 25" is not parsed.
input = "select age from persons wherrrre age > 25"

output = {
  name: "statements",  
  children: {
      Select: ["select"],
      Identifier: ["age, persons"],
      From: ["from"],
      Where: [/*nothing here, due to parse error*/],
      expression: [/*nothing here, due to parse error*/],
  },
  // This marks a recovered node.
  recoveredNode: true
}
```

This accessibility of **partial parsing results** means some post-parsing logic
may be able to perform farther analysis for example: offer auto-fix suggestions or provide better error messages.
 

### Performance of CST building.

Building the CST is a fairly intensive operation.
Using a JSON Grammar benchmarking has shown the performance of CST
building is 55-65% of simply parsing without any output structure.  

* This is a bad benchmark as it compares apples to oranges because one scenario creates an output structure and
  the other does not.
  - A more representative benchmark will be provided in the future.  
  
* Upcoming versions of Chrome (59) with the new V8 JS compilation pipeline enabled were faster (65%)
  Than current versions of chrome (56).
  
* Note that even when building a CST the performance on most recent versions of Chrome (59) was faster
  Than any other tested parsing library (Antlr4/PegJS/Jison).
  - Again we are unfortunately comparing apples to oranges as most parsing libraries in that JSON benchmark
    do not output any data structure.
