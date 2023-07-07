import { createToken, Lexer } from "chevrotain"

// numbers Tokens
const One = createToken({ name: "One", pattern: /1/ })
const Two = createToken({ name: "Two", pattern: /2/ })
const Three = createToken({ name: "Three", pattern: /3/ })

// Letter Tokens
const Alpha = createToken({ name: "Alpha", pattern: /A/ })
const Beta = createToken({ name: "Beta", pattern: /B/ })
const Gamma = createToken({ name: "Gamma", pattern: /G/ })

// signs Tokens
const Hash = createToken({ name: "Hash", pattern: /#/ })
const Caret = createToken({ name: "Caret", pattern: /\^/ })
const Amp = createToken({ name: "Amp", pattern: /&/ })

// Tokens which control entering a new mode.
const EnterNumbers = createToken({
  name: "EnterNumbers",
  pattern: /NUMBERS/,
  push_mode: "numbers_mode"
})

const EnterLetters = createToken({
  name: "EnterLetters",
  pattern: /LETTERS/,
  push_mode: "letter_mode"
})

const EnterSigns = createToken({
  name: "EnterSigns",
  pattern: /SIGNS/,
  push_mode: "signs_mode"
})

// Tokens which control exiting modes
const ExitNumbers = createToken({
  name: "ExitNumbers",
  pattern: /EXIT_NUMBERS/,
  pop_mode: true
})

const ExitLetter = createToken({
  name: "ExitLetter",
  pattern: /EXIT_LETTERS/,
  pop_mode: true
})

const ExitSigns = createToken({
  name: "ExitSigns",
  pattern: /EXIT_SIGNS/,
  pop_mode: true
})

const Whitespace = createToken({
  name: "Whitespace",
  pattern: /(\t| )/,
  group: Lexer.SKIPPED
})

// Each key defines a Lexer mode's name.
// And each value is an array of Tokens which are valid in this Lexer mode.
const multiModeLexerDefinition = {
  modes: {
    numbers_mode: [
      One,
      Two,
      Three,
      ExitNumbers, // encountering an ExitNumbers Token will cause the lexer to revert to the previous mode
      EnterLetters, // switch to "letter_mode" after encountering "ENTER_Letter" while in "numbers_mode"
      Whitespace
    ],
    letter_mode: [
      Alpha,
      Beta,
      Gamma,
      ExitLetter, // encountering an ExitNumbers Token will cause the lexer to revert to the previous mode
      EnterSigns, // switch to "signs_mode" after encountering "ENTER_SIGNS" while in "numbers_mode"
      Whitespace
    ],
    signs_mode: [
      Hash,
      Caret,
      Amp,
      ExitSigns, // encountering an ExitSigns Token will cause the lexer to revert to the previous mode
      EnterNumbers, // switch to "numbers_mode" after encountering "ENTER_NUMBERS" while in "signs_mode"
      Whitespace
    ]
  },

  defaultMode: "numbers_mode"
}

// Our new lexer now support 3 different modes
// To mode switching logic works by using a mode stack and pushing and popping modes.
// using the PUSH_MODE and POP_MODE static properties defined on the Token classes
export const multiModeLexer = new Lexer(multiModeLexerDefinition)
