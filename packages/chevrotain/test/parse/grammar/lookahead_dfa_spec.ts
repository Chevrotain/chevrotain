import { expect } from "chai";
import {
  IOrAlt,
  IToken,
  LookaheadSequence,
  TokenType,
} from "@chevrotain/types";
import {
  buildDenseDfaAlternativesLookAheadFunc,
  buildDenseDfaSingleAlternativeLookaheadFunction,
  buildDfaLookaheadMachine,
  MAX_DENSE_DFA_CELLS,
} from "@chevrotain/lookahead-dfa";
import { END_OF_FILE } from "../../../src/parse/parser/parser.js";
import {
  buildAlternativesLookAheadFunc,
  buildSingleAlternativeLookaheadFunction,
} from "../../../src/parse/grammar/lookahead.js";
import {
  buildAlternativesLookAheadFuncDfa,
  buildSingleAlternativeLookaheadFunctionDfa,
} from "../../../src/parse/grammar/lookahead_dfa.js";
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

  function tokenType(name: string, tokenTypeIdx: number): TokenType {
    return {
      name,
      tokenTypeIdx,
      categoryMatches: [],
      categoryMatchesMap: Object.create(null),
      isParent: false,
    } as TokenType;
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
