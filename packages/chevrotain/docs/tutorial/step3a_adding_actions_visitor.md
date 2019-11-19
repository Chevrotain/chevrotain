# Tutorial - Semantics CST Visitor

[Run and Debug the source code](https://github.com/SAP/chevrotain/tree/master/examples/tutorial/step3_actions/step3a_actions_visitor.js).

## Introduction

In the [previous](./step2_parsing.md) tutorial step
we have implemented a parser for a "mini" SQL Select grammar. The current problem is that our parser only
validates the input conforms to the grammar, in other words it is just a recognizer.
But in most real world use cases the parser will **also** have to output some result/data structure/value.

This can be accomplished using a CST (Concrete Syntax Tree) Visitor defined **outside** our grammar:

-   See in depth documentation of Chevrotain's [CST capabilities](https://sap.github.io/chevrotain/docs/guide/concrete_syntax_tree.html)

## Enabling CST

This feature is automatically enabled when a Parser extends the Chevrotain [CstParser](https://sap.github.io/chevrotain/documentation/6_5_0/classes/cstparser.html) class

The invocation of any grammar rule will now automatically create a CST.

```javascript
function parseInput(text) {
    const lexingResult = SelectLexer.tokenize(text)
    const parser = new SelectParser(lexingResult.tokens)

    // CST automatically created.
    const cstOutput = parser.selectStatement()
}
```

## The CST Visitor

Creating a CST is not enough, we also need to traverse this structure
and execute our actions (semantics).

Each Chevrotain parser **instance** exposes two BaseVisitor classes
which can be extended to create custom user visitors.

```javascript
// BaseVisitor constructors are accessed via a parser instance.
const parserInstance = new SelectParser([])

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

## Visitor Methods

So we now know how to create a CST visitor.
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
        let columns = ctx.Identifier.map(identToken => identToken.image)

        return {
            type: "SELECT_CLAUSE",
            columns: columns
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
            type: "SELECT_STMT",
            selectClause: select,
            fromClause: from,
            whereClause: where
        }
    }
}
```

## Full Visitor

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
        const tableName = ctx.Identifier[0].image

        return {
            type: "FROM_CLAUSE",
            table: tableName
        }
    }

    whereClause(ctx) {
        const condition = this.visit(ctx.expression)

        return {
            type: "WHERE_CLAUSE",
            condition: condition
        }
    }

    expression(ctx) {
        // Note the usage of the "rhs" and "lhs" labels defined in step 2 in the expression rule.
        const lhs = this.visit(ctx.lhs[0])
        const operator = this.visit(ctx.relationalOperator)
        const rhs = this.visit(ctx.rhs[0])

        return {
            type: "EXPRESSION",
            lhs: lhs,
            operator: operator,
            rhs: rhs
        }
    }

    // these two visitor methods will return a string.
    atomicExpression(ctx) {
        if (ctx.Integer) {
            return ctx.Integer[0].image
        } else {
            return ctx.Identifier[0].image
        }
    }

    relationalOperator(ctx) {
        if (ctx.GreaterThan) {
            return ctx.GreaterThan[0].image
        } else {
            return ctx.LessThan[0].image
        }
    }
}
```

#### Usage

So we know how to create a CST Visitor, but how do we actually use it?

```javascript
// A new parser instance with CST output enabled.
const parserInstance = new SelectParser([], { outputCst: true })
// Our visitor has no state, so a single instance is sufficient.
const toAstVisitorInstance = new SQLToAstVisitor()

function toAst(inputText) {
    // Lex
    const lexResult = selectLexer.tokenize(inputText)
    parserInstance.input = lexResult.tokens

    // Automatic CST created when parsing
    const cst = parserInstance.selectStatement()
    if (parserInstance.errors.length > 0) {
        throw Error(
            "Sad sad panda, parsing errors detected!\n" +
                parserInstance.errors[0].message
        )
    }

    // Visit
    const ast = toAstVisitorInstance.visit(cst)
    return ast
}
```
