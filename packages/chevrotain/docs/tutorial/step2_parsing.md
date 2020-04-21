# Tutorial - Parser

### TLDR

[Run and Debug the source code](https://github.com/SAP/chevrotain/tree/master/examples/tutorial/step2_parsing).

## Introduction

In this tutorial we will implement a Parser for a simple SQL Select statement language
introduced in the [previous](./step1_lexing.md) tutorial step.
Note that this parse will only **recognize** the language and not
output any data structure (yet).

The grammar for our language:

```antlr
selectStatement
   : selectClause fromClause (whereClause)?

selectClause
   : "SELECT" Identifier ("," Identifier)*

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

A Chevrotain Parser analyses an [IToken](https://sap.github.io/chevrotain/documentation/7_0_1/interfaces/itoken.html) vector that conforms to some grammar.
The grammar is defined using the [parsing DSL](https://sap.github.io/chevrotain/documentation/7_0_1/classes/cstparser.html#at_least_one), which includes the following methods.

- [CONSUME](https://sap.github.io/chevrotain/documentation/7_0_1/classes/cstparser.html#consume) - 'eat' a Token.
- [SUBRULE](https://sap.github.io/chevrotain/documentation/7_0_1/classes/cstparser.html#subrule) - reference to another rule.
- [OR](https://sap.github.io/chevrotain/documentation/7_0_1/classes/cstparser.html#or) - Alternation
- [OPTION](https://sap.github.io/chevrotain/documentation/7_0_1/classes/cstparser.html#option) - optional production.
- [MANY](https://sap.github.io/chevrotain/documentation/7_0_1/classes/cstparser.html#many) - repetition zero or more.
- [AT_LEAST_ONE](https://sap.github.io/chevrotain/documentation/7_0_1/classes/cstparser.html#at_least_one) - repetition one or more.
- [MANY_SEP](https://sap.github.io/chevrotain/documentation/7_0_1/classes/cstparser.html#many_sep) - repetition (zero or more) with a separator between any two items
- [AT_LEAST_ONE_SEP](https://sap.github.io/chevrotain/documentation/7_0_1/classes/cstparser.html#at_least_one_sep) - repetition (one or more) with a separator between any two items

## First Rule

Let's implement our first grammar rule.

```javascript
// selectStatement
//    : selectClause fromClause (whereClause)?;

const $ = this
$.RULE("selectStatement", () => {
  $.SUBRULE($.selectClause)
  $.SUBRULE($.fromClause)
  $.OPTION(() => {
    $.SUBRULE($.whereClause)
  })
})
```

Fairly straight forward translation:

- Non-Terminals --> SUBRULE
- "?" --> OPTION

## Structure

- What is 'this' in this context?
- where do we write the grammar rules?

Each grammar rule is a property of a class that extends chevrotain.CstParser.

```javascript
const { CstParser } = require("chevrotain")
const allTokens = [
  WhiteSpace,
  Select,
  From,
  Where,
  Comma,
  Identifier,
  Integer,
  GreaterThan,
  LessThan
]

class SelectParser extends CstParser {
  constructor() {
    super(allTokens)

    const $ = this

    $.RULE("selectStatement", () => {
      $.SUBRULE($.selectClause)
      $.SUBRULE($.fromClause)
      $.OPTION(() => {
        $.SUBRULE($.whereClause)
      })
    })

    this.performSelfAnalysis()
  }
}
```

Important to note that:

- The **super** invocation has an array of the Tokens as the second parameter.
  This is the same array we used to define the Lexer and it is used to define the Parser's vocabulary.
- The method **performSelfAnalysis** must be invoked at the end of the constructor.
  This is where much of the 'secret sauce' happens, including creating the inner grammar representation
  and performing static checks on the grammar.

## More Rules

Let's look at two more grammar rule, this time with repetition and alternation.

```javascript
$.RULE("selectClause", () => {
  $.CONSUME(Select)
  $.AT_LEAST_ONE_SEP({
    SEP: Comma,
    DEF: () => {
      $.CONSUME(Identifier)
    }
  })
})

// atomicExpression
//    : INTEGER | IDENTIFIER
$.RULE("atomicExpression", () => {
  $.OR([
    { ALT: () => $.CONSUME(Integer) },
    { ALT: () => $.CONSUME(Identifier) }
  ])
})
```

## Debugging

- How can the Parser be debugged?

The grammar rules above do not only define the grammar, they are also the code that will be run
during parsing. This means that you can debug the parser **simply by adding a break
point in the grammar**.

```javascript
// selectClause
//   : "SELECT" IDENTIFIER ("," IDENTIFIER)*;
$.RULE("selectClause", () => {
  $.CONSUME(Select)
  // Can be debugged directly! no code generation.
  debugger
  $.AT_LEAST_ONE_SEP({
    SEP: Comma,
    DEF: () => {
      $.CONSUME(Identifier)
    }
  })
})
```

There **do not** exist two different representations for the grammar
and the runnable implementation (for example, grammar file vs generated code in the case of parser generators).
Again, please note that Chevrotain is **NOT** a parser generator.
Extra details can be found [in the FAQ](https://sap.github.io/chevrotain/docs/FAQ.html#VS_GENERATORS).

## Under The Hood

- But how does it work? (skip if you don't care :) )

The code above will be executed as is. Yet we have not implemented a lookahead function to
choose between the two OR alternatives `( INTEGER | IDENTIFIER)`,
nor have we implemented logic to identify the next iteration for `("," IDENTIFIER)*`.
So how does it work?

The answer is the 'secret sauce' of Chevrotain:

- `$.RULE` will both:
  - Analyse (using Function.toString) the implementation passed to it and construct a representation of the grammar in memory.
  - Wrap the implementation passed to it in logic for running the Parser (fault tolerance/rule stacks/...)
- `Parser.prototype.performSelfAnalysis(this)` will finish 'compiling' the grammar representation (name resolution/static analysis)

So when the parser needs to choose between the two alternatives:

```javascript
$.OR([
  {
    ALT: () => {
      $.CONSUME(Integer)
    }
  },
  {
    ALT: () => {
      $.CONSUME(Identifier)
    }
  }
])
```

It is aware of:

- Where it is (`OR [1] INSIDE_RULE [A] INSIDE_RULE [B] ...`)
- What Tokens can come next for each alternative, as it "is aware" of the whole grammar representation.

Thus the parser can dynamically create (and cache) the lookahead function to choose between the two alternatives.

The same applies for any grammar rule where the parser has a choice,
and even in some where there is no choice as that same in memory representation of the grammar
can be used for error messages and fault tolerance as well as deciding which path to take.

## Complete Parser

Let's finish implementing the whole SelectParser:

```javascript
const { CstParser } = require("chevrotain")
const allTokens = [
  WhiteSpace,
  Select,
  From,
  Where,
  Comma,
  Identifier,
  Integer,
  GreaterThan,
  LessThan
]

class SelectParser extends CstParser {
  constructor() {
    super(allTokens)

    const $ = this

    $.RULE("selectStatement", () => {
      $.SUBRULE($.selectClause)
      $.SUBRULE($.fromClause)
      $.OPTION(() => {
        $.SUBRULE($.whereClause)
      })
    })

    $.RULE("selectClause", () => {
      $.CONSUME(Select)
      $.AT_LEAST_ONE_SEP({
        SEP: Comma,
        DEF: () => {
          $.CONSUME(Identifier)
        }
      })
    })

    $.RULE("fromClause", () => {
      $.CONSUME(From)
      $.CONSUME(Identifier)
    })

    $.RULE("whereClause", () => {
      $.CONSUME(Where)
      $.SUBRULE($.expression)
    })

    // The "rhs" and "lhs" (Right/Left Hand Side) labels will provide easy
    // to use names during CST Visitor (step 3a).
    $.RULE("expression", () => {
      $.SUBRULE($.atomicExpression, { LABEL: "lhs" })
      $.SUBRULE($.relationalOperator)
      $.SUBRULE2($.atomicExpression, { LABEL: "rhs" }) // note the '2' suffix to distinguish
      // from the 'SUBRULE(atomicExpression)'
      // 2 lines above.
    })

    $.RULE("atomicExpression", () => {
      $.OR([
        { ALT: () => $.CONSUME(Integer) },
        { ALT: () => $.CONSUME(Identifier) }
      ])
    })

    $.RULE("relationalOperator", () => {
      $.OR([
        { ALT: () => $.CONSUME(GreaterThan) },
        { ALT: () => $.CONSUME(LessThan) }
      ])
    })

    this.performSelfAnalysis()
  }
}
```

- Note that as a consequence of the parser having to 'know' its position in the grammar during runtime, the Parsing DSL methods need to be distinguishable when appearing in the same rule.
  Thus in the `"expression"` rule above, the second appearance of `SUBRULE` with `atomicExpression` parameter has a '2' suffix: `$.SUBRULE2($.atomicExpression)`
- Such errors will be detected during self analysis, and will prevent the creation of parser instances with a descriptive error message (fail fast...).

## Usage

- But how do we actually use this Parser?

```javascript
// ONLY ONCE
const parser = new SelectParser()

function parseInput(text) {
  const lexingResult = SelectLexer.tokenize(text)
  // "input" is a setter which will reset the parser's state.
  parser.input = lexingResult.tokens
  parser.selectStatement()

  if (parser.errors.length > 0) {
    throw new Error("sad sad panda, Parsing errors detected")
  }
}

const inputText = "SELECT column1 FROM table2"
parseInput(inputText)
```

- Note that any of the grammar rules can be invoked as the starting rule.
  There is no 'special' top level entry rule.
