import { RegExpParser } from "../src/regexp-parser.js";
import { expect } from "chai";

describe("The RegExp to Ast parser", () => {
  let parser: RegExpParser;

  before(() => {
    parser = new RegExpParser();
  });

  context("can parse", () => {
    it("empty regExp", () => {
      const ast = parser.pattern("/(?:)/");
      expect(ast).to.deep.equal({
        type: "Pattern",
        loc: { begin: 0, end: 6 },
        flags: {
          type: "Flags",
          loc: { begin: 6, end: 6 },
          global: false,
          ignoreCase: false,
          multiLine: false,
          unicode: false,
          sticky: false,
        },
        value: {
          type: "Disjunction",
          loc: { begin: 1, end: 5 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 5 },
              value: [
                {
                  type: "Group",
                  loc: { begin: 1, end: 5 },
                  capturing: false,
                  value: {
                    type: "Disjunction",
                    loc: { begin: 4, end: 4 },
                    value: [
                      {
                        type: "Alternative",
                        loc: { begin: 4, end: 4 },
                        value: [],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      });
    });

    context("flags", () => {
      it("global", () => {
        const ast = parser.pattern("/(?:)/g");
        expect(ast.flags).to.deep.equal({
          type: "Flags",
          loc: { begin: 6, end: 7 },

          global: true,
          ignoreCase: false,
          multiLine: false,
          unicode: false,
          sticky: false,
        });
      });

      it("ignoreCase", () => {
        const ast = parser.pattern("/(?:)/i");
        expect(ast.flags).to.deep.equal({
          type: "Flags",
          loc: { begin: 6, end: 7 },

          global: false,
          ignoreCase: true,
          multiLine: false,
          unicode: false,
          sticky: false,
        });
      });

      it("multiLine", () => {
        const ast = parser.pattern("/(?:)/m");
        expect(ast.flags).to.deep.equal({
          type: "Flags",
          loc: { begin: 6, end: 7 },

          global: false,
          ignoreCase: false,
          multiLine: true,
          unicode: false,
          sticky: false,
        });
      });

      it("unicode", () => {
        const ast = parser.pattern("/(?:)/u");
        expect(ast.flags).to.deep.equal({
          type: "Flags",
          loc: { begin: 6, end: 7 },

          global: false,
          ignoreCase: false,
          multiLine: false,
          unicode: true,
          sticky: false,
        });
      });

      it("ignoreCase", () => {
        const ast = parser.pattern("/(?:)/y");
        expect(ast.flags).to.deep.equal({
          type: "Flags",
          loc: { begin: 6, end: 7 },

          global: false,
          ignoreCase: false,
          multiLine: false,
          unicode: false,
          sticky: true,
        });
      });

      it("none", () => {
        const ast = parser.pattern("/(?:)/");
        expect(ast.flags).to.deep.equal({
          type: "Flags",
          loc: { begin: 6, end: 6 },

          global: false,
          ignoreCase: false,
          multiLine: false,
          unicode: false,
          sticky: false,
        });
      });

      it("all", () => {
        const ast = parser.pattern("/(?:)/gimuy");
        expect(ast.flags).to.deep.equal({
          type: "Flags",
          loc: { begin: 6, end: 11 },

          global: true,
          ignoreCase: true,
          multiLine: true,
          unicode: true,
          sticky: true,
        });
      });

      it("duplicates", () => {
        const parse = () => parser.pattern("/(?:)/gig");
        expect(parse).to.throw("duplicate flag global");
      });

      it("unrecognized", () => {
        const parse = () => parser.pattern("/(?:)/x");
        expect(parse).to.throw("Redundant input: x");
      });
    });

    context("alternatives", () => {
      it("single", () => {
        const ast = parser.pattern("/abc/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 4 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 4 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 97,
                },
                {
                  type: "Character",
                  loc: { begin: 2, end: 3 },
                  value: 98,
                },
                {
                  type: "Character",
                  loc: { begin: 3, end: 4 },
                  value: 99,
                },
              ],
            },
          ],
        });
      });

      it("multiple", () => {
        const ast = parser.pattern("/a|b|c/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 6 },
          value: [
            {
              loc: { begin: 1, end: 2 },
              type: "Alternative",
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 97,
                },
              ],
            },
            {
              type: "Alternative",
              loc: { begin: 3, end: 4 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 3, end: 4 },
                  value: 98,
                },
              ],
            },
            {
              type: "Alternative",
              loc: { begin: 5, end: 6 },
              value: [
                {
                  loc: { begin: 5, end: 6 },
                  type: "Character",
                  value: 99,
                },
              ],
            },
          ],
        });
      });

      it("empty alternative", () => {
        const ast = parser.pattern("/a||c/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 5 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 2 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 97,
                },
              ],
            },
            {
              type: "Alternative",
              loc: { begin: 3, end: 3 },
              value: [],
            },
            {
              type: "Alternative",
              loc: { begin: 4, end: 5 },
              value: [
                {
                  loc: { begin: 4, end: 5 },
                  type: "Character",
                  value: 99,
                },
              ],
            },
          ],
        });
      });
    });

    context("assertions", () => {
      it("startAnchor", () => {
        const ast = parser.pattern("/^a/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 3 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 3 },
              value: [
                {
                  type: "StartAnchor",
                  loc: { begin: 1, end: 2 },
                },
                {
                  type: "Character",
                  loc: { begin: 2, end: 3 },
                  value: 97,
                },
              ],
            },
          ],
        });
      });

      it("endAnchor", () => {
        const ast = parser.pattern("/a$/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 3 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 3 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 97,
                },
                {
                  type: "EndAnchor",
                  loc: { begin: 2, end: 3 },
                },
              ],
            },
          ],
        });
      });

      it("word boundary", () => {
        const ast = parser.pattern("/a\\b/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 4 },
          value: [
            {
              loc: { begin: 1, end: 4 },
              type: "Alternative",
              value: [
                {
                  loc: { begin: 1, end: 2 },
                  type: "Character",
                  value: 97,
                },
                {
                  type: "WordBoundary",
                  loc: { begin: 2, end: 4 },
                },
              ],
            },
          ],
        });
      });

      it("NonWord boundary", () => {
        const ast = parser.pattern("/a\\B/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 4 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 4 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 97,
                },
                {
                  type: "NonWordBoundary",
                  loc: { begin: 2, end: 4 },
                },
              ],
            },
          ],
        });
      });

      it("lookahead assertion", () => {
        const ast = parser.pattern("/a(?=b)/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 7 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 7 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 97,
                },
                {
                  type: "Lookahead",
                  loc: { begin: 2, end: 7 },
                  value: {
                    type: "Disjunction",
                    loc: { begin: 5, end: 6 },
                    value: [
                      {
                        type: "Alternative",
                        loc: { begin: 5, end: 6 },
                        value: [
                          {
                            type: "Character",
                            loc: {
                              begin: 5,
                              end: 6,
                            },
                            value: 98,
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        });
      });

      it("lookahead assertion", () => {
        const ast = parser.pattern("/a(?!b)/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 7 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 7 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 97,
                },
                {
                  type: "NegativeLookahead",
                  loc: { begin: 2, end: 7 },
                  value: {
                    type: "Disjunction",
                    loc: { begin: 5, end: 6 },
                    value: [
                      {
                        type: "Alternative",
                        loc: { begin: 5, end: 6 },
                        value: [
                          {
                            type: "Character",
                            loc: {
                              begin: 5,
                              end: 6,
                            },
                            value: 98,
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        });
      });
    });

    it("lookbehind assertion", () => {
      const ast = parser.pattern("/a(?<=b)/");
      expect(ast.value).to.deep.equal({
        type: "Disjunction",
        loc: { begin: 1, end: 7 },
        value: [
          {
            type: "Alternative",
            loc: { begin: 1, end: 7 },
            value: [
              {
                type: "Character",
                loc: { begin: 1, end: 2 },
                value: 97,
              },
              {
                type: "Lookbehind",
                loc: { begin: 2, end: 7 },
                value: {
                  type: "Disjunction",
                  loc: { begin: 5, end: 6 },
                  value: [
                    {
                      type: "Alternative",
                      loc: { begin: 5, end: 6 },
                      value: [
                        {
                          type: "Character",
                          loc: {
                            begin: 5,
                            end: 6,
                          },
                          value: 98,
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        ],
      });
    });

    it("lookbehind assertion", () => {
      const ast = parser.pattern("/a(?<!b)/");
      expect(ast.value).to.deep.equal({
        type: "Disjunction",
        loc: { begin: 1, end: 7 },
        value: [
          {
            type: "Alternative",
            loc: { begin: 1, end: 7 },
            value: [
              {
                type: "Character",
                loc: { begin: 1, end: 2 },
                value: 97,
              },
              {
                type: "NegativeLookbehind",
                loc: { begin: 2, end: 7 },
                value: {
                  type: "Disjunction",
                  loc: { begin: 5, end: 6 },
                  value: [
                    {
                      type: "Alternative",
                      loc: { begin: 5, end: 6 },
                      value: [
                        {
                          type: "Character",
                          loc: {
                            begin: 5,
                            end: 6,
                          },
                          value: 98,
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        ],
      });
    });
  });

    context("quantifiers", () => {
      it("zero or one", () => {
        const ast = parser.pattern("/a?/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 3 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 3 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 97,
                  quantifier: {
                    type: "Quantifier",
                    loc: { begin: 2, end: 3 },
                    atLeast: 0,
                    atMost: 1,
                    greedy: true,
                  },
                },
              ],
            },
          ],
        });
      });

      it("star", () => {
        const ast = parser.pattern("/a*/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 3 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 3 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 97,
                  quantifier: {
                    type: "Quantifier",
                    loc: { begin: 2, end: 3 },
                    atLeast: 0,
                    atMost: Infinity,
                    greedy: true,
                  },
                },
              ],
            },
          ],
        });
      });

      it("plus", () => {
        const ast = parser.pattern("/a+/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 3 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 3 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 97,
                  quantifier: {
                    type: "Quantifier",
                    loc: { begin: 2, end: 3 },
                    atLeast: 1,
                    atMost: Infinity,
                    greedy: true,
                  },
                },
              ],
            },
          ],
        });
      });

      it("invalid exactlyX", () => {
        const ast = parser.pattern("/a{b}/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 5 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 5 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 97,
                },
                {
                  type: "Character",
                  loc: { begin: 2, end: 3 },
                  value: 123,
                },
                {
                  type: "Character",
                  loc: { begin: 3, end: 4 },
                  value: 98,
                },
                {
                  type: "Character",
                  loc: { begin: 4, end: 5 },
                  value: 125,
                },
              ],
            },
          ],
        });
      });

      it("exactlyX", () => {
        const ast = parser.pattern("/a{6}/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 5 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 5 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 97,
                  quantifier: {
                    type: "Quantifier",
                    loc: { begin: 2, end: 5 },
                    atLeast: 6,
                    atMost: 6,
                    greedy: true,
                  },
                },
              ],
            },
          ],
        });
      });

      it("atLeastX", () => {
        const ast = parser.pattern("/a{2,}/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 6 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 6 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 97,
                  quantifier: {
                    type: "Quantifier",
                    loc: { begin: 2, end: 6 },
                    atLeast: 2,
                    atMost: Infinity,
                    greedy: true,
                  },
                },
              ],
            },
          ],
        });
      });

      it("atLeastXAtMostY", () => {
        const ast = parser.pattern("/a{8,12}/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 8 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 8 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 97,
                  quantifier: {
                    type: "Quantifier",
                    loc: { begin: 2, end: 8 },
                    atLeast: 8,
                    atMost: 12,
                    greedy: true,
                  },
                },
              ],
            },
          ],
        });
      });

      it("issue #6 bug", () => {
        const ast = parser.pattern("/a{0,3}/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 7 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 7 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 97,
                  quantifier: {
                    type: "Quantifier",
                    loc: { begin: 2, end: 7 },
                    atLeast: 0,
                    atMost: 3,
                    greedy: true,
                  },
                },
              ],
            },
          ],
        });
      });

      // /[0-9]+[a-z]{0,3}/
      it("nonGreedy", () => {
        const ast = parser.pattern("/a??/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 4 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 4 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 97,
                  quantifier: {
                    type: "Quantifier",
                    loc: { begin: 2, end: 4 },
                    atLeast: 0,
                    atMost: 1,
                    greedy: false,
                  },
                },
              ],
            },
          ],
        });
      });
    });

    context("atoms", () => {
      it("Looks like Quantifier", () => {
        const ast = parser.pattern("/{{1/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 4 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 4 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 123,
                },
                {
                  type: "Character",
                  loc: { begin: 2, end: 3 },
                  value: 123,
                },
                {
                  type: "Character",
                  loc: { begin: 3, end: 4 },
                  value: 49,
                },
              ],
            },
          ],
        });
      });

      it("patternCharacter", () => {
        const ast = parser.pattern("/b/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 2 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 2 },
              value: [
                {
                  type: "Character",
                  loc: { begin: 1, end: 2 },
                  value: 98,
                },
              ],
            },
          ],
        });
      });

      it("dotAll", () => {
        const ast = parser.pattern("/./");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 2 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 2 },
              value: [
                {
                  type: "Set",
                  loc: { begin: 1, end: 2 },
                  complement: true,
                  value: [10, 13, 8232, 8233],
                },
              ],
            },
          ],
        });
      });

      context("escapes", () => {
        context("Character class escapes", () => {
          it("digit", () => {
            const ast = parser.pattern("/\\d/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 3 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 3 },
                  value: [
                    {
                      type: "Set",
                      loc: { begin: 1, end: 3 },
                      value: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57],
                      complement: false,
                    },
                  ],
                },
              ],
            });
          });

          it("not digit", () => {
            const ast = parser.pattern("/\\D/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 3 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 3 },
                  value: [
                    {
                      type: "Set",
                      loc: { begin: 1, end: 3 },
                      value: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57],
                      complement: true,
                    },
                  ],
                },
              ],
            });
          });

          it("word character", () => {
            const ast = parser.pattern("/\\w/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 3 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 3 },
                  value: [
                    {
                      type: "Set",
                      loc: { begin: 1, end: 3 },
                      value: [
                        95, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 97, 98, 99,
                        100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
                        111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
                        122, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77,
                        78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90,
                      ],
                      complement: false,
                    },
                  ],
                },
              ],
            });
          });

          it("not word character", () => {
            const ast = parser.pattern("/\\W/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 3 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 3 },
                  value: [
                    {
                      type: "Set",
                      loc: { begin: 1, end: 3 },
                      value: [
                        95, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 97, 98, 99,
                        100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
                        111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
                        122, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77,
                        78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90,
                      ],
                      complement: true,
                    },
                  ],
                },
              ],
            });
          });

          it("whitespace", () => {
            const ast = parser.pattern("/\\s/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 3 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 3 },
                  value: [
                    {
                      type: "Set",
                      loc: { begin: 1, end: 3 },
                      value: [
                        32, 12, 10, 13, 9, 11, 9, 160, 5760, 8192, 8193, 8194,
                        8195, 8196, 8197, 8198, 8199, 8200, 8201, 8202, 8232,
                        8233, 8239, 8287, 12288, 65279,
                      ],
                      complement: false,
                    },
                  ],
                },
              ],
            });
          });

          it("not whitespace", () => {
            const ast = parser.pattern("/\\S/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 3 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 3 },
                  value: [
                    {
                      type: "Set",
                      loc: { begin: 1, end: 3 },
                      value: [
                        32, 12, 10, 13, 9, 11, 9, 160, 5760, 8192, 8193, 8194,
                        8195, 8196, 8197, 8198, 8199, 8200, 8201, 8202, 8232,
                        8233, 8239, 8287, 12288, 65279,
                      ],
                      complement: true,
                    },
                  ],
                },
              ],
            });
          });
        });

        context("decimal", () => {
          it("valid escape", () => {
            const ast = parser.pattern("/\\123/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 5 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 5 },
                  value: [
                    {
                      type: "GroupBackReference",
                      loc: { begin: 1, end: 5 },
                      value: 123,
                    },
                  ],
                },
              ],
            });
          });
        });

        context("control escape", () => {
          it("form feed", () => {
            const ast = parser.pattern("/\\f/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 3 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 3 },
                  value: [
                    {
                      type: "Character",
                      loc: { begin: 1, end: 3 },
                      value: 12,
                    },
                  ],
                },
              ],
            });
          });

          it("new line", () => {
            const ast = parser.pattern("/\\n/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 3 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 3 },
                  value: [
                    {
                      type: "Character",
                      loc: { begin: 1, end: 3 },
                      value: 10,
                    },
                  ],
                },
              ],
            });
          });

          it("carriage return", () => {
            const ast = parser.pattern("/\\r/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 3 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 3 },
                  value: [
                    {
                      type: "Character",
                      loc: { begin: 1, end: 3 },
                      value: 13,
                    },
                  ],
                },
              ],
            });
          });

          it("horizontal tab", () => {
            const ast = parser.pattern("/\\t/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 3 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 3 },
                  value: [
                    {
                      type: "Character",
                      loc: { begin: 1, end: 3 },
                      value: 9,
                    },
                  ],
                },
              ],
            });
          });

          it("vertical tab", () => {
            const ast = parser.pattern("/\\v/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 3 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 3 },
                  value: [
                    {
                      type: "Character",
                      loc: { begin: 1, end: 3 },
                      value: 11,
                    },
                  ],
                },
              ],
            });
          });
        });

        it("control letter", () => {
          const ast = parser.pattern("/\\cB/");
          expect(ast.value).to.deep.equal({
            type: "Disjunction",
            loc: { begin: 1, end: 4 },
            value: [
              {
                type: "Alternative",
                loc: { begin: 1, end: 4 },
                value: [
                  {
                    type: "Character",
                    loc: { begin: 1, end: 4 },
                    value: 2,
                  },
                ],
              },
            ],
          });
        });

        it("invalid control letter", () => {
          expect(() => parser.pattern("/\\c9/")).to.throw();
        });

        it("nul character", () => {
          const ast = parser.pattern("/\\0/");
          expect(ast.value).to.deep.equal({
            type: "Disjunction",
            loc: { begin: 1, end: 3 },
            value: [
              {
                type: "Alternative",
                loc: { begin: 1, end: 3 },
                value: [
                  {
                    type: "Character",
                    loc: { begin: 1, end: 3 },
                    value: 0,
                  },
                ],
              },
            ],
          });
        });

        it("invalid hex", () => {
          expect(() => parser.pattern("/\\x2v/")).to.throw(
            "Expecting a HexDecimal digits",
          );
        });

        it("unicode", () => {
          const ast = parser.pattern("/\\u000a/");
          expect(ast.value).to.deep.equal({
            type: "Disjunction",
            loc: { begin: 1, end: 7 },
            value: [
              {
                type: "Alternative",
                loc: { begin: 1, end: 7 },
                value: [
                  {
                    type: "Character",
                    loc: { begin: 1, end: 7 },
                    value: 10,
                  },
                ],
              },
            ],
          });
        });

        it("Identity", () => {
          const ast = parser.pattern("/\\*/");
          expect(ast.value).to.deep.equal({
            type: "Disjunction",
            loc: { begin: 1, end: 3 },
            value: [
              {
                type: "Alternative",
                loc: { begin: 1, end: 3 },
                value: [
                  {
                    type: "Character",
                    loc: { begin: 1, end: 3 },
                    value: 42,
                  },
                ],
              },
            ],
          });
        });
      });

      context("CharacterClass", () => {
        context("escapes", () => {
          it("closing square parenthesis", () => {
            const ast = parser.pattern("/[\\]]/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 5 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 5 },
                  value: [
                    {
                      type: "Set",
                      loc: { begin: 1, end: 5 },
                      complement: false,
                      value: [93],
                    },
                  ],
                },
              ],
            });
          });

          it("backspace", () => {
            const ast = parser.pattern("/[\\b]/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 5 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 5 },
                  value: [
                    {
                      type: "Set",
                      loc: { begin: 1, end: 5 },
                      complement: false,
                      value: [8],
                    },
                  ],
                },
              ],
            });
          });

          it("form feed", () => {
            const ast = parser.pattern("/[\\f]/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 5 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 5 },
                  value: [
                    {
                      type: "Set",
                      loc: { begin: 1, end: 5 },
                      complement: false,
                      value: [12],
                    },
                  ],
                },
              ],
            });
          });

          it("control letter", () => {
            const ast = parser.pattern("/[\\cd]/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 6 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 6 },
                  value: [
                    {
                      complement: false,
                      type: "Set",
                      loc: { begin: 1, end: 6 },
                      value: [4],
                    },
                  ],
                },
              ],
            });
          });

          it("nul", () => {
            const ast = parser.pattern("/[\\0a]/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 6 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 6 },
                  value: [
                    {
                      type: "Set",
                      loc: { begin: 1, end: 6 },
                      complement: false,
                      value: [0, 97],
                    },
                  ],
                },
              ],
            });
          });

          it("hexDecimal", () => {
            const ast = parser.pattern("/[\\xbc]/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 7 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 7 },
                  value: [
                    {
                      type: "Set",
                      loc: { begin: 1, end: 7 },
                      complement: false,
                      value: [188],
                    },
                  ],
                },
              ],
            });
          });

          it("unicode", () => {
            const ast = parser.pattern("/[\\u001a]/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 9 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 9 },
                  value: [
                    {
                      complement: false,
                      type: "Set",
                      loc: { begin: 1, end: 9 },
                      value: [26],
                    },
                  ],
                },
              ],
            });
          });

          it("digits", () => {
            const ast = parser.pattern("/[\\d]/");
            expect(ast.value).to.deep.equal({
              type: "Disjunction",
              loc: { begin: 1, end: 5 },
              value: [
                {
                  type: "Alternative",
                  loc: { begin: 1, end: 5 },
                  value: [
                    {
                      type: "Set",
                      loc: { begin: 1, end: 5 },
                      complement: false,
                      value: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57],
                    },
                  ],
                },
              ],
            });
          });
        });

        it("pattern character", () => {
          const ast = parser.pattern("/[a]/");
          expect(ast.value).to.deep.equal({
            type: "Disjunction",
            loc: { begin: 1, end: 4 },
            value: [
              {
                type: "Alternative",
                loc: { begin: 1, end: 4 },
                value: [
                  {
                    type: "Set",
                    loc: { begin: 1, end: 4 },
                    complement: false,
                    value: [97],
                  },
                ],
              },
            ],
          });
        });

        it("complement", () => {
          const ast = parser.pattern("/[^a]/");
          expect(ast.value).to.deep.equal({
            type: "Disjunction",
            loc: { begin: 1, end: 5 },
            value: [
              {
                type: "Alternative",
                loc: { begin: 1, end: 5 },
                value: [
                  {
                    type: "Set",
                    loc: { begin: 1, end: 5 },
                    complement: true,
                    value: [97],
                  },
                ],
              },
            ],
          });
        });

        it("range", () => {
          const ast = parser.pattern("/[A-Z]/");
          expect(ast.value).to.deep.equal({
            type: "Disjunction",
            loc: { begin: 1, end: 6 },
            value: [
              {
                type: "Alternative",
                loc: { begin: 1, end: 6 },
                value: [
                  {
                    type: "Set",
                    loc: { begin: 1, end: 6 },
                    complement: false,
                    value: [
                      {
                        from: 65,
                        to: 90,
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });

        it("invalid range", () => {
          expect(() => parser.pattern("/[B-A]/")).to.throw(
            "Range out of order in character class",
          );
        });

        it("range with set", () => {
          const ast = parser.pattern("/[A-\\d]/");
          expect(ast.value).to.deep.equal({
            type: "Disjunction",
            loc: { begin: 1, end: 7 },
            value: [
              {
                type: "Alternative",
                loc: { begin: 1, end: 7 },
                value: [
                  {
                    type: "Set",
                    loc: { begin: 1, end: 7 },
                    complement: false,
                    value: [65, 45, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57],
                  },
                ],
              },
            ],
          });
        });
      });
    });

    context("groups", () => {
      it("capturing", () => {
        const ast = parser.pattern("/(a)(b)/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 7 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 7 },
              value: [
                {
                  type: "Group",
                  loc: { begin: 1, end: 4 },
                  capturing: true,
                  value: {
                    type: "Disjunction",
                    loc: { begin: 2, end: 3 },
                    value: [
                      {
                        type: "Alternative",
                        loc: { begin: 2, end: 3 },
                        value: [
                          {
                            type: "Character",
                            loc: {
                              begin: 2,
                              end: 3,
                            },
                            value: 97,
                          },
                        ],
                      },
                    ],
                  },
                  idx: 1,
                },
                {
                  type: "Group",
                  loc: { begin: 4, end: 7 },
                  capturing: true,
                  value: {
                    type: "Disjunction",
                    loc: { begin: 5, end: 6 },
                    value: [
                      {
                        type: "Alternative",
                        loc: { begin: 5, end: 6 },
                        value: [
                          {
                            type: "Character",
                            loc: {
                              begin: 5,
                              end: 6,
                            },
                            value: 98,
                          },
                        ],
                      },
                    ],
                  },
                  idx: 2,
                },
              ],
            },
          ],
        });
      });

      it("non capturing", () => {
        const ast = parser.pattern("/(?:a)(b)/");
        expect(ast.value).to.deep.equal({
          type: "Disjunction",
          loc: { begin: 1, end: 9 },
          value: [
            {
              type: "Alternative",
              loc: { begin: 1, end: 9 },
              value: [
                {
                  type: "Group",
                  loc: { begin: 1, end: 6 },
                  capturing: false,
                  value: {
                    type: "Disjunction",
                    loc: { begin: 4, end: 5 },
                    value: [
                      {
                        type: "Alternative",
                        loc: { begin: 4, end: 5 },
                        value: [
                          {
                            type: "Character",
                            loc: {
                              begin: 4,
                              end: 5,
                            },
                            value: 97,
                          },
                        ],
                      },
                    ],
                  },
                },
                {
                  type: "Group",
                  loc: { begin: 6, end: 9 },
                  capturing: true,
                  value: {
                    type: "Disjunction",
                    loc: { begin: 7, end: 8 },
                    value: [
                      {
                        type: "Alternative",
                        loc: { begin: 7, end: 8 },
                        value: [
                          {
                            type: "Character",
                            loc: {
                              begin: 7,
                              end: 8,
                            },
                            value: 98,
                          },
                        ],
                      },
                    ],
                  },
                  idx: 1,
                },
              ],
            },
          ],
        });
      });
    });
  });

  context("Error Handling", () => {
    it("unexpected end of input", () => {
      const parse = () => parser.pattern("/a");
      expect(parse).to.throw("Unexpected end of input");
    });

    it("unexpected character", () => {
      const parse = () => parser.pattern("a");
      expect(parse).to.throw("Expected: '/' but found: 'a' at offset: 0");
    });
  });
});
