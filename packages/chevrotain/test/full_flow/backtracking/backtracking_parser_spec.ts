import { expect } from "chai";
import { IToken } from "@chevrotain/types";
import {
  BackTrackingParser,
  ColonTok,
  DefaultTok,
  DotTok,
  ElementTok,
  EqualsTok,
  IdentTok,
  NumberTok,
  RET_TYPE,
  SemiColonTok,
} from "./backtracking_parser.js";
import { flatten } from "lodash-es";
import { createRegularToken } from "../../utils/matchers.js";

describe("Simple backtracking example", () => {
  let largeFqnTokenVector: IToken[];
  before(() => {
    // for side effect of augmenting the tokens metadata
    new BackTrackingParser();

    // TODO: modify example to use the Chevrotain Lexer to increase readability
    largeFqnTokenVector = [
      createRegularToken(IdentTok, "ns1"),
      createRegularToken(DotTok, "."),
      createRegularToken(IdentTok, "ns2"),
      createRegularToken(DotTok, "."),
      createRegularToken(IdentTok, "ns3"),
      createRegularToken(DotTok, "."),
      createRegularToken(IdentTok, "ns4"),
      createRegularToken(DotTok, "."),
      createRegularToken(IdentTok, "ns5"),
      createRegularToken(DotTok, "."),
      createRegularToken(IdentTok, "ns6"),
      createRegularToken(DotTok, "."),
      createRegularToken(IdentTok, "ns7"),
      createRegularToken(DotTok, "."),
      createRegularToken(IdentTok, "ns8"),
      createRegularToken(DotTok, "."),
      createRegularToken(IdentTok, "ns9"),
      createRegularToken(DotTok, "."),
      createRegularToken(IdentTok, "ns10"),
      createRegularToken(DotTok, "."),
      createRegularToken(IdentTok, "ns11"),
      createRegularToken(DotTok, "."),
      createRegularToken(IdentTok, "ns12"),
    ];
  });

  it("can parse an element with Equals and a very long qualified name", () => {
    const input: any = flatten([
      // element A:ns1.ns2.ns3.ns4.ns5.ns6.ns7.ns8.ns9.ns10.ns11.ns12 = 666;
      createRegularToken(ElementTok, "element"),
      createRegularToken(IdentTok, "A"),
      createRegularToken(ColonTok, ":"),
      largeFqnTokenVector,
      createRegularToken(EqualsTok, "="),
      createRegularToken(NumberTok, "666"),
      createRegularToken(SemiColonTok, ";"),
    ]);

    const parser = new BackTrackingParser();
    parser.input = input;
    const result = parser.statement();

    expect(parser.errors.length).to.equal(0);
    expect(result).to.equal(RET_TYPE.WITH_EQUALS);
  });

  it("can parse an element with Default and a very long qualified name", () => {
    const input: any = flatten([
      // element A:ns1.ns2.ns3.ns4.ns5.ns6.ns7.ns8.ns9.ns10.ns11.ns12 default 666;
      createRegularToken(ElementTok, "element"),
      createRegularToken(IdentTok, "A"),
      createRegularToken(ColonTok, ":"),
      largeFqnTokenVector,
      createRegularToken(DefaultTok, "default"),
      createRegularToken(NumberTok, "666"),
      createRegularToken(SemiColonTok, ";"),
    ]);

    const parser = new BackTrackingParser();
    parser.input = input;
    const result = parser.statement();

    expect(parser.errors.length).to.equal(0);
    expect(result).to.equal(RET_TYPE.WITH_DEFAULT);
  });
});
