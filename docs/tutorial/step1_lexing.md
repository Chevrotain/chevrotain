# Tutorial Step 1 - Building a Lexer.

### ---> [Online demo of this tutorial step](http://sap.github.io/chevrotain/playground/?example=tutorial%20lexer) <---


### On code samples:
The code samples in the **written** tutorial use ES2015+ for clarity. 
The **online demo** version uses ES5 syntax.


### Introduction:
In This tutorial we will implement a Lexer for a simple SQL Select statement language:
 ```SQL
 SELECT column1 FROM table2
 SELECT name, age FROM persons WHERE age > 100
 ...
```

A Lexer transforms a string input into a [Token](http://sap.github.io/chevrotain/documentation/0_27_3/interfaces/_chevrotain_d_.itoken.html) vector.
Chevrotain has a built in Lexer engine based on Javascript Regular Expressions.
To use the Chevrotain lexer the Tokens must first be defined.
Lets examine the definition for a "FROM" Token:

```javascript
const createToken = chevrotain.createToken
// using createToken API
const From = createToken({name: "From", pattern: /FROM/});

// Using Class syntax 
class From extends Token {}
// manually creating static fields as those are not yet supported in ES2015
From.PATTERN = /FROM/
```
 
There is nothing much to it. The pattern/PATTERN property is a RegExp which will be used when splitting up the input string
into separate Tokens.

We will use the [**createToken** API](http://sap.github.io/chevrotain/documentation/0_27_3/modules/_chevrotain_d_.html#createtoken) 
in the rest of tutorial because ES2015 has no support for static fields.
 
 

#### What about a slightly more complex Tokens? 

How can we define Tokens for Identifiers or Integers?
 
```javascript
const Identifier = createToken({name: "Identifier", pattern: /\w+/});

const Integer = createToken({name: "Integer", pattern: /0|[1-9]\d+/});
```


#### What about skipping certain Tokens? 
The obvious use case in this language (and many others) is **whitespace**. skipping certain Tokens is easily
accomplished by marking them with the SKIP group.

```javascript
const WhiteSpace = createToken({
     name: "WhiteSpace", 
     pattern: /\s+/,
     group: chevrotain.lexer.SKIPPED  
     });
```


#### Let us define all our nine Tokens:

```javascript

const Select = createToken({name: "Select", pattern: /SELECT/});

const From = createToken({name: "From", pattern: /FROM/});

const Where = createToken({name: "Where", pattern: /WHERE/});

const Comma = createToken({name: "Comma", pattern: /,/});

const Identifier = createToken({name: "Identifier", pattern: /\w+/});

const Integer = createToken({name: "Integer", pattern: /0|[1-9]\d+/});

const GreaterThan = createToken({name: "GreaterThan", pattern: /</});

const LessThan = createToken({name: "LessThan", pattern: />/});

const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: chevrotain.lexer.SKIPPED
    }); 
```


#### All right, we have Token definitions, how do we use them to create a Lexer?

```javascript

let allTokens = [WhiteSpace, Select, From, Where, Comma, Identifier, Integer, GreaterThan, LessThan]
let SelectLexer = new Lexer(allTokens);

```

Note that:
* The **order** of Token definitions passed to the Lexer is **important**.
  The first PATTERN to match will be chosen not the longest.
  * See how to resolve [Keywords vs Identifiers](https://github.com/SAP/chevrotain/blob/master/examples/lexer/keywords_vs_identifiers/keywords_vs_identifiers.js)

* The Chevrotain Lexer is **stateless**, thus only a **single one per grammar** should ever be created.
                          

#### But how do we actually use this lexer?

```javascript
let inputText = "SELECT column1 FROM table2"
let lexingResult = SelectLexer.tokenize(inputText)
```

The Lexing Result will contain: 
1. A Token Vector.
2. the lexing errors (if any were encountered)
3. And other [Token groups](https://github.com/SAP/chevrotain/blob/master/examples/lexer/token_groups/token_groups.js) (if grouping was used)


#### What is Next?
* Try out the [Online demo of this tutorial step](http://sap.github.io/chevrotain/playground/?example=tutorial%20lexer) of this tutorial
* Move to the next step: [Step 2 -  Parsing](https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step2_parsing.md).
