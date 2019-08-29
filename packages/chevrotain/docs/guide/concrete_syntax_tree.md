# Automatic Concrete Syntax Tree Creation

Chevrotain has the capability to **automatically** create a concrete syntax tree (CST)
during parsing. A CST is a simple structure which represents the **entire** parse tree.
It contains information on every token parsed.

The main advantage of using the automatic CST creation is that it enables writing "pure" grammars.
This means that the semantic actions are **not** embedded into the grammar implementation but are instead
completely **separated** from it.

This separation of concerns makes the grammar easier to maintain
and makes it easier to implement different capabilities on the grammar,
for example: separate logic for compilation and for IDE support.

## AST vs CST

There are two major differences.

1.  An **A**bstract **S**yntax **T**ree would not normally contain all the syntactic information.
    This mean the **exact original** text can not always be re-constructed from the AST.

2.  An **A**bstract **S**yntax **T**ree would not represent the whole syntactic parse tree.
    It would normally only contain nodes related to specific parse tree nodes,
    but not all of those (mostly leaf nodes).

## Enabling

How to enable CST output?

This feature is enabled when a parser extends the [CstParser class](https://sap.github.io/chevrotain/documentation/6_2_0/classes/cstparser.html).

```typescript
import { CstParser } from "chevrotain"

class SelectParser extends CstParser {
    constructor() {
        super([])
    }
}
```

## Structure

The structure of the CST is very simple.

-   See the full [CstNode type signature](https://sap.github.io/chevrotain/documentation/6_2_0/interfaces/cstnode.html)

-   Explore it by running the CST creation example in the [**online playground**](https://sap.github.io/chevrotain/playground/?example=JSON%20grammar%20and%20automatic%20CST%20output).

-   Note that the following examples are not runnable nor contain the full information.
    These are just snippets to explain the core concepts.

```TypeScript
export type CstElement = IToken | CstNode
export type CstChildrenDictionary = { [elementName:string]:CstElement[] }

export interface CstNode {
    readonly name:string

    readonly children:CstChildrenDictionary

    readonly recoveredNode?:boolean
}
```

A single CstNode corresponds to a single grammar rule's invocation result.

```javascript
$.RULE("qualifiedName", () => {})

input = ""

output = {
    name: "qualifiedName",
    children: {}
}
```

Each Terminal will appear in the children dictionary using the terminal's name
as the key and an **array** of IToken as the value.

```javascript
$.RULE("qualifiedName", () => {
    $.CONSUME(Identifier)
    $.CONSUME(Dot)
    $.CONSUME2(Identifier)
})

input = "foo.bar"

output = {
    name: "qualifiedName",
    children: {
        Dot: ["."],
        Identifier: ["foo", "bar"]
    }
}
```

Non-Terminals are handled similarly to Terminals except each item in the value's array
Is the CstNode of the corresponding Grammar Rule (Non-Terminal).

```javascript
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
        singleIdent: [
            {
                name: "singleIdent",
                children: {
                    Identifier: ["foo"]
                }
            }
        ]
    }
}
```

Note that Terminals and Non-Terminals will only appear in the children object
if they were actually encountered during parsing.
This means that optional grammar productions may or may not appear in a CST node
depending on the actual input, e.g:

```javascript
$.RULE("variableStatement", () => {
    $.CONSUME(Var)
    $.CONSUME(Identifier)
    $.OPTION(() => {
        $.CONSUME(Equals)
        $.CONSUME(Integer)
    })
})

input1 = "var x"

output1 = {
    name: "variableStatement",
    children: {
        Var: ["var"],
        Identifier: ["x"]
        // no "Equals" or "Integer" keys
    }
}

input2 = "var x = 5"

output2 = {
    name: "variableStatement",
    children: {
        Var: ["var"],
        Identifier: ["x"],
        Equals: ["="],
        Integer: ["5"]
    }
}
```

## In-Lined Rules

So far the CST structure is quite simple, but how would a more complex grammar be handled?

```javascript
$.RULE("statements", () => {
    $.OR([
        // let x = 5
        {
            ALT: () => {
                $.CONSUME(Let)
                $.CONSUME(Identifer)
                $.CONSUME(Equals)
                $.SUBRULE($.expression)
            }
        },
        // select age from employee where age = 120
        {
            ALT: () => {
                $.CONSUME(Select)
                $.CONSUME2(Identifer)
                $.CONSUME(From)
                $.CONSUME3(Identifer)
                $.CONSUME(Where)
                $.SUBRULE($.expression)
            }
        }
    ])
})
```

Some of the Terminals and Non-Terminals are used in **both** alternatives.
It is possible to check for the existence of distinguishing terminals such as the "Let" and "Select".
But this is not a robust approach.

```javascript
let cstResult = parser.qualifiedName()

if (cstResult.children.Let !== undefined) {
    // Let statement
    // do something...
} else if (cstResult.children.Select !== undefined) {
    // Select statement
    // do something else.
}
```

Alternatively it is possible to refactor the grammar in such a way that both alternatives
Would be completely wrapped in their own Non-Terminal rules.

```javascript
$.RULE("statements", () => {
    $.OR([
        { ALT: () => $.SUBRULE($.letStatement) },
        { ALT: () => $.SUBRULE($.selectStatement) }
    ])
})
```

This is the recommended approach in this case as more and more alternations are added the grammar rule
will become too difficult to understand and maintain due to verbosity.
However, sometimes refactoring out rules is too much, this is where **in-lined** rules arrive to the rescue.

```javascript
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
            }
        },
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
            }
        }
    ])
})

output = {
    name: "statements",
    // only one of they keys depending on the actual alternative chosen
    children: {
        $letStatement: [
            /*...*/
        ],
        $$selectStatement: [
            /*...*/
        ]
    }
}
```

Providing a **NAME** property to the DSL methods will create an in-lined rule.
It is equivalent to extraction to a separate grammar rule with two differences:

-   To avoid naming conflicts in-lined rules **must** start with a dollar(\$) sign.
-   In-lined rules do not posses error recovery (re-sync) capabilities as do regular rules.

Syntax Limitation:

-   The **NAME** property of an in-lined rule must appear as the **first** property
    of the **DSLMethodOpts** object.

    ```javascript
    // GOOD
    $.RULE("field", () => {
        $.OPTION({
            NAME: "$modifier",
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
            NAME: "$modifier"
        })
    })
    ```

## CstNodes Location

Sometimes the information regarding the textual location (range) of each CstNode is needed.
This information is normally **already present** on the CstNodes **nested** children simply because the CstNode's children
include the Tokens provided by the Lexer. However by default this information is not easily accessible
as we would have to fully traverse a CstNode to understands its full location range information.

The feature for providing CstNode location directly on the CstNodes objects is available since version 4.7.0.
Tracking the CstNodes location is **disabled by default** and can be enabled
by setting the IParserConfig [nodeLocationTracking](https://sap.github.io/chevrotain/documentation/6_2_0/interfaces/iparserconfig.html#nodelocationtracking)
to:

-   "full" (start/end for **all** offset/line/column)
-   or "onlyOffset", (start/end for **only** offsets)

for example:

```typescript
import { CstParser } from "chevrotain"

class SelectParser extends CstParser {
    constructor() {
        super([], {
            nodeLocationTracking: "full"
        })
    }
}
```

Once this feature is enabled the optional [location property](https://sap.github.io/chevrotain/documentation/6_2_0/interfaces/cstnode.html#location)
on each CstNode would be populated with the relevant information.

Caveats

-   In order to track the CstNodes location **every** Token in the input Token vector must include its own location information.

    -   This is enabled by default in the Chevrotain Lexer, See [ILexerConfig.positionTracking](https://sap.github.io/chevrotain/documentation/6_2_0/interfaces/ilexerconfig.html#positiontracking).
        However, if a third party Lexer is used in conjunction with a Chevrotain Parser, the Tokens produced by such a lexer
        must include the relevant location properties to allow the chevrotain parser to compute the CstNode locations.

-   A CstNode may be empty, for example when the matching grammar rule has not matched any token.
    In that case the default value for the location properties is NaN.

-   This feature has a slight performance and memory cost,
    this performance impact is **linear** and was measured at 5-10% for a full lexing + parsing flow.
    In general the more complex a grammar is (in terms of more CstNodes created per N tokens)
    the higher the impact. Additionally if the Parser has activated the error recovery capabilities
    of Chevrotain the impact would be at the high end of the given range,
    as the location tracking logic is more complex when some of the Tokens may be virtual/invalid.

## Fault Tolerance

CST output is also supported in combination with automatic error recovery.
This combination is actually stronger than regular error recovery because
even partially formed CstNodes will be present on the CST output and be marked
using the **recoveredNode"** boolean property.

For example given this grammar and assuming the parser re-synced after a token mismatch at
the "Where" token:

```javascript
$.RULE("SelectClause", () => {
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
    name: "SelectClause",
    children: {
        Select: ["select"],
        Identifier: ["age, persons"],
        From: ["from"]
        // No "Where" key d,ue to the parse error
        // No "expression" key due to the parse error
    },
    // This marks a recovered node.
    recoveredNode: true
}
```

This accessibility of **partial parsing results** means some post-parsing logic
may be able to perform farther analysis.
for example: offering auto-fix suggestions or provide better error messages.

## Traversing

So we now know how to create a CST and it's internal structure.
But how do we traverse this structure and perform semantic actions?
Some examples for such semantic actions:

-   Creation of an Abstract Syntax Tree (AST) to be later used in the rest of the compilation pipeline.
-   Running the input text in an interpreter, for example a Calculator's grammar and input can be evaluated to
    a numerical value.
-   Extracting specific pieces of information from the input.

One option would be to "manually" recursively "walk" the output CST structure.

```javascript
// Tree Walker
export function toAst(cst) {
    const children = cst.children
    switch (cst.name) {
        case "selectStatement": {
            let columnsListCst = children.columnsList[0]
            let fromClauseCst = children.fromClause[0]

            let columnsListAst = toAst(columnsListCst)
            let fromClauseAst = toAst(fromClauseCst)

            return {
                type: "SelectStatementAst",
                columns: columnsListAst,
                from: fromClauseAst
            }
        }
        case "columnsList": {
            let columnName = children.identifier[0].image
            /*...*/
        }
        case "fromClause": {
            /*...*/
        }
        default: {
            throw new Error(
                `CST case handler not implemented for CST node <${cst.name}>`
            )
        }
    }
}
```

This is a valid approach, however it can be somewhat error prone:

-   No validation that the case names match the real names of the CST Nodes.
-   The validation for missing case handler (default case) depends on attempting to run toAst with invalid input.
    (Fail slow instead of fail fast...)
-   In-Lined Rules may cause ambiguities as they should be matched on the fullName property not the name property.

## CST Visitor

For the impatient, See a full runnable example: [Calculator Grammar with CSTVisitor interpreter](https://github.com/SAP/chevrotain/blob/master/examples/grammars/calculator/calculator_pure_grammar.js)

Chevrotain provides a CSTVisitor class which can make traversing the CST less error prone.

```javascript
// The base Visitor Class can be accessed via a Parser **instance**.
const BaseCstVisitor = myParserInstance.getBaseCstVisitorConstructor()

class SqlToAstVisitor extends BaseCstVisitor {
    constructor() {
        super()
        // This helper will detect any missing or redundant methods on this visitor
        this.validateVisitor()
    }

    selectStatement(ctx) {
        // ctx.columnsList is an array, while this.visit accepts a CSTNode
        // but if an array is passed to this.visit it will act as though the first element of the array has been passed.
        // this means "this.visit(ctx.columnsList)" is equivalent to "this.visit(ctx.columnsList[0])"
        let columnsListAst = this.visit(ctx.columnsList)
        let fromClauseAst = this.visit(ctx.fromClause)

        return {
            type: "SelectStatementAst",
            columns: columnsListAst,
            from: fromClauseAst
        }
    }

    columnsList(ctx) {
        let columnName = ctx.identifier[0].image
        /*...*/
    }

    // Optional "IN" argument
    fromClause(ctx, inArg) {
        /*...*/
    }

    // Visitor methods for in-lined rules are created by appending the in-lined rule name to the parent rule name.
    fromClause$INLINED_NAME(ctx) {
        /*...*/
    }
}
```

-   Each visitor method will be invoked with the respective CSTNode's children as the first argument
    (called ctx in the above example).

-   Recursively visiting None-Terminals can be accomplished by using the **this.visit** method.
    It will invoke the appropriate visit method for the CSTNode argument.

-   The **this.visit** method can also be invoked on an array on CSTNodes in that case
    It is equivalent to calling it on the first element of the input array.

-   Each visit method can return a value which can be used to combine the traversal results.

-   The **this.validateVisitor()** method can be used to detect missing or redundant visitor methods.

    -   For example due to a refactoring of the grammar or a typo.

-   Visitor methods support an optional "IN" parameter.

### Do we always have to implement all the visit methods?

**No**, sometimes we only need to handle a few specific CST Nodes
In that case use **getBaseCstVisitorConstructorWithDefaults()** to get the base visitor constructor.
This base visitor includes a default implementation for all visit methods
which simply invokes **this.visit** on all none terminals in the CSTNode's children.

```javascript
// The base Visitor Class can be accessed via a Parser **instance**.
const BaseCstVisitorWithDefaults = myParserInstance.getBaseCstVisitorConstructorWithDefaults()

class SqlColumnNamesVisitor extends BaseCstVisitorWithDefaults {
    constructor() {
        super()
        this.result = []
        this.validateVisitor()
    }

    fromClause(ctx) {
        // collect only the names of the columns
        this.result.push(ctx.Identifier[0].image)
    }

    // All other visit methods will be "filled" automatically with the default implementation.
}
```

Note that when using a visitor with default visit implementations
It is not possible to return values from the visit methods because
the default implementation does not return any value, only traverses the CST
thus the chain of returned values will be broken.

## Performance

On V8 (Chrome/Node) building the CST was measured at anywhere from 35%-90% of the performance
versus a pure grammar's runtime (no output) depending on the grammar used.
Particularly on its level of rules nesting.

This may be substantial yet please consider:

-   Chevrotain is already [very fast](https://sap.github.io/chevrotain/performance/)
    So at worst at will degrade to just "fast"...

-   This comparison is not fair as a pure grammar that has no output also has very little use...
    The right comparison would be to versus embedding actions that built some alternative CST/AST output structure.

-   Parsing is usually just one step in a larger flow, so the overall impact even in the slower edge cases
    would be reduced.

It is therefore recommended to use the CST creation capabilities
as its benefits (modularity / ease of maintenance) by far outweigh the costs (potentially reduced performance).
except in unique edge cases.
