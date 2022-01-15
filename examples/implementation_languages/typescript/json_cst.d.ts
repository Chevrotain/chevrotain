import type { CstNode, ICstVisitor, IToken } from "chevrotain";

export interface JsonCstNode extends CstNode {
  name: "json";
  children: JsonCstChildren;
}

export type JsonCstChildren = {
  object?: ObjectCstNode[];
  array?: ArrayCstNode[];
};

export interface ObjectCstNode extends CstNode {
  name: "object";
  children: ObjectCstChildren;
}

export type ObjectCstChildren = {
  LCurly: IToken[];
  objectItem?: ObjectItemCstNode[];
  Comma?: IToken[];
  RCurly: IToken[];
};

export interface ObjectItemCstNode extends CstNode {
  name: "objectItem";
  children: ObjectItemCstChildren;
}

export type ObjectItemCstChildren = {
  StringLiteral: IToken[];
  Colon: IToken[];
  value: ValueCstNode[];
};

export interface ArrayCstNode extends CstNode {
  name: "array";
  children: ArrayCstChildren;
}

export type ArrayCstChildren = {
  LSquare: IToken[];
  value?: ValueCstNode[];
  Comma?: IToken[];
  RSquare: IToken[];
};

export interface ValueCstNode extends CstNode {
  name: "value";
  children: ValueCstChildren;
}

export type ValueCstChildren = {
  StringLiteral?: IToken[];
  NumberLiteral?: IToken[];
  object?: ObjectCstNode[];
  array?: ArrayCstNode[];
  True?: IToken[];
  False?: IToken[];
  Null?: IToken[];
};

export interface ICstNodeVisitor<IN, OUT> extends ICstVisitor<IN, OUT> {
  json(children: JsonCstChildren, param?: IN): OUT;
  object(children: ObjectCstChildren, param?: IN): OUT;
  objectItem(children: ObjectItemCstChildren, param?: IN): OUT;
  array(children: ArrayCstChildren, param?: IN): OUT;
  value(children: ValueCstChildren, param?: IN): OUT;
}
