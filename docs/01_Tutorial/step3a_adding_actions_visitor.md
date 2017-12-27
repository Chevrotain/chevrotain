* Previous tutorial step - [Step 2 - Parsing](./step2_parsing.md)

# Tutorial Step 3 - Adding Actions using a CST Visitor.


### ---> [Source Code](https://github.com/SAP/chevrotain/blob/master/examples/tutorial/step3_actions/step3a_actions_visitor.js) for this step <---


### On code samples:
The tutorial uses ES2015+ syntax.
See examples of using Chevrotain in other [implementation languages](https://github.com/SAP/chevrotain/tree/master/examples/implementation_languages).


### Introduction:
In the [previous](./step2_parsing.md) tutorial step
we have implemented a parser for a "mini" SQL Select grammar. The current problem is that our parser only
validates the input conforms to the grammar, in other words it is just a recognizer. 
But in most real world use cases the parser will **also** have to output some result/data structure/value.

This can be accomplished using a CST (Concrete Syntax Tree) Visitor defined **outside** our grammar:
 * See in depth documentation of Chevrotain's [CST capabilities](https://github.com/SAP/chevrotain/blob/master/docs/concrete_syntax_tree.md)


### Enabling CST output in our parser.

First we need to enable CST (Concrete Syntax Tree) creation by our parser.
This is easily done by passing the ["outputCst"](http://sap.github.io/chevrotain/documentation/1_0_1/interfaces/_chevrotain_d_.iparserconfig.html#outputcst) parser options object in
the super constructor.

```javascript
class SelectParser extends chevrotain.Parser {

    constructor(input) {
     // The "outputCst" flag will cause the parser to create a CST structure on rule invocation
     super(input, allTokens, {outputCst: true})
     
     /* rule definitions... */
    
     Parser.performSelfAnalysis(this)
    }    
}
```

Note that this is the **only** change needed in the parser.
Invocation of any grammar rule will now automatically create a CST.

```Javascript
function parseInput(text) {
   let lexingResult = SelectLexer.tokenize(text)
   let parser = new SelectParser(lexingResult.tokens)
   
   // CST automatically created. 
   let cstOutput = parser.selectStatement()
}
``` 


### Creating a CST Visitor     

Each Chevrotain parser **instance** exposes two BaseVisitor classes
which can be extended to create custom user visitors.

```javascript
// BaseVisitor constructors are accessed via a parser instance.
const parserInstance = new SelectParser([]);

const BaseSQLVisitor = parserInstance.getBaseCstVisitorConstructor()

// This BaseVisitor include default visit methods that simply traverse the CST. 
const BaseSQLVisitorWithDefaults = parserInstance.getBaseCstVisitorConstructorWithDefaults()

class myCustomVisitor extends BaseSQLVisitor {
    constructor() {
        super()
        // The "validateVisitor" method is a helper utility which performs static analysis
        // to detect missing or redundant visitor methods
        this.validateVisitor()
    }
    
    /* Visit methods go here */
}

class myCustomVisitorWithDefaults extends BaseSQLVisitorWithDefaults {
    constructor() {
        super()
        this.validateVisitor()
    }
    
    /* Visit methods go here */
}

const myVisitorInstance = new myCustomVisitor()
const myVisitorInstanceWithDefaults = new myCustomVisitorWithDefaults()
```

In our example we will use the BaseVisitor constructor (**without** defaults )
 

### Adding some visitor methods     

So we now know how to create a CSt visitor.
But how do we actually make it perform the actions (semantics) we wish?
For that we must create a **visit method** for each grammar rule.
 
Recall the selectClause grammar from the previous step:

```antlr
selectClause: 
  "SELECT" Identifier ("," Identifier)*;
```

Lets create a visitor method for the selectClause rule.

```javascript
class SQLToAstVisitor extends BaseSQLVisitor {
    constructor() {
        super()
        this.validateVisitor()
    }
    
    // The Ctx argument is the current CSTNode's children.
    selectClause(ctx) {
        // Each Terminal or Non-Terminal in a grammar rule are collected into
        // an array with the same name(key) in the ctx object.
        let columns = ctx.Identifier.map((identToken) => identToken.image)
        
        return {
            type    : "SELECT_CLAUSE", 
            columns : columns
        }
    }
}
``` 

So far pretty simple, now lets add another visit method for "selectStatement".
First lets recall it's grammar.

```antlr
selectStatement
   : selectClause fromClause (whereClause)?
```

And now to the code:

```javascript
class SQLToAstVisitor extends BaseSQLVisitor {
    
    constructor() {
        super()
        this.validateVisitor()
    }
    
    // The Ctx argument is the current CSTNode's children.
    selectClause(ctx) {
        /* as above... */
    }
    
    selectStatement(ctx) {
        // "this.visit" can be used to visit none-terminals and will invoke the correct visit method for the CstNode passed.
        let select = this.visit(ctx.selectClause)
        
        //  "this.visit" can work on either a CstNode or an Array of CstNodes.
        //  If an array is passed (ctx.fromClause is an array) it is equivalent
        //  to passing the first element of that array
        let from = this.visit(ctx.fromClause)
        
        // "whereClause" is optional, "this.visit" will ignore empty arrays (optional)   
        let where = this.visit(ctx.whereClause)
        
        return {
            type         : "SELECT_STMT", 
            selectClause : select,
            fromClause   : from, 
            whereClause  : where
        }
    }
}
``` 

We still have a few grammar rules we need to build visitors for.

```ANTLR
 
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
 
lets implement those as well.

```javascript
class SQLToAstVisitor extends BaseSQLVisitor {
    
    constructor() {
        super()
        this.validateVisitor()
    }
    
    selectStatement(ctx) {
        /* as above... */
    }    
        
    selectClause(ctx) {
        /* as above... */
    }
    
    fromClause(ctx) {
        let tableName = ctx.Identifier[0].image
        
        return {
            type    : "FROM_CLAUSE", 
            table : tableName
        }
    }
    
    whereClause(ctx) {
        let condition = this.visit(ctx.expression)
        
        return {
            type: "WHERE_CLAUSE",
            condition: condition
        }

    }
    
    expression(ctx) {
        let lhs = this.visit(ctx.atomicExpression[0])
        // The second [1] atomicExpression is the right hand side
        let rhs = this.visit(ctx.atomicExpression[1])
        let operator = this.visit(ctx.relationalOperator)
        
        return {
            type: "EXPRESSION", 
            lhs: lhs,
            operator: operator,
            rhs: rhs
        }
    }
    
    // these two visitor methods will return a string.
    atomicExpression(ctx) {
        if (ctx.Integer[0]) {
            return ctx.Integer[0].image
        }
        else {
            return ctx.Identifier[0].image
        }
    }
    
    relationalOperator(ctx) {
        if (ctx.GreaterThan[0]) {
            return ctx.GreaterThan[0].image
        }
        else {
            return ctx.LessThan[0].image
        }
    }
}
``` 

#### Gluing it all together 

So we know how to create a CST Visitor, but how do we actually use it?

```javascript

// A new parser instance with CST output enabled.
const parserInstance = new SelectParser([], {outputCst: true})
// Our visitor has no state, so a single instance is sufficient.
const toAstVisitorInstance = new SQLToAstVisitor()

function toAst(inputText) {
    // Lex
    let lexResult = selectLexer.tokenize(inputText)
    parserInstance.input = lexResult.tokens
    
    // Automatic CST created when parsing
    let cst = parserInstance.selectStatement()
    if (parserInstance.errors.length > 0) {
        throw Error("Sad sad panda, parsing errors detected!\n" + parserInstance.errors[0].message)
    }
    
    // Visit
    let ast = toAstVisitorInstance.visit(cst)
    return ast
}
``` 

#### What is Next?
* Run & Debug the [source code](https://github.com/SAP/chevrotain/blob/master/docs/01_Tutorial/step3a_actions_visitor) of 
  this tutorial step.
* Next step in the tutorial: [Step 4 - Fault Tolerance](./step4_fault_tolerance.md).
