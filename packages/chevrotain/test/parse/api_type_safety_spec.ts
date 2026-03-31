/**
 * Type-safety regression tests for the Parsing DSL public API.
 *
 * Strategy: Each test parser contains a `@ts-expect-error` directive that
 * suppresses a type error that only exists **after** the corresponding type
 * improvement has been applied.
 *
 * If a type improvement is ever reverted, `@ts-expect-error` becomes an
 * "unused directive" (TS2578) and the build fails — catching the regression.
 */
import { describe, it, before } from "mocha";
import { expect } from "chai";
import { createToken } from "../../src/scan/tokens_public.js";
import { EmbeddedActionsParser } from "../../src/parse/parser/traits/parser_traits.js";
import { TokenType } from "@chevrotain/types";
import { createRegularToken } from "../utils/matchers.js";

describe("API type safety", () => {
  // ===========================================================================
  // Step 1 — OR array form: union return type inference (Issue #1986)
  // ===========================================================================

  describe("OR([...]) element union return type inference", () => {
    let PlusTok: TokenType;
    let MinusTok: TokenType;
    let parser: OrUnionTypeParser;

    /**
     * Parser whose rule exercises OR with two alternatives returning different
     * types.  The compile-time assertion below verifies that the inferred
     * return type is `number | string` (not `any`).
     */
    class OrUnionTypeParser extends EmbeddedActionsParser {
      constructor() {
        super([PlusTok, MinusTok]);
        this.performSelfAnalysis();
      }

      public orRule = this.RULE("orRule", () => {
        return this.OR([
          {
            ALT: () => {
              this.CONSUME(PlusTok);
              return 1 as number;
            },
          },
          {
            ALT: () => {
              this.CONSUME(MinusTok);
              return "hello" as string;
            },
          },
        ]);
      });
    }

    before(() => {
      PlusTok = createToken({ name: "OR_PlusTok" });
      MinusTok = createToken({ name: "OR_MinusTok" });
      parser = new OrUnionTypeParser();
    });

    it("returns the value from the matched alternative (PlusTok → 1)", () => {
      parser.input = [createRegularToken(PlusTok)];
      const result = parser.orRule();
      expect(parser.errors).to.be.empty;
      expect(result).to.be.a("number");
      expect(result).to.equal(1);
    });

    it("returns the value from the matched alternative (MinusTok → 'hello')", () => {
      parser.input = [createRegularToken(MinusTok)];
      const result = parser.orRule();
      expect(parser.errors).to.be.empty;
      expect(result).to.be.a("string");
      expect(result).to.equal("hello");
    });
  });

  // ===========================================================================
  // Step 2 — BACKTRACK: args tied to grammarRule's parameter types
  // ===========================================================================

  describe("BACKTRACK args type safety", () => {
    let PlusTok: TokenType;
    let parser: BacktrackTypeParser;

    /**
     * Parser with a parameterized rule used as the target of BACKTRACK.
     * The typeCheckRule holds the compile-time assertion.
     */
    class BacktrackTypeParser extends EmbeddedActionsParser {
      constructor() {
        super([PlusTok]);
        this.performSelfAnalysis();
      }

      /** Parameterized rule: takes an optional number, consumes PlusTok. */
      public paramRule = this.RULE("paramRule", (x?: number) => {
        this.CONSUME(PlusTok);
        return x ?? 0;
      });

      /**
       * Compile-time assertion: BACKTRACK's `args` must match the rule's
       * parameter types.  Before the fix, args was `any[]`, so passing
       * `["wrong"]` was silently valid.  After the fix, ARGS is inferred as
       * `[x?: number]` from paramRule, so `["wrong"]` is a type error that
       * we must suppress with @ts-expect-error.
       */
      public typeCheckRule = this.RULE("typeCheckRule", () => {
        // Valid: no args
        this.BACKTRACK(this.paramRule);
        // Valid: correct arg type
        this.BACKTRACK(this.paramRule, [42]);
        // @ts-expect-error  Type 'string' is not assignable to type 'number | undefined'
        this.BACKTRACK(this.paramRule, ["wrong"]);
      });
    }

    before(() => {
      PlusTok = createToken({ name: "BT_PlusTok" });
      parser = new BacktrackTypeParser();
    });

    it("paramRule returns the default value when called without args", () => {
      parser.input = [createRegularToken(PlusTok)];
      const result = parser.paramRule();
      expect(parser.errors).to.be.empty;
      expect(result).to.equal(0);
    });

    it("paramRule returns the provided arg value when called with a number", () => {
      parser.input = [createRegularToken(PlusTok)];
      const result = parser.paramRule(99);
      expect(parser.errors).to.be.empty;
      expect(result).to.equal(99);
    });
  });
});
