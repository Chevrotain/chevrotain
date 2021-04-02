import type { CstNode, ICstVisitor, IToken } from "chevrotain";

export interface TestRuleCstNode extends CstNode {
  name: "testRule";
  children: TestRuleCstChildren;
}

export type TestRuleCstChildren = {
  Token1: IToken[];
  Token2: IToken[];
  Comma?: IToken[];
};

export interface ICstNodeVisitor<IN, OUT> extends ICstVisitor<IN, OUT> {
  testRule(children: TestRuleCstChildren, param?: IN): OUT;
}