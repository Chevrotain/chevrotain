import { createToken } from "../../../src/scan/tokens_public"
import {
  CstParser,
  EmbeddedActionsParser
} from "../../../src/parse/parser/traits/parser_traits"

let skipOnBrowser = describe
if (typeof window !== "undefined") {
  skipOnBrowser = <any>describe.skip
}

skipOnBrowser("Chevrotain's Init Performance Tracing", () => {
  let consoleLogSpy

  beforeEach(() => {
    // @ts-ignore
    consoleLogSpy = sinon.spy(console, "log")
  })

  afterEach(() => {
    // @ts-ignore
    console.log.restore()
  })

  const PlusTok = createToken({ name: "PlusTok" })

  class TraceParser extends EmbeddedActionsParser {
    constructor(traceInitVal) {
      super([PlusTok], {
        traceInitPerf: traceInitVal
      })
      this.performSelfAnalysis()
    }

    public topRule = this.RULE("topRule", () => {
      this.CONSUME(PlusTok)
    })
  }

  it("Will not trace with traceInitPerf = false", () => {
    new TraceParser(false)

    expect(consoleLogSpy).to.have.not.been.called
  })

  it("Will trace nested with traceInitPerf = true", () => {
    new TraceParser(true)

    expect(consoleLogSpy).to.have.been.called
    expect(consoleLogSpy.args[0][0]).to.include("--> <performSelfAnalysis>")
    expect(consoleLogSpy.args[1][0]).to.include("\t--> <toFastProps>")
  })

  it("Will trace one level with traceInitPerf = 1", () => {
    new TraceParser(1)

    expect(consoleLogSpy).to.have.been.called
    expect(consoleLogSpy.args[0][0]).to.include("--> <performSelfAnalysis>")
    expect(consoleLogSpy.args[1][0]).to.not.include("\t")
  })

  it("Will trace 2 levels with traceInitPerf = 2", () => {
    new TraceParser(2)

    expect(consoleLogSpy).to.have.been.called
    expect(consoleLogSpy.args[0][0]).to.include("--> <performSelfAnalysis>")
    expect(consoleLogSpy.args[1][0]).to.include("\t")
  })
})
