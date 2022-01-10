import { GenerateDtsOptions } from "@chevrotain/types"
import { generateCstDts } from "../src/api"
import { CstParser, createToken } from "chevrotain"
import { expect } from "chai"

describe("The DTS generator", () => {
  it("can generate nothing", () => {
    const result = genDts({
      includeTypes: false,
      includeVisitorInterface: false
    })

    expect(result).to.equal("")
  })

  it("can generate only cst types", () => {
    const result = genDts({
      includeTypes: true,
      includeVisitorInterface: false
    })

    expect(result).to.not.include("export interface ICstNodeVisitor")
    expect(result).to.include("export interface TestRuleCstNode")
    expect(result).to.include("export type TestRuleCstChildren")
  })

  it("can generate only cst visitor", () => {
    const result = genDts({
      includeTypes: false,
      includeVisitorInterface: true
    })

    expect(result).to.include("export interface ICstNodeVisitor")
    expect(result).to.not.include("export interface TestRuleCstNode")
    expect(result).to.not.include("export type TestRuleCstChildren")
  })

  it("can generate a cst visitor with specific name", () => {
    const result = genDts({
      includeTypes: false,
      includeVisitorInterface: true,
      visitorInterfaceName: "ITestCstVisitor"
    })

    expect(result).to.include("export interface ITestCstVisitor")
    expect(result).to.not.include("export interface ICstNodeVisitor")
  })

  function genDts(options: GenerateDtsOptions) {
    const parser = new TestParser()
    const productions = parser.getGAstProductions()
    return generateCstDts(productions, options)
  }
})

const TestToken = createToken({
  name: "TestToken",
  pattern: /TESTTOKEN/
})

class TestParser extends CstParser {
  constructor() {
    super([TestToken])

    this.performSelfAnalysis()
  }

  testRule = this.RULE("testRule", () => {
    this.CONSUME(TestToken)
  })
}
