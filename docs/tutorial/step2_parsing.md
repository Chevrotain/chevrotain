* Previous tutorial step - [Step 1 - Lexing](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step1_lexing.md)

# Tutorial Step 2 - Building a Parser.


### ---> [Try This Tutorial Online](http://sap.github.io/chevrotain/playground/?example=tutorial%20grammar) <---


### On code samples:
The code samples in the **written** tutorial use ES2015/2016/Typescript syntax (classes/let/static class props)
As those better convey the intent. The **online** version uses ES5 syntax.


### Introduction:
In This tutorial we will implement a Parser for a simple SQL Select statement language
introduced in the [previous](https://github.com/SAP/chevrotain/blob/master/docs/getting_started_lexer.md) tutorial step. 

The grammar for our language:

```ANTLR
 
selectStatement
   : selectClause fromClause (whereClause)?
   
selectClause
   : "SELECT" IDENTIFIER ("," IDENTIFIER)*
   
fromClause
   : "FROM" IDENTIFIER
     
fromClause
   : "WHERE" expression
   
expression
   : atomicExpression relationalOperator atomicExpression
      
atomicExpression
   : INTEGER | IDENTIFIER
         
relationalOperator
   : ">" | "<"
      
```

A Chevrotain Parser analyses a [Token](https://github.com/SAP/chevrotain/blob/master/src/scan/tokens_public.ts#L61) vector
that conforms to some grammar.
The grammar is defined using the [parsing DSL](http://sap.github.io/chevrotain/documentation/0_5_13/classes/chevrotain.parser.html#at_least_one),
Which includes the following methods.

*   [CONSUME](http://sap.github.io/chevrotain/documentation/0_5_13/classes/chevrotain.parser.html#consume1) - 'eat' a Token.
*   [SUBRULE](http://sap.github.io/chevrotain/documentation/0_5_13/classes/chevrotain.parser.html#subrule1) - reference to another rule.
*   [OPTION](http://sap.github.io/chevrotain/documentation/0_5_13/classes/chevrotain.parser.html#option1) - optional production. 
*   [MANY](http://sap.github.io/chevrotain/documentation/0_5_13/classes/chevrotain.parser.html#many1) - repetition zero or more.
*   [AT_LEAST_ONE](http://sap.github.io/chevrotain/documentation/0_5_13/classes/chevrotain.parser.html#at_least_one1) - repetition one or more.
*   [MANY_SEP](http://sap.github.io/chevrotain/documentation/0_5_13/classes/chevrotain.parser.html#many_sep1) - repetition (zero or more) with a separator between any two items 
*   [AT_LEAST_ONE_SEP](http://sap.github.io/chevrotain/documentation/0_5_13/classes/chevrotain.parser.html#at_least_one_sep1) - repetition (one or more) with a separator between any two items


#### Lets implement our first grammar rule. 

```Typescript
// selectStatement
//    : selectClause fromClause (whereClause)?;

let $ = this
this.selectStatement =
 $.RULE("selectStatement", () => {
     $.SUBRULE($.selectClause)
     $.SUBRULE($.fromClause)
     $.OPTION(() => {
         $.SUBRULE($.whereClause)        
     })
 })
```

fairly simple...


#### What is 'this'? where do we write the grammar rules?

Each grammar rule is a property of a class that extends chevrotain.Parser.

```Typescript
let allTokens = [WhiteSpace, Select, From, Where, Comma, Identifier, Integer, GreaterThan, LessThan]

class SelectParser extends chevrotain.Parser {

    constructor(input:Token[]) {
        super(input, allTokens)
        Parser.performSelfAnalysis(this)
    }
}
```

Important to note that:
* The **super** invocation has an array of the Tokens as the second parameter.
  This is the same array we used to define the Lexer.
* The static method **Parser.performSelfAnalysis** must be invoked at the end of the constructor.
  This is where much of the 'secret sauce' happens, including finishing the grammar representation
  and performing static checks on the grammar.
  

#### Lets look at two more grammar rule, this time with repetition and alternation.

```Typescript
// selectClause
//   : "SELECT" IDENTIFIER ("," IDENTIFIER)*;

this.selectClause =
 $.RULE("selectClause", () => {
      $.CONSUME(Select);
      $.AT_LEAST_ONE_SEP(Comma, () => {
          $.CONSUME(Identifier);
      }, "column name");
 })
 
// atomicExpression
//    : INTEGER | IDENTIFIER
this.atomicExpression =
 $.RULE("atomicExpression", () => {
    $.OR([
         {ALT: () => { $.CONSUME(Integer)}},
         {ALT: () => { $.CONSUME(Identifier)}}
         ]);
})
 
```


#### How can the Parser be debugged? 
The grammar rules above do not only define the grammar, they are also the code that will be run
during parsing. This means that debugging the parser **simply means adding a break
point in the grammar**. There **do not** exist two different representations for for the grammar
and the runnable implementation (for example grammar file vs generated code in the case of parser generators).


#### But how does it work? (skip if you don't care :) )
The code above will be executed as is. Yet we have not implemented a lookahead function to
choose between the two OR alternatives ```( INTEGER | IDENTIFIER)```,
nor have we implemented logic to identify the next iteration for ```("," IDENTIFIER)*```. 
So how does it work?

The answer is the 'secret sauce' of Chevrotain:
 * ```$.RULE``` will both:
  * Analyse (using Function.toString) the implementation passed to it.
    and construct a representation of the grammar in memory.
  * Wrap the implementation passed to it in logic for running the Parser (fault tolerance/rule stacks/...)  
 * ```Parser.performSelfAnalysis(this)``` will finish 'compiling' the grammar representation (name resolution/static analysis) 

So when the parser needs to choose between the two alternatives:
```Typescript
$.OR([
     {ALT: () => { $.CONSUME(Integer)}},
     {ALT: () => { $.CONSUME(Identifier)}}
     ]);
```

It is aware of:
* Where it is (OR [1] INSIDE_RULE [A] INSIDE_RULE [B] ...)
* What Tokens can come next for each alternative, as it "is aware" of the whole grammar representation.

Thus the parser can dynamically create(and cache) the lookahead function to choose between the two alternatives.
The same applies for any grammar rule where the parser has a choice, and even in some where there is no choice
as that same in memory representation of the grammar can be used for fault tolerance as well as deciding which path
to take.


#### Lets finish implementing the whole SelectParser:

```Typescript

let allTokens = [WhiteSpace, Select, From, Where, Comma, Identifier, Integer, GreaterThan, LessThan]

class SelectParser extends chevrotain.Parser {

    constructor(input:Token[]) {
        super(input, allTokens)
        Parser.performSelfAnalysis(this)
    }
    
    let $ = this
    
    this.selectStatement = $.RULE("selectStatement", () => {
        $.SUBRULE($.selectClause)
        $.SUBRULE($.fromClause)
        $.OPTION(() => {
            $.SUBRULE($.whereClause)        
        })
    })
     
    this.selectClause = $.RULE("selectClause", () => {
        $.CONSUME(Select)
        $.AT_LEAST_ONE_SEP(Comma, () => {
            $.CONSUME(Identifier)
        }, "column name")
    })
     
    this.fromClause = $.RULE("fromClause", () => {
        $.CONSUME(From)
        $.CONSUME(Identifier)
    })
    
    this.whereClause = $.RULE("whereClause", () => {
        $.CONSUME(Where)
        $.SUBRULE($.expression)
    }) 
    
    this.expression = $.RULE("expression", () => {
        $.SUBRULE($.atomicExpression)
        $.SUBRULE($.relationalOperator)
        $.SUBRULE2($.atomicExpression) // note the '2' suffix to distinguish
                      // from the 'SUBRULE(atomicExpression)'
                      // 2 lines above.
    })
    
    this.atomicExpression = $.RULE("atomicExpression", () => {
        $.OR([
            {ALT: () => { $.CONSUME(Integer)}},
            {ALT: () => { $.CONSUME(Identifier)}}
            ]);
    })
    
    this.relationalOperator = $.RULE("relationalOperator", () => {
        return $.OR([
            {ALT: function(){ $.CONSUME(GreaterThan)}},
            {ALT: function(){ $.CONSUME(LessThan)}}
        ]);
    });
        
}

```

* Note that as a consequence of the parser having to 'know' its position
  in the grammar during runtime, the Parsing DSL methods need to be distinguishable
  when appearing in the same rule. Thus in the **expression** rule above
  the second appearance of SUBRULE with atomicExpression parameter.
  has a '2' suffix: $.SUBRULE**2**($.atomicExpression)
 * Such errors will be detected during self analysis, and will prevent
   the creation of parser instances with a descriptive error message (fail fast...).


#### But how do we actually use this Parser?

```Typescript
let inputText = "SELECT column1 FROM table2"
let lexingResult = SelectLexer.tokenize(inputText)
let parser = new SelectParser(lexingResult.tokens);
parser.selectStatement()

if (parser.parseErrors.length > 1) {
        throw new Error("sad sad panda, Parsing errors detected")
}
```

* Note that any of the grammar rules can be invoked as the starting rule.
  There is no 'special' top level entry rule.


#### What is Next?
* Play around in the [**onine** version](http://sap.github.io/chevrotain/playground/?example=tutorial%20grammar) of this tutorial.
* Next step in the tutorial: [Step 3 - Grammar Actions](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step3_adding_actions.md).
