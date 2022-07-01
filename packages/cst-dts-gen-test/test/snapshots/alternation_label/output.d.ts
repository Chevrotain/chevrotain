import type { CstNode, ICstVisitor, IToken } from "chevrotain";

export interface TestRuleCstNode extends CstNode {
  name: "testRule";
  children: TestRuleCstChildren;
}

export type TestRuleCstChildren = {
  item?: (OtherRule1CstNode | IToken)[];
};

export interface OtherRule1CstNode extends CstNode {
  name: "otherRule1";
  children: OtherRule1CstChildren;
}

export type OtherRule1CstChildren = {
  Token2: IToken[];
};

export interface ICstNodeVisitor<IN, OUT> extends ICstVisitor<IN, OUT> {
  testRule(children: TestRuleCstChildren, param?: IN): OUT;
  otherRule1(children: OtherRule1CstChildren, param?: IN): OUT;
}
