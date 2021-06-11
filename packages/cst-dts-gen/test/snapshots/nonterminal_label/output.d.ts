import type { CstNode, ICstVisitor, IToken } from "chevrotain";

export interface TestRuleCstNode extends CstNode {
  name: "testRule";
  children: TestRuleCstChildren;
}

export type TestRuleCstChildren = {
  Token1: IToken[];
  otherRule: OtherRuleCstNode[];
  labeled: OtherRuleCstNode[];
};

export interface OtherRuleCstNode extends CstNode {
  name: "otherRule";
  children: OtherRuleCstChildren;
}

export type OtherRuleCstChildren = {
  Token1: IToken[];
};

export interface ICstNodeVisitor<IN, OUT> extends ICstVisitor<IN, OUT> {
  testRule(children: TestRuleCstChildren, param?: IN): OUT;
  otherRule(children: OtherRuleCstChildren, param?: IN): OUT;
}
