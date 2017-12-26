# Tutorial Step 1 - Building a Lexer.

### ---> [Source Code](https://github.com/SAP/chevrotain/tree/master/docs/01_Tutorial/src/step1_lexing) for this step <---


### On code samples:
The tutorial uses ES2015+ syntax.
See examples of using Chevrotain in other [implementation languages](https://github.com/SAP/chevrotain/tree/master/examples/implementation_languages).


### Introduction:
In This tutorial we will implement a Lexer for a simple SQL Select statement language:
 ```SQL
 SELECT column1 FROM table2
 SELECT name, age FROM persons WHERE age > 100
 ...
```

A Lexer transforms a string input into a [Token](http://sap.github.io/chevrotain/documentation/1_0_0/interfaces/_chevrotain_d_.itoken.html) vector.
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

We will use the [**createToken** API](http://sap.github.io/chevrotain/documentation/1_0_0/modules/_chevrotain_d_.html#createtoken) 
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
         group: chevrotain.Lexer.SKIPPED,
         line_breaks: true
     });
```

* Note that we used the **line_breaks** property to flag that the WhiteSpace token may contain line terminators.
  This is needed by the lexer to keep track of line and column numbers.

#### Let us define all our nine Tokens:

```javascript

// We specify the "longer_alt" property to resolve keywords vs identifiers ambiguity.
// See: https://github.com/SAP/chevrotain/blob/master/examples/lexer/keywords_vs_identifiers/keywords_vs_identifiers.js
const Select = createToken({name: "Select", pattern: /SELECT/, longer_alt: Identifier});
const From = createToken({name: "From", pattern: /FROM/, longer_alt: Identifier});
const Where = createToken({name: "Where", pattern: /WHERE/, longer_alt: Identifier});

const Comma = createToken({name: "Comma", pattern: /,/});

const Identifier = createToken({name: "Identifier", pattern: /[a-zA-Z]\w*/});

const Integer = createToken({name: "Integer", pattern: /0|[1-9]\d*/});

const GreaterThan = createToken({name: "GreaterThan", pattern: /</});

const LessThan = createToken({name: "LessThan", pattern: />/});

const WhiteSpace = createToken({
        name: "WhiteSpace",
        pattern: /\s+/,
        group: chevrotain.Lexer.SKIPPED,
        line_breaks: true
    }); 
```


#### All right, we have Token definitions, how do we use them to create a Lexer?

```javascript

// note we are placing WhiteSpace first as it is very common thus it will speed up the lexer.
let allTokens = [
    WhiteSpace,
    // "keywords" appear before the Identifier
    Select, 
    From,
    Where,
    Comma,
    // The Identifier must appear after the keywords because all keywords are valid identifiers.
    Identifier, 
    Integer, 
    GreaterThan, 
    LessThan]
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
* Run & Debug the [source code](https://github.com/SAP/chevrotain/blob/master/docs/01_Tutorial/src/step1_lexing) of 
  this tutorial step.
* Move to the next step: [Step 2 - Parsing](./step2_parsing.md).
