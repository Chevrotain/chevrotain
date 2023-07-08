import { END_OF_FILE } from "../../../src/parse/parser/parser.js";
import { createToken } from "../../../src/scan/tokens_public.js";
import {
  buildAlternativesLookAheadFunc,
  buildLookaheadFuncForOptionalProd,
  buildLookaheadFuncForOr,
  buildSingleAlternativeLookaheadFunction,
  getProdType,
  lookAheadSequenceFromAlternatives,
  PROD_TYPE,
} from "../../../src/parse/grammar/lookahead.js";
import { map } from "lodash-es";
import {
  augmentTokenTypes,
  tokenStructuredMatcher,
} from "../../../src/scan/tokens.js";
import { createRegularToken } from "../../utils/matchers.js";
import {
  Alternation,
  Alternative,
  NonTerminal,
  Option,
  Repetition,
  RepetitionMandatory,
  RepetitionMandatoryWithSeparator,
  RepetitionWithSeparator,
  Rule,
  Terminal,
} from "@chevrotain/gast";
import { IToken, TokenType } from "@chevrotain/types";
import { EmbeddedActionsParser } from "../../../src/parse/parser/traits/parser_traits.js";
import { expect } from "chai";

describe("getProdType", () => {
  it("handles `Option`", () => {
    expect(getProdType(new Option({ definition: [] }))).to.equal(
      PROD_TYPE.OPTION,
    );
  });
  it("handles `Repetition`", () => {
    expect(getProdType(new Repetition({ definition: [] }))).to.equal(
      PROD_TYPE.REPETITION,
    );
  });
  it("handles `RepetitionMandatory`", () => {
    expect(getProdType(new RepetitionMandatory({ definition: [] }))).to.equal(
      PROD_TYPE.REPETITION_MANDATORY,
    );
  });
  it("handles `RepetitionWithSeparator`", () => {
    expect(
      getProdType(
        new RepetitionWithSeparator({
          definition: [],
          separator: createToken({ name: "Comma" }),
        }),
      ),
    ).to.equal(PROD_TYPE.REPETITION_WITH_SEPARATOR);
  });
  it("handles `RepetitionMandatoryWithSeparator`", () => {
    expect(
      getProdType(
        new RepetitionMandatoryWithSeparator({
          definition: [],
          separator: createToken({ name: "Comma" }),
        }),
      ),
    ).to.equal(PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR);
  });
  it("handles `Alternation`", () => {
    expect(getProdType(new Alternation({ definition: [] }))).to.equal(
      PROD_TYPE.ALTERNATION,
    );
  });
});

