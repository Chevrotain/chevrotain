import { createToken } from "../../src/scan/tokens_public.js";
import { EmbeddedActionsParser } from "../../src/parse/parser/traits/parser_traits.js";
import { createRegularToken } from "../utils/matchers.js";
import { IToken, TokenType } from "@chevrotain/types";
import { expect } from "chai";

describe("lookahead Regular Tokens Mode", () => {
  let OneTok: TokenType;
  let TwoTok: TokenType;
  let ThreeTok: TokenType;
  let FourTok: TokenType;
  let FiveTok: TokenType;
  let SixTok: TokenType;
  let SevenTok: TokenType;
  let EightTok: TokenType;
  let NineTok: TokenType;
  let TenTok: TokenType;
  let Comma: TokenType;

  let ALL_TOKENS: TokenType[];

  before(() => {
    OneTok = createToken({ name: "OneTok" });
    TwoTok = createToken({ name: "TwoTok" });
    ThreeTok = createToken({ name: "ThreeTok" });
    FourTok = createToken({ name: "FourTok" });
    FiveTok = createToken({ name: "FiveTok" });
    SixTok = createToken({ name: "SixTok" });
    SevenTok = createToken({ name: "SevenTok" });
    EightTok = createToken({ name: "EightTok" });
    NineTok = createToken({ name: "NineTok" });
    TenTok = createToken({ name: "TenTok" });
    Comma = createToken({ name: "Comma" });

    ALL_TOKENS = [
      OneTok,
      TwoTok,
      ThreeTok,
      FourTok,
      FiveTok,
      SixTok,
      SevenTok,
      EightTok,
      NineTok,
      Comma,
    ];
  });

  describe("The implicit lookahead calculation functionality of the Recognizer For OPTION", () => {
    class OptionsImplicitLookAheadParser extends EmbeddedActionsParser {
      constructor(input: IToken[] = []) {
        super(ALL_TOKENS, {});

        this.performSelfAnalysis();
        this.input = input;
      }

      public manyOptionsRule = this.RULE(
        "manyOptionsRule",
        this.parseManyOptionsRule,
      );

      private parseManyOptionsRule(): string {
        let total = "";

        this.OPTION8(() => {
          this.CONSUME1(OneTok);
          total += "1";
        });

        this.OPTION9(() => {
          this.CONSUME1(TwoTok);
          total += "2";
        });

        this.OPTION3(() => {
          this.CONSUME1(ThreeTok);
          total += "3";
        });

        this.OPTION4(() => {
          this.CONSUME1(FourTok);
          total += "4";
        });

        this.OPTION5(() => {
          this.CONSUME1(FiveTok);
          total += "5";
        });

        this.option(20, () => {
          this.CONSUME1(SixTok);
          total += "6";
        });

        return total;
      }
    }

    it("can automatically compute lookahead for OPTION1", () => {
      const input = [createRegularToken(OneTok)];
      const parser = new OptionsImplicitLookAheadParser(input);
      expect(parser.manyOptionsRule()).to.equal("1");
    });

    it("can automatically compute lookahead for OPTION2", () => {
      const input = [createRegularToken(TwoTok)];
      const parser = new OptionsImplicitLookAheadParser(input);
      expect(parser.manyOptionsRule()).to.equal("2");
    });

    it("can automatically compute lookahead for OPTION3", () => {
      const input = [createRegularToken(ThreeTok)];
      const parser = new OptionsImplicitLookAheadParser(input);
      expect(parser.manyOptionsRule()).to.equal("3");
    });

    it("can automatically compute lookahead for OPTION4", () => {
      const input = [createRegularToken(FourTok)];
      const parser = new OptionsImplicitLookAheadParser(input);
      expect(parser.manyOptionsRule()).to.equal("4");
    });

    it("can automatically compute lookahead for OPTION5", () => {
      const input = [createRegularToken(FiveTok)];
      const parser = new OptionsImplicitLookAheadParser(input);
      expect(parser.manyOptionsRule()).to.equal("5");
    });

    it("can automatically compute lookahead for option(idx, ...)", () => {
      const input = [createRegularToken(SixTok)];
      const parser = new OptionsImplicitLookAheadParser(input);
      expect(parser.manyOptionsRule()).to.equal("6");
    });
  });

  describe("The implicit lookahead calculation functionality of the Recognizer For MANY", () => {
    class ManyImplicitLookAheadParser extends EmbeddedActionsParser {
      constructor(input: IToken[] = []) {
        super(ALL_TOKENS, {});

        this.performSelfAnalysis();
        this.input = input;
      }

      public manyRule = this.RULE("manyRule", this.parseManyRule);

      private parseManyRule(): string {
        let total = "";

        this.MANY1(() => {
          this.CONSUME1(OneTok);
          total += "1";
        });

        this.MANY2(() => {
          this.CONSUME1(TwoTok);
          total += "2";
        });

        this.MANY3(() => {
          this.CONSUME1(ThreeTok);
          total += "3";
        });

        this.MANY4(() => {
          this.CONSUME1(FourTok);
          total += "4";
        });

        this.MANY5(() => {
          this.CONSUME1(FiveTok);
          total += "5";
        });

        this.MANY6(() => {
          this.CONSUME1(SixTok);
          total += "6";
        });

        this.MANY7(() => {
          this.CONSUME1(SevenTok);
          total += "7";
        });

        this.MANY8(() => {
          this.CONSUME1(EightTok);
          total += "8";
        });

        this.MANY9(() => {
          this.CONSUME1(NineTok);
          total += "9";
        });

        this.many(20, () => {
          this.CONSUME1(TenTok);
          total += "10";
        });

        return total;
      }
    }

    it("can automatically compute lookahead for MANY1", () => {
      const input = [createRegularToken(OneTok)];
      const parser = new ManyImplicitLookAheadParser(input);
      expect(parser.manyRule()).to.equal("1");
    });

    it("can automatically compute lookahead for MANY2", () => {
      const input = [createRegularToken(TwoTok)];
      const parser = new ManyImplicitLookAheadParser(input);
      expect(parser.manyRule()).to.equal("2");
    });

    it("can automatically compute lookahead for MANY3", () => {
      const input = [createRegularToken(ThreeTok)];
      const parser = new ManyImplicitLookAheadParser(input);
      expect(parser.manyRule()).to.equal("3");
    });

    it("can automatically compute lookahead for MANY4", () => {
      const input = [createRegularToken(FourTok)];
      const parser = new ManyImplicitLookAheadParser(input);
      expect(parser.manyRule()).to.equal("4");
    });

    it("can automatically compute lookahead for MANY5", () => {
      const input = [createRegularToken(FiveTok)];
      const parser = new ManyImplicitLookAheadParser(input);
      expect(parser.manyRule()).to.equal("5");
    });

    it("can automatically compute lookahead for MANY6", () => {
      const input = [createRegularToken(SixTok)];
      const parser = new ManyImplicitLookAheadParser(input);
      expect(parser.manyRule()).to.equal("6");
    });

    it("can automatically compute lookahead for MANY7", () => {
      const input = [createRegularToken(SevenTok)];
      const parser = new ManyImplicitLookAheadParser(input);
      expect(parser.manyRule()).to.equal("7");
    });

    it("can automatically compute lookahead for MANY8", () => {
      const input = [createRegularToken(EightTok)];
      const parser = new ManyImplicitLookAheadParser(input);
      expect(parser.manyRule()).to.equal("8");
    });

    it("can automatically compute lookahead for MANY9", () => {
      const input = [createRegularToken(NineTok)];
      const parser = new ManyImplicitLookAheadParser(input);
      expect(parser.manyRule()).to.equal("9");
    });

    it("can automatically compute lookahead for many(idx, ...)", () => {
      const input = [createRegularToken(TenTok)];
      const parser = new ManyImplicitLookAheadParser(input);
      expect(parser.manyRule()).to.equal("10");
    });

    it("can accept lookahead function param for flow mixing several MANYs", () => {
      const input = [
        createRegularToken(OneTok),
        createRegularToken(OneTok),
        createRegularToken(ThreeTok),
        createRegularToken(ThreeTok),
        createRegularToken(ThreeTok),
        createRegularToken(FiveTok),
      ];
      const parser = new ManyImplicitLookAheadParser(input);
      expect(parser.manyRule()).to.equal("113335");
    });
  });

  describe("The implicit lookahead calculation functionality of the Recognizer For MANY_SEP", () => {
    class ManySepImplicitLookAheadParser extends EmbeddedActionsParser {
      constructor(input: IToken[] = []) {
        super(ALL_TOKENS, {});

        this.performSelfAnalysis();
        this.input = input;
      }

      public manySepRule = this.RULE("manySepRule", this.parseManyRule);

      private parseManyRule(): any {
        let total = "";
        const separators: IToken[] = [];

        this.MANY_SEP1({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(OneTok);
            total += "1";
          },
        });

        this.MANY_SEP2({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(TwoTok);
            total += "2";
          },
        });

        this.MANY_SEP3({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(ThreeTok);
            total += "3";
          },
        });

        this.MANY_SEP4({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(FourTok);
            total += "4";
          },
        });

        this.MANY_SEP5({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(FiveTok);
            total += "5";
          },
        });

        this.MANY_SEP6({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(SixTok);
            total += "6";
          },
        });

        this.MANY_SEP7({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(SevenTok);
            total += "7";
          },
        });

        this.MANY_SEP8({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(EightTok);
            total += "8";
          },
        });

        this.MANY_SEP9({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(NineTok);
            total += "9";
          },
        });

        return {
          total: total,
          separators: separators,
        };
      }
    }

    it("can automatically compute lookahead for MANY_SEP1", () => {
      const input = [createRegularToken(OneTok)];
      const parser = new ManySepImplicitLookAheadParser(input);
      expect(parser.manySepRule().total).to.equal("1");
    });

    it("can automatically compute lookahead for MANY_SEP2", () => {
      const input = [createRegularToken(TwoTok)];
      const parser = new ManySepImplicitLookAheadParser(input);
      expect(parser.manySepRule().total).to.equal("2");
    });

    it("can automatically compute lookahead for MANY_SEP3", () => {
      const input = [createRegularToken(ThreeTok)];
      const parser = new ManySepImplicitLookAheadParser(input);
      expect(parser.manySepRule().total).to.equal("3");
    });

    it("can automatically compute lookahead for MANY_SEP4", () => {
      const input = [createRegularToken(FourTok)];
      const parser = new ManySepImplicitLookAheadParser(input);
      expect(parser.manySepRule().total).to.equal("4");
    });

    it("can automatically compute lookahead for MANY_SEP5", () => {
      const input = [createRegularToken(FiveTok)];
      const parser = new ManySepImplicitLookAheadParser(input);
      expect(parser.manySepRule().total).to.equal("5");
    });

    it("can automatically compute lookahead for MANY_SEP6", () => {
      const input = [createRegularToken(SixTok)];
      const parser = new ManySepImplicitLookAheadParser(input);
      expect(parser.manySepRule().total).to.equal("6");
    });

    it("can automatically compute lookahead for MANY_SEP7", () => {
      const input = [createRegularToken(SevenTok)];
      const parser = new ManySepImplicitLookAheadParser(input);
      expect(parser.manySepRule().total).to.equal("7");
    });

    it("can automatically compute lookahead for MANY_SEP8", () => {
      const input = [createRegularToken(EightTok)];
      const parser = new ManySepImplicitLookAheadParser(input);
      expect(parser.manySepRule().total).to.equal("8");
    });

    it("can automatically compute lookahead for MANY_SEP9", () => {
      const input = [createRegularToken(NineTok)];
      const parser = new ManySepImplicitLookAheadParser(input);
      expect(parser.manySepRule().total).to.equal("9");
    });

    it("can accept lookahead function param for flow mixing several MANY_SEPs", () => {
      const input = [
        createRegularToken(OneTok),
        createRegularToken(Comma),
        createRegularToken(OneTok),
        createRegularToken(ThreeTok),
        createRegularToken(Comma),
        createRegularToken(ThreeTok),
        createRegularToken(Comma),
        createRegularToken(ThreeTok),
        createRegularToken(FiveTok),
      ];
      const parser = new ManySepImplicitLookAheadParser(input);
      const result = parser.manySepRule();
      expect(result.total).to.equal("113335");
    });
  });

  describe("The implicit lookahead calculation functionality of the Recognizer For AT_LEAST_ONE", () => {
    class AtLeastOneImplicitLookAheadParser extends EmbeddedActionsParser {
      constructor(input: IToken[] = []) {
        super(ALL_TOKENS, {});

        this.performSelfAnalysis();
        this.input = input;
      }

      public atLeastOneRule = this.RULE(
        "atLeastOneRule",
        this.parseAtLeastOneRule,
        {
          recoveryValueFunc: () => {
            return "-666";
          },
        },
      );

      private parseAtLeastOneRule(): string {
        let total = "";

        this.AT_LEAST_ONE1(() => {
          this.CONSUME1(OneTok);
          total += "1";
        });

        this.AT_LEAST_ONE2(() => {
          this.CONSUME1(TwoTok);
          total += "2";
        });

        this.AT_LEAST_ONE3(() => {
          this.CONSUME1(ThreeTok);
          total += "3";
        });

        this.AT_LEAST_ONE4(() => {
          this.CONSUME1(FourTok);
          total += "4";
        });

        this.AT_LEAST_ONE5(() => {
          this.CONSUME1(FiveTok);
          total += "5";
        });

        this.AT_LEAST_ONE6(() => {
          this.CONSUME1(SixTok);
          total += "6";
        });

        this.AT_LEAST_ONE7(() => {
          this.CONSUME1(SevenTok);
          total += "7";
        });

        this.AT_LEAST_ONE8(() => {
          this.CONSUME1(EightTok);
          total += "8";
        });

        this.AT_LEAST_ONE9(() => {
          this.CONSUME1(NineTok);
          total += "9";
        });

        this.atLeastOne(32, () => {
          this.CONSUME1(TenTok);
          total += "10";
        });

        return total;
      }
    }

    it("can accept lookahead function param for AT_LEAST_ONE", () => {
      const input = [
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(FourTok),
        createRegularToken(FourTok),
        createRegularToken(FiveTok),
        createRegularToken(SixTok),
        createRegularToken(SevenTok),
        createRegularToken(EightTok),
        createRegularToken(EightTok),
        createRegularToken(EightTok),
        createRegularToken(NineTok),
        createRegularToken(TenTok),
      ];
      const parser = new AtLeastOneImplicitLookAheadParser(input);
      expect(parser.atLeastOneRule()).to.equal("122344567888910");
    });

    it("will fail when zero occurrences of AT_LEAST_ONE in input", () => {
      const input = [
        createRegularToken(OneTok),
        createRegularToken(TwoTok) /*createToken(ThreeTok),*/,
        createRegularToken(FourTok),
        createRegularToken(FiveTok),
      ];
      const parser = new AtLeastOneImplicitLookAheadParser(input);
      expect(parser.atLeastOneRule()).to.equal("-666");
    });
  });

  describe("The implicit lookahead calculation functionality of the Recognizer For AT_LEAST_ONE_SEP", () => {
    class AtLeastOneSepImplicitLookAheadParser extends EmbeddedActionsParser {
      constructor(input: IToken[] = []) {
        super(ALL_TOKENS, {});

        this.performSelfAnalysis();
        this.input = input;
      }

      public atLeastOneSepRule = this.RULE(
        "atLeastOneSepRule",
        this.parseAtLeastOneRule,
        {
          recoveryValueFunc: () => {
            return {
              total: "-666",
              separators: [],
            };
          },
        },
      );

      private parseAtLeastOneRule(): any {
        let total = "";
        const separators: IToken[] = [];

        this.AT_LEAST_ONE_SEP1({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(OneTok);
            total += "1";
          },
        });

        this.AT_LEAST_ONE_SEP2({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(TwoTok);
            total += "2";
          },
        });

        this.AT_LEAST_ONE_SEP3({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(ThreeTok);
            total += "3";
          },
        });

        this.AT_LEAST_ONE_SEP4({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(FourTok);
            total += "4";
          },
        });

        this.AT_LEAST_ONE_SEP5({
          SEP: Comma,
          DEF: () => {
            this.consume(72, FiveTok);
            total += "5";
          },
        });

        this.AT_LEAST_ONE_SEP6({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(SixTok);
            total += "6";
          },
        });

        this.AT_LEAST_ONE_SEP7({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(SevenTok);
            total += "7";
          },
        });

        this.AT_LEAST_ONE_SEP8({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(EightTok);
            total += "8";
          },
        });

        this.AT_LEAST_ONE_SEP9({
          SEP: Comma,
          DEF: () => {
            this.CONSUME1(NineTok);
            total += "9";
          },
        });

        return {
          total: total,
          separators: separators,
        };
      }
    }

    it("can accept lookahead function param for AT_LEAST_ONE_SEP", () => {
      const input = [
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(Comma),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(FourTok),
        createRegularToken(Comma),
        createRegularToken(FourTok),
        createRegularToken(FiveTok),
        createRegularToken(SixTok),
        createRegularToken(SevenTok),
        createRegularToken(Comma),
        createRegularToken(SevenTok),
        createRegularToken(Comma),
        createRegularToken(SevenTok),
        createRegularToken(EightTok),
        createRegularToken(NineTok),
      ];
      const parser = new AtLeastOneSepImplicitLookAheadParser(input);
      const parseResult = parser.atLeastOneSepRule();
      expect(parseResult.total).to.equal("1223445677789");
    });

    it("will fail when zero occurrences of AT_LEAST_ONE_SEP in input", () => {
      const input = [
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        /*createToken(ThreeTok),*/ createRegularToken(FourTok),
        createRegularToken(FiveTok),
      ];
      const parser = new AtLeastOneSepImplicitLookAheadParser(input);
      expect(parser.atLeastOneSepRule().total).to.equal("-666");
    });
  });

  describe("The implicit lookahead calculation functionality of the Recognizer For OR", () => {
    class OrImplicitLookAheadParser extends EmbeddedActionsParser {
      constructor(input: IToken[] = []) {
        super(ALL_TOKENS, {});

        this.performSelfAnalysis();
        this.input = input;
      }

      public orRule = this.RULE("orRule", this.parseOrRule, {
        recoveryValueFunc: () => "-666",
      });

      private parseOrRule(): string {
        let total = "";

        this.OR8([
          {
            ALT: () => {
              this.CONSUME1(OneTok);
              total += "A1";
            },
          },
          {
            ALT: () => {
              this.CONSUME1(TwoTok);
              total += "A2";
            },
          },
          {
            ALT: () => {
              this.CONSUME1(ThreeTok);
              total += "A3";
            },
          },
          {
            ALT: () => {
              this.CONSUME1(FourTok);
              total += "A4";
            },
          },
          {
            ALT: () => {
              this.CONSUME1(FiveTok);
              total += "A5";
            },
          },
        ]);

        this.OR2([
          {
            ALT: () => {
              this.CONSUME2(OneTok);
              total += "B1";
            },
          },
          {
            ALT: () => {
              this.CONSUME2(FourTok);
              total += "B4";
            },
          },
          {
            ALT: () => {
              this.CONSUME2(ThreeTok);
              total += "B3";
            },
          },
          {
            ALT: () => {
              this.CONSUME2(TwoTok);
              total += "B2";
            },
          },
          {
            ALT: () => {
              this.CONSUME2(FiveTok);
              total += "B5";
            },
          },
        ]);

        this.OR3([
          {
            ALT: () => {
              this.CONSUME3(TwoTok);
              total += "C2";
            },
          },
          {
            ALT: () => {
              this.CONSUME3(FourTok);
              total += "C4";
            },
          },
          {
            ALT: () => {
              this.CONSUME3(ThreeTok);
              total += "C3";
            },
          },
          {
            ALT: () => {
              this.CONSUME3(FiveTok);
              total += "C5";
            },
          },
          {
            ALT: () => {
              this.CONSUME3(OneTok);
              total += "C1";
            },
          },
        ]);

        this.OR4([
          {
            ALT: () => {
              this.CONSUME4(OneTok);
              total += "D1";
            },
          },
          {
            ALT: () => {
              this.CONSUME4(ThreeTok);
              total += "D3";
            },
          },
          {
            ALT: () => {
              this.CONSUME4(FourTok);
              total += "D4";
            },
          },
          {
            ALT: () => {
              this.CONSUME4(TwoTok);
              total += "D2";
            },
          },
          {
            ALT: () => {
              this.CONSUME4(FiveTok);
              total += "D5";
            },
          },
        ]);

        this.OR5([
          {
            ALT: () => {
              this.CONSUME5(TwoTok);
              total += "E2";
            },
          },
          {
            ALT: () => {
              this.CONSUME5(OneTok);
              total += "E1";
            },
          },
          {
            ALT: () => {
              this.CONSUME5(FourTok);
              total += "E4";
            },
          },
          {
            ALT: () => {
              this.CONSUME5(ThreeTok);
              total += "E3";
            },
          },
          {
            ALT: () => {
              this.CONSUME5(FiveTok);
              total += "E5";
            },
          },
        ]);

        this.or(45, [
          {
            ALT: () => {
              this.CONSUME6(TwoTok);
              total += "F2";
            },
          },
          {
            ALT: () => {
              this.CONSUME6(OneTok);
              total += "F1";
            },
          },
          {
            ALT: () => {
              this.CONSUME6(ThreeTok);
              total += "F3";
            },
          },
          {
            ALT: () => {
              this.CONSUME6(FourTok);
              total += "F4";
            },
          },
          {
            ALT: () => {
              this.consume(66, FiveTok);
              total += "F5";
            },
          },
        ]);

        return total;
      }
    }

    it("can compute the lookahead automatically for OR", () => {
      const input = [
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(FourTok),
        createRegularToken(FiveTok),
        createRegularToken(ThreeTok),
      ];
      const parser = new OrImplicitLookAheadParser(input);
      expect(parser.orRule()).to.equal("A1B2C3D4E5F3");
    });

    it("will fail when none of the alternatives match", () => {
      const input = [createRegularToken(SixTok)];
      const parser = new OrImplicitLookAheadParser(input);
      expect(parser.orRule()).to.equal("-666");
    });
  });

  describe("OR production ambiguity detection when using implicit lookahead calculation", () => {
    it("will throw an error when two alternatives have the same single token (lookahead 1) prefix", () => {
      class OrAmbiguityLookAheadParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {});

          this.performSelfAnalysis();
          this.input = input;
        }

        public ambiguityRule = this.RULE(
          "ambiguityRule",
          this.parseAmbiguityRule,
        );

        private parseAmbiguityRule(): void {
          this.OR1([
            {
              ALT: () => {
                this.CONSUME1(OneTok);
              },
            },
            // <-- this alternative starts with the same token as the previous one, ambiguity!
            {
              ALT: () => {
                this.CONSUME2(OneTok);
              },
            },
            {
              ALT: () => {
                this.CONSUME2(TwoTok);
              },
            },
            {
              ALT: () => {
                this.CONSUME2(ThreeTok);
              },
            },
          ]);
        }
      }

      expect(() => new OrAmbiguityLookAheadParser()).to.throw(
        "Ambiguous Alternatives Detected:",
      );
      expect(() => new OrAmbiguityLookAheadParser()).to.throw("OneTok");
    });

    it("will throw an error when two alternatives have the same multi token (lookahead > 1) prefix", () => {
      class OrAmbiguityMultiTokenLookAheadParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {});

          this.performSelfAnalysis();
          this.input = input;
        }

        public ambiguityRule = this.RULE(
          "ambiguityRule",
          this.parseAmbiguityRule,
        );

        private parseAmbiguityRule(): void {
          this.OR1([
            {
              ALT: () => {
                this.CONSUME1(OneTok);
              },
            },
            {
              ALT: () => {
                this.CONSUME1(TwoTok);
                this.CONSUME1(ThreeTok);
                this.CONSUME1(FourTok);
              },
            },
            {
              ALT: () => {
                this.CONSUME2(TwoTok);
                this.CONSUME2(ThreeTok);
                this.CONSUME2(FourTok);
              },
            },
          ]);
        }
      }
      expect(() => new OrAmbiguityMultiTokenLookAheadParser()).to.throw(
        "Ambiguous Alternatives Detected:",
      );
      expect(() => new OrAmbiguityMultiTokenLookAheadParser()).to.throw(
        "TwoTok, ThreeTok, FourTok",
      );
    });
  });

  describe("The implicit lookahead calculation functionality of the Recognizer For OR (with IGNORE_AMBIGUITIES)", () => {
    class OrImplicitLookAheadParserIgnoreAmbiguities extends EmbeddedActionsParser {
      constructor(input: IToken[] = []) {
        super(ALL_TOKENS, {});

        this.performSelfAnalysis();
        this.input = input;
      }

      public orRule = this.RULE("orRule", this.parseOrRule, {
        recoveryValueFunc: () => "-666",
      });

      private parseOrRule(): string {
        let total = "";

        this.OR({
          IGNORE_AMBIGUITIES: true,
          DEF: [
            {
              ALT: () => {
                this.CONSUME1(OneTok);
                total += "A1";
              },
            },
            {
              ALT: () => {
                this.CONSUME2(OneTok);
                total += "OOPS!";
              },
            },
            {
              ALT: () => {
                this.CONSUME1(ThreeTok);
                total += "A3";
              },
            },
            {
              ALT: () => {
                this.CONSUME1(FourTok);
                total += "A4";
              },
            },
            {
              ALT: () => {
                this.CONSUME1(FiveTok);
                total += "A5";
              },
            },
          ],
        });

        this.OR2({
          IGNORE_AMBIGUITIES: true,
          DEF: [
            {
              ALT: () => {
                this.CONSUME2(FourTok);
                total += "B4";
              },
            },
            {
              ALT: () => {
                this.CONSUME2(ThreeTok);
                total += "B3";
              },
            },
            {
              ALT: () => {
                this.CONSUME2(TwoTok);
                total += "B2";
              },
            },
            {
              ALT: () => {
                this.CONSUME3(TwoTok);
                total += "OOPS!";
              },
            },
            {
              ALT: () => {
                this.CONSUME2(FiveTok);
                total += "B5";
              },
            },
          ],
        });

        this.OR3({
          IGNORE_AMBIGUITIES: true,
          DEF: [
            {
              ALT: () => {
                this.CONSUME3(FourTok);
                total += "C4";
              },
            },
            {
              ALT: () => {
                this.CONSUME3(ThreeTok);
                total += "C3";
              },
            },
            {
              ALT: () => {
                this.CONSUME4(ThreeTok);
                total += "OOPS!";
              },
            },
            {
              ALT: () => {
                this.CONSUME3(FiveTok);
                total += "C5";
              },
            },
            {
              ALT: () => {
                this.CONSUME3(OneTok);
                total += "C1";
              },
            },
          ],
        });

        this.OR4({
          IGNORE_AMBIGUITIES: true,
          DEF: [
            {
              ALT: () => {
                this.CONSUME4(OneTok);
                total += "D1";
              },
            },
            {
              ALT: () => {
                this.CONSUME4(FourTok);
                total += "D4";
              },
            },
            {
              ALT: () => {
                this.CONSUME5(FourTok);
                total += "OOPS!";
              },
            },
            {
              ALT: () => {
                this.CONSUME4(TwoTok);
                total += "D2";
              },
            },
          ],
        });

        this.OR5({
          IGNORE_AMBIGUITIES: true,
          DEF: [
            {
              ALT: () => {
                this.CONSUME5(TwoTok);
                total += "E2";
              },
            },
            {
              ALT: () => {
                this.CONSUME5(OneTok);
                total += "E1";
              },
            },
            {
              ALT: () => {
                this.CONSUME4(FiveTok);
                total += "E5";
              },
            },
            {
              ALT: () => {
                this.CONSUME5(ThreeTok);
                total += "E3";
              },
            },
            {
              ALT: () => {
                this.CONSUME5(FiveTok);
                total += "OOPS!";
              },
            },
          ],
        });

        return total;
      }
    }

    it("can compute the lookahead automatically for OR", () => {
      const input = [
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(FourTok),
        createRegularToken(FiveTok),
      ];
      const parser = new OrImplicitLookAheadParserIgnoreAmbiguities(input);
      expect(parser.orRule()).to.equal("A1B2C3D4E5");
    });

    it("will fail when none of the alternatives match", () => {
      const input = [createRegularToken(SixTok)];
      const parser = new OrImplicitLookAheadParserIgnoreAmbiguities(input);
      expect(parser.orRule()).to.equal("-666");
    });
  });

  describe("The support for MultiToken (K>1) implicit lookahead capabilities in DSL Production:", () => {
    it("OPTION", () => {
      class MultiTokenLookAheadForOptionParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {});

          this.performSelfAnalysis();
          this.input = input;
        }

        public rule = this.RULE("rule", () => {
          let result = "OPTION Not Taken";
          this.OPTION2(() => {
            this.CONSUME1(OneTok);
            this.CONSUME1(TwoTok);
            this.CONSUME1(ThreeTok);
            result = "OPTION Taken";
          });
          this.CONSUME2(OneTok);
          this.CONSUME2(TwoTok);
          return result;
        });
      }

      const parser = new MultiTokenLookAheadForOptionParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(parser.rule()).to.equal("OPTION Not Taken");

      const parser2 = new MultiTokenLookAheadForOptionParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(parser2.rule()).to.equal("OPTION Taken");
    });

    it("MANY", () => {
      class MultiTokenLookAheadForManyParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {});

          this.performSelfAnalysis();
          this.input = input;
        }

        public rule = this.RULE("orRule", () => {
          let numOfIterations = 0;
          this.MANY(() => {
            this.CONSUME1(OneTok);
            this.CONSUME1(TwoTok);
            this.CONSUME1(ThreeTok);
            numOfIterations++;
          });
          this.CONSUME2(OneTok);
          this.CONSUME2(TwoTok);
          return numOfIterations;
        });
      }

      const parser = new MultiTokenLookAheadForManyParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(parser.rule()).to.equal(0);

      const oneIterationParser = new MultiTokenLookAheadForManyParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(oneIterationParser.rule()).to.equal(1);

      const twoIterationsParser = new MultiTokenLookAheadForManyParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);

      expect(twoIterationsParser.rule()).to.equal(2);
    });

    it("MANY_SEP", () => {
      class MultiTokenLookAheadForManySepParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {});

          this.performSelfAnalysis();
          this.input = input;
        }

        public rule = this.RULE("orRule", () => {
          let numOfIterations = 0;
          this.MANY_SEP({
            SEP: Comma,
            DEF: () => {
              this.CONSUME1(OneTok);
              this.CONSUME1(TwoTok);
              this.CONSUME1(ThreeTok);
              numOfIterations++;
            },
          });
          this.CONSUME2(OneTok);
          this.CONSUME2(TwoTok);
          return numOfIterations;
        });
      }

      const parser = new MultiTokenLookAheadForManySepParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(parser.rule()).to.equal(0);

      const oneIterationParser = new MultiTokenLookAheadForManySepParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(oneIterationParser.rule()).to.equal(1);

      const twoIterationsParser = new MultiTokenLookAheadForManySepParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(Comma),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(twoIterationsParser.rule()).to.equal(2);
    });

    it("OR", () => {
      class MultiTokenLookAheadForOrParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {});

          this.performSelfAnalysis();
          this.input = input;
        }

        public orRule = this.RULE("orRule", () => {
          return this.OR([
            {
              ALT: () => {
                this.CONSUME1(OneTok);
                this.CONSUME2(OneTok);
                return "alt1 Taken";
              },
            },
            {
              ALT: () => {
                this.CONSUME3(OneTok);
                this.CONSUME1(TwoTok);
                this.CONSUME1(ThreeTok);
                return "alt2 Taken";
              },
            },
            {
              ALT: () => {
                this.CONSUME4(OneTok);
                this.CONSUME2(TwoTok);
                return "alt3 Taken";
              },
            },
            {
              ALT: () => {
                this.CONSUME1(FourTok);
                return "alt4 Taken";
              },
            },
          ]);
        });
      }

      const alt1Parser = new MultiTokenLookAheadForOrParser([
        createRegularToken(OneTok),
        createRegularToken(OneTok),
      ]);
      expect(alt1Parser.orRule()).to.equal("alt1 Taken");

      const alt2Parser = new MultiTokenLookAheadForOrParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
      ]);
      expect(alt2Parser.orRule()).to.equal("alt2 Taken");

      const alt3Parser = new MultiTokenLookAheadForOrParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(alt3Parser.orRule()).to.equal("alt3 Taken");

      const alt4Parser = new MultiTokenLookAheadForOrParser([
        createRegularToken(FourTok),
      ]);
      expect(alt4Parser.orRule()).to.equal("alt4 Taken");
    });

    it("AT_LEAST_ONE", () => {
      class MultiTokenLookAheadForAtLeastOneParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {});

          this.performSelfAnalysis();
          this.input = input;
        }

        public rule = this.RULE("orRule", () => {
          let numOfIterations = 0;
          this.AT_LEAST_ONE(() => {
            this.CONSUME1(OneTok);
            this.CONSUME1(TwoTok);
            this.CONSUME1(ThreeTok);
            numOfIterations++;
          });
          this.CONSUME2(OneTok);
          this.CONSUME2(TwoTok);
          return numOfIterations;
        });
      }

      const oneIterationParser = new MultiTokenLookAheadForAtLeastOneParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(oneIterationParser.rule()).to.equal(1);

      const twoIterationsParser = new MultiTokenLookAheadForAtLeastOneParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);

      expect(twoIterationsParser.rule()).to.equal(2);

      const threeIterationsParser = new MultiTokenLookAheadForAtLeastOneParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);

      expect(threeIterationsParser.rule()).to.equal(3);
    });

    it("AT_LEAST_ONE_SEP", () => {
      class MultiTokenLookAheadForAtLeastOneSepParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {});

          this.performSelfAnalysis();
          this.input = input;
        }

        public rule = this.RULE("orRule", () => {
          let numOfIterations = 0;
          this.AT_LEAST_ONE_SEP({
            SEP: Comma,
            DEF: () => {
              this.CONSUME1(OneTok);
              this.CONSUME1(TwoTok);
              this.CONSUME1(ThreeTok);
              numOfIterations++;
            },
          });
          this.CONSUME2(OneTok);
          this.CONSUME2(TwoTok);
          return numOfIterations;
        });
      }

      const oneIterationParser = new MultiTokenLookAheadForAtLeastOneSepParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(oneIterationParser.rule()).to.equal(1);

      const twoIterationsParser = new MultiTokenLookAheadForAtLeastOneSepParser(
        [
          createRegularToken(OneTok),
          createRegularToken(TwoTok),
          createRegularToken(ThreeTok),
          createRegularToken(Comma),
          createRegularToken(OneTok),
          createRegularToken(TwoTok),
          createRegularToken(ThreeTok),
          createRegularToken(OneTok),
          createRegularToken(TwoTok),
        ],
      );
      expect(twoIterationsParser.rule()).to.equal(2);

      const threeIterationsParser =
        new MultiTokenLookAheadForAtLeastOneSepParser([
          createRegularToken(OneTok),
          createRegularToken(TwoTok),
          createRegularToken(ThreeTok),
          createRegularToken(Comma),
          createRegularToken(OneTok),
          createRegularToken(TwoTok),
          createRegularToken(ThreeTok),
          createRegularToken(Comma),
          createRegularToken(OneTok),
          createRegularToken(TwoTok),
          createRegularToken(ThreeTok),
          createRegularToken(OneTok),
          createRegularToken(TwoTok),
        ]);
      expect(threeIterationsParser.rule()).to.equal(3);
    });
  });

  describe("The support for MultiToken (K>1) EXPLICIT lookahead capabilities in DSL Production:", () => {
    it("OPTION", () => {
      class MultiTokenLookAheadForOptionParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {});

          this.performSelfAnalysis();
          this.input = input;
        }

        public rule = this.RULE("rule", () => {
          let result = "OPTION Not Taken";
          this.OPTION2({
            // will only consider the OneTok when evaluating entering the OPTION
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

      const parser = new MultiTokenLookAheadForOptionParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      const parseResult = parser.rule();
      expect(parseResult).to.be.undefined;
      expect(parser.errors.length).to.eql(1);
      // wrong path chosen due to low explicit lookahead
      expect(parser.errors[0].message).to.include(
        "Expecting token of type --> ThreeTok <--",
      );
    });

    it("MANY", () => {
      class MultiTokenLookAheadForManyParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {
            // Global Low maxLookahead
            maxLookahead: 1,
          });

          this.performSelfAnalysis();
          this.input = input;
        }

        public rule = this.RULE("orRule", () => {
          let numOfIterations = 0;
          this.MANY({
            // Increase lookahead for this specific DSL method
            MAX_LOOKAHEAD: 3,
            DEF: () => {
              this.CONSUME1(OneTok);
              this.CONSUME1(TwoTok);
              this.CONSUME1(ThreeTok);
              numOfIterations++;
            },
          });
          this.CONSUME2(OneTok);
          this.CONSUME2(TwoTok);
          return numOfIterations;
        });
      }

      const parser = new MultiTokenLookAheadForManyParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(parser.rule()).to.equal(0);

      const oneIterationParser = new MultiTokenLookAheadForManyParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(oneIterationParser.rule()).to.equal(1);

      const twoIterationsParser = new MultiTokenLookAheadForManyParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);

      expect(twoIterationsParser.rule()).to.equal(2);
    });

    it("MANY_SEP", () => {
      class MultiTokenLookAheadForManySepParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, { maxLookahead: 1 });

          this.performSelfAnalysis();
          this.input = input;
        }

        public rule = this.RULE("orRule", () => {
          let numOfIterations = 0;
          this.MANY_SEP({
            MAX_LOOKAHEAD: 3,
            SEP: Comma,
            DEF: () => {
              this.CONSUME1(OneTok);
              this.CONSUME1(TwoTok);
              this.CONSUME1(ThreeTok);
              numOfIterations++;
            },
          });
          this.CONSUME2(OneTok);
          this.CONSUME2(TwoTok);
          return numOfIterations;
        });
      }

      const parser = new MultiTokenLookAheadForManySepParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(parser.rule()).to.equal(0);

      const oneIterationParser = new MultiTokenLookAheadForManySepParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(oneIterationParser.rule()).to.equal(1);

      const twoIterationsParser = new MultiTokenLookAheadForManySepParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(Comma),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(twoIterationsParser.rule()).to.equal(2);
    });

    it("OR", () => {
      class MultiTokenLookAheadForOrParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {
            // Global low maxLookahead should cause ambiguities in this grammar
            maxLookahead: 1,
          });

          this.performSelfAnalysis();
          this.input = input;
        }

        public orRule = this.RULE("orRule", () => {
          return this.OR({
            // explicit higher maxLookahead is used to resolve the ambiguities
            MAX_LOOKAHEAD: 3,
            DEF: [
              {
                ALT: () => {
                  this.CONSUME1(OneTok);
                  this.CONSUME2(OneTok);
                  return "alt1 Taken";
                },
              },
              {
                ALT: () => {
                  this.CONSUME3(OneTok);
                  this.CONSUME1(TwoTok);
                  this.CONSUME1(ThreeTok);
                  return "alt2 Taken";
                },
              },
              {
                ALT: () => {
                  this.CONSUME4(OneTok);
                  this.CONSUME2(TwoTok);
                  return "alt3 Taken";
                },
              },
              {
                ALT: () => {
                  this.CONSUME1(FourTok);
                  return "alt4 Taken";
                },
              },
            ],
          });
        });
      }

      // let alt1Parser = new MultiTokenLookAheadForOrParser([
      //     createRegularToken(OneTok),
      //     createRegularToken(OneTok)
      // ])
      // expect(alt1Parser.orRule()).to.equal("alt1 Taken")

      const alt2Parser = new MultiTokenLookAheadForOrParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
      ]);
      expect(alt2Parser.orRule()).to.equal("alt2 Taken");

      const alt3Parser = new MultiTokenLookAheadForOrParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(alt3Parser.orRule()).to.equal("alt3 Taken");

      const alt4Parser = new MultiTokenLookAheadForOrParser([
        createRegularToken(FourTok),
      ]);
      expect(alt4Parser.orRule()).to.equal("alt4 Taken");
    });

    it("AT_LEAST_ONE", () => {
      class MultiTokenLookAheadForAtLeastOneParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, { maxLookahead: 1 });

          this.performSelfAnalysis();
          this.input = input;
        }

        public rule = this.RULE("orRule", () => {
          let numOfIterations = 0;
          this.AT_LEAST_ONE({
            MAX_LOOKAHEAD: 3,
            DEF: () => {
              this.CONSUME1(OneTok);
              this.CONSUME1(TwoTok);
              this.CONSUME1(ThreeTok);
              numOfIterations++;
            },
          });
          this.CONSUME2(OneTok);
          this.CONSUME2(TwoTok);
          return numOfIterations;
        });
      }

      const oneIterationParser = new MultiTokenLookAheadForAtLeastOneParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(oneIterationParser.rule()).to.equal(1);

      const twoIterationsParser = new MultiTokenLookAheadForAtLeastOneParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);

      expect(twoIterationsParser.rule()).to.equal(2);

      const threeIterationsParser = new MultiTokenLookAheadForAtLeastOneParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);

      expect(threeIterationsParser.rule()).to.equal(3);
    });

    it("AT_LEAST_ONE_SEP", () => {
      class MultiTokenLookAheadForAtLeastOneSepParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, { maxLookahead: 1 });

          this.performSelfAnalysis();
          this.input = input;
        }

        public rule = this.RULE("orRule", () => {
          let numOfIterations = 0;
          this.AT_LEAST_ONE_SEP({
            MAX_LOOKAHEAD: 3,
            SEP: Comma,
            DEF: () => {
              this.CONSUME1(OneTok);
              this.CONSUME1(TwoTok);
              this.CONSUME1(ThreeTok);
              numOfIterations++;
            },
          });
          this.CONSUME2(OneTok);
          this.CONSUME2(TwoTok);
          return numOfIterations;
        });
      }

      const oneIterationParser = new MultiTokenLookAheadForAtLeastOneSepParser([
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
        createRegularToken(ThreeTok),
        createRegularToken(OneTok),
        createRegularToken(TwoTok),
      ]);
      expect(oneIterationParser.rule()).to.equal(1);

      const twoIterationsParser = new MultiTokenLookAheadForAtLeastOneSepParser(
        [
          createRegularToken(OneTok),
          createRegularToken(TwoTok),
          createRegularToken(ThreeTok),
          createRegularToken(Comma),
          createRegularToken(OneTok),
          createRegularToken(TwoTok),
          createRegularToken(ThreeTok),
          createRegularToken(OneTok),
          createRegularToken(TwoTok),
        ],
      );
      expect(twoIterationsParser.rule()).to.equal(2);

      const threeIterationsParser =
        new MultiTokenLookAheadForAtLeastOneSepParser([
          createRegularToken(OneTok),
          createRegularToken(TwoTok),
          createRegularToken(ThreeTok),
          createRegularToken(Comma),
          createRegularToken(OneTok),
          createRegularToken(TwoTok),
          createRegularToken(ThreeTok),
          createRegularToken(Comma),
          createRegularToken(OneTok),
          createRegularToken(TwoTok),
          createRegularToken(ThreeTok),
          createRegularToken(OneTok),
          createRegularToken(TwoTok),
        ]);
      expect(threeIterationsParser.rule()).to.equal(3);
    });
  });

  describe("Lookahead bug: MANY in OR", () => {
    class ManyInOrBugParser extends EmbeddedActionsParser {
      constructor() {
        super(ALL_TOKENS, {});
        this.performSelfAnalysis();
      }

      public main = this.RULE("main", () => {
        this.OR({
          DEF: [
            { ALT: () => this.SUBRULE(this.alt1) },
            { ALT: () => this.SUBRULE(this.alt2) },
          ],
          IGNORE_AMBIGUITIES: true,
        });
      });

      public alt1 = this.RULE("alt1", () => {
        this.MANY(() => {
          this.CONSUME(Comma);
        });
        this.CONSUME(OneTok);
      });

      public alt2 = this.RULE("alt2", () => {
        this.MANY(() => {
          this.CONSUME(Comma);
        });
        this.CONSUME(TwoTok);
      });
    }

    let manyInOrBugParser: ManyInOrBugParser;
    before(() => {
      manyInOrBugParser = new ManyInOrBugParser();
    });

    it("Won't throw NoViableAltException when the repetition appears twice", () => {
      const input = [
        createRegularToken(Comma),
        createRegularToken(Comma),
        createRegularToken(TwoTok),
      ];
      manyInOrBugParser.input = input;
      manyInOrBugParser.main();
      expect(manyInOrBugParser.errors).to.be.empty;
    });
  });

  describe("Categories lookahead bug #918", () => {
    it("Will take token categories into account when performing lookahead", () => {
      const A = createToken({ name: "A" });
      const B = createToken({ name: "B", categories: A });
      const C = createToken({ name: "C" });
      const D = createToken({ name: "D" });

      class CategoriesLookaheadBugParser extends EmbeddedActionsParser {
        constructor() {
          super([A, B, C, D]);
          this.performSelfAnalysis();
        }

        public main = this.RULE("main", () => {
          this.OR([
            { ALT: () => this.SUBRULE(this.alt1) },
            { ALT: () => this.SUBRULE(this.alt2) },
          ]);
        });

        public alt1 = this.RULE("alt1", () => {
          this.CONSUME(B);
          this.CONSUME(C);
        });

        public alt2 = this.RULE("alt2", () => {
          this.CONSUME(A);
          this.CONSUME(D);
        });
      }

      const input = [createRegularToken(B), createRegularToken(D)];

      const parser = new CategoriesLookaheadBugParser();
      parser.input = input;
      parser.main();
      expect(parser.errors).to.be.empty;
    });
  });
});
