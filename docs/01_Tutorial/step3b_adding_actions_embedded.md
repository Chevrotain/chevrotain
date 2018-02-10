* Previous tutorial step - [Step 2 - Parsing](./step2_parsing.md)

# Tutorial Step 3 - Adding Embedded Actions to the Parser.


### ---> [Source Code](https://github.com/SAP/chevrotain/blob/master/examples/tutorial/step3_actions/step3b_actions_embedded.js) for this step <---


### On code samples:
The tutorial uses ES2015+ syntax.
See examples of using Chevrotain in other [implementation languages](https://github.com/SAP/chevrotain/tree/master/examples/implementation_languages).


### Introduction:
In the [previous](./step2_parsing.md) tutorial step
we have implemented a parser for a "mini" SQL Select grammar. The current problem is that our parser only
validates the input conforms to the grammar. In most real world use cases the parser will also have to output some 
result/data structure/value.

This can be accomplished using two features of the Parsing DSL:
* [CONSUME](http://sap.github.io/chevrotain/documentation/2_0_0/classes/parser.html#consume1) will return
  The [IToken](http://sap.github.io/chevrotain/documentation/2_0_0/interfaces/itoken.html) object consumed.
* [SUBRULE](http://sap.github.io/chevrotain/documentation/2_0_0/classes/parser.html#subrule1) will return
  the result of the grammar rule invoked.


### A simple contrived example:
  
```javascript
$.RULE("topRule", () => {
    let result = 0
    
    $.MANY(() => {
        $.OR([
            {ALT: () => { result += $.SUBRULE($.decimalRule)}},
            {ALT: () => { result += $.SUBRULE($.IntegerRule)}}
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


#### Back To the mini SQL Select grammar:
For this grammar lets build a more complex data structure (an AST) instead of simply returning a number.
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
        type         : "SELECT_STMT", 
        selectClause : select,
        fromClause   : from, 
        // may be undefined if the OPTION was not entered.
        whereClause  : where
    }
})
```

Three of those properties (selectClause / fromClause / whereClause) are the results of invoking
other parser rules.

Lets look at the "selectClause" rule implemntaiton:

```javascript
$.RULE("selectClause", () => {
    let columns = []
    
    $.CONSUME(Select);
    $.AT_LEAST_ONE_SEP({SEP:Comma, DEF:() => {
       // accessing a token's string via getImage utility
       columns.push($.CONSUME(Identifier).image)
    }})

    return {
        type    : "SELECT_CLAUSE", 
        columns : columns
    }
})
```

In the selectClause rule we access the **image** property of the Identifier token returned from **CONSUME** 
and push each of these strings to the **columns** array.


#### What is Next?
* Run & Debug the [source code](https://github.com/SAP/chevrotain/blob/master/examples/tutorial/step3_actions/step3b_actions_embedded.js) of 
  this tutorial step.
* Next step in the tutorial: [Step 4 - Fault Tolerance](./step4_fault_tolerance.md).
