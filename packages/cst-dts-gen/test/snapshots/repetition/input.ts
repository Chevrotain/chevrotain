import { createToken, CstParser } from "chevrotain"

const Token1 = createToken({
  name: "Token1",
  pattern: /TOKEN1/
})

const Token2 = createToken({
  name: "Token2",
  pattern: /TOKEN2/
})

class TestParser extends CstParser {
  constructor() {
    super([Token1, Token2])

    this.performSelfAnalysis()
  }

  testRule = this.RULE("testRule", () => {
    this.MANY(() => {
      this.CONSUME(Token1)
      this.CONSUME(Token2)
    })
  })
}

export const parser = new TestParser()
