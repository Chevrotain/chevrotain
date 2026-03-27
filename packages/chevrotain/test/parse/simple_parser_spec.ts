import { expect } from "chai";
import type {
  ILookaheadStrategy,
  ILookaheadValidationError,
  IOrAlt,
  IToken,
  OptionalProductionType,
  Rule,
  TokenType,
} from "@chevrotain/types";
import { MismatchedTokenException } from "../../src/parse/exceptions_public.js";
import { OPTION_IDX } from "../../src/parse/grammar/keys.js";
import { augmentTokenTypes } from "../../src/scan/tokens.js";
import { createToken } from "../../src/scan/tokens_public.js";
import { createRegularToken } from "../utils/matchers.js";
import { SmartParser } from "../../src/parse/parser/parser.js";

describe("SmartParser", () => {
  describe("lazy self analysis", () => {
    const IntTok = createToken({ name: "IntTok" });
    const PlusTok = createToken({ name: "PlusTok" });
    const allTokens = [IntTok, PlusTok];
    augmentTokenTypes(allTokens);

    it("can parse without an explicit performSelfAnalysis call", () => {
      class ParserWithoutPerformSelfAnalysis extends SmartParser {
        constructor() {
          super(allTokens);
          this.RULE("goodRule", () => {
            this.CONSUME(IntTok);
          });
        }
      }

      const parser: any = new ParserWithoutPerformSelfAnalysis();
      parser.input = [createRegularToken(IntTok, "1")];
      expect(parser.goodRule()).to.be.undefined;
      expect(parser.errors).to.be.empty;
    });

    it("can expose GAST without an explicit performSelfAnalysis call", () => {
      class ParserWithoutPerformSelfAnalysis extends SmartParser {
        constructor() {
          super(allTokens);
          this.RULE("goodRule", () => {
            this.CONSUME(IntTok);
          });
        }
      }

      const parser: any = new ParserWithoutPerformSelfAnalysis();
      const gast = parser.getGAstProductions();
      expect(gast).to.be.an("object");
      expect(gast.goodRule).to.exist;
    });

    it("can serialize GAST without an explicit performSelfAnalysis call", () => {
      class ParserWithoutPerformSelfAnalysis extends SmartParser {
        constructor() {
          super(allTokens);
          this.RULE("goodRule", () => {
            this.CONSUME(IntTok);
          });
        }
      }

      const parser: any = new ParserWithoutPerformSelfAnalysis();
      const serialized = parser.getSerializedGastProductions();
      expect(serialized).to.be.an("array");
      expect(serialized.length).to.be.greaterThan(0);
    });

    it("can parse OR and MANY without an explicit performSelfAnalysis call", () => {
      class ParserWithoutPerformSelfAnalysis extends SmartParser {
        constructor() {
          super(allTokens);
          this.RULE("list", () => {
            const items: string[] = [];
            this.MANY({
              DEF: () => {
                items.push(
                  this.OR([
                    { ALT: () => this.CONSUME1(IntTok).image },
                    { ALT: () => this.CONSUME1(PlusTok).image },
                  ]) as string,
                );
              },
            });
            return items;
          });
        }
      }

      const parser: any = new ParserWithoutPerformSelfAnalysis();
      parser.input = [
        createRegularToken(IntTok, "1"),
        createRegularToken(PlusTok, "+"),
        createRegularToken(IntTok, "2"),
      ];
      const result = parser.list();
      expect(result).to.deep.equal(["1", "+", "2"]);
      expect(parser.errors).to.be.empty;
    });

    for (const explicitPSA of [false, true]) {
      it(`honors a custom lookahead strategy on parser reuse ${
        explicitPSA ? "with" : "without"
      } performSelfAnalysis()`, () => {
        const Tok = createToken({ name: "Tok" });
        const allTokens = [Tok];
        augmentTokenTypes(allTokens);

        class ToggleLookaheadStrategy implements ILookaheadStrategy {
          validate(_options: {
            rules: Rule[];
            tokenTypes: TokenType[];
            grammarName: string;
          }): ILookaheadValidationError[] {
            return [];
          }

          buildLookaheadForAlternation(_options: {
            prodOccurrence: number;
            rule: Rule;
            maxLookahead: number;
            hasPredicates: boolean;
            dynamicTokensEnabled: boolean;
          }): (orAlts?: IOrAlt<any>[] | undefined) => number | undefined {
            return function (this: CustomStrategyParser) {
              return this.pickSecond ? 1 : 0;
            };
          }

          buildLookaheadForOptional(_options: {
            prodOccurrence: number;
            prodType: OptionalProductionType;
            rule: Rule;
            maxLookahead: number;
            dynamicTokensEnabled: boolean;
          }): () => boolean {
            return function () {
              return false;
            };
          }
        }

        class CustomStrategyParser extends SmartParser {
          public pickSecond = false;

          constructor() {
            super(allTokens, {
              lookaheadStrategy: new ToggleLookaheadStrategy(),
            });
            if (explicitPSA) {
              this.performSelfAnalysis();
            }
          }

          public rule = this.RULE("rule", () => {
            return this.OR([
              { ALT: () => (this.CONSUME(Tok), "first") },
              { ALT: () => (this.CONSUME(Tok), "second") },
            ]);
          });
        }

        const parser = new CustomStrategyParser();

        parser.pickSecond = false;
        parser.input = [createRegularToken(Tok, "a")];
        expect(parser.rule()).to.equal("first");
        expect(parser.errors).to.be.empty;

        parser.pickSecond = true;
        parser.input = [createRegularToken(Tok, "a")];
        expect(parser.rule()).to.equal("second");
        expect(parser.errors).to.be.empty;
      });

      it(`restores the self-analysis lookahead baseline when parser.input is replaced ${
        explicitPSA ? "with" : "without"
      } performSelfAnalysis()`, () => {
        const A = createToken({ name: "A" });
        const B = createToken({ name: "B" });
        const allTokens = [A, B];
        augmentTokenTypes(allTokens);

        class ReuseCacheParser extends SmartParser {
          constructor() {
            super(allTokens, { skipValidations: true });
            if (explicitPSA) {
              this.performSelfAnalysis();
            }
          }

          public staticRule = this.RULE("staticRule", () => {
            return this.OR([
              {
                ALT: () => {
                  this.CONSUME1(A);
                  return "A";
                },
              },
              {
                ALT: () => {
                  this.CONSUME1(B);
                  return "B";
                },
              },
            ]);
          });
        }

        function snapshotLookaheadCaches(parser: any) {
          function sparseRecordTableSnapshot(table: any) {
            const result: Record<string, Record<string, number | boolean>> = {};
            for (const key of Object.keys(table ?? {})) {
              const value = table[key];
              if (value !== undefined) {
                result[key] = JSON.parse(JSON.stringify(value));
              }
            }
            return result;
          }

          return {
            fastMaps: sparseRecordTableSnapshot(parser._orFastMaps),
            gatedPrefixAlts: sparseRecordTableSnapshot(
              parser._orGatedPrefixAlts,
            ),
            committable: sparseRecordTableSnapshot(parser._orCommittable),
            fastMapAltsRefKeys: Object.keys(parser._orFastMapAltsRef ?? {}),
            orLookaheadKeys: Object.keys(parser._orLookahead ?? {}).filter(
              (key) => parser._orLookahead[key] !== undefined,
            ),
            orLookaheadLL1Keys: Object.keys(
              parser._orLookaheadLL1 ?? {},
            ).filter((key) => parser._orLookaheadLL1[key] !== undefined),
            prodLookaheadKeys: Object.keys(parser._prodLookahead ?? {}).filter(
              (key) => parser._prodLookahead[key] !== undefined,
            ),
          };
        }

        const parser = new ReuseCacheParser();

        parser.input = [createRegularToken(A)];
        expect(parser.staticRule()).to.equal("A");
        expect(parser.errors).to.be.empty;

        const baseline = snapshotLookaheadCaches(parser);

        const runtimeCacheState = parser as any;
        runtimeCacheState._orFastMaps[999] = Object.assign(
          Object.create(null),
          {
            [(A as any).tokenTypeIdx]: 0,
          },
        );
        runtimeCacheState._orFastMapAltsRef[999] = [
          {
            ALT: () => "mutated",
          },
        ];
        runtimeCacheState._orGatedPrefixAlts[999] = [0];
        runtimeCacheState._orCommittable[999] = Object.assign(
          Object.create(null),
          {
            [(A as any).tokenTypeIdx]: true,
          },
        );
        runtimeCacheState._orLookahead[999] = () => 0;
        runtimeCacheState._orLookaheadLL1[999] = () => 0;
        runtimeCacheState._prodLookahead[999] = () => true;
        runtimeCacheState._runtimeLookaheadCachesDirty = true;

        parser.input = [createRegularToken(B)];
        expect(snapshotLookaheadCaches(parser)).to.deep.equal(
          baseline,
          "replacing parser.input should restore the performSelfAnalysis cache baseline",
        );

        expect(parser.staticRule()).to.equal("B");
        expect(parser.errors).to.be.empty;
      });
    }
  });

  describe("auto occurrence", () => {
    it("allows repeated plain OR sites in the same rule", () => {
      const TokenA = createToken({ name: "TokenA" });
      const TokenB = createToken({ name: "TokenB" });
      const TokenC = createToken({ name: "TokenC" });
      const TokenD = createToken({ name: "TokenD" });
      const allTokens = [TokenA, TokenB, TokenC, TokenD];
      augmentTokenTypes(allTokens);

      class TwoOrParser extends SmartParser {
        constructor() {
          super(allTokens, {});
          this.performSelfAnalysis();
        }

        public testRule = this.RULE("testRule", () => {
          const first = this.OR([
            { ALT: () => (this.CONSUME(TokenA), "A") },
            { ALT: () => (this.CONSUME(TokenB), "B") },
          ]);
          const second = this.OR([
            { ALT: () => (this.CONSUME(TokenC), "C") },
            { ALT: () => (this.CONSUME(TokenD), "D") },
          ]);
          return [first, second];
        });
      }

      const parser = new TwoOrParser();
      parser.input = [createRegularToken(TokenA), createRegularToken(TokenC)];
      expect(parser.testRule()).to.deep.equal(["A", "C"]);
      expect(parser.errors).to.be.empty;

      parser.input = [createRegularToken(TokenB), createRegularToken(TokenD)];
      expect(parser.testRule()).to.deep.equal(["B", "D"]);
      expect(parser.errors).to.be.empty;

      const fastMaps = (parser as any)._orFastMaps ?? {};
      expect(Object.keys(fastMaps)).to.have.lengthOf(2);
    });

    it("allows repeated plain CONSUME calls in the same rule", () => {
      const TokenA = createToken({ name: "TokenA" });
      const TokenB = createToken({ name: "TokenB" });
      const allTokens = [TokenA, TokenB];
      augmentTokenTypes(allTokens);

      class MultiConsumeParser extends SmartParser {
        constructor() {
          super(allTokens, {});
          this.performSelfAnalysis();
        }

        public testRule = this.RULE("testRule", () => {
          const first = this.CONSUME(TokenA);
          const second = this.CONSUME(TokenB);
          return [first.image, second.image];
        });
      }

      const parser = new MultiConsumeParser();
      parser.input = [
        createRegularToken(TokenA, "a"),
        createRegularToken(TokenB, "b"),
      ];
      expect(parser.testRule()).to.deep.equal(["a", "b"]);
      expect(parser.errors).to.be.empty;
    });

    it("allows duplicate explicit SUBRULE occurrences in the same rule", () => {
      class PlusTok {
        static PATTERN = /NA/;
      }

      class DuplicateSubruleParser extends SmartParser {
        constructor(input: IToken[] = []) {
          super([PlusTok]);
          this.performSelfAnalysis();
          this.input = input;
        }

        public duplicateRef = this.RULE("duplicateRef", () => {
          this.SUBRULE1(this.anotherRule);
          this.SUBRULE1(this.anotherRule);
        });

        public anotherRule = this.RULE("anotherRule", () => {
          this.CONSUME(PlusTok);
        });
      }

      expect(() => new DuplicateSubruleParser()).to.not.throw();
    });

    it("ignores user-provided lowercase idx values", () => {
      const Tok = createToken({ name: "Tok" });
      const allTokens = [Tok];
      augmentTokenTypes(allTokens);

      class InvalidIdxParser extends SmartParser {
        constructor() {
          super(allTokens);
          this.performSelfAnalysis();
        }

        public one = this.RULE("one", () => {
          this.consume(256, Tok);
        });
      }

      expect(() => new InvalidIdxParser()).to.not.throw();
    });

    it("tolerates duplicate plain and numbered DSL wrappers across parser lifecycles", () => {
      const A = createToken({ name: "DupA" });
      const B = createToken({ name: "DupB" });
      const C = createToken({ name: "DupC" });
      const D = createToken({ name: "DupD" });
      const Comma = createToken({ name: "DupComma" });
      const allTokens = [A, B, C, D, Comma];
      augmentTokenTypes(allTokens);

      class DuplicateDslParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public atom = this.RULE("atom", () => {
          return this.OR([
            { ALT: () => this.CONSUME(A) },
            { ALT: () => this.CONSUME(B) },
          ]);
        });

        public consumePlain = this.RULE("consumePlain", () => {
          this.CONSUME(A);
          this.CONSUME(B);
        });

        public consumeExplicit = this.RULE("consumeExplicit", () => {
          this.CONSUME1(A);
          this.CONSUME1(B);
        });

        public subrulePlain = this.RULE("subrulePlain", () => {
          this.SUBRULE(this.atom);
          this.SUBRULE(this.atom);
        });

        public subruleExplicit = this.RULE("subruleExplicit", () => {
          this.SUBRULE1(this.atom);
          this.SUBRULE1(this.atom);
        });

        public optionPlain = this.RULE("optionPlain", () => {
          let hits = 0;
          this.OPTION(() => {
            this.CONSUME(A);
            hits++;
          });
          this.OPTION(() => {
            this.CONSUME(B);
            hits++;
          });
          return hits;
        });

        public optionExplicit = this.RULE("optionExplicit", () => {
          let hits = 0;
          this.OPTION1(() => {
            this.CONSUME(A);
            hits++;
          });
          this.OPTION1(() => {
            this.CONSUME(B);
            hits++;
          });
          return hits;
        });

        public orPlain = this.RULE("orPlain", () => {
          return [
            this.OR([
              { ALT: () => (this.CONSUME(A), "A") },
              { ALT: () => (this.CONSUME(B), "B") },
            ]),
            this.OR([
              { ALT: () => (this.CONSUME(C), "C") },
              { ALT: () => (this.CONSUME(D), "D") },
            ]),
          ];
        });

        public orExplicit = this.RULE("orExplicit", () => {
          return [
            this.OR1([
              { ALT: () => (this.CONSUME(A), "A") },
              { ALT: () => (this.CONSUME(B), "B") },
            ]),
            this.OR1([
              { ALT: () => (this.CONSUME(C), "C") },
              { ALT: () => (this.CONSUME(D), "D") },
            ]),
          ];
        });

        public manyPlain = this.RULE("manyPlain", () => {
          let aCount = 0;
          let bCount = 0;
          this.MANY(() => {
            this.CONSUME(A);
            aCount++;
          });
          this.MANY(() => {
            this.CONSUME(B);
            bCount++;
          });
          return [aCount, bCount];
        });

        public manyExplicit = this.RULE("manyExplicit", () => {
          let aCount = 0;
          let bCount = 0;
          this.MANY1(() => {
            this.CONSUME(A);
            aCount++;
          });
          this.MANY1(() => {
            this.CONSUME(B);
            bCount++;
          });
          return [aCount, bCount];
        });

        public manySepPlain = this.RULE("manySepPlain", () => {
          let aCount = 0;
          let bCount = 0;
          this.MANY_SEP({
            SEP: Comma,
            DEF: () => {
              this.CONSUME(A);
              aCount++;
            },
          });
          this.MANY_SEP({
            SEP: Comma,
            DEF: () => {
              this.CONSUME(B);
              bCount++;
            },
          });
          return [aCount, bCount];
        });

        public manySepExplicit = this.RULE("manySepExplicit", () => {
          let aCount = 0;
          let bCount = 0;
          this.MANY_SEP1({
            SEP: Comma,
            DEF: () => {
              this.CONSUME(A);
              aCount++;
            },
          });
          this.MANY_SEP1({
            SEP: Comma,
            DEF: () => {
              this.CONSUME(B);
              bCount++;
            },
          });
          return [aCount, bCount];
        });

        public atLeastOnePlain = this.RULE("atLeastOnePlain", () => {
          let aCount = 0;
          let bCount = 0;
          this.AT_LEAST_ONE(() => {
            this.CONSUME(A);
            aCount++;
          });
          this.AT_LEAST_ONE(() => {
            this.CONSUME(B);
            bCount++;
          });
          return [aCount, bCount];
        });

        public atLeastOneExplicit = this.RULE("atLeastOneExplicit", () => {
          let aCount = 0;
          let bCount = 0;
          this.AT_LEAST_ONE1(() => {
            this.CONSUME(A);
            aCount++;
          });
          this.AT_LEAST_ONE1(() => {
            this.CONSUME(B);
            bCount++;
          });
          return [aCount, bCount];
        });

        public atLeastOneSepPlain = this.RULE("atLeastOneSepPlain", () => {
          let aCount = 0;
          let bCount = 0;
          this.AT_LEAST_ONE_SEP({
            SEP: Comma,
            DEF: () => {
              this.CONSUME(A);
              aCount++;
            },
          });
          this.AT_LEAST_ONE_SEP({
            SEP: Comma,
            DEF: () => {
              this.CONSUME(B);
              bCount++;
            },
          });
          return [aCount, bCount];
        });

        public atLeastOneSepExplicit = this.RULE(
          "atLeastOneSepExplicit",
          () => {
            let aCount = 0;
            let bCount = 0;
            this.AT_LEAST_ONE_SEP1({
              SEP: Comma,
              DEF: () => {
                this.CONSUME(A);
                aCount++;
              },
            });
            this.AT_LEAST_ONE_SEP1({
              SEP: Comma,
              DEF: () => {
                this.CONSUME(B);
                bCount++;
              },
            });
            return [aCount, bCount];
          },
        );
      }

      for (const explicitPSA of [false, true]) {
        const parser = new DuplicateDslParser(explicitPSA);

        parser.input = [createRegularToken(A), createRegularToken(B)];
        parser.consumePlain();
        expect(parser.errors).to.be.empty;

        parser.input = [createRegularToken(A), createRegularToken(B)];
        parser.consumeExplicit();
        expect(parser.errors).to.be.empty;

        parser.input = [createRegularToken(A), createRegularToken(B)];
        parser.subrulePlain();
        expect(parser.errors).to.be.empty;

        parser.input = [createRegularToken(A), createRegularToken(B)];
        parser.subruleExplicit();
        expect(parser.errors).to.be.empty;

        parser.input = [createRegularToken(A), createRegularToken(B)];
        expect(parser.optionPlain()).to.equal(2);
        expect(parser.errors).to.be.empty;

        parser.input = [createRegularToken(A), createRegularToken(B)];
        expect(parser.optionExplicit()).to.equal(2);
        expect(parser.errors).to.be.empty;

        parser.input = [createRegularToken(A), createRegularToken(C)];
        expect(parser.orPlain()).to.deep.equal(["A", "C"]);
        expect(parser.errors).to.be.empty;

        parser.input = [createRegularToken(B), createRegularToken(D)];
        expect(parser.orExplicit()).to.deep.equal(["B", "D"]);
        expect(parser.errors).to.be.empty;

        parser.input = [
          createRegularToken(A),
          createRegularToken(A),
          createRegularToken(B),
          createRegularToken(B),
        ];
        expect(parser.manyPlain()).to.deep.equal([2, 2]);
        expect(parser.errors).to.be.empty;

        parser.input = [
          createRegularToken(A),
          createRegularToken(A),
          createRegularToken(B),
          createRegularToken(B),
        ];
        expect(parser.manyExplicit()).to.deep.equal([2, 2]);
        expect(parser.errors).to.be.empty;

        parser.input = [
          createRegularToken(A),
          createRegularToken(Comma),
          createRegularToken(A),
          createRegularToken(B),
          createRegularToken(Comma),
          createRegularToken(B),
        ];
        expect(parser.manySepPlain()).to.deep.equal([2, 2]);
        expect(parser.errors).to.be.empty;

        parser.input = [
          createRegularToken(A),
          createRegularToken(Comma),
          createRegularToken(A),
          createRegularToken(B),
          createRegularToken(Comma),
          createRegularToken(B),
        ];
        expect(parser.manySepExplicit()).to.deep.equal([2, 2]);
        expect(parser.errors).to.be.empty;

        parser.input = [
          createRegularToken(A),
          createRegularToken(A),
          createRegularToken(B),
          createRegularToken(B),
        ];
        expect(parser.atLeastOnePlain()).to.deep.equal([2, 2]);
        expect(parser.errors).to.be.empty;

        parser.input = [
          createRegularToken(A),
          createRegularToken(A),
          createRegularToken(B),
          createRegularToken(B),
        ];
        expect(parser.atLeastOneExplicit()).to.deep.equal([2, 2]);
        expect(parser.errors).to.be.empty;

        parser.input = [
          createRegularToken(A),
          createRegularToken(Comma),
          createRegularToken(A),
          createRegularToken(B),
          createRegularToken(Comma),
          createRegularToken(B),
        ];
        expect(parser.atLeastOneSepPlain()).to.deep.equal([2, 2]);
        expect(parser.errors).to.be.empty;

        parser.input = [
          createRegularToken(A),
          createRegularToken(Comma),
          createRegularToken(A),
          createRegularToken(B),
          createRegularToken(Comma),
          createRegularToken(B),
        ];
        expect(parser.atLeastOneSepExplicit()).to.deep.equal([2, 2]);
        expect(parser.errors).to.be.empty;

        const gast = parser.getGAstProductions();
        expect(gast).to.have.property("consumePlain");
        expect(parser.getSerializedGastProductions().length).to.be.greaterThan(
          0,
        );

        parser.input = [createRegularToken(B), createRegularToken(D)];
        expect(parser.orExplicit()).to.deep.equal(["B", "D"]);
        expect(parser.errors).to.be.empty;
      }
    });
  });

  describe("ambiguity tolerance", () => {
    it("allows ambiguous LL(1) alternatives and resolves them speculatively", () => {
      const Ident = createToken({ name: "Ident" });
      const LParen = createToken({ name: "LParen" });
      const allTokens = [Ident, LParen];
      augmentTokenTypes(allTokens);

      expect(() => {
        class AmbiguousParser extends SmartParser {
          constructor() {
            super(allTokens, {});
            this.performSelfAnalysis();
          }

          public testRule = this.RULE("testRule", () => {
            return this.OR([
              {
                ALT: () => {
                  const id = this.CONSUME(Ident);
                  this.CONSUME(LParen);
                  return "call:" + id.image;
                },
              },
              {
                ALT: () => {
                  const id = this.CONSUME(Ident);
                  return "ref:" + id.image;
                },
              },
            ]);
          });
        }

        const parser = new AmbiguousParser();
        parser.input = [
          createRegularToken(Ident, "foo"),
          createRegularToken(LParen, "("),
        ];
        expect(parser.testRule()).to.equal("call:foo");
        expect(parser.errors).to.be.empty;

        parser.input = [createRegularToken(Ident, "bar")];
        expect(parser.testRule()).to.equal("ref:bar");
        expect(parser.errors).to.be.empty;
      }).to.not.throw();
    });
  });

  describe("speculative lookahead tolerance", () => {
    it("can skip a wrong OPTION path even when explicit MAX_LOOKAHEAD is too low", () => {
      const OneTok = createToken({ name: "OneTok" });
      const TwoTok = createToken({ name: "TwoTok" });
      const ThreeTok = createToken({ name: "ThreeTok" });
      const allTokens = [OneTok, TwoTok, ThreeTok];
      augmentTokenTypes(allTokens);

      class SpeculativeOptionParser extends SmartParser {
        constructor(input: IToken[] = []) {
          super(allTokens);
          this.performSelfAnalysis();
          this.input = input;
        }

        public rule = this.RULE("rule", () => {
          let result = "OPTION Not Taken";
          this.OPTION2({
            // Deliberately too low; SmartParser should still try the body
            // speculatively and back out when ThreeTok does not appear.
            MAX_LOOKAHEAD: 1,
            DEF: () => {
              this.CONSUME1(OneTok);
              this.CONSUME1(ThreeTok);
              result = "OPTION Taken";
            },
          });
          this.CONSUME2(OneTok);
          this.CONSUME2(TwoTok);
          return result;
        });
      }

      const parser = new SpeculativeOptionParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(parser.rule()).to.equal("OPTION Not Taken");
      expect(parser.errors).to.be.empty;
    });
  });

  describe("definition validations", () => {
    it("does not require skipValidations for repeated plain CONSUME sites", () => {
      const IntTok = createToken({ name: "IntTok" });
      const allTokens: TokenType[] = [IntTok];
      augmentTokenTypes(allTokens);

      class SkipValidationsParser extends SmartParser {
        constructor(skipValidationsValue: boolean) {
          super(allTokens, {
            skipValidations: skipValidationsValue,
          });

          this.RULE("goodRule", () => {
            this.CONSUME(IntTok);
            this.CONSUME(IntTok);
          });
          this.performSelfAnalysis();
        }
      }

      expect(() => new SkipValidationsParser(true)).to.not.throw();
      expect(() => new SkipValidationsParser(false)).to.not.throw();
    });
  });

  describe("coverage parity", () => {
    it("covers SmartParser numbered DSL wrappers in both recording modes", () => {
      const tokenMap = Object.fromEntries(
        [
          "C4",
          "C5",
          "C6",
          "C7",
          "C8",
          "C9",
          "S2",
          "S3",
          "S4",
          "S5",
          "S6",
          "S7",
          "S8",
          "S9",
          "O1",
          "O3",
          "O4",
          "O5",
          "O6",
          "O7",
          "O8",
          "O9",
          "OR1A",
          "OR1B",
          "OR2A",
          "OR2B",
          "OR3A",
          "OR3B",
          "OR4A",
          "OR4B",
          "OR5A",
          "OR5B",
          "OR6A",
          "OR6B",
          "OR7A",
          "OR7B",
          "OR8A",
          "OR8B",
          "OR9A",
          "OR9B",
          "M1",
          "M2",
          "M3",
          "M4",
          "M5",
          "M6",
          "M7",
          "M8",
          "M9",
          "MS0",
          "MS1",
          "MS2",
          "MS3",
          "MS4",
          "MS5",
          "MS6",
          "MS7",
          "MS8",
          "MS9",
          "ALO",
          "AL1",
          "AL2",
          "AL3",
          "AL4",
          "AL5",
          "AL6",
          "AL7",
          "AL8",
          "AL9",
          "ALS0",
          "ALS1",
          "ALS2",
          "ALS3",
          "ALS4",
          "ALS5",
          "ALS6",
          "ALS7",
          "ALS8",
          "ALS9",
          "Sep",
        ].map((name) => [name, createToken({ name })]),
      ) as Record<string, TokenType>;
      const allTokens = Object.values(tokenMap);
      augmentTokenTypes(allTokens);

      const tok = (name: keyof typeof tokenMap) =>
        createRegularToken(tokenMap[name], String(name));

      class NumberedWrappersParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public consumeRule = this.RULE("consumeRule", () => {
          this.CONSUME4(tokenMap.C4);
          this.CONSUME5(tokenMap.C5);
          this.CONSUME6(tokenMap.C6);
          this.CONSUME7(tokenMap.C7);
          this.CONSUME8(tokenMap.C8);
          this.CONSUME9(tokenMap.C9);
        });

        public sub2 = this.RULE("sub2", () => this.CONSUME(tokenMap.S2));
        public sub3 = this.RULE("sub3", () => this.CONSUME(tokenMap.S3));
        public sub4 = this.RULE("sub4", () => this.CONSUME(tokenMap.S4));
        public sub5 = this.RULE("sub5", () => this.CONSUME(tokenMap.S5));
        public sub6 = this.RULE("sub6", () => this.CONSUME(tokenMap.S6));
        public sub7 = this.RULE("sub7", () => this.CONSUME(tokenMap.S7));
        public sub8 = this.RULE("sub8", () => this.CONSUME(tokenMap.S8));
        public sub9 = this.RULE("sub9", () => this.CONSUME(tokenMap.S9));

        public subruleRule = this.RULE("subruleRule", () => {
          this.SUBRULE2(this.sub2);
          this.SUBRULE3(this.sub3);
          this.SUBRULE4(this.sub4);
          this.SUBRULE5(this.sub5);
          this.SUBRULE6(this.sub6);
          this.SUBRULE7(this.sub7);
          this.SUBRULE8(this.sub8);
          this.SUBRULE9(this.sub9);
        });

        public optionRule = this.RULE("optionRule", () => {
          const hits: string[] = [];
          this.OPTION1(() => {
            this.CONSUME(tokenMap.O1);
            hits.push("1");
          });
          this.OPTION3(() => {
            this.CONSUME(tokenMap.O3);
            hits.push("3");
          });
          this.OPTION4(() => {
            this.CONSUME(tokenMap.O4);
            hits.push("4");
          });
          this.OPTION5(() => {
            this.CONSUME(tokenMap.O5);
            hits.push("5");
          });
          this.OPTION6(() => {
            this.CONSUME(tokenMap.O6);
            hits.push("6");
          });
          this.OPTION7(() => {
            this.CONSUME(tokenMap.O7);
            hits.push("7");
          });
          this.OPTION8(() => {
            this.CONSUME(tokenMap.O8);
            hits.push("8");
          });
          this.OPTION9(() => {
            this.CONSUME(tokenMap.O9);
            hits.push("9");
          });
          return hits;
        });

        public orRule = this.RULE("orRule", () => {
          return [
            this.OR1([
              { ALT: () => (this.CONSUME(tokenMap.OR1A), "1A") },
              { ALT: () => (this.CONSUME(tokenMap.OR1B), "1B") },
            ]),
            this.OR2([
              { ALT: () => (this.CONSUME(tokenMap.OR2A), "2A") },
              { ALT: () => (this.CONSUME(tokenMap.OR2B), "2B") },
            ]),
            this.OR3([
              { ALT: () => (this.CONSUME(tokenMap.OR3A), "3A") },
              { ALT: () => (this.CONSUME(tokenMap.OR3B), "3B") },
            ]),
            this.OR4([
              { ALT: () => (this.CONSUME(tokenMap.OR4A), "4A") },
              { ALT: () => (this.CONSUME(tokenMap.OR4B), "4B") },
            ]),
            this.OR5([
              { ALT: () => (this.CONSUME(tokenMap.OR5A), "5A") },
              { ALT: () => (this.CONSUME(tokenMap.OR5B), "5B") },
            ]),
            this.OR6([
              { ALT: () => (this.CONSUME(tokenMap.OR6A), "6A") },
              { ALT: () => (this.CONSUME(tokenMap.OR6B), "6B") },
            ]),
            this.OR7([
              { ALT: () => (this.CONSUME(tokenMap.OR7A), "7A") },
              { ALT: () => (this.CONSUME(tokenMap.OR7B), "7B") },
            ]),
            this.OR8([
              { ALT: () => (this.CONSUME(tokenMap.OR8A), "8A") },
              { ALT: () => (this.CONSUME(tokenMap.OR8B), "8B") },
            ]),
            this.OR9([
              { ALT: () => (this.CONSUME(tokenMap.OR9A), "9A") },
              { ALT: () => (this.CONSUME(tokenMap.OR9B), "9B") },
            ]),
          ];
        });

        public manyRule = this.RULE("manyRule", () => {
          let hits = 0;
          this.MANY1(() => {
            this.CONSUME(tokenMap.M1);
            hits++;
          });
          this.MANY2(() => {
            this.CONSUME(tokenMap.M2);
            hits++;
          });
          this.MANY3(() => {
            this.CONSUME(tokenMap.M3);
            hits++;
          });
          this.MANY4(() => {
            this.CONSUME(tokenMap.M4);
            hits++;
          });
          this.MANY5(() => {
            this.CONSUME(tokenMap.M5);
            hits++;
          });
          this.MANY6(() => {
            this.CONSUME(tokenMap.M6);
            hits++;
          });
          this.MANY7(() => {
            this.CONSUME(tokenMap.M7);
            hits++;
          });
          this.MANY8(() => {
            this.CONSUME(tokenMap.M8);
            hits++;
          });
          this.MANY9(() => {
            this.CONSUME(tokenMap.M9);
            hits++;
          });
          return hits;
        });

        public manySepRule = this.RULE("manySepRule", () => {
          let hits = 0;
          const manySep = (name: keyof typeof tokenMap) => () => {
            this.CONSUME(tokenMap[name]);
            hits++;
          };
          this.MANY_SEP({ SEP: tokenMap.Sep, DEF: manySep("MS0") });
          this.MANY_SEP1({ SEP: tokenMap.Sep, DEF: manySep("MS1") });
          this.MANY_SEP2({ SEP: tokenMap.Sep, DEF: manySep("MS2") });
          this.MANY_SEP3({ SEP: tokenMap.Sep, DEF: manySep("MS3") });
          this.MANY_SEP4({ SEP: tokenMap.Sep, DEF: manySep("MS4") });
          this.MANY_SEP5({ SEP: tokenMap.Sep, DEF: manySep("MS5") });
          this.MANY_SEP6({ SEP: tokenMap.Sep, DEF: manySep("MS6") });
          this.MANY_SEP7({ SEP: tokenMap.Sep, DEF: manySep("MS7") });
          this.MANY_SEP8({ SEP: tokenMap.Sep, DEF: manySep("MS8") });
          this.MANY_SEP9({ SEP: tokenMap.Sep, DEF: manySep("MS9") });
          return hits;
        });

        public atLeastOneRule = this.RULE("atLeastOneRule", () => {
          let hits = 0;
          const atLeastOne = (name: keyof typeof tokenMap) => () => {
            this.CONSUME(tokenMap[name]);
            hits++;
          };
          this.AT_LEAST_ONE(() => {
            this.CONSUME(tokenMap.ALO);
            hits++;
          });
          this.AT_LEAST_ONE1(atLeastOne("AL1"));
          this.AT_LEAST_ONE2(atLeastOne("AL2"));
          this.AT_LEAST_ONE3(atLeastOne("AL3"));
          this.AT_LEAST_ONE4(atLeastOne("AL4"));
          this.AT_LEAST_ONE5(atLeastOne("AL5"));
          this.AT_LEAST_ONE6(atLeastOne("AL6"));
          this.AT_LEAST_ONE7(atLeastOne("AL7"));
          this.AT_LEAST_ONE8(atLeastOne("AL8"));
          this.AT_LEAST_ONE9(atLeastOne("AL9"));
          return hits;
        });

        public atLeastOneSepRule = this.RULE("atLeastOneSepRule", () => {
          let hits = 0;
          const atLeastOneSep = (name: keyof typeof tokenMap) => ({
            SEP: tokenMap.Sep,
            DEF: () => {
              this.CONSUME(tokenMap[name]);
              hits++;
            },
          });
          this.AT_LEAST_ONE_SEP(atLeastOneSep("ALS0"));
          this.AT_LEAST_ONE_SEP1(atLeastOneSep("ALS1"));
          this.AT_LEAST_ONE_SEP2(atLeastOneSep("ALS2"));
          this.AT_LEAST_ONE_SEP3(atLeastOneSep("ALS3"));
          this.AT_LEAST_ONE_SEP4(atLeastOneSep("ALS4"));
          this.AT_LEAST_ONE_SEP5(atLeastOneSep("ALS5"));
          this.AT_LEAST_ONE_SEP6(atLeastOneSep("ALS6"));
          this.AT_LEAST_ONE_SEP7(atLeastOneSep("ALS7"));
          this.AT_LEAST_ONE_SEP8(atLeastOneSep("ALS8"));
          this.AT_LEAST_ONE_SEP9(atLeastOneSep("ALS9"));
          return hits;
        });
      }

      for (const explicitPSA of [false, true]) {
        const parser = new NumberedWrappersParser(explicitPSA);

        parser.input = [
          tok("C4"),
          tok("C5"),
          tok("C6"),
          tok("C7"),
          tok("C8"),
          tok("C9"),
        ];
        parser.consumeRule();
        expect(parser.errors).to.be.empty;

        parser.input = [
          tok("S2"),
          tok("S3"),
          tok("S4"),
          tok("S5"),
          tok("S6"),
          tok("S7"),
          tok("S8"),
          tok("S9"),
        ];
        parser.subruleRule();
        expect(parser.errors).to.be.empty;

        parser.input = [
          tok("O1"),
          tok("O3"),
          tok("O4"),
          tok("O5"),
          tok("O6"),
          tok("O7"),
          tok("O8"),
          tok("O9"),
        ];
        expect(parser.optionRule()).to.deep.equal([
          "1",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
        ]);
        expect(parser.errors).to.be.empty;

        parser.input = [
          tok("OR1A"),
          tok("OR2A"),
          tok("OR3A"),
          tok("OR4A"),
          tok("OR5A"),
          tok("OR6A"),
          tok("OR7A"),
          tok("OR8A"),
          tok("OR9A"),
        ];
        expect(parser.orRule()).to.deep.equal([
          "1A",
          "2A",
          "3A",
          "4A",
          "5A",
          "6A",
          "7A",
          "8A",
          "9A",
        ]);
        expect(parser.errors).to.be.empty;

        parser.input = [
          tok("M1"),
          tok("M2"),
          tok("M3"),
          tok("M4"),
          tok("M5"),
          tok("M6"),
          tok("M7"),
          tok("M8"),
          tok("M9"),
        ];
        expect(parser.manyRule()).to.equal(9);
        expect(parser.errors).to.be.empty;

        parser.input = [
          tok("MS0"),
          tok("Sep"),
          tok("MS0"),
          tok("MS1"),
          tok("Sep"),
          tok("MS1"),
          tok("MS2"),
          tok("Sep"),
          tok("MS2"),
          tok("MS3"),
          tok("Sep"),
          tok("MS3"),
          tok("MS4"),
          tok("Sep"),
          tok("MS4"),
          tok("MS5"),
          tok("Sep"),
          tok("MS5"),
          tok("MS6"),
          tok("Sep"),
          tok("MS6"),
          tok("MS7"),
          tok("Sep"),
          tok("MS7"),
          tok("MS8"),
          tok("Sep"),
          tok("MS8"),
          tok("MS9"),
          tok("Sep"),
          tok("MS9"),
        ];
        expect(parser.manySepRule()).to.equal(20);
        expect(parser.errors).to.be.empty;

        parser.input = [
          tok("ALO"),
          tok("AL1"),
          tok("AL2"),
          tok("AL3"),
          tok("AL4"),
          tok("AL5"),
          tok("AL6"),
          tok("AL7"),
          tok("AL8"),
          tok("AL9"),
        ];
        expect(parser.atLeastOneRule()).to.equal(10);
        expect(parser.errors).to.be.empty;

        parser.input = [
          tok("ALS0"),
          tok("Sep"),
          tok("ALS0"),
          tok("ALS1"),
          tok("Sep"),
          tok("ALS1"),
          tok("ALS2"),
          tok("Sep"),
          tok("ALS2"),
          tok("ALS3"),
          tok("Sep"),
          tok("ALS3"),
          tok("ALS4"),
          tok("Sep"),
          tok("ALS4"),
          tok("ALS5"),
          tok("Sep"),
          tok("ALS5"),
          tok("ALS6"),
          tok("Sep"),
          tok("ALS6"),
          tok("ALS7"),
          tok("Sep"),
          tok("ALS7"),
          tok("ALS8"),
          tok("Sep"),
          tok("ALS8"),
          tok("ALS9"),
          tok("Sep"),
          tok("ALS9"),
        ];
        expect(parser.atLeastOneSepRule()).to.equal(20);
        expect(parser.errors).to.be.empty;
      }
    });

    it("covers lazy SmartParser OR dispatch variants", () => {
      const LL1A = createToken({ name: "LL1A" });
      const LL1B = createToken({ name: "LL1B" });
      const ManagedA = createToken({ name: "ManagedA" });
      const ManagedB = createToken({ name: "ManagedB" });
      const GateTok = createToken({ name: "GateTok" });
      const GateManagedTok = createToken({ name: "GateManagedTok" });
      const TailTok = createToken({ name: "TailTok" });
      const allTokens = [
        LL1A,
        LL1B,
        ManagedA,
        ManagedB,
        GateTok,
        GateManagedTok,
        TailTok,
      ];
      augmentTokenTypes(allTokens);

      class LazyOrDispatchParser extends SmartParser {
        public chooseFirst = true;

        constructor() {
          super(allTokens, { skipValidations: true });
        }

        public ll1Simple = this.RULE("ll1Simple", () => {
          return this.OR1([
            { ALT: () => (this.CONSUME(LL1A), "A") },
            { ALT: () => (this.CONSUME(LL1B), "B") },
          ]);
        });

        public ll1Managed = this.RULE("ll1Managed", () => {
          return this.OR2([
            {
              ALT: () => {
                this.CONSUME(ManagedA);
                this.OPTION(() => this.CONSUME(TailTok));
                return "managedA";
              },
            },
            {
              ALT: () => {
                this.CONSUME(ManagedB);
                this.OPTION(() => this.CONSUME(TailTok));
                return "managedB";
              },
            },
          ]);
        });

        public gatedSimple = this.RULE("gatedSimple", () => {
          return this.OR3([
            {
              GATE: () => this.chooseFirst,
              ALT: () => {
                this.CONSUME(GateTok);
                return "gated-first";
              },
            },
            {
              ALT: () => {
                this.CONSUME(GateTok);
                return "gated-second";
              },
            },
          ]);
        });

        public gatedManaged = this.RULE("gatedManaged", () => {
          const result = this.OR4([
            {
              GATE: () => this.chooseFirst,
              ALT: () => {
                this.CONSUME(GateManagedTok);
                return "managed-first";
              },
            },
            {
              ALT: () => {
                this.CONSUME(GateManagedTok);
                return "managed-second";
              },
            },
          ]);
          this.OPTION9(() => this.CONSUME(TailTok));
          return result;
        });
      }

      const parser = new LazyOrDispatchParser();

      parser.input = [createRegularToken(LL1A)];
      expect(parser.ll1Simple()).to.equal("A");
      parser.input = [createRegularToken(LL1B)];
      expect(parser.ll1Simple()).to.equal("B");

      parser.input = [createRegularToken(ManagedA)];
      expect(parser.ll1Managed()).to.equal("managedA");
      parser.input = [createRegularToken(ManagedB)];
      expect(parser.ll1Managed()).to.equal("managedB");

      parser.chooseFirst = true;
      parser.input = [createRegularToken(GateTok)];
      expect(parser.gatedSimple()).to.equal("gated-first");
      parser.chooseFirst = false;
      parser.input = [createRegularToken(GateTok)];
      expect(parser.gatedSimple()).to.equal("gated-second");

      parser.chooseFirst = true;
      parser.input = [createRegularToken(GateManagedTok)];
      expect(parser.gatedManaged()).to.equal("managed-first");
      parser.chooseFirst = false;
      parser.input = [createRegularToken(GateManagedTok)];
      expect(parser.gatedManaged()).to.equal("managed-second");

      expect(parser.errors).to.be.empty;
    });

    it("supports SmartParser OR options objects", () => {
      const A = createToken({ name: "ObjA" });
      const B = createToken({ name: "ObjB" });
      augmentTokenTypes([A, B]);

      class OrOptsParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super([A, B], { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public rule = this.RULE("rule", () => {
          return this.OR1({
            MAX_LOOKAHEAD: 1,
            DEF: [
              { ALT: () => (this.CONSUME(A), "A") },
              { ALT: () => (this.CONSUME(B), "B") },
            ],
          });
        });
      }

      for (const explicitPSA of [false, true]) {
        const parser = new OrOptsParser(explicitPSA);
        parser.input = [createRegularToken(B)];
        expect(parser.rule()).to.equal("B");
        expect(parser.errors).to.be.empty;
      }
    });

    it("rolls back failed later AT_LEAST_ONE iterations", () => {
      const A = createToken({ name: "IterA" });
      const allTokens = [A];
      augmentTokenTypes(allTokens);

      class RepetitionRollbackParser extends SmartParser {
        constructor() {
          super(allTokens, { skipValidations: true });
        }

        public rule = this.RULE("rule", () => {
          let hits = 0;
          this.AT_LEAST_ONE1(() => {
            this.CONSUME(A);
            if (hits > 0 && !this.RECORDING_PHASE && !this.IS_SPECULATING) {
              throw new MismatchedTokenException(
                "forced rollback",
                this.LA(1),
                this.LA(0),
              );
            }
            hits++;
          });
          return hits;
        });
      }

      const parser = new RepetitionRollbackParser();
      parser.input = [createRegularToken(A), createRegularToken(A)];

      expect(parser.rule()).to.equal(1);
      expect(parser.errors).to.have.lengthOf(1);
      expect(parser.errors[0].name).to.equal("NotAllInputParsedException");
    });

    it("raises early exit when the first AT_LEAST_ONE_SEP body fails", () => {
      const A = createToken({ name: "SepA" });
      const Comma = createToken({ name: "SepComma" });
      const allTokens = [A, Comma];
      augmentTokenTypes(allTokens);

      class RepetitionSepFailureParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public rule = this.RULE("rule", () => {
          this.AT_LEAST_ONE_SEP1({
            SEP: Comma,
            DEF: () => {
              this.CONSUME(A);
              if (!this.RECORDING_PHASE && !this.IS_SPECULATING) {
                throw new MismatchedTokenException(
                  "forced first-body failure",
                  this.LA(1),
                  this.LA(0),
                );
              }
            },
          });
        });
      }

      for (const explicitPSA of [false, true]) {
        const parser = new RepetitionSepFailureParser(explicitPSA);
        parser.input = [createRegularToken(A)];
        expect(parser.rule()).to.be.undefined;
        expect(parser.errors).to.have.lengthOf(1);
        expect(parser.errors[0].name).to.equal("EarlyExitException");
      }
    });

    it("rethrows non-recognition errors from later AT_LEAST_ONE iterations", () => {
      const A = createToken({ name: "ThrowIterA" });
      const allTokens = [A];
      augmentTokenTypes(allTokens);

      class ThrowingRepetitionParser extends SmartParser {
        constructor() {
          super(allTokens, { skipValidations: true });
        }

        public rule = this.RULE("rule", () => {
          let hits = 0;
          this.AT_LEAST_ONE1(() => {
            this.CONSUME(A);
            if (hits > 0 && !this.RECORDING_PHASE && !this.IS_SPECULATING) {
              throw new Error("later iteration failure");
            }
            hits++;
          });
          return hits;
        });
      }

      const parser = new ThrowingRepetitionParser();
      parser.input = [createRegularToken(A), createRegularToken(A)];
      expect(() => parser.rule()).to.throw("later iteration failure");
    });

    it("bails out of AT_LEAST_ONE when a later iteration makes no progress", () => {
      const A = createToken({ name: "NoProgressA" });
      const allTokens = [A];
      augmentTokenTypes(allTokens);

      class NoProgressRepetitionParser extends SmartParser {
        constructor() {
          super(allTokens, { skipValidations: true });
        }

        public rule = this.RULE("rule", () => {
          let realHits = 0;
          this.AT_LEAST_ONE1(() => {
            if (realHits === 0) {
              this.CONSUME(A);
            }
            if (!this.IS_SPECULATING) {
              realHits++;
            }
          });
          return realHits;
        });
      }

      const parser = new NoProgressRepetitionParser();
      parser.input = [createRegularToken(A)];
      const result = parser.rule();
      expect(result).to.be.greaterThan(0);
      expect(result).to.be.lessThan(10);
      if (parser.errors.length > 0) {
        expect(parser.errors[0].name).to.equal("NotAllInputParsedException");
      }
    });

    it("rethrows non-recognition errors from the first AT_LEAST_ONE_SEP body", () => {
      const A = createToken({ name: "ThrowSepA" });
      const Comma = createToken({ name: "ThrowSepComma" });
      const allTokens = [A, Comma];
      augmentTokenTypes(allTokens);

      class ThrowingSepParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public rule = this.RULE("rule", () => {
          this.AT_LEAST_ONE_SEP1({
            SEP: Comma,
            DEF: () => {
              this.CONSUME(A);
              if (!this.RECORDING_PHASE && !this.IS_SPECULATING) {
                throw new Error("first body failure");
              }
            },
          });
        });
      }

      for (const explicitPSA of [false, true]) {
        const parser = new ThrowingSepParser(explicitPSA);
        parser.input = [createRegularToken(A)];
        expect(() => parser.rule()).to.throw("first body failure");
      }
    });

    it("handles gated AT_LEAST_ONE prefixes during speculative OR dispatch", () => {
      const A = createToken({ name: "GateAl1A" });
      const allTokens = [A];
      augmentTokenTypes(allTokens);

      class GatedAtLeastOneOrParser extends SmartParser {
        public allowFirst = false;

        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public rule = this.RULE("rule", () => {
          return this.OR1([
            {
              ALT: () => {
                this.AT_LEAST_ONE1({
                  GATE: () => this.allowFirst,
                  DEF: () => this.CONSUME(A),
                });
                return "first";
              },
            },
            { ALT: () => (this.CONSUME(A), "second") },
          ]);
        });
      }

      for (const explicitPSA of [false, true]) {
        const parser = new GatedAtLeastOneOrParser(explicitPSA);
        parser.allowFirst = false;
        parser.input = [createRegularToken(A)];
        expect(parser.rule()).to.be.undefined;
        expect(parser.errors).to.have.lengthOf(1);
        expect(parser.errors[0].name).to.equal("EarlyExitException");
      }
    });

    it("raises early exit when the first AT_LEAST_ONE body fails", () => {
      const A = createToken({ name: "Al1FailA" });
      const allTokens = [A];
      augmentTokenTypes(allTokens);

      class AtLeastOneFailureParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public rule = this.RULE("rule", () => {
          this.AT_LEAST_ONE1(() => {
            this.CONSUME(A);
            if (!this.RECORDING_PHASE && !this.IS_SPECULATING) {
              throw new MismatchedTokenException(
                "forced first-body failure",
                this.LA(1),
                this.LA(0),
              );
            }
          });
        });
      }

      for (const explicitPSA of [false, true]) {
        const parser = new AtLeastOneFailureParser(explicitPSA);
        parser.input = [createRegularToken(A)];
        expect(parser.rule()).to.be.undefined;
        expect(parser.errors).to.have.lengthOf(1);
        expect(parser.errors[0].name).to.equal("EarlyExitException");
      }
    });

    it("rethrows non-recognition errors from the first AT_LEAST_ONE body", () => {
      const A = createToken({ name: "ThrowAl1A" });
      const allTokens = [A];
      augmentTokenTypes(allTokens);

      class ThrowingAtLeastOneParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public rule = this.RULE("rule", () => {
          this.AT_LEAST_ONE1(() => {
            this.CONSUME(A);
            if (!this.RECORDING_PHASE && !this.IS_SPECULATING) {
              throw new Error("first atLeastOne body failure");
            }
          });
        });
      }

      for (const explicitPSA of [false, true]) {
        const parser = new ThrowingAtLeastOneParser(explicitPSA);
        parser.input = [createRegularToken(A)];
        expect(() => parser.rule()).to.throw("first atLeastOne body failure");
      }
    });

    it("rethrows non-recognition errors from OPTION bodies", () => {
      const A = createToken({ name: "OptionThrowA" });
      const allTokens = [A];
      augmentTokenTypes(allTokens);

      class ThrowingOptionParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public rule = this.RULE("rule", () => {
          this.OPTION1(() => {
            this.CONSUME(A);
            if (!this.RECORDING_PHASE && !this.IS_SPECULATING) {
              throw new Error("option body failure");
            }
          });
        });
      }

      for (const explicitPSA of [false, true]) {
        const parser = new ThrowingOptionParser(explicitPSA);
        parser.input = [createRegularToken(A)];
        expect(() => parser.rule()).to.throw("option body failure");
      }
    });

    it("rolls back failed precomputed OPTION bodies", () => {
      const A = createToken({ name: "OptionRollbackA" });
      const allTokens = [A];
      augmentTokenTypes(allTokens);

      class RollingBackOptionParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public rule = this.RULE("rule", () => {
          this.OPTION1(() => {
            this.CONSUME(A);
            if (!this.RECORDING_PHASE && !this.IS_SPECULATING) {
              throw new MismatchedTokenException(
                "option rollback failure",
                this.LA(1),
                this.LA(0),
              );
            }
          });
          this.CONSUME1(A);
        });
      }

      for (const explicitPSA of [false, true]) {
        const parser = new RollingBackOptionParser(explicitPSA);
        parser.input = [createRegularToken(A)];
        expect(parser.rule()).to.be.undefined;
        expect(parser.errors).to.be.empty;
      }
    });

    it("skips precomputed OPTION paths when lookahead does not match", () => {
      const A = createToken({ name: "OptionSkipA" });
      const B = createToken({ name: "OptionSkipB" });
      const allTokens = [A, B];
      augmentTokenTypes(allTokens);

      class SkippingOptionParser extends SmartParser {
        constructor() {
          super(allTokens, { skipValidations: true });
          this.performSelfAnalysis();
        }

        public rule = this.RULE("rule", () => {
          const maybe = this.OPTION1(() => {
            this.CONSUME(A);
            return "took-option";
          });
          this.CONSUME1(B);
          return maybe;
        });
      }

      const parser = new SkippingOptionParser();
      parser.input = [createRegularToken(B)];
      expect(parser.rule()).to.be.undefined;
      expect(parser.errors).to.be.empty;
    });

    it("treats non-consuming OPTION bodies consistently with and without PSA", () => {
      const A = createToken({ name: "OptionNoProgressA" });
      const allTokens = [A];
      augmentTokenTypes(allTokens);

      class NoProgressOptionParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public rule = this.RULE("rule", () => {
          const maybe = this.OPTION1(() => {
            // No token consumed on purpose.
            return "should-rollback";
          });
          this.CONSUME1(A);
          return maybe;
        });
      }

      for (const explicitPSA of [false, true]) {
        const parser = new NoProgressOptionParser(explicitPSA);
        parser.input = [createRegularToken(A)];
        expect(parser.rule()).to.equal("should-rollback");
        expect(parser.errors).to.be.empty;
      }
    });

    it("honors closed OPTION gates with and without PSA", () => {
      const A = createToken({ name: "OptionGateA" });
      const allTokens = [A];
      augmentTokenTypes(allTokens);

      class GatedOptionParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public rule = this.RULE("rule", () => {
          const maybe = this.OPTION1({
            GATE: () => false,
            DEF: () => {
              this.CONSUME(A);
              return "took-option";
            },
          });
          this.CONSUME1(A);
          return maybe;
        });
      }

      for (const explicitPSA of [false, true]) {
        const parser = new GatedOptionParser(explicitPSA);
        parser.input = [createRegularToken(A)];
        expect(parser.rule()).to.be.undefined;
        expect(parser.errors).to.be.empty;
      }
    });

    it("reuses lazy-built OPTION lookahead across parses without explicit PSA", () => {
      const A = createToken({ name: "OptionReuseA" });
      const B = createToken({ name: "OptionReuseB" });
      const allTokens = [A, B];
      augmentTokenTypes(allTokens);

      class ReusedOptionParser extends SmartParser {
        constructor() {
          super(allTokens, { skipValidations: true });
        }

        public rule = this.RULE("rule", () => {
          const maybe = this.OPTION1(() => {
            this.CONSUME(A);
            return "took-option";
          });
          this.CONSUME1(B);
          return maybe;
        });
      }

      const parser = new ReusedOptionParser();

      parser.input = [createRegularToken(A), createRegularToken(B)];
      expect(parser.rule()).to.equal("took-option");
      expect(parser.errors).to.be.empty;

      parser.input = [createRegularToken(B)];
      expect(parser.rule()).to.be.undefined;
      expect(parser.errors).to.be.empty;
    });

    it("rolls back a failed first MANY_SEP body", () => {
      const A = createToken({ name: "ManySepFailA" });
      const Comma = createToken({ name: "ManySepFailComma" });
      const allTokens = [A, Comma];
      augmentTokenTypes(allTokens);

      class ManySepFailureParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public rule = this.RULE("rule", () => {
          this.MANY_SEP1({
            SEP: Comma,
            DEF: () => {
              this.CONSUME(A);
              if (!this.RECORDING_PHASE && !this.IS_SPECULATING) {
                throw new MismatchedTokenException(
                  "forced MANY_SEP failure",
                  this.LA(1),
                  this.LA(0),
                );
              }
            },
          });
          this.CONSUME1(A);
        });
      }

      for (const explicitPSA of [false, true]) {
        const parser = new ManySepFailureParser(explicitPSA);
        parser.input = [createRegularToken(A)];
        expect(parser.rule()).to.be.undefined;
        expect(parser.errors).to.be.empty;
      }
    });

    it("bails out of MANY_SEP when the first body makes no progress", () => {
      const A = createToken({ name: "ManySepNoProgressA" });
      const Comma = createToken({ name: "ManySepNoProgressComma" });
      const allTokens = [A, Comma];
      augmentTokenTypes(allTokens);

      class ManySepNoProgressParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public rule = this.RULE("rule", () => {
          this.MANY_SEP1({
            SEP: Comma,
            DEF: () => {
              // No token consumed on purpose.
            },
          });
          this.CONSUME1(A);
        });
      }

      for (const explicitPSA of [false, true]) {
        const parser = new ManySepNoProgressParser(explicitPSA);
        parser.input = [createRegularToken(A)];
        expect(parser.rule()).to.be.undefined;
        expect(parser.errors).to.be.empty;
      }
    });

    it("bails out of MANY when an iteration makes no progress", () => {
      const A = createToken({ name: "ManyNoProgressA" });
      const allTokens = [A];
      augmentTokenTypes(allTokens);

      class ManyNoProgressParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public rule = this.RULE("rule", () => {
          this.MANY1(() => {
            // No token consumed on purpose.
          });
          this.CONSUME1(A);
        });
      }

      for (const explicitPSA of [false, true]) {
        const parser = new ManyNoProgressParser(explicitPSA);
        parser.input = [createRegularToken(A)];
        expect(parser.rule()).to.be.undefined;
        expect(parser.errors).to.be.empty;
      }
    });

    it("rethrows non-recognition errors from the first MANY_SEP body", () => {
      const A = createToken({ name: "ManySepThrowA" });
      const Comma = createToken({ name: "ManySepThrowComma" });
      const allTokens = [A, Comma];
      augmentTokenTypes(allTokens);

      class ManySepThrowingParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public rule = this.RULE("rule", () => {
          this.MANY_SEP1({
            SEP: Comma,
            DEF: () => {
              this.CONSUME(A);
              if (!this.RECORDING_PHASE && !this.IS_SPECULATING) {
                throw new Error("first MANY_SEP body failure");
              }
            },
          });
        });
      }

      for (const explicitPSA of [false, true]) {
        const parser = new ManySepThrowingParser(explicitPSA);
        parser.input = [createRegularToken(A)];
        expect(() => parser.rule()).to.throw("first MANY_SEP body failure");
      }
    });

    it("marks gated prefixes for speculative AT_LEAST_ONE probes", () => {
      const A = createToken({ name: "GateProbeA" });
      const allTokens = [A];
      augmentTokenTypes(allTokens);

      class GatedProbeParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public probeGateMarker(): { anyPrefix: boolean; gatedPrefix: boolean } {
          const startLexPos = this.exportLexerState();
          const prevSpeculating = this.IS_SPECULATING;
          const prevAltStart = this._orAltStartLexPos;
          const prevAnyPrefix = this._orAltHasAnyPrefix;
          const prevGatedPrefix = this._orAltHasGatedPrefix;

          this.IS_SPECULATING = true;
          this._orAltStartLexPos = startLexPos;
          this._orAltHasAnyPrefix = false;
          this._orAltHasGatedPrefix = false;

          try {
            expect(() =>
              this.atLeastOneInternalLogic(1, {
                GATE: () => false,
                DEF: () => this.CONSUME(A),
              }),
            ).to.throw();

            return {
              anyPrefix: this._orAltHasAnyPrefix,
              gatedPrefix: this._orAltHasGatedPrefix,
            };
          } finally {
            this.IS_SPECULATING = prevSpeculating;
            this._orAltStartLexPos = prevAltStart;
            this._orAltHasAnyPrefix = prevAnyPrefix;
            this._orAltHasGatedPrefix = prevGatedPrefix;
          }
        }
      }

      for (const explicitPSA of [false, true]) {
        const parser = new GatedProbeParser(explicitPSA);
        parser.input = [createRegularToken(A)];
        expect(parser.probeGateMarker()).to.deep.equal({
          anyPrefix: true,
          gatedPrefix: true,
        });
      }
    });

    it("marks gated prefixes for speculative MANY probes", () => {
      const A = createToken({ name: "ManyGateProbeA" });
      const allTokens = [A];
      augmentTokenTypes(allTokens);

      class GatedManyProbeParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public probeGateMarker(): { anyPrefix: boolean; gatedPrefix: boolean } {
          const startLexPos = this.exportLexerState();
          const prevSpeculating = this.IS_SPECULATING;
          const prevAltStart = this._orAltStartLexPos;
          const prevAnyPrefix = this._orAltHasAnyPrefix;
          const prevGatedPrefix = this._orAltHasGatedPrefix;

          this.IS_SPECULATING = true;
          this._orAltStartLexPos = startLexPos;
          this._orAltHasAnyPrefix = false;
          this._orAltHasGatedPrefix = false;

          try {
            this.manyInternalLogic(1, {
              GATE: () => false,
              DEF: () => this.CONSUME(A),
            });
            return {
              anyPrefix: this._orAltHasAnyPrefix,
              gatedPrefix: this._orAltHasGatedPrefix,
            };
          } finally {
            this.IS_SPECULATING = prevSpeculating;
            this._orAltStartLexPos = prevAltStart;
            this._orAltHasAnyPrefix = prevAnyPrefix;
            this._orAltHasGatedPrefix = prevGatedPrefix;
          }
        }
      }

      for (const explicitPSA of [false, true]) {
        const parser = new GatedManyProbeParser(explicitPSA);
        parser.input = [createRegularToken(A)];
        expect(parser.probeGateMarker()).to.deep.equal({
          anyPrefix: true,
          gatedPrefix: true,
        });
      }
    });

    it("rethrows speculative MANY recognition errors after progress", () => {
      const A = createToken({ name: "ManySpecThrowA" });
      const allTokens = [A];
      augmentTokenTypes(allTokens);

      class ThrowingManyProbeParser extends SmartParser {
        constructor(explicitPSA: boolean) {
          super(allTokens, { skipValidations: true });
          if (explicitPSA) {
            this.performSelfAnalysis();
          }
        }

        public probeRecognitionThrow(): void {
          const prevSpeculating = this.IS_SPECULATING;
          this.IS_SPECULATING = true;
          try {
            this.manyInternalLogic(1, () => {
              this.CONSUME(A);
              throw new MismatchedTokenException(
                "spec MANY recognition failure",
                this.LA(1),
                this.LA(0),
              );
            });
          } finally {
            this.IS_SPECULATING = prevSpeculating;
          }
        }

        public probeErrorThrow(): void {
          const prevSpeculating = this.IS_SPECULATING;
          this.IS_SPECULATING = true;
          try {
            this.manyInternalLogic(1, () => {
              this.CONSUME(A);
              throw new Error("spec MANY non-recognition failure");
            });
          } finally {
            this.IS_SPECULATING = prevSpeculating;
          }
        }

        public probeNoProgress(): { before: number; after: number } {
          const prevSpeculating = this.IS_SPECULATING;
          const before = this.currIdx;
          this.IS_SPECULATING = true;
          try {
            this.manyInternalLogic(1, () => {
              // No token consumed on purpose.
            });
            return { before, after: this.currIdx };
          } finally {
            this.IS_SPECULATING = prevSpeculating;
          }
        }

        public probeRecognitionRollback(): { before: number; after: number } {
          const prevSpeculating = this.IS_SPECULATING;
          const before = this.currIdx;
          this.IS_SPECULATING = true;
          try {
            this.manyInternalLogic(1, () => {
              throw new MismatchedTokenException(
                "spec MANY rollback",
                this.LA(1),
                this.LA(0),
              );
            });
            return { before, after: this.currIdx };
          } finally {
            this.IS_SPECULATING = prevSpeculating;
          }
        }

        public probeOptionNoProgress(): { before: number; after: number } {
          const before = this.currIdx;
          const result = this.optionInternalLogic(() => undefined, 9_999);
          expect(result).to.be.undefined;
          return { before, after: this.currIdx };
        }

        public probeOptionGateClosed(): { before: number; after: number } {
          const before = this.currIdx;
          const result = this.optionInternalLogic(
            {
              GATE: () => false,
              DEF: () => {
                this.CONSUME(A);
                return "gated-option";
              },
            },
            9_998,
          );
          expect(result).to.be.undefined;
          return { before, after: this.currIdx };
        }

        public probeOptionPrecomputedFalse(): {
          before: number;
          after: number;
        } {
          const before = this.currIdx;
          const optLaKey = this.currRuleShortName | OPTION_IDX | 9_997;
          this._prodLookahead[optLaKey] = () => false;
          const result = this.optionInternalLogic(() => {
            this.CONSUME(A);
            return "wrong-lookahead";
          }, 9_997);
          expect(result).to.be.undefined;
          return { before, after: this.currIdx };
        }

        public probeOptionPrecomputedRollback(): {
          before: number;
          after: number;
        } {
          const before = this.currIdx;
          const optLaKey = this.currRuleShortName | OPTION_IDX | 9_996;
          this._prodLookahead[optLaKey] = () => true;
          const result = this.optionInternalLogic(() => {
            this.CONSUME(A);
            throw new MismatchedTokenException(
              "direct OPTION rollback",
              this.LA(1),
              this.LA(0),
            );
          }, 9_996);
          expect(result).to.be.undefined;
          return { before, after: this.currIdx };
        }

        public probeOptionLazyBuildSuccess(): {
          result: string | undefined;
          before: number;
          after: number;
        } {
          const before = this.currIdx;
          const optLaKey = this.currRuleShortName | OPTION_IDX | 9_995;
          delete this._prodLookahead[optLaKey];
          const result = this.optionInternalLogic(() => {
            this.CONSUME(A);
            return "lazy-built-option";
          }, 9_995);
          return {
            result,
            before,
            after: this.currIdx,
          };
        }

        public probeOptionThrow(): void {
          this.optionInternalLogic(() => {
            throw new Error("direct OPTION failure");
          }, 9_999);
        }
      }

      for (const explicitPSA of [false, true]) {
        const recognitionParser = new ThrowingManyProbeParser(explicitPSA);
        recognitionParser.input = [createRegularToken(A)];
        expect(() => recognitionParser.probeRecognitionThrow()).to.throw(
          MismatchedTokenException,
        );

        const errorParser = new ThrowingManyProbeParser(explicitPSA);
        errorParser.input = [createRegularToken(A)];
        expect(() => errorParser.probeErrorThrow()).to.throw(
          "spec MANY non-recognition failure",
        );

        const noProgressParser = new ThrowingManyProbeParser(explicitPSA);
        noProgressParser.input = [createRegularToken(A)];
        const noProgress = noProgressParser.probeNoProgress();
        expect(noProgress.after).to.equal(noProgress.before);

        const rollbackParser = new ThrowingManyProbeParser(explicitPSA);
        rollbackParser.input = [createRegularToken(A)];
        const rollback = rollbackParser.probeRecognitionRollback();
        expect(rollback.after).to.equal(rollback.before);

        const optionNoProgressParser = new ThrowingManyProbeParser(explicitPSA);
        optionNoProgressParser.input = [createRegularToken(A)];
        const optionNoProgress = optionNoProgressParser.probeOptionNoProgress();
        expect(optionNoProgress.after).to.equal(optionNoProgress.before);

        const optionGateParser = new ThrowingManyProbeParser(explicitPSA);
        optionGateParser.input = [createRegularToken(A)];
        const optionGateClosed = optionGateParser.probeOptionGateClosed();
        expect(optionGateClosed.after).to.equal(optionGateClosed.before);

        const optionFalseParser = new ThrowingManyProbeParser(explicitPSA);
        optionFalseParser.input = [createRegularToken(A)];
        const optionFalse = optionFalseParser.probeOptionPrecomputedFalse();
        expect(optionFalse.after).to.equal(optionFalse.before);

        const optionRollbackParser = new ThrowingManyProbeParser(explicitPSA);
        optionRollbackParser.input = [createRegularToken(A)];
        const optionRollback =
          optionRollbackParser.probeOptionPrecomputedRollback();
        expect(optionRollback.after).to.equal(optionRollback.before);

        const optionLazyParser = new ThrowingManyProbeParser(explicitPSA);
        optionLazyParser.input = [createRegularToken(A)];
        const optionLazy = optionLazyParser.probeOptionLazyBuildSuccess();
        expect(optionLazy.result).to.equal("lazy-built-option");
        expect(optionLazy.after).to.equal(optionLazy.before + 1);

        const optionThrowParser = new ThrowingManyProbeParser(explicitPSA);
        optionThrowParser.input = [createRegularToken(A)];
        expect(() => optionThrowParser.probeOptionThrow()).to.throw(
          "direct OPTION failure",
        );
      }
    });
  });
});
