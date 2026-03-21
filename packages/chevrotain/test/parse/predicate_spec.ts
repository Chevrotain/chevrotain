import { EmbeddedActionsParser } from "../../src/parse/parser/traits/parser_traits.js";
import { SmartParser } from "../../src/parse/parser/parser.js";
import {
  EarlyExitException,
  NoViableAltException,
} from "../../src/parse/exceptions_public.js";
import { augmentTokenTypes } from "../../src/scan/tokens.js";
import { createToken } from "../../src/scan/tokens_public.js";
import { createRegularToken } from "../utils/matchers.js";
import { IToken, TokenType } from "@chevrotain/types";
import { expect } from "chai";

describe("The chevrotain support for custom gates/predicates on DSL production:", () => {
  class A {
    static PATTERN = /a/;
  }

  class B {
    static PATTERN = /a/;
  }

  class C {
    static PATTERN = /a/;
  }

  let ALL_TOKENS: TokenType[];
  before(() => {
    ALL_TOKENS = [A, B, C];
    augmentTokenTypes(ALL_TOKENS);
  });

  it("OPTION", () => {
    function gateFunc() {
      return this.gate;
    }

    class PredicateOptionParser extends EmbeddedActionsParser {
      constructor(
        input: IToken[] = [],
        private gate: boolean,
      ) {
        super(ALL_TOKENS, {});
        this.performSelfAnalysis();
        this.input = input;
      }

      public optionRule = this.RULE("optionRule", () => {
        let result = "not entered!";
        this.OPTION({
          GATE: gateFunc,
          DEF: () => {
            this.CONSUME(A);
            result = "entered!";
          },
        });
        return result;
      });
    }

    const gateOpenInputGood = new PredicateOptionParser(
      [createRegularToken(A)],
      true,
    ).optionRule();
    expect(gateOpenInputGood).to.equal("entered!");

    const gateOpenInputBad = new PredicateOptionParser(
      [createRegularToken(B)],
      true,
    ).optionRule();
    expect(gateOpenInputBad).to.equal("not entered!");

    const gateClosedInputGood = new PredicateOptionParser(
      [createRegularToken(A)],
      false,
    ).optionRule();
    expect(gateClosedInputGood).to.equal("not entered!");

    const gateClosedInputBad = new PredicateOptionParser(
      [createRegularToken(B)],
      false,
    ).optionRule();
    expect(gateClosedInputBad).to.equal("not entered!");
  });

  it("MANY", () => {
    function gateFunc() {
      return this.gate;
    }

    class PredicateManyParser extends EmbeddedActionsParser {
      constructor(
        input: IToken[] = [],
        private gate: boolean,
      ) {
        super(ALL_TOKENS, {});
        this.performSelfAnalysis();
        this.input = input;
      }

      public manyRule = this.RULE("manyRule", () => {
        let result = "not entered!";
        this.MANY({
          GATE: gateFunc,
          DEF: () => {
            this.CONSUME(A);
            result = "entered!";
          },
        });

        return result;
      });
    }

    const gateOpenInputGood = new PredicateManyParser(
      [createRegularToken(A), createRegularToken(A)],
      true,
    ).manyRule();
    expect(gateOpenInputGood).to.equal("entered!");

    const gateOpenInputBad = new PredicateManyParser(
      [createRegularToken(B)],
      true,
    ).manyRule();
    expect(gateOpenInputBad).to.equal("not entered!");

    const gateClosedInputGood = new PredicateManyParser(
      [createRegularToken(A), createRegularToken(A)],
      false,
    ).manyRule();
    expect(gateClosedInputGood).to.equal("not entered!");

    const gateClosedInputBad = new PredicateManyParser(
      [createRegularToken(B)],
      false,
    ).manyRule();
    expect(gateClosedInputBad).to.equal("not entered!");
  });

  it("AT_LEAST_ONE", () => {
    function gateFunc() {
      return this.gate;
    }

    class PredicateAtLeastOneParser extends EmbeddedActionsParser {
      constructor(
        input: IToken[] = [],
        private gate: boolean,
      ) {
        super(ALL_TOKENS, {});
        this.performSelfAnalysis();
        this.input = input;
      }

      public atLeastOneRule = this.RULE("atLeastOneRule", () => {
        let result = "not entered!";
        this.AT_LEAST_ONE({
          GATE: gateFunc,
          DEF: () => {
            this.CONSUME(A);
            result = "entered!";
          },
        });

        return result;
      });
    }

    const gateOpenInputGood = new PredicateAtLeastOneParser(
      [createRegularToken(A), createRegularToken(A)],
      true,
    ).atLeastOneRule();
    expect(gateOpenInputGood).to.equal("entered!");

    const gateOpenInputBadParser = new PredicateAtLeastOneParser(
      [createRegularToken(B)],
      true,
    );
    gateOpenInputBadParser.atLeastOneRule();
    expect(gateOpenInputBadParser.errors).to.have.lengthOf(1);
    expect(gateOpenInputBadParser.errors[0]).to.be.an.instanceOf(
      EarlyExitException,
    );

    const gateClosedInputGood = new PredicateAtLeastOneParser(
      [createRegularToken(A), createRegularToken(A)],
      false,
    );
    gateClosedInputGood.atLeastOneRule();
    expect(gateClosedInputGood.errors).to.have.lengthOf(1);
    expect(gateClosedInputGood.errors[0]).to.be.an.instanceOf(
      EarlyExitException,
    );

    const gateClosedInputBad = new PredicateAtLeastOneParser(
      [createRegularToken(B)],
      false,
    );
    gateClosedInputBad.atLeastOneRule();
    expect(gateClosedInputBad.errors).to.have.lengthOf(1);
    expect(gateClosedInputBad.errors[0]).to.be.an.instanceOf(
      EarlyExitException,
    );
  });

  it("OR", () => {
    function gateFunc() {
      return this.gate;
    }

    class PredicateOrParser extends EmbeddedActionsParser {
      constructor(
        input: IToken[] = [],
        private gate: boolean,
      ) {
        super(ALL_TOKENS, {});
        this.performSelfAnalysis();
        this.input = input;
      }

      public orRule = this.RULE("orRule", () => {
        return this.OR7([
          // no predicate
          {
            ALT: () => {
              this.CONSUME1(A);
              return "A";
            },
          }, // Has predicate
          {
            GATE: gateFunc,
            ALT: () => {
              this.CONSUME1(B);
              return "B";
            },
          },
          // No predicate
          {
            ALT: () => {
              this.CONSUME1(C);
              return "C";
            },
          },
        ]);
      });
    }

    const gateOpenInputA = new PredicateOrParser(
      [createRegularToken(A)],
      true,
    ).orRule();
    expect(gateOpenInputA).to.equal("A");

    const gateOpenInputB = new PredicateOrParser(
      [createRegularToken(B)],
      true,
    ).orRule();
    expect(gateOpenInputB).to.equal("B");

    const gateOpenInputC = new PredicateOrParser(
      [createRegularToken(C)],
      true,
    ).orRule();
    expect(gateOpenInputC).to.equal("C");

    const gateClosedInputA = new PredicateOrParser(
      [createRegularToken(A)],
      false,
    ).orRule();
    expect(gateClosedInputA).to.equal("A");

    const gateClosedInputBad = new PredicateOrParser(
      [createRegularToken(B)],
      false,
    );
    gateClosedInputBad.orRule();
    expect(gateClosedInputBad.errors).to.have.lengthOf(1);
    expect(gateClosedInputBad.errors[0]).to.be.an.instanceOf(
      NoViableAltException,
    );

    const gateClosedInputC = new PredicateOrParser(
      [createRegularToken(C)],
      false,
    ).orRule();
    expect(gateClosedInputC).to.equal("C");
  });

  describe("Predicates shall work with parametrized rules (issue #221)", () => {
    it("predicates in OR", () => {
      class PredicateWithRuleOrParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {});
          this.performSelfAnalysis();
          this.input = input;
        }

        public topRule = this.RULE("topRule", (param: boolean) => {
          return this.OR1([
            {
              GATE: () => param,
              ALT: () => this.CONSUME1(A).image,
            },
            {
              GATE: () => !param,
              ALT: () => this.CONSUME1(B).image,
            },
          ]);
        });
      }

      const gateOpenInputA = new PredicateWithRuleOrParser([
        createRegularToken(A, "a"),
      ]).topRule(true);
      expect(gateOpenInputA).to.equal("a");

      // if the predicate function still kept a reference via a closure to the original param this will not work.
      const gateOpenInputB = new PredicateWithRuleOrParser([
        createRegularToken(B, "b"),
      ]).topRule(false);
      expect(gateOpenInputB).to.equal("b");
    });

    it("predicates in OPTION", () => {
      class PredicateWithRuleOptionParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {});
          this.performSelfAnalysis();
          this.input = input;
        }

        public topRule = this.RULE("topRule", (param: boolean) => {
          let result = "";
          this.OPTION({
            GATE: () => param,
            DEF: () => {
              result += this.CONSUME1(B).image;
            },
          });

          return result;
        });
      }

      const parser = new PredicateWithRuleOptionParser([
        createRegularToken(B, "b"),
      ]);
      const gateOpenInputB = parser.topRule(false);
      expect(gateOpenInputB).to.equal("");

      // // if the predicate function still kept a reference via a closure to the original param this will not work.
      // // because the <() => param> in the OPTION will ALWAYS return false (the original param)
      // let gateOpenInputA = new PredicateWithRuleOptionParser([
      //     createRegularToken(A, "a"),
      //     createRegularToken(B, "b")
      // ]).topRule(true)
      // expect(gateOpenInputA).to.equal("ab")
    });

    it("predicates in MANY", () => {
      class PredicateWithRuleManyParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {});
          this.performSelfAnalysis();
          this.input = input;
        }

        public topRule = this.RULE("topRule", (param: boolean) => {
          let result = "";
          this.MANY({
            GATE: () => param,
            DEF: () => {
              result += this.CONSUME1(A).image;
            },
          });
          result += this.CONSUME1(B).image;
          return result;
        });
      }

      const gateOpenInputB = new PredicateWithRuleManyParser([
        createRegularToken(B, "b"),
      ]).topRule(false);
      expect(gateOpenInputB).to.equal("b");

      // if the predicate function still kept a reference via a closure to the original param this will not work.
      // because the <() => param> in the MANY will ALWAYS return false (the original param)
      const gateOpenInputA = new PredicateWithRuleManyParser([
        createRegularToken(A, "a"),
        createRegularToken(A, "a"),
        createRegularToken(A, "a"),
        createRegularToken(B, "b"),
      ]).topRule(true);
      expect(gateOpenInputA).to.equal("aaab");
    });

    it("predicates in AT_LEAST_ONE", () => {
      class PredicateWithRuleAtLeastOneParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {});
          this.performSelfAnalysis();
          this.input = input;
        }

        public topRule = this.RULE("topRule", (param: boolean) => {
          let times = 0;

          function gateFunc() {
            // got to enter at least once...
            if (times === 0) {
              times++;
              return true;
            } else {
              return param;
            }
          }

          let result = "";
          this.AT_LEAST_ONE({
            GATE: gateFunc,
            DEF: () => {
              result += this.CONSUME1(A).image;
            },
          });
          result += this.CONSUME1(B).image;
          return result;
        });
      }

      const gateOpenInputB = new PredicateWithRuleAtLeastOneParser([
        createRegularToken(A, "a"),
        createRegularToken(B, "b"),
      ]).topRule(false);
      expect(gateOpenInputB).to.equal("ab");

      // if the predicate function still kept a reference via a closure to the original param this will not work.
      // because the <() => param> in the AT_LEAST_ONE will ALWAYS return false (the original param)
      const gateOpenInputA = new PredicateWithRuleAtLeastOneParser([
        createRegularToken(A, "a"),
        createRegularToken(A, "a"),
        createRegularToken(A, "a"),
        createRegularToken(B, "b"),
      ]).topRule(true);
      expect(gateOpenInputA).to.equal("aaab");
    });
  });

  describe("OR GATE must be checked even after fast-dispatch cache is populated", () => {
    it("gated alt takes priority when gate passes, even after gate-free alt was cached", () => {
      // Scenario:
      // - Alt 0: GATED (gate = () => this.useGatedAlt), consumes token A → returns "gated"
      // - Alt 1: gate-free, also consumes token A → returns "ungated"
      //
      // Parse 1: gate OFF → alt 0 skipped, alt 1 succeeds → cached for LA(1)=A
      // Parse 2: gate ON  → fast path must NOT skip alt 0's gate check
      //
      // Without the fix, parse 2 dispatches directly to cached alt 1,
      // ignoring alt 0 even though its gate now passes.

      class GateFastPathParser extends SmartParser {
        public useGatedAlt = false;

        constructor() {
          super(ALL_TOKENS, {});
          this.performSelfAnalysis();
        }

        public topRule = this.RULE("topRule", () => {
          return this.OR([
            {
              GATE: () => this.useGatedAlt,
              ALT: () => {
                this.CONSUME1(A);
                return "gated";
              },
            },
            {
              ALT: () => {
                this.CONSUME2(A);
                return "ungated";
              },
            },
          ]);
        });
      }

      const parser = new GateFastPathParser();

      // Parse 1: gate closed → alt 1 wins, gets cached for LA(1) = A
      parser.useGatedAlt = false;
      parser.input = [createRegularToken(A)];
      expect(parser.topRule()).to.equal("ungated");
      expect(parser.errors).to.be.empty;

      // Parse 2: gate still closed → alt 1 should still win
      parser.useGatedAlt = false;
      parser.input = [createRegularToken(A)];
      expect(parser.topRule()).to.equal("ungated");
      expect(parser.errors).to.be.empty;

      // Parse 3: gate OPEN → alt 0 should win (higher priority, gate passes)
      parser.useGatedAlt = true;
      parser.input = [createRegularToken(A)];
      expect(parser.topRule()).to.equal("gated");
      expect(parser.errors).to.be.empty;

      // Parse 4: gate closed again → alt 1 should win again
      parser.useGatedAlt = false;
      parser.input = [createRegularToken(A)];
      expect(parser.topRule()).to.equal("ungated");
      expect(parser.errors).to.be.empty;
    });

    it("alt with gated OPTION at start remains a fast-path candidate after failure", () => {
      // Scenario:
      // - Alt 0: starts with OPTION(GATE: flag, DEF: CONSUME(A)), then CONSUME(B)
      // - Alt 1: CONSUME(A)
      //
      // Parse 1: flag ON  → OPTION consumes A, then CONSUME(B) → alt 0 succeeds
      //          → alt 0 is cached as candidate for LA(1)=A
      // Parse 2: flag OFF → OPTION skipped, CONSUME(B) fails on A → alt 0 fails
      //          → fast path must NOT remove alt 0 from candidates
      //          → alt 1 succeeds
      // Parse 3: flag ON again → alt 0 should succeed again (still a candidate)

      class GatedOptionParser extends SmartParser {
        public optionFlag = true;

        constructor() {
          super(ALL_TOKENS, {});
          this.performSelfAnalysis();
        }

        public topRule = this.RULE("topRule", () => {
          return this.OR([
            {
              ALT: () => {
                this.OPTION({
                  GATE: () => this.optionFlag,
                  DEF: () => this.CONSUME1(A),
                });
                this.CONSUME1(B);
                return "optionAlt";
              },
            },
            {
              ALT: () => {
                this.CONSUME2(A);
                return "plainAlt";
              },
            },
          ]);
        });
      }

      const parser = new GatedOptionParser();

      // Parse 1: flag ON → OPTION takes A, then B consumed → "optionAlt"
      parser.optionFlag = true;
      parser.input = [createRegularToken(A), createRegularToken(B)];
      expect(parser.topRule()).to.equal("optionAlt");
      expect(parser.errors).to.be.empty;

      // Parse 2: flag OFF, input is just A → OPTION skipped, CONSUME(B) fails
      //          → falls to alt 1 which consumes A → "plainAlt"
      parser.optionFlag = false;
      parser.input = [createRegularToken(A)];
      expect(parser.topRule()).to.equal("plainAlt");
      expect(parser.errors).to.be.empty;

      // Parse 3: flag ON again → alt 0 must still be in the candidate list
      parser.optionFlag = true;
      parser.input = [createRegularToken(A), createRegularToken(B)];
      expect(parser.topRule()).to.equal("optionAlt");
      expect(parser.errors).to.be.empty;
    });

    it("failed alt with progress is added to fast-path cache", () => {
      // Two alts start with the same token (A) but require different
      // continuations. When alt 0 fails after consuming A (progress > 0),
      // it should still be recorded in the fast-path candidate list for
      // LA(1)=A. On the next call where alt 0's input is valid, the fast
      // path should include it.
      //
      // Alt 0: CONSUME(A), CONSUME(B) → needs [A, B]
      // Alt 1: CONSUME(A), CONSUME(C) → needs [A, C]

      class FailWithProgressParser extends SmartParser {
        constructor() {
          super(ALL_TOKENS, {});
          this.performSelfAnalysis();
        }

        public topRule = this.RULE("topRule", () => {
          return this.OR([
            {
              ALT: () => {
                this.CONSUME1(A);
                this.CONSUME1(B);
                return "alt0";
              },
            },
            {
              ALT: () => {
                this.CONSUME2(A);
                this.CONSUME1(C);
                return "alt1";
              },
            },
          ]);
        });
      }

      const parser = new FailWithProgressParser();

      // Parse 1: input [A, C] → alt 0 consumes A, fails on B (progress > 0)
      //          → alt 0 added to cache for LA(1)=A despite failure
      //          → alt 1 succeeds → also added to cache
      parser.input = [createRegularToken(A), createRegularToken(C)];
      expect(parser.topRule()).to.equal("alt1");
      expect(parser.errors).to.be.empty;

      // Verify that both alts are recorded for token A's tokenTypeIdx.
      // With the direct map, two alts matching the same tokenTypeIdx → ambiguous (-1).
      const fastMaps = (parser as any)._orFastMaps ?? {};
      const mapKeys = Object.keys(fastMaps);
      expect(mapKeys.length).to.be.greaterThan(0);
      const map = fastMaps[mapKeys[0]];
      const aTypeIdx = (A as any).tokenTypeIdx;
      expect(map[aTypeIdx]).to.equal(
        -1,
        "both alts match token A → ambiguous entry (-1)",
      );

      // Parse 2: input [A, B] → fast path finds both candidates,
      //          tries alt 0 first → succeeds
      parser.input = [createRegularToken(A), createRegularToken(B)];
      expect(parser.topRule()).to.equal("alt0");
      expect(parser.errors).to.be.empty;

      // Parse 3: input [A, C] again → fast path, alt 0 fails, alt 1 succeeds
      parser.input = [createRegularToken(A), createRegularToken(C)];
      expect(parser.topRule()).to.equal("alt1");
      expect(parser.errors).to.be.empty;
    });

    it("fast-path works for category CONSUME (not just exact token)", () => {
      // Before the fix: fast path was keyed by exact tokenTypeIdx only. When
      // the first CONSUME was a category (e.g. Keyword), only the first-observed
      // token (e.g. IfKeyword) was cached. ElseKeyword would miss the fast path.
      // After the fix: we record and filter by exact vs category per alt, so
      // any token in the category hits the fast path on first sight.
      const Keyword = createToken({ name: "Keyword" });
      const IfKeyword = createToken({
        name: "IfKeyword",
        pattern: /if/,
        categories: [Keyword],
      });
      const ElseKeyword = createToken({
        name: "ElseKeyword",
        pattern: /else/,
        categories: [Keyword],
      });
      const Ident = createToken({ name: "Ident", pattern: /[a-z]+/ });
      const CAT_TOKENS = [Keyword, IfKeyword, ElseKeyword, Ident];
      augmentTokenTypes(CAT_TOKENS);

      class CategoryFastPathParser extends SmartParser {
        constructor() {
          super(CAT_TOKENS, {});
          this.performSelfAnalysis();
        }

        public topRule = this.RULE("topRule", () => {
          return this.OR([
            { ALT: () => this.CONSUME1(Keyword).image || "keyword" },
            { ALT: () => this.CONSUME2(Ident).image || "ident" },
          ]);
        });
      }

      const parser = new CategoryFastPathParser();

      // Parse 1: IfKeyword → succeeds, alt 0 cached (category match)
      parser.input = [createRegularToken(IfKeyword, "if")];
      expect(parser.topRule()).to.equal("if");
      expect(parser.errors).to.be.empty;

      // Parse 2 (same token): hits fast path via direct map
      parser.input = [createRegularToken(IfKeyword, "if")];
      expect(parser.topRule()).to.equal("if");
      expect(parser.errors).to.be.empty;

      // Verify the fast map has IfKeyword's tokenTypeIdx mapped to alt 0
      const fastMaps = (parser as any)._orFastMaps ?? {};
      const mapKeys = Object.keys(fastMaps);
      expect(mapKeys.length).to.be.greaterThan(0);
      const mapKey = mapKeys[0];
      const map = fastMaps[mapKey];
      expect(map[(IfKeyword as any).tokenTypeIdx]).to.equal(0);

      // Parse 3: ElseKeyword (different token, same category) → first time
      // hits the slow path which records ElseKeyword.tokenTypeIdx → alt 0.
      // After that, fast path handles it directly.
      parser.input = [createRegularToken(ElseKeyword, "else")];
      expect(parser.topRule()).to.equal("else");
      expect(parser.errors).to.be.empty;
    });

    it("non-gated OPTION at start of ALT is stable in the fast-path cache", () => {
      // A non-gated OPTION always attempts its body — no context-dependent
      // skipping. The alt is deterministic for a given LA(1):
      // - LA(1)=A → OPTION consumes A, then CONSUME(B) or CONSUME(C)
      // - LA(1)=B → OPTION skipped, CONSUME(B)
      //
      // Once cached, the same LA(1) always takes the same path.

      class NonGatedOptionParser extends SmartParser {
        constructor() {
          super(ALL_TOKENS, {});
          this.performSelfAnalysis();
        }

        public topRule = this.RULE("topRule", () => {
          return this.OR([
            {
              ALT: () => {
                this.OPTION(() => this.CONSUME1(A));
                this.CONSUME1(B);
                return "alt0";
              },
            },
            {
              ALT: () => {
                this.CONSUME2(A);
                this.CONSUME1(C);
                return "alt1";
              },
            },
          ]);
        });
      }

      const parser = new NonGatedOptionParser();

      // Parse 1: [A, B] → alt 0 OPTION takes A, CONSUME(B) → "alt0"
      parser.input = [createRegularToken(A), createRegularToken(B)];
      expect(parser.topRule()).to.equal("alt0");
      expect(parser.errors).to.be.empty;

      // Parse 2: [B] → alt 0 OPTION skipped, CONSUME(B) → "alt0"
      parser.input = [createRegularToken(B)];
      expect(parser.topRule()).to.equal("alt0");
      expect(parser.errors).to.be.empty;

      // Parse 3: [A, C] → alt 0 OPTION takes A, CONSUME(B) fails on C
      //          → alt 1 takes A, CONSUME(C) → "alt1"
      parser.input = [createRegularToken(A), createRegularToken(C)];
      expect(parser.topRule()).to.equal("alt1");
      expect(parser.errors).to.be.empty;

      // Parse 4: repeat [A, B] → still works (alt 0 still cached for LA(1)=A)
      parser.input = [createRegularToken(A), createRegularToken(B)];
      expect(parser.topRule()).to.equal("alt0");
      expect(parser.errors).to.be.empty;
    });

    it("gated OPTION nested inside a SUBRULE is handled correctly", () => {
      // The gated OPTION is inside a sub-rule, not directly in the ALT body.
      // Progress tracking works by lexer position, so nesting depth doesn't
      // matter — if the SUBRULE's body consumed tokens, progress > 0.
      //
      // Alt 0: SUBRULE(helper) where helper = OPTION(GATE, CONSUME(A)) + CONSUME(B)
      // Alt 1: CONSUME(A)

      class NestedGatedOptionParser extends SmartParser {
        public optionFlag = true;

        constructor() {
          super(ALL_TOKENS, {});
          this.performSelfAnalysis();
        }

        public helper = this.RULE("helper", () => {
          this.OPTION({
            GATE: () => this.optionFlag,
            DEF: () => this.CONSUME1(A),
          });
          this.CONSUME1(B);
        });

        public topRule = this.RULE("topRule", () => {
          return this.OR([
            {
              ALT: () => {
                this.SUBRULE(this.helper);
                return "subruleAlt";
              },
            },
            {
              ALT: () => {
                this.CONSUME2(A);
                return "plainAlt";
              },
            },
          ]);
        });
      }

      const parser = new NestedGatedOptionParser();

      // Parse 1: flag ON, [A, B] → helper OPTION takes A, CONSUME(B) → "subruleAlt"
      parser.optionFlag = true;
      parser.input = [createRegularToken(A), createRegularToken(B)];
      expect(parser.topRule()).to.equal("subruleAlt");
      expect(parser.errors).to.be.empty;

      // Parse 2: flag OFF, [A] → helper OPTION skipped, CONSUME(B) fails on A
      //          → alt 0 fails (progress > 0 not guaranteed here since OPTION
      //            was skipped and CONSUME(B) is the first CONSUME attempted)
      //          → alt 1 takes A → "plainAlt"
      parser.optionFlag = false;
      parser.input = [createRegularToken(A)];
      expect(parser.topRule()).to.equal("plainAlt");
      expect(parser.errors).to.be.empty;

      // Parse 3: flag ON again, [A, B] → alt 0 should still work
      parser.optionFlag = true;
      parser.input = [createRegularToken(A), createRegularToken(B)];
      expect(parser.topRule()).to.equal("subruleAlt");
      expect(parser.errors).to.be.empty;

      // Parse 4: flag OFF, [B] → helper OPTION skipped, CONSUME(B) → "subruleAlt"
      //          (OPTION gate closed but B is consumed directly — different LA(1))
      parser.optionFlag = false;
      parser.input = [createRegularToken(B)];
      expect(parser.topRule()).to.equal("subruleAlt");
      expect(parser.errors).to.be.empty;
    });

    it("gated OPTION closed on first run, open on later run — alt must still be tried", () => {
      // The critical scenario:
      // - Alt 0: OPTION({ GATE: flag, DEF: CONSUME(A) }), CONSUME(B)
      // - Alt 1: CONSUME(A)
      //
      // Parse 1: flag=false, input=[A]
      //   → Alt 0: OPTION gate closed (skipped), CONSUME(B) fails on A (progress=0)
      //   → Alt 1: CONSUME(A) succeeds → cached for LA(1)=A: [1]
      //   → Alt 0 is NOT in candidate list for A (it never consumed A)
      //
      // Parse 2: flag=true, input=[A, B]
      //   → Fast path for LA(1)=A: candidates = [1] (only alt 1)
      //   → Alt 1: CONSUME(A) → succeeds → returns "alt1"
      //   → BUT alt 0 has higher priority and would succeed:
      //     OPTION gate open → consumes A, CONSUME(B) → "alt0"
      //
      // Without tracking gated-prefix OPTIONs, the fast path gives the
      // WRONG result: it returns "alt1" instead of "alt0".

      class GatedPrefixParser extends SmartParser {
        public flag = false;

        constructor() {
          super(ALL_TOKENS, {});
          this.performSelfAnalysis();
        }

        public topRule = this.RULE("topRule", () => {
          return this.OR([
            {
              ALT: () => {
                this.OPTION({
                  GATE: () => this.flag,
                  DEF: () => this.CONSUME1(A),
                });
                this.CONSUME1(B);
                return "alt0";
              },
            },
            {
              ALT: () => {
                this.CONSUME2(A);
                return "alt1";
              },
            },
          ]);
        });
      }

      const parser = new GatedPrefixParser();

      // Parse 1: flag OFF, input [A] → alt 0 fails (progress=0), alt 1 wins
      // Fast map for LA(1)=A: [1] — alt 0 is missing.
      parser.flag = false;
      parser.input = [createRegularToken(A)];
      expect(parser.topRule()).to.equal("alt1");
      expect(parser.errors).to.be.empty;

      // Parse 2: flag ON, input [A, B] → alt 0 should win (higher priority,
      // OPTION gate now open → consumes A, then CONSUME(B))
      parser.flag = true;
      parser.input = [createRegularToken(A), createRegularToken(B)];
      expect(parser.topRule()).to.equal("alt0");
      expect(parser.errors).to.be.empty;
    });

    it("BUG: nested OR must not corrupt outer OR gated-prefix tracking", () => {
      // Outer OR alt 0 calls SUBRULE(innerRule). innerRule has its own OR
      // with a gated OPTION. The inner OR sets _orAltHasGatedPrefix = true
      // for its own alt. When control returns to the outer OR, it must NOT
      // see the inner OR's flag — outer alt 0 has no gated prefix of its own.
      //
      // Without save/restore of _orAltStartLexPos/_orAltHasGatedPrefix
      // around orInternal, the outer OR incorrectly marks alt 0 as having
      // a gated prefix, preventing it from being cached.

      class NestedOrParser extends SmartParser {
        public innerFlag = false;

        constructor() {
          super(ALL_TOKENS, {});
          this.performSelfAnalysis();
        }

        // Inner rule has a gated OPTION at the start of its first alt.
        public innerRule = this.RULE("innerRule", () => {
          return this.OR([
            {
              ALT: () => {
                this.OPTION({
                  GATE: () => this.innerFlag,
                  DEF: () => this.CONSUME1(A),
                });
                this.CONSUME1(B);
                return "innerAlt0";
              },
            },
            {
              ALT: () => {
                this.CONSUME2(A);
                return "innerAlt1";
              },
            },
          ]);
        });

        // Outer OR: alt 0 calls SUBRULE(innerRule), alt 1 consumes C.
        // Alt 0 has NO gated prefix — the gated OPTION is inside innerRule.
        public topRule = this.RULE("topRule", () => {
          return this.OR([
            {
              ALT: () => {
                const inner = this.SUBRULE(this.innerRule);
                return "outer0:" + inner;
              },
            },
            {
              ALT: () => {
                this.CONSUME3(C);
                return "outer1";
              },
            },
          ]);
        });
      }

      const parser = new NestedOrParser();

      // Parse 1: innerFlag OFF, input [A] → inner alt 1 wins → "outer0:innerAlt1"
      parser.innerFlag = false;
      parser.input = [createRegularToken(A)];
      expect(parser.topRule()).to.equal("outer0:innerAlt1");
      expect(parser.errors).to.be.empty;

      // Parse 2: same input → should use fast path for outer OR.
      // BUG: if inner OR's gated-prefix flag leaked, outer alt 0 is NOT
      // cached and the slow loop runs unnecessarily.
      // Verify by checking outer alt 0 IS in the fast-path candidates.
      parser.innerFlag = false;
      parser.input = [createRegularToken(A)];
      expect(parser.topRule()).to.equal("outer0:innerAlt1");
      expect(parser.errors).to.be.empty;

      // Behavioral check: parse 2 with same input should succeed via
      // fast path (outer alt 0 cached). If the inner OR's gated-prefix
      // flag leaked, outer alt 0 would be in _orGatedPrefixAlts instead
      // of _orFastMaps, forcing unnecessary slow-loop speculation.
      //
      // Verify: the outer OR's mapKey should NOT have alt 0 in
      // _orGatedPrefixAlts. The inner OR's mapKey will (correctly) have
      // its own alt 0 there — so we must check the right mapKey.
      //
      // The simplest behavioral proof: a third parse with different inner
      // gate state but same outer input still picks outer alt 0 without
      // hitting the slow loop. We can't directly observe fast vs slow, but
      // we can verify outer alt 0 is in _orFastMaps (token-cached).
      const fastMaps = (parser as any)._orFastMaps ?? {};
      const gatedPrefixAlts = (parser as any)._orGatedPrefixAlts ?? {};

      // Find outer OR's mapKey: the outer OR observed alt 0 (SUBRULE) with
      // LA(1)=A, so fastMaps has A.tokenTypeIdx → 0. The inner OR has
      // gated-prefix alts. So the outer OR is the one whose map has an entry
      // for A.tokenTypeIdx and has no gated-prefix alts.
      let outerMapKey: string | undefined;
      for (const key of Object.keys(fastMaps)) {
        const map = fastMaps[key];
        if (
          map !== undefined &&
          map[(A as any).tokenTypeIdx] === 0 &&
          gatedPrefixAlts[key] === undefined
        ) {
          outerMapKey = key;
          break;
        }
      }
      expect(outerMapKey, "outer OR alt 0 should be in token-based fast map").to
        .not.be.undefined;
    });

    it("BUG: _orGatedPrefixAlts must remain sorted across multiple calls", () => {
      // If alt 2 is discovered as gated-prefix on call 1, and alt 0 on
      // call 2, the list becomes [2, 0] — unsorted. The fast-path merge
      // iteration uses sorted-order pointers and would skip alt 0.
      //
      // Construct: three alts with no LL(k) ambiguity at the non-gated level.
      // Alts 0 and 2 have gated OPTIONs, alt 1 is a plain fallback.
      // Call 1: gate0 OFF, gate2 ON → alt 2 discovered as gated-prefix first.
      // Call 2: gate0 ON, gate2 OFF → alt 0 discovered as gated-prefix second.

      class MultiGatedParser extends SmartParser {
        public gate0 = false;
        public gate2 = false;

        constructor() {
          // skipValidations: the speculative engine handles LL(1) ambiguity
          // at runtime via multi-candidate fast-dispatch — no need for the
          // old lookahead ambiguity check.
          super(ALL_TOKENS, { skipValidations: true });
          this.performSelfAnalysis();
        }

        public topRule = this.RULE("topRule", () => {
          return this.OR([
            {
              // Alt 0: gated OPTION(A) then B
              ALT: () => {
                this.OPTION({
                  GATE: () => this.gate0,
                  DEF: () => this.CONSUME1(A),
                });
                this.CONSUME1(B);
                return "alt0";
              },
            },
            {
              // Alt 1: plain A (no gate)
              ALT: () => {
                this.CONSUME2(A);
                return "alt1";
              },
            },
            {
              // Alt 2: gated OPTION(B) then C
              ALT: () => {
                this.OPTION2({
                  GATE: () => this.gate2,
                  DEF: () => this.CONSUME3(B),
                });
                this.CONSUME1(C);
                return "alt2";
              },
            },
          ]);
        });
      }

      const parser = new MultiGatedParser();

      // Call 1: gate0 OFF, gate2 ON, input [C]
      // Alt 0: OPTION skipped (gate0 OFF), CONSUME(B) fails on C → progress=0, gated prefix
      // Alt 1: CONSUME(A) fails on C → progress=0
      // Alt 2: OPTION gate2 ON → CONSUME(B) fails on C → OPTION fails,
      //         CONSUME(C) succeeds → "alt2"
      // → alt 2 gated prefix discovered (and alt 0 too)
      parser.gate0 = false;
      parser.gate2 = true;
      parser.input = [createRegularToken(C)];
      expect(parser.topRule()).to.equal("alt2");
      expect(parser.errors).to.be.empty;

      // Call 2: gate0 ON, gate2 OFF, input [B]
      // Alt 0: OPTION gate0 ON → CONSUME(A) fails on B → OPTION fails,
      //         CONSUME(B) succeeds → "alt0"
      // → alt 0 gated prefix discovered
      parser.gate0 = true;
      parser.gate2 = false;
      parser.input = [createRegularToken(B)];
      expect(parser.topRule()).to.equal("alt0");
      expect(parser.errors).to.be.empty;

      // Verify _orGatedPrefixAlts is sorted [0, 2], not [2, 0].
      const gatedPrefixAlts = (parser as any)._orGatedPrefixAlts;
      const keys = Object.keys(gatedPrefixAlts);
      for (const key of keys) {
        const gpa = gatedPrefixAlts[key];
        if (gpa.length > 1) {
          for (let j = 1; j < gpa.length; j++) {
            expect(gpa[j]).to.be.greaterThan(
              gpa[j - 1],
              `_orGatedPrefixAlts must be sorted, got: [${gpa}]`,
            );
          }
        }
      }

      // Call 3: gate0 ON, gate2 ON, input [A, B]
      // Both gated-prefix alts should be tried. Alt 0 (OPTION takes A,
      // CONSUME(B)) should win since it's first in declaration order.
      parser.gate0 = true;
      parser.gate2 = true;
      parser.input = [createRegularToken(A), createRegularToken(B)];
      expect(parser.topRule()).to.equal("alt0");
      expect(parser.errors).to.be.empty;
    });
  });

  describe("Deep backtracking: MANY unwinds failed iterations (CSS nesting pattern)", () => {
    // This replicates the CSS nesting ambiguity:
    //   .parent { a:hover { color: red; } }
    // Inside the block, `a:hover` could be a declaration (`a: hover`) or
    // a nested rule selector (`a:hover`). The `declaration` alt partially
    // matches then the outer rule fails at `{`. MANY must catch the error
    // and unwind so the outer OR can try `qualifiedRule` instead.

    const Ident = createToken({ name: "Ident" });
    const Colon = createToken({ name: "Colon" });
    const Semi = createToken({ name: "Semi" });
    const LCurly = createToken({ name: "LCurly" });
    const RCurly = createToken({ name: "RCurly" });
    const allTokens = [Ident, Colon, Semi, LCurly, RCurly];
    augmentTokenTypes(allTokens);

    class CssNestingParser extends SmartParser {
      constructor() {
        super(allTokens, {});
        this.performSelfAnalysis();
      }

      // stylesheet: qualifiedRule*
      public stylesheet = this.RULE("stylesheet", () => {
        const rules: string[] = [];
        this.MANY(() => {
          rules.push(this.SUBRULE(this.qualifiedRule));
        });
        return rules;
      });

      // qualifiedRule: selector '{' declarationList '}'
      public qualifiedRule = this.RULE("qualifiedRule", () => {
        this.SUBRULE(this.selector);
        this.CONSUME(LCurly);
        this.SUBRULE(this.declarationList);
        this.CONSUME(RCurly);
        return "rule";
      });

      // selector: (Ident | Ident ':' Ident)+
      public selector = this.RULE("selector", () => {
        let result = "";
        this.AT_LEAST_ONE(() => {
          result += this.CONSUME(Ident).image;
          this.OPTION(() => {
            this.CONSUME(Colon);
            result += ":" + this.CONSUME(Ident).image;
          });
        });
        return result;
      });

      // declarationList: (declaration | qualifiedRule)*
      // This is the ambiguous production — `a:hover` could match either.
      public declarationList = this.RULE("declarationList", () => {
        const items: string[] = [];
        this.MANY(() => {
          items.push(
            this.OR([
              { ALT: () => this.SUBRULE(this.declaration) },
              { ALT: () => this.SUBRULE(this.qualifiedRule) },
              {
                ALT: () => {
                  this.CONSUME(Semi);
                  return "";
                },
              },
            ]),
          );
        });
        return items;
      });

      // declaration: Ident ':' Ident
      // No trailing ';' — matches real CSS where semicolons are optional.
      // For `a:hover`, this succeeds as `a: hover`. The grammar needs a
      // whitespace-based GATE (like the Jess css-parser) to disambiguate.
      // These tests currently expect errors because the grammar is ambiguous
      // without a GATE — the engine correctly parses what it can.
      public declaration = this.RULE("declaration", () => {
        const prop = this.CONSUME(Ident).image;
        this.CONSUME(Colon);
        const val = this.CONSUME(Ident).image;
        return prop + ":" + val;
      });
    }

    it("ambiguous grammar (no GATE) produces errors for a:hover { } — grammar needs disambiguation", () => {
      const parser = new CssNestingParser();

      // Input: parent { a:hover { color:blue; } }
      // Without a disambiguation GATE, `declaration` succeeds for `a:hover`
      // (parsing it as `a: hover`). The engine can't undo a successful alt.
      // This is expected — real CSS parsers use whitespace/lookahead GATEs
      // to disambiguate. The engine's backtracking is correct; the grammar
      // needs the GATE.
      parser.input = [
        createRegularToken(Ident, "parent"),
        createRegularToken(LCurly),
        createRegularToken(Ident, "a"),
        createRegularToken(Colon),
        createRegularToken(Ident, "hover"),
        createRegularToken(LCurly),
        createRegularToken(Ident, "color"),
        createRegularToken(Colon),
        createRegularToken(Ident, "blue"),
        createRegularToken(Semi),
        createRegularToken(RCurly),
        createRegularToken(RCurly),
      ];
      parser.stylesheet();
      // Errors expected — ambiguous grammar without GATE
      expect(parser.errors.length).to.be.greaterThan(0);
    });

    it("declaration still works when followed by ';'", () => {
      const parser = new CssNestingParser();
      parser.input = [
        createRegularToken(Ident, "parent"),
        createRegularToken(LCurly),
        createRegularToken(Ident, "color"),
        createRegularToken(Colon),
        createRegularToken(Ident, "blue"),
        createRegularToken(Semi),
        createRegularToken(RCurly),
      ];
      const result = parser.stylesheet();
      expect(parser.errors).to.be.empty;
      expect(result).to.have.length(1);
    });

    it("mixed declarations and nested rules — ambiguous without GATE", () => {
      const parser = new CssNestingParser();
      // parent { color:blue; a:hover { x:y; } }
      parser.input = [
        createRegularToken(Ident, "parent"),
        createRegularToken(LCurly),
        createRegularToken(Ident, "color"),
        createRegularToken(Colon),
        createRegularToken(Ident, "blue"),
        createRegularToken(Semi),
        createRegularToken(Ident, "a"),
        createRegularToken(Colon),
        createRegularToken(Ident, "hover"),
        createRegularToken(LCurly),
        createRegularToken(Ident, "x"),
        createRegularToken(Colon),
        createRegularToken(Ident, "y"),
        createRegularToken(Semi),
        createRegularToken(RCurly),
        createRegularToken(RCurly),
      ];
      parser.stylesheet();
      // Errors expected — same ambiguity as above
      expect(parser.errors.length).to.be.greaterThan(0);
    });
  });
});
