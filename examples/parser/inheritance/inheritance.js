/*
 * Example Of using Grammar complex grammar inheritance to implement
 * 'Structured natural language' supporting multiple 'spoken languages' using grammar inheritance.
 *
 * 1. An "Abstract" Base Grammar with two concrete grammars extending it.
 * 2. Each concrete grammar has a different lexer
 * 3. This also shows an example of using Token inheritance
 */

import { createToken, Lexer, CstParser } from "chevrotain"

// ----------------- lexer -----------------
const RelationWord = createToken({ name: "RelationWord", pattern: Lexer.NA })

// Token inheritance CONSUME(RelationWord) will work on any Token extending RelationWord
const And = createToken({
  name: "And",
  pattern: /and/,
  categories: RelationWord
})
const Before = createToken({
  name: "Before",
  pattern: /before/,
  categories: RelationWord
})
const After = createToken({
  name: "After",
  pattern: /after/,
  categories: RelationWord
})
const Und = createToken({
  name: "Und",
  pattern: /und/,
  categories: RelationWord
})
const Vor = createToken({
  name: "Vor",
  pattern: /vor/,
  categories: RelationWord
})
const Nach = createToken({
  name: "Nach",
  pattern: /nach/,
  categories: RelationWord
})

/// English Tokens
const Cook = createToken({ name: "Cook", pattern: /cooking|cook/ })
const Some = createToken({ name: "Some", pattern: /some/ })
const Sausages = createToken({ name: "Sausages", pattern: /sausages/ })
const Clean = createToken({ name: "Clean", pattern: /clean/ })
const The = createToken({ name: "The", pattern: /the/ })
const Room = createToken({ name: "Room", pattern: /room/ })

// German Tokens
const Kochen = createToken({ name: "Kochen", pattern: /kochen/ })
const Wurstchen = createToken({ name: "Wurstchen", pattern: /wurstchen/ })
const Wurst = createToken({ name: "Wurst", pattern: /wurst/ })
const Raum = createToken({ name: "Raum", pattern: /raum/ })
const Auf = createToken({ name: "Auf", pattern: /auf/ })
const Den = createToken({ name: "Den", pattern: /den/ })

const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED
})

const abstractTokens = [RelationWord]

const englishTokens = [
  WhiteSpace,
  RelationWord,
  And,
  Before,
  After,
  Cook,
  Some,
  Sausages,
  Clean,
  The,
  Room
]

const germanTokens = [
  WhiteSpace,
  RelationWord,
  Und,
  Vor,
  Nach,
  Kochen,
  Wurstchen,
  Wurst,
  Raum,
  Auf,
  Den
]

// We can define a different Lexer for each of the sub grammars.
const EnglishLexer = new Lexer(englishTokens)
const GermanLexer = new Lexer(germanTokens)

// ----------------- parser -----------------

// Extending the base chevrotain CstParser class
class AbstractCommandsParser extends CstParser {
  constructor(tokenVocabulary) {
    // combining the token vocabularies of parent and child.
    super(abstractTokens.concat(tokenVocabulary))

    const $ = this

    $.RULE("commands", () => {
      $.SUBRULE($.command)

      $.MANY(() => {
        $.CONSUME(RelationWord)
        $.SUBRULE2($.command)
      })
    })

    $.RULE("command", () => {
      // The cook and clean commands must be implemented in each sub grammar
      $.OR([
        { ALT: () => $.SUBRULE($.cookCommand) },
        { ALT: () => $.SUBRULE($.cleanCommand) }
      ])
    })

    // this is an "abstract" base grammar it should not be instantiated directly
    // therefor it does not invoke "performSelfAnalysis"
  }
}

class EnglishCommandsParser extends AbstractCommandsParser {
  constructor() {
    super(englishTokens)

    const $ = this

    // implementing the 'cookCommand' referenced in the AbstractCommandsParser
    $.RULE("cookCommand", () => {
      $.CONSUME(Cook)
      $.OPTION(() => {
        $.CONSUME(Some)
      })
      $.CONSUME(Sausages)
    })

    // implementing the 'cleanCommand' referenced in the AbstractCommandsParser
    $.RULE("cleanCommand", () => {
      $.CONSUME(Clean)
      $.CONSUME(The)
      $.CONSUME(Room)
    })

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    this.performSelfAnalysis()
  }
}

class GermanCommandsParser extends AbstractCommandsParser {
  constructor() {
    super(germanTokens)

    const $ = this

    // implementing the 'cookCommand' referenced in the AbstractCommandsParser
    $.RULE("cookCommand", () => {
      $.CONSUME(Kochen)
      $.OR([
        { ALT: () => $.CONSUME(Wurstchen) },
        { ALT: () => $.CONSUME(Wurst) }
      ])
    })

    // implementing the 'cleanCommand' referenced in the AbstractCommandsParser
    $.RULE("cleanCommand", () => {
      $.CONSUME(Raum)
      $.CONSUME(Den)
      $.CONSUME2(Raum)
      $.CONSUME(Auf)
    })

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    this.performSelfAnalysis()
  }
}

// ----------------- wrapping it all together -----------------

// reuse the same parser instances.
const englishParser = new EnglishCommandsParser()
const germanParser = new GermanCommandsParser()

module.exports = function (text, language) {
  // lex
  let lexer
  // match language and lexer.
  switch (language) {
    case "english":
      lexer = EnglishLexer
      break
    case "german":
      lexer = GermanLexer
      break
    default:
      throw Error("no valid language chosen")
  }

  const lexResult = lexer.tokenize(text)

  // parse
  let parser
  // match language and parser.
  switch (language) {
    case "english":
      parser = englishParser
      break
    case "german":
      parser = germanParser
      break
    default:
      throw Error("no valid language chosen")
  }

  // setting a new input will RESET the parser instance's state.
  parser.input = lexResult.tokens
  // any top level rule may be used as an entry point
  const cst = parser.commands()

  return {
    cst: cst,
    lexErrors: lexResult.errors,
    parseErrors: parser.errors
  }
}
