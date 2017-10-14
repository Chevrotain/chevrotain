* Previous tutorial step - [Step 1 - Lexing](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step1_lexing.md)

# Tutorial Step 2 - Building a Parser.


### ---> [Source Code](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/src/step2_parsing) for this step <---


### On code samples:
The tutorial uses ES2015+ syntax.
See examples of using Chevrotain in other [implementation languages](https://github.com/SAP/chevrotain/tree/master/examples/implementation_languages).


### Introduction:
In this tutorial we will implement a Parser for a simple SQL Select statement language
introduced in the [previous](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step1_lexing.md) tutorial step. 

The grammar for our language:

```ANTLR
 
selectStatement
   : selectClause fromClause (whereClause)?
   
selectClause
   : "SELECT" Identifier ("," Identifier)*
   
fromClause
   : "FROM" Identifier
     
whereClause
   : "WHERE" expression
   
expression
   : atomicExpression relationalOperator atomicExpression
      
atomicExpression
   : Integer | Identifier
         
relationalOperator
   : ">" | "<"
      
```

A Chevrotain Parser analyses an [IToken](http://sap.github.io/chevrotain/documentation/0_34_0/interfaces/_chevrotain_d_.itoken.html) vector that conforms to some grammar.
The grammar is defined using the [parsing DSL](http://sap.github.io/chevrotain/documentation/0_34_0/classes/_chevrotain_d_.parser.html#at_least_one), which includes the following methods.

*   [CONSUME](http://sap.github.io/chevrotain/documentation/0_34_0/classes/_chevrotain_d_.parser.html#consume1) - 'eat' a Token.
*   [SUBRULE](http://sap.github.io/chevrotain/documentation/0_34_0/classes/_chevrotain_d_.parser.html#subrule1) - reference to another rule.
*   [OR](http://sap.github.io/chevrotain/documentation/0_34_0/classes/_chevrotain_d_.parser.html#or1) - Alternation
*   [OPTION](http://sap.github.io/chevrotain/documentation/0_34_0/classes/_chevrotain_d_.parser.html#option1) - optional production. 
*   [MANY](http://sap.github.io/chevrotain/documentation/0_34_0/classes/_chevrotain_d_.parser.html#many1) - repetition zero or more.
*   [AT_LEAST_ONE](http://sap.github.io/chevrotain/documentation/0_34_0/classes/_chevrotain_d_.parser.html#at_least_one1) - repetition one or more.
*   [MANY_SEP](http://sap.github.io/chevrotain/documentation/0_34_0/classes/_chevrotain_d_.parser.html#many_sep1) - repetition (zero or more) with a separator between any two items 
*   [AT_LEAST_ONE_SEP](http://sap.github.io/chevrotain/documentation/0_34_0/classes/_chevrotain_d_.parser.html#at_least_one_sep1) - repetition (one or more) with a separator between any two items


#### Let's implement our first grammar rule. 

```javascript
// selectStatement
//    : selectClause fromClause (whereClause)?;

const $ = this
$.RULE("selectStatement", () => {
    $.SUBRULE($.selectClause)
    $.SUBRULE($.fromClause)
    $.OPTION(() => {
        $.SUBRULE($.whereClause)        
    })
})
```

Fairly straight forward translation:
 * Non-Terminals --> SUBRULE
 * "?" --> OPTION


#### What is 'this' in this context? where do we write the grammar rules?

Each grammar rule is a property of a class that extends chevrotain.Parser.

```javascript
let allTokens = [WhiteSpace, Select, From, Where, Comma, Identifier, Integer, GreaterThan, LessThan]

class SelectParser extends chevrotain.Parser {
    /**
    * @param {IToken[]} input 
    */
    constructor(input) {
        super(input, allTokens)
        
        const $ = this;
        
        $.RULE("selectStatement", () => {
            $.SUBRULE($.selectClause)
            $.SUBRULE($.fromClause)
            $.OPTION(() => {
               $.SUBRULE($.whereClause)        
            })
        })
        
        Parser.performSelfAnalysis(this)
    }   
}
```

Important to note that:
* The **super** invocation has an array of the Tokens as the second parameter.
  This is the same array we used to define the Lexer and it is used to define the Parser's vocabulary.
* The static method **Parser.performSelfAnalysis** must be invoked at the end of the constructor.
  This is where much of the 'secret sauce' happens, including creating the inner grammar representation
  and performing static checks on the grammar.
  

#### Let's look at two more grammar rule, this time with repetition and alternation.

```javascript
// selectClause
//   : "SELECT" IDENTIFIER ("," IDENTIFIER)*;
this.selectClause =
   $.RULE("selectClause", () => {
       $.CONSUME(Select);
       $.AT_LEAST_ONE_SEP({SEP: Comma, DEF: () => {
           $.CONSUME(Identifier);
       }});
   })
 
// atomicExpression
//    : INTEGER | IDENTIFIER
this.atomicExpression =
   $.RULE("atomicExpression", () => {
// prettier-ignore
       $.OR([
           {ALT: () => { $.CONSUME(Integer)}},
           {ALT: () => { $.CONSUME(Identifier)}}
       ]);
})
```


#### How can the Parser be debugged? 
The grammar rules above do not only define the grammar, they are also the code that will be run
during parsing. This means that you can debug the parser **simply by adding a break
point in the grammar**.

```javascript
// selectClause
//   : "SELECT" IDENTIFIER ("," IDENTIFIER)*;
this.selectClause =
   $.RULE("selectClause", () => {
       $.CONSUME(Select);
       // Can be debugged directly! no code generation.
       debugger;
       $.AT_LEAST_ONE_SEP({SEP: Comma, DEF: () => {
           $.CONSUME(Identifier);
       }});
   })
})
```

There **do not** exist two different representations for the grammar
and the runnable implementation (for example, grammar file vs generated code in the case of parser generators).
Again, please note that Chevrotain is **NOT** a parser generator.
Extra details can be found [in the FAQ](https://github.com/SAP/chevrotain/blob/master/docs/faq.md#-why-should-i-use-a-parsing-dsl-instead-of-a-parser-generator).


#### But how does it work? (skip if you don't care :) )
The code above will be executed as is. Yet we have not implemented a lookahead function to
choose between the two OR alternatives ```( INTEGER | IDENTIFIER)```,
nor have we implemented logic to identify the next iteration for ```("," IDENTIFIER)*```. 
So how does it work?

The answer is the 'secret sauce' of Chevrotain:

* `$.RULE` will both:
  - Analyse (using Function.toString) the implementation passed to it and construct a representation of the grammar in memory.
  - Wrap the implementation passed to it in logic for running the Parser (fault tolerance/rule stacks/...)  
* `Parser.performSelfAnalysis(this)` will finish 'compiling' the grammar representation (name resolution/static analysis) 

So when the parser needs to choose between the two alternatives:
```javascript
$.OR([
     {ALT: () => { $.CONSUME(Integer)}},
     {ALT: () => { $.CONSUME(Identifier)}}
]);
```

It is aware of:
* Where it is (`OR [1] INSIDE_RULE [A] INSIDE_RULE [B] ...`)
* What Tokens can come next for each alternative, as it "is aware" of the whole grammar representation.

Thus the parser can dynamically create (and cache) the lookahead function to choose between the two alternatives.

The same applies for any grammar rule where the parser has a choice, 
and even in some where there is no choice as that same in memory representation of the grammar 
can be used for error messages and fault tolerance as well as deciding which path to take.


#### Let's finish implementing the whole SelectParser:

```javascript

let allTokens = [WhiteSpace, Select, From, Where, Comma, Identifier, Integer, GreaterThan, LessThan]

class SelectParser extends chevrotain.Parser {

    constructor(input) {
     super(input, allTokens)
     
     const $ = this
     
     $.RULE("selectStatement", () => {
         $.SUBRULE($.selectClause)
         $.SUBRULE($.fromClause)
         $.OPTION(() => {
             $.SUBRULE($.whereClause)        
         })
     })

     $.RULE("selectClause", () => {
         $.CONSUME(Select)
         $.AT_LEAST_ONE_SEP({SEP: Comma, DEF: () => {
             $.CONSUME(Identifier)
         }})
     })

     $.RULE("fromClause", () => {
         $.CONSUME(From)
         $.CONSUME(Identifier)
     })

     $.RULE("whereClause", () => {
         $.CONSUME(Where)
         $.SUBRULE($.expression)
     }) 

     $.RULE("expression", () => {
         $.SUBRULE($.atomicExpression)
         $.SUBRULE($.relationalOperator)
         $.SUBRULE2($.atomicExpression) // note the '2' suffix to distinguish
                       // from the 'SUBRULE(atomicExpression)'
                       // 2 lines above.
     })

     $.RULE("atomicExpression", () => {
         // prettier-ignore
         $.OR([
             {ALT: () => { $.CONSUME(Integer)}},
             {ALT: () => { $.CONSUME(Identifier)}}
         ]);
     })

     $.RULE("relationalOperator", () => {
         // prettier-ignore
         $.OR([
             {ALT: function(){ $.CONSUME(GreaterThan)}},
             {ALT: function(){ $.CONSUME(LessThan)}}
         ]);
     });
    
     Parser.performSelfAnalysis(this)
    }    
}
```

* Note that as a consequence of the parser having to 'know' its position in the grammar during runtime, the Parsing DSL methods need to be distinguishable when appearing in the same rule. 
  Thus in the `"expression"` rule above, the second appearance of `SUBRULE` with `atomicExpression` parameter has a '2' suffix: `$.SUBRULE2($.atomicExpression)`
* Such errors will be detected during self analysis, and will prevent the creation of parser instances with a descriptive error message (fail fast...).


#### But how do we actually use this Parser?

```Javascript
// ONLY ONCE
const parser = new SelectParser([]);

function parseInput(text) {
   let lexingResult = SelectLexer.tokenize(text)
   // "input" is a setter which will reset the parser's state.
   parser.input = lexingResult.tokens
   parser.selectStatement()

   if (parser.errors.length > 0) {
      throw new Error("sad sad panda, Parsing errors detected")
   }
}

let inputText = "SELECT column1 FROM table2"
parseInput(inputText)
```

* Note that any of the grammar rules can be invoked as the starting rule.
  There is no 'special' top level entry rule.


#### What is Next?
* Run & Debug the [source code](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/src/step2_parsing) of 
  this tutorial step.
* Next step in the tutorial: [Step 3 - Grammar Actions](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step3_adding_actions_root.md).
