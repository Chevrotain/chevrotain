/*
 * Example Of using parametrized grammar rules.
 * An call to a sub grammar rule may supply an array of argument which will be used
 * in the invocation of the sub-rule.
 *
 * This example additionally displays the use of gates/predicates to control the grammar flow.
 *
 * The Parser in this example accepts a <mood> argument with the invocation of the <topRule>
 * This parameter is passed down to the <hello> rule where it is used to determine the possible grammar path.
 */
"use strict"

import { createToken, Lexer, CstParser } from "chevrotain"

// ----------------- lexer -----------------

const Hello = createToken({ name: "Hello", pattern: /hello/ })
const World = createToken({ name: "World", pattern: /world/ })

const Cruel = createToken({ name: "Cruel", pattern: /cruel/ })
const Bad = createToken({ name: "Bad", pattern: /bad/ })
const Evil = createToken({ name: "Evil", pattern: /evil/ })

const Good = createToken({ name: "Good", pattern: /good/ })
const Wonderful = createToken({ name: "Wonderful", pattern: /wonderful/ })
const Amazing = createToken({ name: "Amazing", pattern: /amazing/ })

const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED
})

const allTokens = [
  WhiteSpace,
  Hello,
  World,
  Cruel,
  Bad,
  Evil,
  Good,
  Wonderful,
  Amazing
]

const HelloLexer = new Lexer(allTokens)

// ----------------- parser -----------------
class HelloParser extends CstParser {
  constructor() {
    super(allTokens)

    const $ = this

    $.RULE("topRule", (mood) => {
      // Passing arguments via a SUBRULE is done using a config object
      $.SUBRULE($.hello, { ARGS: [mood] })
    })

    // the <hello> rule's implementation is defined with a <mood> parameter
    $.RULE("hello", (mood) => {
      $.CONSUME(Hello)

      // The mood parameter is used to determine which path to take
      $.OR([
        {
          GATE: () => mood === "positive",
          ALT: () => $.SUBRULE($.positive)
        },
        {
          GATE: () => mood === "negative",
          ALT: () => $.SUBRULE($.negative)
        }
      ])

      $.CONSUME(World)
    })

    $.RULE("negative", () => {
      $.OR([
        { ALT: () => $.CONSUME(Cruel) },
        { ALT: () => $.CONSUME(Bad) },
        { ALT: () => $.CONSUME(Evil) }
      ])
    })

    $.RULE("positive", () => {
      $.OR([
        { ALT: () => $.CONSUME(Good) },
        { ALT: () => $.CONSUME(Wonderful) },
        { ALT: () => $.CONSUME(Amazing) }
      ])
    })

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    this.performSelfAnalysis()
  }
}

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
const parser = new HelloParser()

module.exports = function (text, mood) {
  const lexResult = HelloLexer.tokenize(text)

  // setting a new input will RESET the parser instance's state.
  parser.input = lexResult.tokens

  const cst = parser.topRule(mood)

  return {
    cst: cst,
    lexErrors: lexResult.errors,
    parseErrors: parser.errors
  }
}
