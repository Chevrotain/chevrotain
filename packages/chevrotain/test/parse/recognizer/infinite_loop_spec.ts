import { Parser } from "../../../src/parse/parser/traits/parser_traits"
import { createRegularToken } from "../../utils/matchers"
import { augmentTokenTypes } from "../../../src/scan/tokens"
import { IToken } from "../../../api"
import { createToken } from "../../../src/scan/tokens_public"

describe("The Recognizer's capabilities for detecting infinite loops", () => {
  class PlusTok {
    static PATTERN = /\+/
  }
  augmentTokenTypes(<any>[PlusTok])

  it("Will gracefully 'escape' from an infinite loop in a repetition", () => {
    class InfiniteLoopParser extends Parser {
      constructor(input: IToken[] = []) {
        super([PlusTok])

        this.performSelfAnalysis()
        this.input = input
      }

      counter = 0
      public loop = this.RULE("loop", () => {
        this.MANY(() => {
          // By returning without consuming any tokens we could
          // cause an infinite loop as the looahead for re-entering the `MANY`
          // would still be true.
          if (this.counter > 0) {
            // A bit of a hack to skip over the `return` once
            // So the Grammar Recording will process the grammar correctly
            // Otherwise a different error would occur
            // (detection of empty repetition at GAST level).
            return
          }
          this.counter++
          this.CONSUME(PlusTok)
        })
      })
    }

    const parser = new InfiniteLoopParser()
    parser.input = [createRegularToken(PlusTok)]
    const parseResult = parser.loop()
    expect(parser.errors[0].message).to.match(
      /Redundant input, expecting EOF but found/
    )
  })

  it("Will gracefully 'escape' from an infinite loop in a repetition issue #956", () => {
    const Semi = createToken({ name: "Semi", pattern: /;/, label: ";" })
    const A = createToken({ name: "A", pattern: /A/i })
    const B = createToken({ name: "B", pattern: /B/i })
    const C = createToken({ name: "C", pattern: /C/i })

    const allTokens = [Semi, A, B, C]

    class InfParser extends Parser {
      constructor() {
        super(allTokens, {
          recoveryEnabled: true
        })

        this.performSelfAnalysis()
      }

      public block = this.RULE("block", () => {
        this.MANY(() => {
          this.SUBRULE(this.command)
        })
      })

      public command = this.RULE("command", () => {
        this.OR([
          { ALT: () => this.SUBRULE(this.ab) },
          { ALT: () => this.SUBRULE(this.ac) }
        ])
        this.CONSUME(Semi)
      })

      public ab = this.RULE("ab", () => {
        this.CONSUME(A)
        this.CONSUME(B)
      })

      public ac = this.RULE("ac", () => {
        this.CONSUME(A)
        this.CONSUME(C)
      })
    }

    const parser = new InfParser()
    parser.input = [createRegularToken(A)]
    const parseResult = parser.block()
    expect(parser.errors[0].message).to.match(
      /Expecting: one of these possible Token sequences:/
    )
    expect(parser.errors[0].message).to.match(/[A, B]/)
    expect(parser.errors[0].message).to.match(/[A, C]/)
  })
})
