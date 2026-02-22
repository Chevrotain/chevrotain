import assert from "assert";
import { parseBooleanExpression } from "./boolean_expression.js";

describe("The Boolean Expression Grammar", () => {
  it("can parse a simple variable", () => {
    const input = "A";
    const result = parseBooleanExpression(input);

    assert.equal(result.lexErrors.length, 0);
    assert.equal(result.parseErrors.length, 0);
  });

  it("can parse boolean literals", () => {
    const input = "TRUE AND FALSE";
    const result = parseBooleanExpression(input);

    assert.equal(result.lexErrors.length, 0);
    assert.equal(result.parseErrors.length, 0);
  });

  it("can parse AND expressions", () => {
    const input = "A AND B AND C";
    const result = parseBooleanExpression(input);

    assert.equal(result.lexErrors.length, 0);
    assert.equal(result.parseErrors.length, 0);
  });

  it("can parse OR expressions", () => {
    const input = "A OR B OR C";
    const result = parseBooleanExpression(input);

    assert.equal(result.lexErrors.length, 0);
    assert.equal(result.parseErrors.length, 0);
  });

  it("can parse NOT expressions", () => {
    const input = "NOT A";
    const result = parseBooleanExpression(input);

    assert.equal(result.lexErrors.length, 0);
    assert.equal(result.parseErrors.length, 0);
  });

  it("can parse double NOT (recursive prefix operator)", () => {
    const input = "NOT NOT A";
    const result = parseBooleanExpression(input);

    assert.equal(result.lexErrors.length, 0);
    assert.equal(result.parseErrors.length, 0);
  });

  it("can parse a complex expression with precedence", () => {
    // Parsed as: (A AND (NOT B)) OR C
    const input = "A AND NOT B OR C";
    const result = parseBooleanExpression(input);

    assert.equal(result.lexErrors.length, 0);
    assert.equal(result.parseErrors.length, 0);
  });

  it("can parse parenthesized sub-expressions", () => {
    const input = "(A OR B) AND (C OR D)";
    const result = parseBooleanExpression(input);

    assert.equal(result.lexErrors.length, 0);
    assert.equal(result.parseErrors.length, 0);
  });

  it("can parse nested parentheses", () => {
    const input = "NOT (A AND (B OR C))";
    const result = parseBooleanExpression(input);

    assert.equal(result.lexErrors.length, 0);
    assert.equal(result.parseErrors.length, 0);
  });

  it("does not confuse keywords with variable prefixes", () => {
    // "ANDROID" should be a Variable, not "AND" + "ROID"
    // "ORDER" should be a Variable, not "OR" + "DER"
    // "NOTHING" should be a Variable, not "NOT" + "HING"
    const input = "ANDROID AND ORDER OR NOTHING";
    const result = parseBooleanExpression(input);

    assert.equal(result.lexErrors.length, 0);
    // If the keywords were confused with variable prefixes, there would be parsing errors
    // due to an expression starting with "AND"(roid)
    assert.equal(result.parseErrors.length, 0);
  });
});
