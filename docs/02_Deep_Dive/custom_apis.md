## Building Custom Parsing APIs

Chevrotain can be used as the underlying engine for other parsing libraries.

The general flow is:
1. Creating a GAST (Grammar AST) data structure
1. Resolving and validating the GAST Structure.
1. Generating the parser code and executing.
   - Can be done "in memory" without writing to file in certain runtime envs.
   
   
### The GAST structure    

This structure is made up of the following classes:

 - [Rule](http://sap.github.io/chevrotain/documentation/1_0_1/classes/rule.html)
 - [Terminal](http://sap.github.io/chevrotain/documentation/1_0_1/classes/terminal.html)
 - [NonTerminal](http://sap.github.io/chevrotain/documentation/1_0_1/classes/nonterminal.html)
 - [Alternation](http://sap.github.io/chevrotain/documentation/1_0_1/classes/alternation.html) 
 - [Option](http://sap.github.io/chevrotain/documentation/1_0_1/classes/option.html)
 - [Repetition](http://sap.github.io/chevrotain/documentation/1_0_1/classes/repetition.html)
 - [RepetitionWithSeparator](http://sap.github.io/chevrotain/documentation/1_0_1/classes/repetitionwithseparator.html)
 - [RepetitionMandatory](http://sap.github.io/chevrotain/documentation/1_0_1/classes/repetitionmandatory.html)
 - [RepetitionMandatoryWithSeparator](http://sap.github.io/chevrotain/documentation/1_0_1/classes/repetitionmandatorywithseparator.html)
 - [Flat](http://sap.github.io/chevrotain/documentation/1_0_1/classes/flat.html) (sequence)

For example to define a grammar rule for a fully qualified name:

```antlr
fqn : Ident (Dot Ident)
```

Is equivalent to:

```javascript
const {createToken, Rule, Terminal, Repetition} = require("chevrotain")
const Ident = createToken({name:"Ident", pattern:/[a-zA-Z]\w+/})
const Dot = createToken({name:"Dot", pattern:/\./})


const fqn = new Rule({name:"fqn", definition:[
    new Terminal({terminalType:Ident}),
    new Repetition({definition:[
        new Terminal({terminalType:Dot}),
        new Terminal({terminalType:Ident})
    ]})
]})
```

Important to note that:

- By default the definition array for each GAST class acts as a sequence,
  However in the case of Alternation each element in the definition array represents a different
  alternative which should be wrapped in a Flat class.
  
  e.g:
  
  ```javascript
  const {Flat, Alternation} = require("chevrotain")
  
  const gastAlts = new Alternation({definition:[  
      // first alternative
      new Flat({definition:[/*...*/]}),
      // second alternative
      new Flat({definition:[/*...*/]}),
      // third alternative
      new Flat({definition:[/*...*/]})
  ]})
  ```


### Resolving and Validating the GAST structure

Chevrotain exposes three functions for this purpose:

1. [**resolveGrammar**](http://sap.github.io/chevrotain/documentation/1_0_1/globals.html#resolvegrammar)
   NonTerminals are often referenced by their name as cyclic references will make
   a direct object reference impossible, for example with right recursion:
   ```antlr
      rule1: A (rule1)?
   ``` 
   The resolveGrammar function will resolve (mutate the input rules) such "name only" references
   to the actual Rule instance.
   
   For any reference that cannot be resolved an error object will be outputted, 
   this object will contain an error message which can be customized by providing
   a custom implementation of [IGrammarResolverErrorMessageProvider](http://sap.github.io/chevrotain/documentation/1_0_1/interfaces/igrammarresolvererrormessageprovider.html).
   The [default implementation](http://sap.github.io/chevrotain/documentation/1_0_1/globals.html#defaultgrammarresolvererrorprovider) also exported as part of the public API.
   
   
1. [**validateGrammar**](http://sap.github.io/chevrotain/documentation/1_0_1/globals.html#validategrammar)
   Chevrotain expose a set of checks on the grammar structure that it is **highly recommended** to execute.
   These checks will detect ambiguous alternatives, left recursion, conflicting Terminals & NonTerminal names and more...
   
   validateGrammar is side effect free and like resolveGrammar will return an array of error objects.
   The error messages in these objects can once again be customized by providing a [IGrammarResolverErrorMessageProvider](http://sap.github.io/chevrotain/documentation/1_0_1/interfaces/igrammarvalidatorerrormessageprovider.html) 
   optionally based on the [default implementation](http://sap.github.io/chevrotain/documentation/1_0_1/globals.html#defaultgrammarvalidatorerrorprovider)  
    
1. [**assignOccurrenceIndices**](http://sap.github.io/chevrotain/documentation/1_0_1/globals.html#assignoccurrenceindices)
   Chevrotain has certain constraint on the "shape" of the generated code. The relevant one in this case is the [unique numerical suffixes](http://sap.github.io/chevrotain/website/FAQ.html#NUMERICAL_SUFFIXES) for the DSL methods.
   The assignOccurrenceIndices function will take care of this requirement by mutating the idx property on the GAST classes accordingly.
   
   
### A Note on Custom Error Messages

As mentioned earlier **validateGrammar** **assignOccurrenceIndices** optionally accept
a [errMsgProvider](http://sap.github.io/chevrotain/documentation/1_0_1/globals.html#validategrammar) option.
Note that all custom error message builders receive a GAST instance as input. What this means is that
the GAST classes created by the implementor of the custom API can be augmented with additional information to enable
producing better error messages. e.g:

- A Parser Generator style API using an EBNF notation in a **separate file**.
  may add location (line/column/offset) information to be able to link to locations in the original EBNF styled file.
  
- A Parser combinator API may attempt to reconstruct the original text of its API invocations to give better hints
  to assist in locating the original error.     


### Code Generation & Execution     

There are two APIs for code generation and execution.

- [**generateParserModule**](http://sap.github.io/chevrotain/documentation/1_0_1/globals.html#generateparsermodule)
  This will generate the string literal of a [UMD](https://github.com/umdjs/umd) module.
  This UMD pattern is consumable in all standard JS runtimes & module implementations.
  The approach is to generate the string literal and write it to a file for later consumption.
  However for development purposes or under certain runtimes it is possible to skip the file creation
  For example see the [require-from-string](https://github.com/floatdrop/require-from-string)

- [**generateParserFactory**](http://sap.github.io/chevrotain/documentation/1_0_1/globals.html#generateparserfactory)
  This API skips string literal and directly evals (new Function(...)) the code and returns
  a factory that can be used to create Parser instances.
  
  This can be useful for development and testing purposes but be wary
  as certain execution environments disallow the use of eval/new Function.
  Specifically webpages with content security policy enabled and browser extensions.
  However if the custom API is targeting only a node.js runtime this can be very
  useful for example for a combinator style API in which code generation is best
  avoided.
  
   
### Runnable examples

- [Combinator Style](https://github.com/SAP/chevrotain/tree/master/examples/custom_apis/combinator)

- Generator Style (TBD)


### Limitations 

