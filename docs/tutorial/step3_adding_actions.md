* Previous tutorial step - [Step 2 - Parsing](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step2_parsing.md)

# Tutorial Step 3 - Adding Actions to the Parser.


### ---> [Try This Tutorial Online](http://sap.github.io/chevrotain/playground/?example=tutorial%20actions) <---


### On code samples:
The code samples in the **written** tutorial use ES2015/2016/Typescript syntax (classes/let/static class props)
As those better convey the intent. The **online** version uses ES5 syntax.


### Introduction:
In the [previous](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step2_parsing.md) tutorial step
we have implemented a parser for a "mini" SQL Select grammar. The current problem is that our parser only
validates the input conforms to the grammar, in other words it is just a recognizer. But in most real world use cases the parser will **also** have to output some result/data structure/value.

This can be accomplished using two features of the Parsing DSL:
* [CONSUME](http://sap.github.io/chevrotain/documentation/0_27_3/classes/_chevrotain_d_.parser.html#consume1) will return
  The [Token](http://sap.github.io/chevrotain/documentation/0_27_3/classes/_chevrotain_d_.token.html) instance consumed.
* [SUBRULE](http://sap.github.io/chevrotain/documentation/0_27_3/classes/_chevrotain_d_.parser.html#subrule1) will return
  the result on invoking the subrule.


### A simple contrived example:
  
```Typescript
$.RULE("topRule", () => {
    let result = 0
    
    $.MANY(() => {
        $.OR([
            {ALT: () => { result += $.SUBRULE($.decimalRule)}},
            {ALT: () => { result += $.SUBRULE($.IntegerRule)}}
            ])
    }
    
    return result
})
   
$.RULE("decimalRule", () => {
    let decToken = $.CONSUME(Decimal)
    return parseFloat(decimalToken.image)
  
})

$.RULE("IntegerRule", () => {
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
        whereClause  : where
    }
})
```

Three of those properties (selectClause / fromClause / whereClause) are the results of invoking
other parser rules.

Lets look at one of those sub rules:

```Typescript

$.RULE("selectClause", () => {
    let columns = []
    
    $.CONSUME(Select);
    $.AT_LEAST_ONE_SEP({SEP:Comma, DEF:() => {
       columns.push($.CONSUME(Identifier).image)
    }})

    return {
        type    : "SELECT_CLAUSE", 
        columns : columns
    }
})
```

In the selectClause rule we access the **image** property of the Identifier **Token** returned from **CONSUME** utility. and push each of these strings to the **columns** array. We then return an AST node which includes the columns array and a **type** property.


#### What is Next?
* Play around in the [**onine** version](http://sap.github.io/chevrotain/playground/?example=tutorial%20actions) of This tutorial.
* Next step in the tutorial: [Step 4 - Fault Tolerance](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step4_fault_tolerance.md).
