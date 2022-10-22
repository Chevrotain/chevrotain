import { Lexer } from "../../src/scan/lexer_public"
import { expect } from "chai"
import { SinonSpy } from "sinon/index"

describe("Chevrotain's Lexer Init Performance Tracing", () => {
  let consoleLogSpy: SinonSpy

  beforeEach(() => {
    // @ts-ignore
    consoleLogSpy = sinon.spy(console, "log")
  })

  afterEach(() => {
    // @ts-ignore
    console.log.restore()
  })

  it("Will not skipValidation by default", () => {
    new Lexer([], { traceInitPerf: true })

    expect(consoleLogSpy).to.have.been.called
    const consoleArgs = ([] as string[]).concat(...consoleLogSpy.args)

    const runtimeChecksArg = consoleArgs.find((item: string) =>
      /performRuntimeChecks/.test(item)
    )
    expect(runtimeChecksArg).to.not.be.undefined
    const warningRuntimeChecksAra = consoleArgs.find((item: string) =>
      /performWarningRuntimeChecks/.test(item)
    )
    expect(warningRuntimeChecksAra).to.not.be.undefined
    const validateArg = consoleArgs.find((item: string) =>
      /validatePatterns/.test(item)
    )
    expect(validateArg).to.not.be.undefined
  })

  it("Will avoid running lexer validations when `skipValidations` is enabled", () => {
    new Lexer([], { traceInitPerf: true, skipValidations: true })

    expect(consoleLogSpy).to.have.been.called
    const consoleArgs = ([] as string[]).concat(...consoleLogSpy.args)

    const runtimeChecksArg = consoleArgs.find((item: string) =>
      /performRuntimeChecks/.test(item)
    )
    expect(runtimeChecksArg).to.be.undefined
    const warningRuntimeChecksAra = consoleArgs.find((item: string) =>
      /performWarningRuntimeChecks/.test(item)
    )
    expect(warningRuntimeChecksAra).to.be.undefined
    const validateArg = consoleArgs.find((item: string) =>
      /validatePatterns/.test(item)
    )
    expect(validateArg).to.be.undefined
  })
})
