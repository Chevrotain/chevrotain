# Getting Started With Lexing

### ---> [Try This Tutorial Online](http://sap.github.io/chevrotain/playground/?example=tutorial%20lexer) <---

### On code samples:
The code samples in the **written** tutorial use ES2015/2016 sytnax (classes/let/static class props)
As those better convey the intent. The **online** version uses ES5 syntax.

### Lets get started:
In This tutorial we will implement a Lexer for a simple SQL Select statement language:
 ```SQL
 SELECT column1 FROM table2
 SELECT name, age FROM persons WHERE age > 100
 ...
```

A Lexer transforms a string input into a [Token](https://github.com/SAP/chevrotain/blob/master/src/scan/tokens_public.ts#L61) vector.
Chevrotain comes with a built in Lexer engine based on Javascript Regular Expressions.
To use the Chevrotain lexer the Tokens must first be defined.
Lets examine the definition for a "FROM" Token:
 
```Typescript
 
class From extends Token {
  static PATTERN = /FROM/  
}
```
 
There is nothing much to it. The static **PATTERN** property is a RegExp which will be used when splitting up the input string
into separate Tokens.
 
#### What about a slightly more complex Tokens? 

How can we define Tokens for Identifiers or Integers?
 
```Typescript

class Identifier extends Token {
  static PATTERN = /\w+/  
}
 
class Integer extends Token {
  static PATTERN = /0|[1-9]\d+/  
}
```

#### What about skipping certain Tokens? 
The obvious use case in this language (and many others) is **whitespace**. skipping certain Tokens is easily
accomplished by marking them with the SKIP group.

```Typescript

class WhiteSpace extends Token {
  static PATTERN = /\s+/
  static GROUP = chevrotain.lexer.SKIPPED
}
```

#### Let us define all our nine Tokens:

```Typescript
 
class Select extends Token {
  static PATTERN = /SELECT/  
}
      
class From extends Token {
  static PATTERN = /FROM/  
}

class Where extends Token {
  static PATTERN = /WHERE/  
}

class Comma extends Token {
  static PATTERN = /,/  
}
  
class Identifier extends Token {
  static PATTERN = /\w+/  
}

class Integer extends Token {
  static PATTERN = /0|[1-9]\d+/  
}

class GreaterThan extends Token {
  static PATTERN = /0|[1-9]\d+/  
}

class LessThan extends Token {
  static PATTERN = />/  
}

class WhiteSpace extends Token {
  static PATTERN = /\s+/
  static GROUP = chevrotain.lexer.SKIPPED
}
 
```

#### Allright, we have Token definitions, how do we use them to create a Lexer?

```Typescript

let allTokens = [WhiteSpace, Select, From, Where, Comma, Identifier, Integer, GreaterThan, LessThan]
let SelectLexer = new Lexer(allTokens);

```

Note that:
* The **order** of Token definitions passed to the Lexer is **important**.
  The first PATTERN to match will be chosen not the longest.
  * See how to resolve [Keywords vs Identifiers](https://github.com/SAP/chevrotain/blob/master/examples/lexer/keywords_vs_identifiers.js)

* The SelectLexer is **stateless**, thus only a **single one** should be created.    
  
                            

#### But how do we actually use this lexer?

```Typescript
let inputText = "SELECT column1 FROM table2"
let lexingResult = SelectLexer.tokenize(inputText)
```

The Lexing Result will contain a Token Vector, the lexing errors (if any were encountered)
and other [Token groups](https://github.com/SAP/chevrotain/blob/master/examples/lexer/token_groups.js) (if grouping was used)

#### What is Next?
* Try out the **onine** version of [This Tutorial](http://sap.github.io/chevrotain/playground/?example=tutorial%20lexer)
* TBD move to the next phase, building a Parser for our mini SQL grammar.




