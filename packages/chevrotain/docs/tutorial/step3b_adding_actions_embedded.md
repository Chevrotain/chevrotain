# Tutorial - Semantics Embedded Actions

### TLDR

[Run and Debug the source code](https://github.com/SAP/chevrotain/tree/master/examples/tutorial/step3_actions/step3b_actions_embedded.js).

### Introduction

In the [previous](./step2_parsing.md) tutorial step
we have implemented a parser for a "mini" SQL Select grammar. The current problem is that our parser only
validates the input conforms to the grammar. In most real world use cases the parser will also have to output some
result/data structure/value.

This can be accomplished using two features of the Parsing DSL:

-   [CONSUME](https://sap.github.io/chevrotain/documentation/4_3_0/classes/parser.html#consume1) will return
    The [IToken](https://sap.github.io/chevrotain/documentation/4_3_0/interfaces/itoken.html) object consumed.
-   [SUBRULE](https://sap.github.io/chevrotain/documentation/4_3_0/classes/parser.html#subrule1) will return
    the result of the grammar rule invoked.

### Enabling embedded actions

For embedded actions to work as expected the automatic CST creation must first be disabled.
The CST creation is controlled by the **outputCst** flag of the parser [configuration object](https://sap.github.io/chevrotain/documentation/4_3_0/interfaces/iparserconfig.html).

```javascript
class SelectParserEmbedded extends Parser {
    constructor() {
        super(
            tokenVocabulary,
            // we have to explicitly disable the CST building for embedded actions to work.
            { outputCst: false }
        )
    }
}
```

Failing to disabled the CST creation would cause the Parser to return a CST of the grammar rule
we invoked instead of of the expected output structure we will be creating (an AST).

## Simple Example

Lets inspect a simple contrived example:

```javascript
$.RULE("topRule", () => {
    let result = 0

    $.MANY(() => {
        $.OR([
            {
                ALT: () => {
                    result += $.SUBRULE($.decimalRule)
                }
            },
            {
                ALT: () => {
                    result += $.SUBRULE($.IntegerRule)
                }
            }
        ])
    })

    return result
})

$.RULE("decimalRule", () => {
    const decimalToken = $.CONSUME(Decimal)
    return parseFloat(decimalToken.image)
})

$.RULE("IntegerRule", () => {
    const intToken = $.CONSUME(Integer)
    return parseInt(intToken.image)
})
```

The **decimalRule** and **IntegerRule** both return a javascript number (using parseInt/parseFloat).
and the **topRule** adds it to the final result.

## SQL Grammar

Lets go back to the mini SQL Select grammar.

For this grammar we will build a more complex data structure (an AST) instead of simply returning a number.
Our selectStatement rule will now return an object with four properties:

```javascript
$.RULE("selectStatement", () => {
    let select, from, where

    select = $.SUBRULE($.selectClause)
    from = $.SUBRULE($.fromClause)
    $.OPTION(() => {
        where = $.SUBRULE($.whereClause)
    })

    return {
        type: "SELECT_STMT",
        selectClause: select,
        fromClause: from,
        // may be undefined if the OPTION was not entered.
        whereClause: where
    }
})
```

Three of those properties (selectClause / fromClause / whereClause) are the results of invoking
other parser rules.

Lets look at the "selectClause" rule implemntaiton:

```javascript
$.RULE("selectClause", () => {
    let columns = []

    $.CONSUME(Select)
    $.AT_LEAST_ONE_SEP({
        SEP: Comma,
        DEF: () => {
            // accessing a token's string via getImage utility
            columns.push($.CONSUME(Identifier).image)
        }
    })

    return {
        type: "SELECT_CLAUSE",
        columns: columns
    }
})
```

In the selectClause rule we access the **image** property of the Identifier token returned from **CONSUME**
and push each of these strings to the **columns** array.
