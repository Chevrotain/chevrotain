* Previous tutorial step - [Step 2 - Parsing](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step2_parsing.md)

# Tutorial Step 3 - Adding Actions to the Parser.


### ---> [Try This Tutorial Online](http://sap.github.io/chevrotain/playground/?example=tutorial%20actions) <---


### On code samples:
The code samples in the **written** tutorial use ES2015/2016/Typescript syntax (classes/let/static class props)
As those better convey the intent. The **online** version uses ES5 syntax.


### Introduction:
In the [previous](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step2_parsing.md) tutorial step
we have implemented a parser for a "mini" SQL Select grammar. The problem however that our parser only
validates the input conforms to the grammar. In most real world use cases the parser will also have to output some 
result/data structure/value.

This can be accomplished using two features of the Parsing DSL:
* [CONSUME](http://sap.github.io/chevrotain/documentation/0_13_2/classes/parser.html#consume1) will return
  The [Token](http://sap.github.io/chevrotain/documentation/0_13_2/classes/token.html) instance consumed.
* [SUBRULE](http://sap.github.io/chevrotain/documentation/0_13_2/classes/parser.html#subrule1) will return
  the result on invoking the rule.


### A simple contrived example:
  
```Typescript
this.topRule = $.RULE("topRule", () => {
    let result = 0
    
    $.MANY(() => {
        $.OR([
            {ALT: () => { result += $.SUBRULE($.decimalRule)}},
            {ALT: () => { result += $.SUBRULE($.IntegerRule)}}
            ])
    }
    
    return result
})
   
this.decimalRule = $.RULE("decimalRule", () => {
    let decToken = $.CONSUME(Decimal)
    return parseFloat(decimalToken.image)
  
})

this.IntegerRule = $.RULE("IntegerRule", () => {
    let intToken = $.CONSUME(Integer)
    return parseInt(intToken.image)
})
```

The **decimalRule** and **IntegerRule** both return a javascript number (using parseInt/parseFloat).
and the **topRule** adds it to the final result.


#### Back To the mini SQL Select grammar:
For this parser lets build a more complex data structure instead of simply returning a number.
Our selectStatement rule will now return an object with four properties:
 
```Typescript
this.selectStatement = $.RULE("selectStatement", () => {
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
        whereClause  : where
    }
})
```

Three of those properties (selectClause / fromClause / whereClause) are the results of invoking
other parser rules.

Lets look at one of those sub rules:

```Typescript
this.selectClause = $.RULE("selectClause", () => {
    let columns = []
    
    $.CONSUME(Select);
    $.AT_LEAST_ONE_SEP(Comma, () => {
    // accessing a token's string via .image property
    columns.push($.CONSUME(Identifier).image)
    }, "column name")

    return {
        type    : "SELECT_CLAUSE", 
        columns : columns
    }
})
```

In the selectClause rule we access the **image** property of the Identifier token
returned from **CONSUME**, and push each of these strings to the **columns** array. 


#### What is Next?
* Play around in the [**onine** version](http://sap.github.io/chevrotain/playground/?example=tutorial%20actions) of This tutorial.
* Next step in the tutorial: [Step 4 - Fault Tolerance](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step4_fault_tolerance.md).
