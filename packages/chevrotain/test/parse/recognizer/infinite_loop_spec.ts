import {
  EmbeddedActionsParser,
  CstParser
} from "../../../src/parse/parser/traits/parser_traits"
import { createRegularToken } from "../../utils/matchers"
import { augmentTokenTypes } from "../../../src/scan/tokens"
import { IToken } from "@chevrotain/types"
import { createToken } from "../../../src/scan/tokens_public"
import { EMPTY_ALT } from "../../../src/parse/parser/parser"
import { expect } from "chai"

describe("The Recognizer's capabilities for detecting / handling infinite loops", () => {
  it("Will gracefully 'escape' from an infinite loop in a repetition", () => {
    class PlusTok {
      static PATTERN = /\+/
    }
    augmentTokenTypes(<any>[PlusTok])

    class InfiniteLoopParser extends EmbeddedActionsParser {
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

    class InfParser extends EmbeddedActionsParser {
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

  it("Will enter an infinite loop during parser initialization when there is an empty alternative inside nested repetitionn", () => {
    // ----------------- lexer -----------------
    const Comma = createToken({ name: "Comma", pattern: /,/ })
    const Comma2 = createToken({ name: "Comma", pattern: /,/ })

    const allTokens = [Comma]

    class NestedManyEmptyAltBugParser extends CstParser {
      constructor() {
        super(allTokens)
        this.performSelfAnalysis()
      }

      public A = this.RULE("A", () => {
        this.MANY(() => {
          this.SUBRULE(this.B)
        })
      })

      public B = this.RULE("B", () => {
        this.MANY(() => {
          this.SUBRULE(this.C)
        })
      })

      public C = this.RULE("C", () => {
        this.OR([
          { ALT: () => this.CONSUME(Comma) },
          {
            ALT: EMPTY_ALT()
          }
        ])
      })
    }

    expect(() => new NestedManyEmptyAltBugParser()).to.not.throw()
  })
})
