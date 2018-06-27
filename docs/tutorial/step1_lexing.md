# Tutorial - Lexer

### TLDR

[Run and Debug the source code](https://github.com/SAP/chevrotain/tree/master/examples/tutorial/step1_lexing).

## Introduction

In This tutorial we will implement a Lexer for a simple SQL Select statement language:

```sql
SELECT column1 FROM table2
SELECT name, age FROM persons WHERE age > 100
...
```

A Lexer transforms a string input into a [Token](https://sap.github.io/chevrotain/documentation/3_7_0/interfaces/itoken.html) vector.
Chevrotain has a built in Lexer engine based on Javascript Regular Expressions.

## Our First Token

To use the Chevrotain lexer the Tokens must first be defined.
Lets examine the definition for a "FROM" Token:

```javascript
const createToken = chevrotain.createToken
// using createToken API
const From = createToken({ name: "From", pattern: /FROM/ })
```

There is nothing much to it. The pattern property is a RegExp which will be used when splitting up the input string
into separate Tokens.

We will use the [**createToken** API](https://sap.github.io/chevrotain/documentation/3_7_0/globals.html#createtoken)
in the rest of tutorial because ES2015 has no support for static fields.

## More complex Tokens

How can we define Tokens for Identifiers or Integers?

```javascript
const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })

const Integer = createToken({ name: "Integer", pattern: /0|[1-9]\d+/ })
```

## Skipping Tokens

The obvious use case in this language (and many others) is **whitespace**. skipping certain Tokens is easily
accomplished by marking them with the SKIP group.

```javascript
const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: chevrotain.Lexer.SKIPPED
})
```

## All Our Tokens

Lets examine all the needed Tokens definitions"

```javascript
const Identifier = createToken({ name: "Identifier", pattern: /[a-zA-Z]\w*/ })
// We specify the "longer_alt" property to resolve keywords vs identifiers ambiguity.
// See: https://github.com/SAP/chevrotain/blob/master/examples/lexer/keywords_vs_identifiers/keywords_vs_identifiers.js
const Select = createToken({
    name: "Select",
    pattern: /SELECT/,
    longer_alt: Identifier
})
const From = createToken({
    name: "From",
    pattern: /FROM/,
    longer_alt: Identifier
})
const Where = createToken({
    name: "Where",
    pattern: /WHERE/,
    longer_alt: Identifier
})

const Comma = createToken({ name: "Comma", pattern: /,/ })

const Integer = createToken({ name: "Integer", pattern: /0|[1-9]\d*/ })

const GreaterThan = createToken({ name: "GreaterThan", pattern: />/ })

const LessThan = createToken({ name: "LessThan", pattern: /</ })

const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: chevrotain.Lexer.SKIPPED
})
```

## Creating The Lexer

We now have Token definitions, but how do we create a Lexer from these?

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
    LessThan
]
let SelectLexer = new Lexer(allTokens)
```

Note that:

-   The **order** of Token definitions passed to the Lexer is **important**.
    The first PATTERN to match will be chosen not the longest.

    -   See how to resolve [Keywords vs Identifiers](https://github.com/SAP/chevrotain/blob/master/examples/lexer/keywords_vs_identifiers/keywords_vs_identifiers.js)

-   The Chevrotain Lexer is **stateless**, thus only a **single one per grammar** should ever be created.

## Using The Lexer

```javascript
let inputText = "SELECT column1 FROM table2"
let lexingResult = SelectLexer.tokenize(inputText)
```

The Lexing Result will contain:

1.  A Token Vector.
2.  the lexing errors (if any were encountered)
3.  And other [Token groups](https://github.com/SAP/chevrotain/blob/master/examples/lexer/token_groups/token_groups.js) (if grouping was used)
