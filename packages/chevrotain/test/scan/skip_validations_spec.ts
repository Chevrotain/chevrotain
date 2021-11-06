import { Lexer } from "../../src/scan/lexer_public"
import flatten from "lodash/flatten"
import find from "lodash/find"
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
    const consoleArgs = flatten(consoleLogSpy.args)

    const runtimeChecksArg = find(consoleArgs, (item: string) =>
      /performRuntimeChecks/.test(item)
    )
    expect(runtimeChecksArg).to.not.be.undefined
    const warningRuntimeChecksAra = find(consoleArgs, (item: string) =>
      /performWarningRuntimeChecks/.test(item)
    )
    expect(warningRuntimeChecksAra).to.not.be.undefined
    const validateArg = find(consoleArgs, (item: string) =>
      /validatePatterns/.test(item)
    )
    expect(validateArg).to.not.be.undefined
  })

  it("Will avoid running lexer validations when `skipValidations` is enabled", () => {
    new Lexer([], { traceInitPerf: true, skipValidations: true })

    expect(consoleLogSpy).to.have.been.called
    const consoleArgs = flatten(consoleLogSpy.args)

    const runtimeChecksArg = find(consoleArgs, (item: string) =>
      /performRuntimeChecks/.test(item)
    )
    expect(runtimeChecksArg).to.be.undefined
    const warningRuntimeChecksAra = find(consoleArgs, (item: string) =>
      /performWarningRuntimeChecks/.test(item)
    )
    expect(warningRuntimeChecksAra).to.be.undefined
    const validateArg = find(consoleArgs, (item: string) =>
      /validatePatterns/.test(item)
    )
    expect(validateArg).to.be.undefined
  })
})
