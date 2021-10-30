import { Lexer } from "../../src/scan/lexer_public"
import { expect } from "chai"
import { SinonSpy } from "sinon"

let skipOnBrowser = describe
if (typeof window !== "undefined") {
  skipOnBrowser = <any>describe.skip
}

skipOnBrowser("Chevrotain's Lexer Init Performance Tracing", () => {
  let consoleLogSpy: SinonSpy

  beforeEach(() => {
    // @ts-ignore
    consoleLogSpy = sinon.spy(console, "log")
  })

  afterEach(() => {
    // @ts-ignore
    console.log.restore()
  })

  it("Will not trace with traceInitPerf = false", () => {
    new Lexer([], { traceInitPerf: false })

    expect(consoleLogSpy).to.have.not.been.called
  })

  it("Will trace nested with traceInitPerf = true", () => {
    new Lexer([], { traceInitPerf: true })

    expect(consoleLogSpy).to.have.been.called
    expect(consoleLogSpy.args[0][0]).to.include("--> <Lexer Constructor>")
    expect(consoleLogSpy.args[1][0]).to.include("\t--> <Lexer Config handling>")
  })

  it("Will trace one level with traceInitPerf = 1", () => {
    new Lexer([], { traceInitPerf: 1 })

    expect(consoleLogSpy).to.have.been.called
    expect(consoleLogSpy.args[0][0]).to.include("--> <Lexer Constructor>")
    expect(consoleLogSpy.args[1][0]).to.not.include("\t")
  })

  it("Will trace 2 levels with traceInitPerf = 2", () => {
    new Lexer([], { traceInitPerf: 2 })

    expect(consoleLogSpy).to.have.been.called
    expect(consoleLogSpy.args[0][0]).to.include("--> <Lexer Constructor>")
    expect(consoleLogSpy.args[1][0]).to.include("\t")
  })
})
