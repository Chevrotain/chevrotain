/**
 * Type-safety regression tests for the Parsing DSL public API.
 *
 * Strategy: Each test contains a `@ts-expect-error` directive that suppresses
 * a type error that only exists **after** the corresponding type improvement
 * has been applied.
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
      expect(result).to.equal(1);
      // Compile-time guard: result must be `number | string`, not `any`.
      // If OR returned `any` this assignment would be silently valid and the
      // directive would become "unused" (TS2578), breaking the build.
      // @ts-expect-error  Type 'number | string' is not assignable to type 'boolean'
      const _assertNotAny: boolean = result;
      void _assertNotAny;
    });

    it("returns the value from the matched alternative (MinusTok → 'hello')", () => {
      parser.input = [createRegularToken(MinusTok)];
      const result = parser.orRule();
      expect(parser.errors).to.be.empty;
      expect(result).to.equal("hello");
      // @ts-expect-error  Type 'number | string' is not assignable to type 'boolean'
      const _assertNotAny: boolean = result;
      void _assertNotAny;
    });
  });

  // ===========================================================================
  // Step 2 — BACKTRACK: args tied to grammarRule's parameter types
  // ===========================================================================

  describe("BACKTRACK args type safety", () => {
    let PlusTok: TokenType;
    let parser: BacktrackTypeParser;

    class BacktrackTypeParser extends EmbeddedActionsParser {
      constructor() {
        super([PlusTok]);
        this.performSelfAnalysis();
      }

      public paramRule = this.RULE("paramRule", (x?: number) => {
        this.CONSUME(PlusTok);
        return x ?? 0;
      });

      // Compile-time guard: `args` must match paramRule's parameter types.
      // Before the fix args was `any[]` so `["wrong"]` was silently valid.
      // After the fix ARGS is inferred as `[x?: number]`, so `["wrong"]` is
      // a type error — suppressed here so the build stays green.
      //
      // BACKTRACK is protected so this must live inside the class body.
      // The call is a safe no-op at runtime: BACKTRACK returns a closure
      // without invoking the rule.
      private readonly _backtrackArgTypeCheck = this.BACKTRACK(
        this.paramRule,
        // @ts-expect-error  Type 'string' is not assignable to type 'number | undefined'
        ["wrong"],
      );
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

  // ===========================================================================
  // Step 5 — OR object form: union return type inference for { DEF: [...] }
  // ===========================================================================

  describe("OR({DEF: [...]}) object form union return type inference", () => {
    let PlusTok: TokenType;
    let MinusTok: TokenType;
    let parser: OrObjectFormParser;

    class OrObjectFormParser extends EmbeddedActionsParser {
      constructor() {
        super([PlusTok, MinusTok]);
        this.performSelfAnalysis();
      }

      public orWithOptsRule = this.RULE("orWithOptsRule", () => {
        return this.OR({
          DEF: [
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
          ],
          ERR_MSG: "expected plus or minus",
        });
      });
    }

    before(() => {
      PlusTok = createToken({ name: "OROBJ_PlusTok" });
      MinusTok = createToken({ name: "OROBJ_MinusTok" });
      parser = new OrObjectFormParser();
    });

    it("returns the value from the matched alternative (PlusTok → 1)", () => {
      parser.input = [createRegularToken(PlusTok)];
      const result = parser.orWithOptsRule();
      expect(parser.errors).to.be.empty;
      expect(result).to.equal(1);
      // Compile-time guard: same as Step 1 but for the object form.
      // @ts-expect-error  Type 'number | string' is not assignable to type 'boolean'
      const _assertNotAny: boolean = result;
      void _assertNotAny;
    });

    it("returns the value from the matched alternative (MinusTok → 'hello')", () => {
      parser.input = [createRegularToken(MinusTok)];
      const result = parser.orWithOptsRule();
      expect(parser.errors).to.be.empty;
      expect(result).to.equal("hello");
      // @ts-expect-error  Type 'number | string' is not assignable to type 'boolean'
      const _assertNotAny: boolean = result;
      void _assertNotAny;
    });
  });
});
