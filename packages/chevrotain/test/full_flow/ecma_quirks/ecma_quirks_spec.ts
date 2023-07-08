import { expect } from "chai";
import { parse } from "./ecma_quirks.js";

describe("ECMAScript Quirks Example (ScannerLess Mode)", () => {
  it("can parse a valid text successfully", () => {
    const result = parse("return ;");
    expect(result.errors).to.be.empty;
  });

  it("can parse a valid text successfully #2", () => {
    const result = parse("return 1;");
    expect(result.errors).to.be.empty;
  });

  it("can parse a valid text successfully #3 - Division", () => {
    const result = parse("return 8 / 2 ;");
    expect(result.errors).to.be.empty;
  });

  it("can parse a valid text successfully #3 - RegExp", () => {
    const result = parse("return /123/ ;");
    expect(result.errors).to.be.empty;
  });

  it("can parse a valid text successfully #3 - RegExp and Division", () => {
    const result = parse("return /123/ / 5 ;");
    expect(result.errors).to.be.empty;
  });
});
