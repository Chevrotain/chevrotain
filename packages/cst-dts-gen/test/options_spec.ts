import { generateCstDts, GenerateDtsOptions } from "../src/api"
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

    expect(result).to
      .equal(`import type { CstNode, ICstVisitor, IToken } from "chevrotain";

export interface TestRuleCstNode extends CstNode {
  name: "testRule";
  children: TestRuleCstChildren;
}

export type TestRuleCstChildren = {
  TestToken: IToken[];
};`)
  })

  it("can generate only cst visitor", () => {
    const result = genDts({
      includeTypes: false,
      includeVisitorInterface: true
    })

    expect(result).to
      .equal(`import type { CstNode, ICstVisitor, IToken } from "chevrotain";

export interface ICstNodeVisitor<IN, OUT> extends ICstVisitor<IN, OUT> {
  testRule(children: TestRuleCstChildren, param?: IN): OUT;
}`)
  })

  it("can generate a cst visitor with specific name", () => {
    const result = genDts({
      includeTypes: false,
      includeVisitorInterface: true,
      visitorInterfaceName: "ITestCstVisitor"
    })

    expect(result).to
      .equal(`import type { CstNode, ICstVisitor, IToken } from "chevrotain";

export interface ITestCstVisitor<IN, OUT> extends ICstVisitor<IN, OUT> {
  testRule(children: TestRuleCstChildren, param?: IN): OUT;
}`)
  })

  function genDts(options: GenerateDtsOptions) {
    const parser = new TestParser()
    return generateCstDts(parser, options)
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
