import { expect } from "chai";
import {
  IOrAlt,
  IToken,
  LookaheadSequence,
  TokenType,
} from "@chevrotain/types";
import { END_OF_FILE } from "../../../src/parse/parser/parser.js";
import {
  buildAlternativesLookAheadFunc,
  buildSingleAlternativeLookaheadFunction,
} from "../../../src/parse/grammar/lookahead.js";
import {
  buildAlternativesLookAheadFuncDfa,
  buildDfaLookaheadMachine,
  buildSingleAlternativeLookaheadFunctionDfa,
  isDfaLookaheadProfitable,
  isDfaSingleLookaheadProfitable,
} from "../../../src/parse/grammar/lookahead_dfa.js";
import {
  buildDenseDfaAlternativesLookAheadFunc,
  buildDenseDfaSingleAlternativeLookaheadFunction,
  denseDfaCellCount,
  MAX_DENSE_DFA_CELLS,
} from "../../../src/parse/grammar/dfa/dense.js";
import {
  augmentTokenTypes,
  tokenStructuredMatcher,
} from "../../../src/scan/tokens.js";
import { createToken } from "../../../src/scan/tokens_public.js";
import { createRegularToken } from "../../utils/matchers.js";

describe("DFA lookahead", () => {
  const A = createToken({ name: "DfaA" });
  const B = createToken({ name: "DfaB" });
  const C = createToken({ name: "DfaC" });
  const D = createToken({ name: "DfaD" });
  const E = createToken({ name: "DfaE" });
  const F = createToken({ name: "DfaF" });
  const CategoryAB = createToken({ name: "DfaCategoryAB" });
  const CategoryBC = createToken({ name: "DfaCategoryBC" });
  const ChildA = createToken({
    name: "DfaChildA",
    categories: CategoryAB,
  });
  const ChildB = createToken({
    name: "DfaChildB",
    categories: [CategoryAB, CategoryBC],
  });
  const ChildC = createToken({
    name: "DfaChildC",
    categories: CategoryBC,
  });
  const endings = Array.from({ length: 32 }, (_, idx) =>
    createToken({ name: `DfaEnding${idx}` }),
  );
  const expectedTokens = [A, B, C, D, E, F, CategoryAB, CategoryBC];

  before(() => {
    augmentTokenTypes([A, B, C, D, E, F, ChildA, ChildB, ChildC, ...endings]);
  });

  class MockParser {
    private readonly input: IToken[];

    constructor(input: TokenType[], maxLookahead: number) {
      this.input = input.map((tokenType) => createRegularToken(tokenType));
      while (this.input.length < maxLookahead + 1) {
        this.input.push(END_OF_FILE);
      }
    }

    LA_FAST(howMuch: number): IToken {
      return this.input[howMuch - 1];
    }
  }

  function fanout(count: number, prefix: TokenType[] = [A]) {
    return endings
      .slice(0, count)
      .map((ending): TokenType[][] => [[...prefix, ending]]);
  }

  function nonSharedFanout(count: number) {
    return Array.from({ length: count }, (_, idx): TokenType[][] => [
      [endings[idx * 2], endings[idx * 2 + 1]],
    ]);
  }

  function tokenType(name: string, tokenTypeIdx: number): TokenType {
    return {
      name,
      tokenTypeIdx,
      categoryMatches: [],
      categoryMatchesMap: Object.create(null),
      isParent: false,
    } as TokenType;
  }

  function buildDenseOr(alternatives: LookaheadSequence[]) {
    return buildDenseDfaAlternativesLookAheadFunc(
      buildDfaLookaheadMachine(alternatives),
    )!;
  }

  function buildDenseSingle(alternative: LookaheadSequence) {
    return buildDenseDfaSingleAlternativeLookaheadFunction(
      buildDfaLookaheadMachine([alternative]),
    )!;
  }

  function callOr(
    lookahead: (orAlts: IOrAlt<any>[]) => number | undefined,
    input: TokenType[],
    maxLookahead: number,
    orAlts: IOrAlt<any>[] = [],
  ) {
    return lookahead.call(new MockParser(input, maxLookahead), orAlts);
  }

  function callSingle(
    lookahead: () => boolean,
    input: TokenType[],
    maxLookahead: number,
  ) {
    return lookahead.call(new MockParser(input, maxLookahead));
  }

  describe("profitability", () => {
    it("keeps narrow shared paths on the original implementation", () => {
      expect(isDfaLookaheadProfitable(fanout(2))).to.be.false;
      expect(isDfaLookaheadProfitable(fanout(2, [A, B]))).to.be.false;
    });

    it("selects wide and deep shared paths", () => {
      expect(isDfaLookaheadProfitable(fanout(3))).to.be.true;
      expect(isDfaLookaheadProfitable(fanout(8))).to.be.true;
      expect(isDfaLookaheadProfitable(fanout(8, [A, B]))).to.be.true;
      expect(
        isDfaLookaheadProfitable([
          [[A]],
          [[B, C]],
          [[B, D, E]],
          [[B, D, F]],
          [[C]],
        ]),
      ).to.be.true;
    });

    it("uses a conservative threshold for single-production lookahead", () => {
      expect(isDfaSingleLookaheadProfitable(fanout(3).flat())).to.be.false;
      expect(isDfaSingleLookaheadProfitable(fanout(4).flat())).to.be.true;
      expect(isDfaSingleLookaheadProfitable(fanout(5).flat())).to.be.true;
      expect(isDfaSingleLookaheadProfitable(fanout(3, [A, B]).flat())).to.be
        .false;
      expect(isDfaSingleLookaheadProfitable(fanout(4, [A, B]).flat())).to.be
        .true;
    });

    it("selects non-shared fanout above the dense boundaries", () => {
      expect(isDfaLookaheadProfitable(nonSharedFanout(2))).to.be.false;
      expect(isDfaLookaheadProfitable(nonSharedFanout(3))).to.be.true;
      expect(isDfaSingleLookaheadProfitable(nonSharedFanout(3).flat())).to.be
        .false;
      expect(isDfaSingleLookaheadProfitable(nonSharedFanout(4).flat())).to.be
        .true;
    });

    it("keeps unusually long paths on the original implementation", () => {
      const longPath = Array.from({ length: 33 }, () => A);
      expect(isDfaLookaheadProfitable([...fanout(8), [longPath]])).to.be.false;
      expect(isDfaSingleLookaheadProfitable([...fanout(8).flat(), longPath])).to
        .be.false;
    });
  });

  describe("runtime", () => {
    it("selects alternatives through a wide shared prefix", () => {
      const lookahead = buildDenseOr(fanout(8));

      expect(callOr(lookahead, [A, endings[0]], 2)).to.equal(0);
      expect(callOr(lookahead, [A, endings[4]], 2)).to.equal(4);
      expect(callOr(lookahead, [A, endings[7]], 2)).to.equal(7);
      expect(callOr(lookahead, [A, B], 2)).to.be.undefined;
    });

    it("matches a wide single alternative", () => {
      const lookahead = buildDenseSingle(fanout(8).flat());

      expect(callSingle(lookahead, [A, endings[0]], 2)).to.be.true;
      expect(callSingle(lookahead, [A, endings[7]], 2)).to.be.true;
      expect(callSingle(lookahead, [A, B], 2)).to.be.false;
    });

    it("handles overlapping categories at multiple states", () => {
      const lookahead = buildDenseOr([
        [[CategoryAB, D]],
        [[ChildB, E]],
        [[CategoryBC, F]],
      ]);

      expect(callOr(lookahead, [ChildA, D], 2)).to.equal(0);
      expect(callOr(lookahead, [ChildB, E], 2)).to.equal(1);
      expect(callOr(lookahead, [ChildC, F], 2)).to.equal(2);
      expect(callOr(lookahead, [ChildB, F], 2)).to.equal(2);
    });

    it("preserves short and empty alternative priority", () => {
      const emptyLookahead = buildDenseOr([[[A, B]], [[]], [[A, C]]]);
      expect(callOr(emptyLookahead, [A, B], 2)).to.equal(0);
      expect(callOr(emptyLookahead, [A, C], 2)).to.equal(1);
      expect(callOr(emptyLookahead, [D], 2)).to.equal(1);

      const shortLookahead = buildDenseOr([[[A, B]], [[A]]]);
      expect(callOr(shortLookahead, [A, B], 2)).to.equal(0);
      expect(callOr(shortLookahead, [A, C], 2)).to.equal(1);
    });

    it("handles constant and missing single alternatives", () => {
      expect(callSingle(buildDenseSingle([[]]), [], 1)).to.be.true;
      expect(callSingle(buildDenseSingle([]), [], 1)).to.be.false;
    });

    it("handles 32 alternatives in the dense representation", () => {
      const alternatives = fanout(32);
      const lookahead = buildDenseDfaAlternativesLookAheadFunc(
        buildDfaLookaheadMachine(alternatives),
      )!;

      expect(callOr(lookahead, [A, endings[31]], 2)).to.equal(31);
      expect(callOr(lookahead, [A, B], 2)).to.be.undefined;
    });

    it("rejects dense machines above the cell cap", () => {
      const machine = buildDfaLookaheadMachine([
        [[tokenType("Low", 1)]],
        [[tokenType("High", MAX_DENSE_DFA_CELLS + 1)]],
      ]);

      expect(denseDfaCellCount(machine)).to.equal(MAX_DENSE_DFA_CELLS + 1);
      expect(buildDenseDfaAlternativesLookAheadFunc(machine)).to.be.undefined;
    });
  });

  describe("fallback", () => {
    it("uses dense lookahead for profitable static paths", () => {
      const alternatives = fanout(8);
      const optimizedOr = buildAlternativesLookAheadFuncDfa(
        alternatives,
        false,
        tokenStructuredMatcher,
        false,
      );
      const optimizedSingle = buildSingleAlternativeLookaheadFunctionDfa(
        alternatives.flat(),
        tokenStructuredMatcher,
        false,
      );

      expect(callOr(optimizedOr, [A, endings[7]], 2)).to.equal(7);
      expect(callSingle(optimizedSingle, [A, endings[7]], 2)).to.be.true;
    });

    it("uses original lookahead above the dense cell cap", () => {
      const shared = tokenType("Shared", 1);
      const alternatives = Array.from({ length: 5 }, (_, idx) => [
        [shared, tokenType(`Far${idx}`, MAX_DENSE_DFA_CELLS + 1 + idx)],
      ]);
      const optimizedOr = buildAlternativesLookAheadFuncDfa(
        alternatives,
        false,
        tokenStructuredMatcher,
        false,
      );
      const optimizedSingle = buildSingleAlternativeLookaheadFunctionDfa(
        alternatives.flat(),
        tokenStructuredMatcher,
        false,
      );

      expect(callOr(optimizedOr, alternatives[4][0], 2)).to.equal(4);
      expect(callSingle(optimizedSingle, alternatives[4][0], 2)).to.be.true;
    });

    it("preserves predicates", () => {
      const lookahead = buildAlternativesLookAheadFuncDfa(
        fanout(8),
        true,
        tokenStructuredMatcher,
        false,
      );
      const orAlts = fanout(8).map((_, idx) => ({
        ALT: () => undefined,
        GATE: idx === 0 ? () => false : undefined,
      }));

      expect(callOr(lookahead, [A, endings[0]], 2, orAlts)).to.be.undefined;
    });

    it("preserves dynamic-token lookahead", () => {
      const alternatives = fanout(8);
      const optimizedOr = buildAlternativesLookAheadFuncDfa(
        alternatives,
        false,
        tokenStructuredMatcher,
        true,
      );
      const originalOr = buildAlternativesLookAheadFunc(
        alternatives,
        false,
        tokenStructuredMatcher,
        true,
      );
      expect(callOr(optimizedOr, [A, endings[7]], 2)).to.equal(
        callOr(originalOr, [A, endings[7]], 2),
      );

      const alternative = alternatives.flat();
      const optimizedSingle = buildSingleAlternativeLookaheadFunctionDfa(
        alternative,
        tokenStructuredMatcher,
        true,
      );
      const originalSingle = buildSingleAlternativeLookaheadFunction(
        alternative,
        tokenStructuredMatcher,
        true,
      );
      expect(callSingle(optimizedSingle, [A, endings[7]], 2)).to.equal(
        callSingle(originalSingle, [A, endings[7]], 2),
      );
    });
  });

  describe("differential equivalence", () => {
    function makeRandom(seed: number) {
      return function () {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
    }

    function sequences(alphabet: TokenType[], length: number): TokenType[][] {
      let result: TokenType[][] = [[]];
      for (let offset = 0; offset < length; offset++) {
        result = result.flatMap((prefix) =>
          alphabet.map((tokenType) => [...prefix, tokenType]),
        );
      }
      return result;
    }

    it("matches the original OR and single implementations", () => {
      const random = makeRandom(0xc0ffee);
      for (let fixture = 0; fixture < 40; fixture++) {
        const maxLookahead = 1 + Math.floor(random() * 4);
        const alternatives: LookaheadSequence[] = Array.from(
          { length: 1 + Math.floor(random() * 4) },
          () =>
            Array.from({ length: 1 + Math.floor(random() * 3) }, () => {
              const length =
                random() < 0.12 ? 0 : 1 + Math.floor(random() * maxLookahead);
              return Array.from(
                { length },
                () =>
                  expectedTokens[Math.floor(random() * expectedTokens.length)],
              );
            }),
        );
        const inputs = sequences([A, B, C, ChildA, ChildB], maxLookahead);
        const originalOr = buildAlternativesLookAheadFunc(
          alternatives,
          false,
          tokenStructuredMatcher,
          true,
        );
        const denseOr = buildDenseDfaAlternativesLookAheadFunc(
          buildDfaLookaheadMachine(alternatives),
        )!;
        const originalSingle = buildSingleAlternativeLookaheadFunction(
          alternatives[0],
          tokenStructuredMatcher,
          true,
        );
        const denseSingle = buildDenseDfaSingleAlternativeLookaheadFunction(
          buildDfaLookaheadMachine([alternatives[0]]),
        )!;

        for (const input of inputs) {
          expect(callOr(denseOr, input, maxLookahead)).to.equal(
            callOr(originalOr, input, maxLookahead),
            `dense OR fixture ${fixture} for ${input.map((token) => token.name)}`,
          );
          expect(callSingle(denseSingle, input, maxLookahead)).to.equal(
            callSingle(originalSingle, input, maxLookahead),
            `dense single fixture ${fixture} for ${input.map((token) => token.name)}`,
          );
        }
      }
    });
  });
});
