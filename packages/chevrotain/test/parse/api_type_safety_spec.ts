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

// ===========================================================================
// Step 1 — OR array form: union return type inference (Issue #1986)
// ===========================================================================

describe("API type safety", () => {
  describe("OR([...] element union return type inference)", () => {
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
        // Should be inferred as `number | string` (not `any`).
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

    let PlusTok: TokenType;
    let MinusTok: TokenType;
    let parser: OrUnionTypeParser;

    // Avoid API calls in case this test is skipped
    // By wrapping token creation in a before() hook
    before(() => {
      PlusTok = createToken({ name: "PlusTok" });
      MinusTok = createToken({ name: "MinusTok" });
      parser = new OrUnionTypeParser();
    });

    it("returns the value from the matched alternative (PlusTok → 1)", () => {
      parser.input = [createRegularToken(PlusTok)];
      const result = parser.orRule();
      expect(parser.errors).to.be.empty;
      expect(result).to.be.a("number");
      expect(result).to.equal(1);

      /**
       * Compile-time assertion: the result of OR must be `number | string`.
       * Assigning it to `boolean` is a type error — which we suppress with
       * @ts-expect-error.  If OR returned `any` this assignment would be
       * silently valid and the directive would become "unused", breaking the
       * build.
       */
      // @ts-expect-error
      const boolean: boolean = result;
    });

    it("returns the value from the matched alternative (MinusTok → 'hello')", () => {
      parser.input = [createRegularToken(MinusTok)];
      const result = parser.orRule();
      expect(parser.errors).to.be.empty;
      expect(result).to.be.a("string");
      expect(result).to.equal("hello");

      /**
       * Same as above `it` block: compile-time assertion that the result of OR is `number | string`.
       */
      // @ts-expect-error
      const boolean: boolean = result;
    });
  });
});
