import { expect } from "chai";
import {
  IParserErrorMessageProvider,
  IToken,
  LookaheadSequence,
  TokenType,
} from "@chevrotain/types";
import { createToken } from "../../../src/scan/tokens_public.js";
import { EmbeddedActionsParser } from "../../../src/parse/parser/traits/parser_traits.js";
import { defaultParserErrorProvider } from "../../../src/parse/errors_public.js";
import {
  EarlyExitException,
  NoViableAltException,
} from "../../../src/parse/exceptions_public.js";
import {
  getLookaheadPathsForOptionalProd,
  getLookaheadPathsForOr,
  PROD_TYPE,
} from "../../../src/parse/grammar/lookahead.js";
import { createRegularToken } from "../../utils/matchers.js";

describe("The error handler trait", () => {
  const A = createToken({ name: "A" });
  const B = createToken({ name: "B" });
  const C = createToken({ name: "C" });
  const D = createToken({ name: "D" });
  const Comma = createToken({ name: "Comma" });
  const allTokens = [A, B, C, D, Comma];
  const maxLookahead = 3;

  function tokens(...tokTypes: TokenType[]): IToken[] {
    return tokTypes.map((tokType) => createRegularToken(tokType));
  }

  type RecordedPaths = {
    noViableAlt: LookaheadSequence[][];
    earlyExit: LookaheadSequence[];
  };

  function createRecordingProvider(
    recorded: RecordedPaths,
  ): IParserErrorMessageProvider {
    return {
      ...defaultParserErrorProvider,
      buildNoViableAltMessage(options) {
        recorded.noViableAlt.push(options.expectedPathsPerAlt);
        return defaultParserErrorProvider.buildNoViableAltMessage(options);
      },
      buildEarlyExitMessage(options) {
        recorded.earlyExit.push(options.expectedIterationPaths);
        return defaultParserErrorProvider.buildEarlyExitMessage(options);
      },
    };
  }

  class ErrorsParser extends EmbeddedActionsParser {
    constructor(errorMessageProvider: IParserErrorMessageProvider) {
      super(allTokens, {
        errorMessageProvider,
        maxLookahead,
        recoveryEnabled: false,
      });
      this.performSelfAnalysis();
    }

    public twoAlternations = this.RULE("twoAlternations", () => {
      this.OR1([
        { ALT: () => this.CONSUME1(A) },
        { ALT: () => this.CONSUME1(B) },
      ]);
      this.OR2([
        { ALT: () => this.CONSUME1(C) },
        { ALT: () => this.CONSUME1(D) },
      ]);
    });

    public sameOccurrenceOtherRule = this.RULE(
      "sameOccurrenceOtherRule",
      () => {
        this.OR1([
          { ALT: () => this.CONSUME1(C) },
          { ALT: () => this.CONSUME1(D) },
        ]);
      },
    );

    public repetition = this.RULE("repetition", () => {
      this.AT_LEAST_ONE1(() => this.CONSUME1(A));
    });

    public repetitionWithSep = this.RULE("repetitionWithSep", () => {
      this.AT_LEAST_ONE_SEP1({
        SEP: Comma,
        DEF: () => this.CONSUME1(B),
      });
    });
  }

  function createParser() {
    const recorded: RecordedPaths = { noViableAlt: [], earlyExit: [] };
    const parser = new ErrorsParser(createRecordingProvider(recorded));
    return { parser, recorded };
  }

  function parseWithError(
    parser: ErrorsParser,
    input: IToken[],
    rule: () => void,
  ) {
    parser.input = input;
    rule.call(parser);
    expect(parser.errors).to.have.lengthOf(1);
    return parser.errors[0];
  }

  context("NoViableAltException", () => {
    it("computes the expected paths once per alternation and reuses them", () => {
      const { parser, recorded } = createParser();

      const first = parseWithError(parser, tokens(C), parser.twoAlternations);
      const second = parseWithError(parser, tokens(D), parser.twoAlternations);

      expect(first).to.be.an.instanceOf(NoViableAltException);
      expect(second).to.be.an.instanceOf(NoViableAltException);
      expect(recorded.noViableAlt).to.have.lengthOf(2);
      expect(recorded.noViableAlt[1]).to.equal(recorded.noViableAlt[0]);
    });

    it("produces the same paths and messages as an uncached computation", () => {
      const { parser, recorded } = createParser();
      const expectedPaths = getLookaheadPathsForOr(
        1,
        parser.getGAstProductions()["twoAlternations"],
        maxLookahead,
      );

      const first = parseWithError(parser, tokens(C), parser.twoAlternations);
      const second = parseWithError(parser, tokens(C), parser.twoAlternations);

      expect(recorded.noViableAlt[0]).to.deep.equal(expectedPaths);
      expect(second.message).to.equal(first.message);
      expect(first.message).to.equal(
        "Expecting: one of these possible Token sequences:\n" +
          "  1. [A]\n" +
          "  2. [B]\n" +
          "but found: ''",
      );
    });

    it("does not share cached paths between occurrences in the same rule", () => {
      const { parser, recorded } = createParser();

      parseWithError(parser, tokens(C), parser.twoAlternations);
      parseWithError(parser, tokens(A, A), parser.twoAlternations);

      expect(recorded.noViableAlt[0]).to.deep.equal([[[A]], [[B]]]);
      expect(recorded.noViableAlt[1]).to.deep.equal([[[C]], [[D]]]);
    });

    it("does not share cached paths between rules with the same occurrence", () => {
      const { parser, recorded } = createParser();

      parseWithError(parser, tokens(C), parser.twoAlternations);
      parseWithError(parser, tokens(A), parser.sameOccurrenceOtherRule);

      expect(recorded.noViableAlt[0]).to.deep.equal([[[A]], [[B]]]);
      expect(recorded.noViableAlt[1]).to.deep.equal([[[C]], [[D]]]);
    });

    it("does not share cached paths between parser instances", () => {
      const first = createParser();
      const second = createParser();

      parseWithError(first.parser, tokens(C), first.parser.twoAlternations);
      parseWithError(second.parser, tokens(C), second.parser.twoAlternations);

      expect(second.recorded.noViableAlt[0]).to.deep.equal(
        first.recorded.noViableAlt[0],
      );
      expect(second.recorded.noViableAlt[0]).to.not.equal(
        first.recorded.noViableAlt[0],
      );
    });
  });

  context("EarlyExitException", () => {
    it("computes the expected paths once for AT_LEAST_ONE and reuses them", () => {
      const { parser, recorded } = createParser();
      const expectedPaths = getLookaheadPathsForOptionalProd(
        1,
        parser.getGAstProductions()["repetition"],
        PROD_TYPE.REPETITION_MANDATORY,
        maxLookahead,
      )[0];

      const first = parseWithError(parser, tokens(B), parser.repetition);
      const second = parseWithError(parser, tokens(C), parser.repetition);

      expect(first).to.be.an.instanceOf(EarlyExitException);
      expect(second).to.be.an.instanceOf(EarlyExitException);
      expect(recorded.earlyExit[0]).to.deep.equal(expectedPaths);
      expect(recorded.earlyExit[1]).to.equal(recorded.earlyExit[0]);
      expect(second.message).to.equal(first.message);
    });

    it("computes the expected paths once for AT_LEAST_ONE_SEP and reuses them", () => {
      const { parser, recorded } = createParser();
      const expectedPaths = getLookaheadPathsForOptionalProd(
        1,
        parser.getGAstProductions()["repetitionWithSep"],
        PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR,
        maxLookahead,
      )[0];

      const first = parseWithError(parser, tokens(A), parser.repetitionWithSep);
      const second = parseWithError(
        parser,
        tokens(C),
        parser.repetitionWithSep,
      );

      expect(first).to.be.an.instanceOf(EarlyExitException);
      expect(second).to.be.an.instanceOf(EarlyExitException);
      expect(recorded.earlyExit[0]).to.deep.equal(expectedPaths);
      expect(recorded.earlyExit[1]).to.equal(recorded.earlyExit[0]);
      expect(second.message).to.equal(first.message);
    });
  });
});
