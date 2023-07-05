import { Lexer } from "../../src/scan/lexer_public.js"
import { find, flatten } from "lodash-es"
import { expect } from "chai"
import { SinonSpy, spy } from "sinon"

describe("Chevrotain's Lexer Init Performance Tracing", () => {
  let consoleLogSpy: SinonSpy

  beforeEach(() => {
    consoleLogSpy = spy(console, "log")
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
