import assert from "assert";
import { parseEmbedded } from "./calculator_embedded_actions.js";
import { parsePure } from "./calculator_pure_grammar.js";

describe("The Calculator Grammar", () => {
  context("Embedded Actions", () => {
    it("can calculate an expression", () => {
      assert.equal(parseEmbedded("1 + 2").value, 3);
    });

    it("can calculate an expression with operator precedence", () => {
      // if it was evaluated left to right without taking into account precedence the result would have been 9
      assert.equal(parseEmbedded("1 + 2 * 3").value, 7);
    });

    it("can calculate an expression with operator precedence #2", () => {
      assert.equal(parseEmbedded("(1 + 2) * 3").value, 9);
    });

    it("can calculate an expression with many parenthesis", () => {
      assert.equal(parseEmbedded("((((666))))").value, 666);
    });

    it("can calculate an expression with power function", () => {
      assert.equal(parseEmbedded("1 + power(2,2)").value, 5);
    });
  });

  context("Pure Grammar with Separated Semantics", () => {
    it("can calculate an expression", () => {
      assert.equal(parsePure("1 + 2").value, 3);
    });

    it("can calculate an expression with operator precedence", () => {
      // if it was evaluated left to right without taking into account precedence the result would have been 9
      assert.equal(parsePure("1 + 2 * 3").value, 7);
    });

    it("can calculate an expression with operator precedence #2", () => {
      assert.equal(parsePure("(1 + 2) * 3").value, 9);
    });

    it("can calculate an expression with many parenthesis", () => {
      assert.equal(parsePure("((((666))))").value, 666);
    });

    it("can calculate an expression with power function", () => {
      assert.equal(parsePure("1 + power(2,2)").value, 5);
    });
  });
});