context("lookahead specs", () => {
  let ColonParserMockVar: any;
  let IdentParserMockVar: any;
  let CommaParserMockVar: any;
  let KeyParserMockVar: any;
  let EntityParserMockVar: any;
  let actionDec: Rule;
  let lotsOfOrs: Rule;
  let emptyAltOr: Rule;

  before(() => {
    const IdentTok = createToken({ name: "IdentTok" });
    const DotTok = createToken({ name: "DotTok" });
    const ColonTok = createToken({ name: "ColonTok" });
    const LSquareTok = createToken({ name: "LSquareTok" });
    const RSquareTok = createToken({ name: "RSquareTok" });
    const ActionTok = createToken({ name: "ActionTok" });
    const LParenTok = createToken({ name: "LParenTok" });
    const RParenTok = createToken({ name: "RParenTok" });
    const CommaTok = createToken({ name: "CommaTok" });
    const SemicolonTok = createToken({ name: "SemicolonTok" });
    const EntityTok = createToken({ name: "EntityTok" });
    const KeyTok = createToken({ name: "KeyTok" });

    const qualifiedName = new Rule({
      name: "qualifiedName",
      definition: [
        new Terminal({ terminalType: IdentTok }),
        new Repetition({
          definition: [
            new Terminal({ terminalType: DotTok }),
            new Terminal({ terminalType: IdentTok, idx: 2 }),
          ],
        }),
      ],
    });
    const paramSpec = new Rule({
      name: "paramSpec",
      definition: [
        new Terminal({ terminalType: IdentTok }),
        new Terminal({ terminalType: ColonTok }),
        new NonTerminal({
          nonTerminalName: "qualifiedName",
          referencedRule: qualifiedName,
        }),
        new Option({
          definition: [
            new Terminal({ terminalType: LSquareTok }),
            new Terminal({ terminalType: RSquareTok }),
          ],
        }),
      ],
    });
    actionDec = new Rule({
      name: "actionDec",
      definition: [
        new Terminal({ terminalType: ActionTok }),
        new Terminal({ terminalType: IdentTok }),
        new Terminal({ terminalType: LParenTok }),
        new Option({
          definition: [
            new NonTerminal({
              nonTerminalName: "paramSpec",
              referencedRule: paramSpec,
            }),
            new Repetition({
              definition: [
                new Terminal({ terminalType: CommaTok }),
                new NonTerminal({
                  nonTerminalName: "paramSpec",
                  referencedRule: paramSpec,
                  idx: 2,
                }),
              ],
            }),
          ],
        }),
        new Terminal({ terminalType: RParenTok }),
        new Option({
          definition: [
            new Terminal({ terminalType: ColonTok }),
            new NonTerminal({
              nonTerminalName: "qualifiedName",
              referencedRule: qualifiedName,
            }),
          ],
          idx: 2,
        }),
        new Terminal({ terminalType: SemicolonTok }),
      ],
    });

    lotsOfOrs = new Rule({
      name: "lotsOfOrs",
      definition: [
        new Alternation({
          definition: [
            new Alternative({
              definition: [
                new Alternation({
                  definition: [
                    new Alternative({
                      definition: [
                        new Terminal({
                          terminalType: CommaTok,
                          idx: 1,
                        }),
                      ],
                    }),
                    new Alternative({
                      definition: [
                        new Terminal({
                          terminalType: KeyTok,
                          idx: 1,
                        }),
                      ],
                    }),
                  ],
                  idx: 2,
                }),
              ],
            }),
            new Alternative({
              definition: [
                new Terminal({
                  terminalType: EntityTok,
                  idx: 1,
                }),
              ],
            }),
          ],
        }),
        new Alternation({
          definition: [
            new Alternative({
              definition: [
                new Terminal({
                  terminalType: DotTok,
                  idx: 1,
                }),
              ],
            }),
          ],
          idx: 3,
        }),
      ],
    });

    emptyAltOr = new Rule({
      name: "emptyAltOr",
      definition: [
        new Alternation({
          definition: [
            new Alternative({
              definition: [
                new Terminal({
                  terminalType: KeyTok,
                  idx: 1,
                }),
              ],
            }),
            new Alternative({
              definition: [
                new Terminal({
                  terminalType: EntityTok,
                  idx: 1,
                }),
              ],
            }),
            new Alternative({ definition: [] }), // an empty alternative
          ],
        }),
      ],
    });

    class ColonParserMock extends EmbeddedActionsParser {
      constructor() {
        super([ColonTok]);
      }

      LA(): IToken {
        return createRegularToken(ColonTok, ":");
      }
    }
    ColonParserMockVar = ColonParserMock;

    class IdentParserMock extends EmbeddedActionsParser {
      constructor() {
        super([IdentTok]);
      }

      LA(): IToken {
        return createRegularToken(IdentTok, "bamba");
      }
    }
    IdentParserMockVar = IdentParserMock;

    class CommaParserMock extends EmbeddedActionsParser {
      constructor() {
        super([CommaTok]);
      }

      LA(): IToken {
        return createRegularToken(CommaTok, ",");
      }
    }
    CommaParserMockVar = CommaParserMock;

    class EntityParserMock extends EmbeddedActionsParser {
      constructor() {
        super([EntityTok]);
      }

      LA(): IToken {
        return createRegularToken(EntityTok, ",");
      }
    }
    EntityParserMockVar = EntityParserMock;

    class KeyParserMock extends EmbeddedActionsParser {
      constructor() {
        super([KeyTok]);
      }

      LA(): IToken {
        return createRegularToken(KeyTok, ",");
      }
    }
    KeyParserMockVar = KeyParserMock;
  });

  describe("The Grammar Lookahead namespace", () => {
    it("can compute the lookahead function for the first OPTION in ActionDec", () => {
      const colonMock = new ColonParserMockVar();
      const indentMock = new IdentParserMockVar();

      const laFunc = buildLookaheadFuncForOptionalProd(
        1,
        actionDec,
        1,
        false,
        PROD_TYPE.OPTION,
        buildSingleAlternativeLookaheadFunction,
      );

      expect(laFunc.call(colonMock)).to.equal(false);
      expect(laFunc.call(indentMock)).to.equal(true);
    });

    it("can compute the lookahead function for the second OPTION in ActionDec", () => {
      const colonParserMock = new ColonParserMockVar();
      const identParserMock = new IdentParserMockVar();

      const laFunc = buildLookaheadFuncForOptionalProd(
        2,
        actionDec,
        1,
        false,
        PROD_TYPE.OPTION,
        buildSingleAlternativeLookaheadFunction,
      );

      expect(laFunc.call(colonParserMock)).to.equal(true);
      expect(laFunc.call(identParserMock)).to.equal(false);
    });

    it("can compute the lookahead function for OPTION with categories", () => {
      const B = createToken({ name: "B" });
      const C = createToken({ name: "C", categories: [B] });

      const optionRule = new Rule({
        name: "optionRule",
        definition: [
          new Option({
            definition: [
              new Terminal({
                terminalType: B,
                idx: 1,
              }),
            ],
          }),
        ],
      });

      const laFunc = buildLookaheadFuncForOptionalProd(
        1,
        optionRule,
        1,
        false,
        PROD_TYPE.OPTION,
        buildSingleAlternativeLookaheadFunction,
      );

      const laMock = {
        LA(): IToken {
          return createRegularToken(C, "c");
        },
      };

      // C can match B (2nd alternative) due to its categories definition
      expect(laFunc.call(laMock)).to.be.true;
    });

    it("can compute the lookahead function for the first MANY in ActionDec", () => {
      const identParserMock = new IdentParserMockVar();
      const commaParserMock = new CommaParserMockVar();

      const laFunc = buildLookaheadFuncForOptionalProd(
        1,
        actionDec,
        1,
        false,
        PROD_TYPE.REPETITION,
        buildSingleAlternativeLookaheadFunction,
      );

      expect(laFunc.call(commaParserMock)).to.equal(true);
      expect(laFunc.call(identParserMock)).to.equal(false);
    });

    it("can compute the lookahead function for lots of ORs sample", () => {
      const keyParserMock = new KeyParserMockVar();
      const entityParserMock = new EntityParserMockVar();
      const colonParserMock = new ColonParserMockVar();
      const commaParserMock = new CommaParserMockVar();

      const laFunc = buildLookaheadFuncForOr(
        1,
        lotsOfOrs,
        1,
        false,
        false,
        buildAlternativesLookAheadFunc,
      );

      expect(laFunc.call(commaParserMock)).to.equal(0);
      expect(laFunc.call(keyParserMock)).to.equal(0);
      expect(laFunc.call(entityParserMock)).to.equal(1);
      expect(laFunc.call(colonParserMock)).to.equal(undefined);
    });

    it("can compute the lookahead function for OR using categories", () => {
      const A = createToken({ name: "A" });
      const B = createToken({ name: "B" });
      const C = createToken({ name: "C", categories: [B] });

      const orRule = new Rule({
        name: "orRule",
        definition: [
          new Alternation({
            definition: [
              new Alternative({
                definition: [
                  new Terminal({
                    terminalType: A,
                    idx: 1,
                  }),
                ],
              }),
              new Alternative({
                definition: [
                  new Terminal({
                    terminalType: B,
                    idx: 1,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const laFunc = buildLookaheadFuncForOr(
        1,
        orRule,
        1,
        false,
        false,
        buildAlternativesLookAheadFunc,
      );

      const laMock = {
        LA(): IToken {
          return createRegularToken(C, "c");
        },
      };

      // C can match B (2nd alternative) due to its categories definition
      expect(laFunc.call(laMock)).to.equal(1);
    });

    it("can compute the lookahead function for EMPTY OR sample", () => {
      const commaParserMock = new CommaParserMockVar();
      const keyParserMock = new KeyParserMockVar();
      const entityParserMock = new EntityParserMockVar();

      const laFunc = buildLookaheadFuncForOr(
        1,
        emptyAltOr,
        1,
        false,
        false,
        buildAlternativesLookAheadFunc,
      );

      expect(laFunc.call(keyParserMock)).to.equal(0);
      expect(laFunc.call(entityParserMock)).to.equal(1);
      // none matches so the last empty alternative should be taken (idx 2)
      expect(laFunc.call(commaParserMock)).to.equal(2);
    });
  });

  describe("The chevrotain grammar lookahead capabilities", () => {
    let Alpha: TokenType;
    let ExtendsAlpha: TokenType;
    let ExtendsAlphaAlpha: TokenType;
    let Beta: TokenType;
    let Charlie: TokenType;
    let Delta: TokenType;
    let Gamma: TokenType;

    before(() => {
      Alpha = createToken({ name: "Alpha" });
      ExtendsAlpha = createToken({
        name: "ExtendsAlpha",
        categories: Alpha,
      });
      ExtendsAlphaAlpha = createToken({
        name: "ExtendsAlphaAlpha",
        categories: ExtendsAlpha,
      });
      Beta = createToken({ name: "Beta" });
      Charlie = createToken({ name: "Charlie" });
      Delta = createToken({ name: "Delta" });
      Gamma = createToken({ name: "Gamma" });
      augmentTokenTypes([
        Alpha,
        Beta,
        Delta,
        Gamma,
        Charlie,
        ExtendsAlphaAlpha,
      ]);
    });

    context("computing lookahead sequences for", () => {
      it("two simple one token alternatives", () => {
        const alt1 = new Alternation({
          definition: [
            new Alternative({
              definition: [new Terminal({ terminalType: Alpha })],
            }),
            new Alternative({
              definition: [new Terminal({ terminalType: Beta })],
            }),
            new Alternative({
              definition: [new Terminal({ terminalType: Beta })],
            }),
          ],
        });
        const alt2 = new Terminal({ terminalType: Gamma });

        const actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5);
        expect(actual).to.deep.equal([[[Alpha], [Beta]], [[Gamma]]]);
      });

      it("three simple one token alternatives", () => {
        const alt1 = new Alternation({
          definition: [
            new Alternative({
              definition: [new Terminal({ terminalType: Alpha })],
            }),
            new Alternative({
              definition: [new Terminal({ terminalType: Beta })],
            }),
            new Alternative({
              definition: [new Terminal({ terminalType: Beta })],
            }),
          ],
        });
        const alt2 = new Terminal({ terminalType: Gamma });
        const alt3 = new Alternative({
          definition: [
            new Terminal({ terminalType: Delta }),
            new Terminal({ terminalType: Charlie }),
          ],
        });

        const actual = lookAheadSequenceFromAlternatives([alt1, alt2, alt3], 5);
        expect(actual).to.deep.equal([[[Alpha], [Beta]], [[Gamma]], [[Delta]]]);
      });

      it("two complex multi token alternatives", () => {
        const alt1 = new Alternation({
          definition: [
            new Alternative({
              definition: [
                new Terminal({ terminalType: Alpha }),
                new Terminal({ terminalType: Beta }),
              ],
            }),
            new Alternative({
              definition: [new Terminal({ terminalType: Beta })],
            }),
            new Alternative({
              definition: [
                new Terminal({ terminalType: Alpha }),
                new Terminal({ terminalType: Gamma }),
                new Terminal({ terminalType: Delta }),
              ],
            }),
          ],
        });
        const alt2 = new Alternation({
          definition: [
            new Alternative({
              definition: [
                new Terminal({ terminalType: Alpha }),
                new Terminal({ terminalType: Delta }),
              ],
            }),
            new Alternative({
              definition: [new Terminal({ terminalType: Charlie })],
            }),
          ],
        });

        const actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5);
        expect(actual).to.deep.equal([
          [[Beta], [Alpha, Beta], [Alpha, Gamma]],
          [[Charlie], [Alpha, Delta]],
        ]);
      });

      it("three complex multi token alternatives", () => {
        const alt1 = new Alternation({
          definition: [
            new Alternative({
              definition: [
                new Terminal({ terminalType: Alpha }),
                new Terminal({ terminalType: Beta }),
                new Terminal({ terminalType: Gamma }),
              ],
            }),
            new Alternative({
              definition: [new Terminal({ terminalType: Beta })],
            }),
          ],
        });
        const alt2 = new Alternation({
          definition: [
            new Alternative({
              definition: [
                new Terminal({ terminalType: Alpha }),
                new Terminal({ terminalType: Delta }),
              ],
            }),
            new Alternative({
              definition: [new Terminal({ terminalType: Charlie })],
            }),
            new Alternative({
              definition: [
                new Terminal({ terminalType: Gamma }),
                new Terminal({ terminalType: Gamma }),
              ],
            }),
          ],
        });
        const alt3 = new Alternation({
          definition: [
            new Alternative({
              definition: [
                new Terminal({ terminalType: Alpha }),
                new Terminal({ terminalType: Beta }),
                new Terminal({ terminalType: Delta }),
              ],
            }),
            new Alternative({
              definition: [
                new Terminal({ terminalType: Charlie }),
                new Terminal({ terminalType: Beta }),
              ],
            }),
          ],
        });

        const actual = lookAheadSequenceFromAlternatives([alt1, alt2, alt3], 5);
        expect(actual).to.deep.equal([
          [[Beta], [Alpha, Beta, Gamma]],
          [[Charlie], [Gamma], [Alpha, Delta]],
          [
            [Charlie, Beta],
            [Alpha, Beta, Delta],
          ],
        ]);
      });

      it("two complex multi token alternatives with shared prefix", () => {
        const alt1 = new Alternative({
          definition: [
            new Terminal({ terminalType: Alpha }),
            new Terminal({ terminalType: Beta }),
            new Terminal({ terminalType: Charlie }),
            new Terminal({ terminalType: Delta }),
          ],
        });

        const alt2 = new Alternative({
          definition: [
            new Terminal({ terminalType: Alpha }),
            new Terminal({ terminalType: Beta }),
            new Terminal({ terminalType: Charlie }),
            new Terminal({ terminalType: Delta }),
            new Terminal({ terminalType: Gamma }),
            new Terminal({ terminalType: Alpha }),
          ],
        });

        const actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5);
        expect(actual).to.deep.equal([
          [[Alpha, Beta, Charlie, Delta]],
          [[Alpha, Beta, Charlie, Delta, Gamma]],
        ]);
      });

      it("simple ambiguous alternatives", () => {
        const alt1 = new Alternative({
          definition: [new Terminal({ terminalType: Alpha })],
        });
        const alt2 = new Alternative({
          definition: [new Terminal({ terminalType: Alpha })],
        });

        const actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5);
        expect(actual).to.deep.equal([[[Alpha]], [[Alpha]]]);
      });

      it("complex(multi-token) ambiguous alternatives", () => {
        const alt1 = new Alternative({
          definition: [
            new Terminal({ terminalType: Alpha }),
            new Terminal({ terminalType: Beta }),
            new Terminal({ terminalType: Charlie }),
          ],
        });

        const alt2 = new Alternative({
          definition: [
            new Terminal({ terminalType: Alpha }),
            new Terminal({ terminalType: Beta }),
            new Terminal({ terminalType: Charlie }),
          ],
        });

        const actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5);
        expect(actual).to.deep.equal([
          [[Alpha, Beta, Charlie]],
          [[Alpha, Beta, Charlie]],
        ]);
      });
    });

    context("computing lookahead functions for", () => {
      class MockParser {
        public input: IToken[];

        constructor(public inputConstructors: TokenType[]) {
          this.input = map(inputConstructors, (currConst) =>
            createRegularToken(currConst),
          );
        }

        LA(howMuch: number): IToken {
          if (this.input.length <= howMuch - 1) {
            return END_OF_FILE;
          } else {
            return this.input[howMuch - 1];
          }
        }
      }

      it("inheritance Alternative alternatives - positive", () => {
        const alternatives = [
          [[ExtendsAlphaAlpha]], // 0
          [[ExtendsAlpha]], // 1
          [[Alpha]], // 2
        ];
        const laFunc = buildAlternativesLookAheadFunc(
          alternatives,
          false,
          tokenStructuredMatcher,
          false,
        );

        expect(laFunc.call(new MockParser([Alpha]))).to.equal(2);
        expect(laFunc.call(new MockParser([ExtendsAlpha]))).to.equal(1);
        expect(laFunc.call(new MockParser([ExtendsAlphaAlpha]))).to.equal(0);
      });

      it("simple alternatives - positive", () => {
        const alternatives = [
          [[Alpha], [Beta]], // 0
          [[Delta], [Gamma]], // 1
          [[Charlie]], // 2
        ];
        const laFunc = buildAlternativesLookAheadFunc(
          alternatives,
          false,
          tokenStructuredMatcher,
          false,
        );

        expect(laFunc.call(new MockParser([Alpha]))).to.equal(0);
        expect(laFunc.call(new MockParser([Beta]))).to.equal(0);
        expect(laFunc.call(new MockParser([Delta]))).to.equal(1);
        expect(laFunc.call(new MockParser([Gamma]))).to.equal(1);
        expect(laFunc.call(new MockParser([Charlie]))).to.equal(2);
      });

      it("simple alternatives - negative", () => {
        const alternatives = [
          [[Alpha], [Beta]], // 0
          [[Delta], [Gamma]], // 1
        ];
        const laFunc = buildAlternativesLookAheadFunc(
          alternatives,
          false,
          tokenStructuredMatcher,
          false,
        );

        expect(laFunc.call(new MockParser([]))).to.be.undefined;
        expect(laFunc.call(new MockParser([Charlie]))).to.be.undefined;
      });

      it("complex alternatives - positive", () => {
        const alternatives = [
          [
            [Alpha, Beta, Gamma],
            [Alpha, Beta, Delta],
          ], // 0
          [[Alpha, Beta, Beta]], // 1
          [[Alpha, Beta]], // 2 - Prefix of '1' alternative
        ];
        const laFunc = buildAlternativesLookAheadFunc(
          alternatives,
          false,
          tokenStructuredMatcher,
          false,
        );

        expect(laFunc.call(new MockParser([Alpha, Beta, Gamma]))).to.equal(0);
        expect(
          laFunc.call(new MockParser([Alpha, Beta, Gamma, Delta])),
        ).to.equal(0);
        expect(laFunc.call(new MockParser([Alpha, Beta, Delta]))).to.equal(0);
        expect(laFunc.call(new MockParser([Alpha, Beta, Beta]))).to.equal(1);
        expect(laFunc.call(new MockParser([Alpha, Beta, Charlie]))).to.equal(2);
      });

      it("complex alternatives - negative", () => {
        const alternatives = [
          [
            [Alpha, Beta, Gamma],
            [Alpha, Beta, Delta],
          ], // 0
          [[Alpha, Beta, Beta]], // 1
          [[Alpha, Beta], [Gamma]], // 2
        ];
        const laFunc = buildAlternativesLookAheadFunc(
          alternatives,
          false,
          tokenStructuredMatcher,
          false,
        );

        expect(laFunc.call(new MockParser([]))).to.be.undefined;
        expect(laFunc.call(new MockParser([Alpha, Gamma, Gamma]))).to.be
          .undefined;
        expect(laFunc.call(new MockParser([Charlie]))).to.be.undefined;
        expect(laFunc.call(new MockParser([Beta, Alpha, Beta, Gamma]))).to.be
          .undefined;
      });

      it("complex alternatives with inheritance - positive", () => {
        const alternatives = [
          [[ExtendsAlpha, Beta]], // 0
          [[Alpha, Beta]], // 1
        ];

        const laFunc = buildAlternativesLookAheadFunc(
          alternatives,
          false,
          tokenStructuredMatcher,
          false,
        );

        expect(laFunc.call(new MockParser([Alpha, Beta]))).to.equal(1);
        expect(laFunc.call(new MockParser([ExtendsAlphaAlpha, Beta]))).to.equal(
          0,
        );
        // expect(
        //     laFunc.call(new MockParser([ExtendsAlpha, Beta]))
        // ).to.equal(0)
      });

      it("complex alternatives with inheritance - negative", () => {
        const alternatives = [
          [[ExtendsAlpha, Beta]], // 0
          [[Alpha, Gamma]], // 1
        ];

        const laFunc = buildAlternativesLookAheadFunc(
          alternatives,
          false,
          tokenStructuredMatcher,
          false,
        );

        expect(laFunc.call(new MockParser([Alpha, Beta]))).to.be.undefined;
        expect(laFunc.call(new MockParser([ExtendsAlphaAlpha, Delta]))).to.be
          .undefined;
      });

      it("Empty alternatives", () => {
        const alternatives = [
          [[Alpha]], // 0
          [[]], // 1
        ];
        const laFunc = buildAlternativesLookAheadFunc(
          alternatives,
          false,
          tokenStructuredMatcher,
          false,
        );

        expect(laFunc.call(new MockParser([Alpha]))).to.equal(0);
        expect(laFunc.call(new MockParser([]))).to.equal(1); // empty alternative always matches
        expect(laFunc.call(new MockParser([Delta]))).to.equal(1); // empty alternative always matches
      });

      it("simple optional - positive", () => {
        const alternative = [[Alpha], [Beta], [Charlie]];
        const laFunc = buildSingleAlternativeLookaheadFunction(
          alternative,
          tokenStructuredMatcher,
          false,
        );

        expect(laFunc.call(new MockParser([Alpha]))).to.be.true;
        expect(laFunc.call(new MockParser([Beta]))).to.be.true;
        expect(laFunc.call(new MockParser([Charlie]))).to.be.true;
      });

      it("simple optional - negative", () => {
        const alternative = [[Alpha], [Beta], [Charlie]];
        const laFunc = buildSingleAlternativeLookaheadFunction(
          alternative,
          tokenStructuredMatcher,
          false,
        );

        expect(laFunc.call(new MockParser([Delta]))).to.be.false;
        expect(laFunc.call(new MockParser([Gamma]))).to.be.false;
      });

      it("complex optional - positive", () => {
        const alternative = [[Alpha, Beta, Gamma], [Beta], [Charlie, Delta]];
        const laFunc = buildSingleAlternativeLookaheadFunction(
          alternative,
          tokenStructuredMatcher,
          false,
        );

        expect(laFunc.call(new MockParser([Alpha, Beta, Gamma]))).to.be.true;
        expect(laFunc.call(new MockParser([Beta]))).to.be.true;
        expect(laFunc.call(new MockParser([Charlie, Delta]))).to.be.true;
      });

      it("complex optional - Negative", () => {
        const alternative = [[Alpha, Beta, Gamma], [Beta], [Charlie, Delta]];
        const laFunc = buildSingleAlternativeLookaheadFunction(
          alternative,
          tokenStructuredMatcher,
          false,
        );

        expect(laFunc.call(new MockParser([Alpha, Charlie, Gamma]))).to.be
          .false;
        expect(laFunc.call(new MockParser([Charlie]))).to.be.false;
        expect(laFunc.call(new MockParser([Charlie, Beta]))).to.be.false;
      });

      it("complex optional with inheritance - positive", () => {
        const alternative = [[Alpha, ExtendsAlpha, ExtendsAlphaAlpha]];
        const laFunc = buildSingleAlternativeLookaheadFunction(
          alternative,
          tokenStructuredMatcher,
          false,
        );

        expect(
          laFunc.call(new MockParser([Alpha, ExtendsAlpha, ExtendsAlphaAlpha])),
        ).to.be.true;
        expect(
          laFunc.call(
            new MockParser([ExtendsAlpha, ExtendsAlpha, ExtendsAlphaAlpha]),
          ),
        ).to.be.true;
        expect(
          laFunc.call(
            new MockParser([
              ExtendsAlphaAlpha,
              ExtendsAlpha,
              ExtendsAlphaAlpha,
            ]),
          ),
        ).to.be.true;
        expect(
          laFunc.call(
            new MockParser([
              ExtendsAlphaAlpha,
              ExtendsAlphaAlpha,
              ExtendsAlphaAlpha,
            ]),
          ),
        ).to.be.true;
      });

      it("complex optional with inheritance - negative", () => {
        const alternative = [[Alpha, ExtendsAlpha, ExtendsAlphaAlpha]];
        const laFunc = buildSingleAlternativeLookaheadFunction(
          alternative,
          tokenStructuredMatcher,
          false,
        );

        expect(
          laFunc.call(new MockParser([Gamma, ExtendsAlpha, ExtendsAlphaAlpha])),
        ).to.be.false;
        expect(
          laFunc.call(new MockParser([ExtendsAlpha, Alpha, ExtendsAlphaAlpha])),
        ).to.be.false;
        expect(
          laFunc.call(
            new MockParser([ExtendsAlphaAlpha, ExtendsAlpha, ExtendsAlpha]),
          ),
        ).to.be.false;
      });
    });
  });
});
