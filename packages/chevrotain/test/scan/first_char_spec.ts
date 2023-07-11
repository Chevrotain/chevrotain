import { getRegExpAst } from "../../src/scan/reg_exp_parser.js";
import { firstCharOptimizedIndices } from "../../src/scan/reg_exp.js";
import { expect } from "chai";

describe("The Chevrotain Lexer First Char Optimization", () => {
  it("considers ignoreCase flag", () => {
    const ast = getRegExpAst(/a/i);
    const firstChars = firstCharOptimizedIndices(
      ast.value,
      {},
      ast.flags.ignoreCase
    );
    expect(firstChars).to.deep.equal([65, 97]);
  });

  it("considers ignoreCase in range", () => {
    const ast = getRegExpAst(/[a-b]/i);
    const firstChars = firstCharOptimizedIndices(
      ast.value,
      {},
      ast.flags.ignoreCase
    );
    expect(firstChars).to.deep.equal([65, 66, 97, 98]);
  });

  it("Handles Large CharCode ranges", () => {
    const ast = getRegExpAst(/[\u0100-\u04C4]/);
    const firstChars = firstCharOptimizedIndices(
      ast.value,
      {},
      ast.flags.ignoreCase
    );
    expect(firstChars).to.deep.equal([256, 257, 258, 259]);
  });

  it("Handles Large CharCode ranges #2", () => {
    const ast = getRegExpAst(/[\u00ff-\u04C4]/);
    const firstChars = firstCharOptimizedIndices(
      ast.value,
      {},
      ast.flags.ignoreCase
    );
    expect(firstChars).to.deep.equal([255, 256, 257, 258, 259]);
  });
});
