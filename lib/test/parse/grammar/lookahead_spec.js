"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var parser_1 = require("../../../src/parse/parser/parser");
var tokens_public_1 = require("../../../src/scan/tokens_public");
var lookahead_1 = require("../../../src/parse/grammar/lookahead");
var utils_1 = require("../../../src/utils/utils");
var tokens_1 = require("../../../src/scan/tokens");
var matchers_1 = require("../../utils/matchers");
var gast_public_1 = require("../../../src/parse/grammar/gast/gast_public");
var IdentTok = tokens_public_1.createToken({ name: "IdentTok" });
var DotTok = tokens_public_1.createToken({ name: "DotTok" });
var DotDotTok = tokens_public_1.createToken({ name: "DotDotTok" });
var ColonTok = tokens_public_1.createToken({ name: "ColonTok" });
var LSquareTok = tokens_public_1.createToken({ name: "LSquareTok" });
var RSquareTok = tokens_public_1.createToken({ name: "RSquareTok" });
var ActionTok = tokens_public_1.createToken({ name: "ActionTok" });
var LParenTok = tokens_public_1.createToken({ name: "LParenTok" });
var RParenTok = tokens_public_1.createToken({ name: "RParenTok" });
var CommaTok = tokens_public_1.createToken({ name: "CommaTok" });
var SemicolonTok = tokens_public_1.createToken({ name: "SemicolonTok" });
var UnsignedIntegerLiteralTok = tokens_public_1.createToken({
    name: "UnsignedIntegerLiteralTok"
});
var DefaultTok = tokens_public_1.createToken({ name: "DefaultTok" });
var AsteriskTok = tokens_public_1.createToken({ name: "AsteriskTok" });
var EntityTok = tokens_public_1.createToken({ name: "EntityTok" });
var KeyTok = tokens_public_1.createToken({ name: "KeyTok" });
var atLeastOneRule = new gast_public_1.Rule({
    name: "atLeastOneRule",
    definition: [
        new gast_public_1.RepetitionMandatory({
            definition: [
                new gast_public_1.RepetitionMandatory({
                    definition: [
                        new gast_public_1.RepetitionMandatory({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: EntityTok })
                            ],
                            idx: 3
                        }),
                        new gast_public_1.Terminal({ terminalType: CommaTok })
                    ],
                    idx: 2
                }),
                new gast_public_1.Terminal({ terminalType: DotTok, idx: 1 })
            ]
        }),
        new gast_public_1.Terminal({ terminalType: DotTok, idx: 2 })
    ]
});
var atLeastOneSepRule = new gast_public_1.Rule({
    name: "atLeastOneSepRule",
    definition: [
        new gast_public_1.RepetitionMandatoryWithSeparator({
            definition: [
                new gast_public_1.RepetitionMandatoryWithSeparator({
                    definition: [
                        new gast_public_1.RepetitionMandatoryWithSeparator({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: EntityTok })
                            ],
                            separator: SemicolonTok,
                            idx: 3
                        }),
                        new gast_public_1.Terminal({ terminalType: CommaTok })
                    ],
                    separator: SemicolonTok,
                    idx: 2
                }),
                new gast_public_1.Terminal({ terminalType: DotTok, idx: 1 })
            ],
            separator: SemicolonTok
        }),
        new gast_public_1.Terminal({ terminalType: DotTok, idx: 2 })
    ]
});
var qualifiedName = new gast_public_1.Rule({
    name: "qualifiedName",
    definition: [
        new gast_public_1.Terminal({ terminalType: IdentTok }),
        new gast_public_1.Repetition({
            definition: [
                new gast_public_1.Terminal({ terminalType: DotTok }),
                new gast_public_1.Terminal({ terminalType: IdentTok, idx: 2 })
            ]
        })
    ]
});
var qualifiedNameSep = new gast_public_1.Rule({
    name: "qualifiedNameSep",
    definition: [
        new gast_public_1.RepetitionMandatoryWithSeparator({
            definition: [new gast_public_1.Terminal({ terminalType: IdentTok, idx: 1 })],
            separator: DotTok
        })
    ]
});
var paramSpec = new gast_public_1.Rule({
    name: "paramSpec",
    definition: [
        new gast_public_1.Terminal({ terminalType: IdentTok }),
        new gast_public_1.Terminal({ terminalType: ColonTok }),
        new gast_public_1.NonTerminal({
            nonTerminalName: "qualifiedName",
            referencedRule: qualifiedName
        }),
        new gast_public_1.Option({
            definition: [
                new gast_public_1.Terminal({ terminalType: LSquareTok }),
                new gast_public_1.Terminal({ terminalType: RSquareTok })
            ]
        })
    ]
});
var actionDec = new gast_public_1.Rule({
    name: "actionDec",
    definition: [
        new gast_public_1.Terminal({ terminalType: ActionTok }),
        new gast_public_1.Terminal({ terminalType: IdentTok }),
        new gast_public_1.Terminal({ terminalType: LParenTok }),
        new gast_public_1.Option({
            definition: [
                new gast_public_1.NonTerminal({
                    nonTerminalName: "paramSpec",
                    referencedRule: paramSpec
                }),
                new gast_public_1.Repetition({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: CommaTok }),
                        new gast_public_1.NonTerminal({
                            nonTerminalName: "paramSpec",
                            referencedRule: paramSpec,
                            idx: 2
                        })
                    ]
                })
            ]
        }),
        new gast_public_1.Terminal({ terminalType: RParenTok }),
        new gast_public_1.Option({
            definition: [
                new gast_public_1.Terminal({ terminalType: ColonTok }),
                new gast_public_1.NonTerminal({
                    nonTerminalName: "qualifiedName",
                    referencedRule: qualifiedName
                })
            ],
            idx: 2
        }),
        new gast_public_1.Terminal({ terminalType: SemicolonTok })
    ]
});
var actionDecSep = new gast_public_1.Rule({
    name: "actionDecSep",
    definition: [
        new gast_public_1.Terminal({ terminalType: ActionTok }),
        new gast_public_1.Terminal({ terminalType: IdentTok }),
        new gast_public_1.Terminal({ terminalType: LParenTok }),
        new gast_public_1.RepetitionWithSeparator({
            definition: [
                new gast_public_1.NonTerminal({
                    nonTerminalName: "paramSpec",
                    referencedRule: paramSpec,
                    idx: 2
                })
            ],
            separator: CommaTok
        }),
        new gast_public_1.Terminal({ terminalType: RParenTok }),
        new gast_public_1.Option({
            definition: [
                new gast_public_1.Terminal({ terminalType: ColonTok }),
                new gast_public_1.NonTerminal({
                    nonTerminalName: "qualifiedName",
                    referencedRule: qualifiedName
                })
            ],
            idx: 2
        }),
        new gast_public_1.Terminal({ terminalType: SemicolonTok })
    ]
});
var manyActions = new gast_public_1.Rule({
    name: "manyActions",
    definition: [
        new gast_public_1.Repetition({
            definition: [
                new gast_public_1.NonTerminal({
                    nonTerminalName: "actionDec",
                    referencedRule: actionDec,
                    idx: 1
                })
            ]
        })
    ]
});
var cardinality = new gast_public_1.Rule({
    name: "cardinality",
    definition: [
        new gast_public_1.Terminal({ terminalType: LSquareTok }),
        new gast_public_1.Terminal({ terminalType: UnsignedIntegerLiteralTok }),
        new gast_public_1.Terminal({ terminalType: DotDotTok }),
        new gast_public_1.Alternation({
            definition: [
                new gast_public_1.Flat({
                    definition: [
                        new gast_public_1.Terminal({
                            terminalType: UnsignedIntegerLiteralTok,
                            idx: 2
                        })
                    ]
                }),
                new gast_public_1.Flat({
                    definition: [new gast_public_1.Terminal({ terminalType: AsteriskTok })]
                })
            ]
        }),
        new gast_public_1.Terminal({ terminalType: RSquareTok })
    ]
});
var assignedTypeSpec = new gast_public_1.Rule({
    name: "assignedTypeSpec",
    definition: [
        new gast_public_1.Terminal({ terminalType: ColonTok }),
        new gast_public_1.NonTerminal({ nonTerminalName: "assignedType" }),
        new gast_public_1.Option({
            definition: [new gast_public_1.NonTerminal({ nonTerminalName: "enumClause" })]
        }),
        new gast_public_1.Option({
            definition: [
                new gast_public_1.Terminal({ terminalType: DefaultTok }),
                new gast_public_1.NonTerminal({ nonTerminalName: "expression" })
            ],
            idx: 2
        })
    ]
});
var lotsOfOrs = new gast_public_1.Rule({
    name: "lotsOfOrs",
    definition: [
        new gast_public_1.Alternation({
            definition: [
                new gast_public_1.Flat({
                    definition: [
                        new gast_public_1.Alternation({
                            definition: [
                                new gast_public_1.Flat({
                                    definition: [
                                        new gast_public_1.Terminal({
                                            terminalType: CommaTok,
                                            idx: 1
                                        })
                                    ]
                                }),
                                new gast_public_1.Flat({
                                    definition: [
                                        new gast_public_1.Terminal({
                                            terminalType: KeyTok,
                                            idx: 1
                                        })
                                    ]
                                })
                            ],
                            idx: 2
                        })
                    ]
                }),
                new gast_public_1.Flat({
                    definition: [
                        new gast_public_1.Terminal({
                            terminalType: EntityTok,
                            idx: 1
                        })
                    ]
                })
            ]
        }),
        new gast_public_1.Alternation({
            definition: [
                new gast_public_1.Flat({
                    definition: [
                        new gast_public_1.Terminal({
                            terminalType: DotTok,
                            idx: 1
                        })
                    ]
                })
            ],
            idx: 3
        })
    ]
});
var emptyAltOr = new gast_public_1.Rule({
    name: "emptyAltOr",
    definition: [
        new gast_public_1.Alternation({
            definition: [
                new gast_public_1.Flat({
                    definition: [
                        new gast_public_1.Terminal({
                            terminalType: KeyTok,
                            idx: 1
                        })
                    ]
                }),
                new gast_public_1.Flat({
                    definition: [
                        new gast_public_1.Terminal({
                            terminalType: EntityTok,
                            idx: 1
                        })
                    ]
                }),
                new gast_public_1.Flat({ definition: [] }) // an empty alternative
            ]
        })
    ]
});
var callArguments = new gast_public_1.Rule({
    name: "callArguments",
    definition: [
        new gast_public_1.RepetitionWithSeparator({
            definition: [new gast_public_1.Terminal({ terminalType: IdentTok, idx: 1 })],
            separator: CommaTok
        }),
        new gast_public_1.RepetitionWithSeparator({
            definition: [new gast_public_1.Terminal({ terminalType: IdentTok, idx: 2 })],
            separator: CommaTok,
            idx: 2
        })
    ]
});
describe("getProdType", function () {
    it("handles `Option`", function () {
        expect(lookahead_1.getProdType(new gast_public_1.Option({ definition: [] }))).to.equal(lookahead_1.PROD_TYPE.OPTION);
    });
    it("handles `Repetition`", function () {
        expect(lookahead_1.getProdType(new gast_public_1.Repetition({ definition: [] }))).to.equal(lookahead_1.PROD_TYPE.REPETITION);
    });
    it("handles `RepetitionMandatory`", function () {
        expect(lookahead_1.getProdType(new gast_public_1.RepetitionMandatory({ definition: [] }))).to.equal(lookahead_1.PROD_TYPE.REPETITION_MANDATORY);
    });
    it("handles `RepetitionWithSeparator`", function () {
        expect(lookahead_1.getProdType(new gast_public_1.RepetitionWithSeparator({ definition: [], separator: null }))).to.equal(lookahead_1.PROD_TYPE.REPETITION_WITH_SEPARATOR);
    });
    it("handles `RepetitionMandatoryWithSeparator`", function () {
        expect(lookahead_1.getProdType(new gast_public_1.RepetitionMandatoryWithSeparator({
            definition: [],
            separator: null
        }))).to.equal(lookahead_1.PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR);
    });
    it("handles `Alternation`", function () {
        expect(lookahead_1.getProdType(new gast_public_1.Alternation({ definition: [] }))).to.equal(lookahead_1.PROD_TYPE.ALTERNATION);
    });
});
context("lookahead specs", function () {
    var ColonParserMock = /** @class */ (function (_super) {
        __extends(ColonParserMock, _super);
        function ColonParserMock() {
            return _super.call(this, [ColonTok]) || this;
        }
        ColonParserMock.prototype.LA = function () {
            return matchers_1.createRegularToken(ColonTok, ":");
        };
        return ColonParserMock;
    }(parser_1.Parser));
    var IdentParserMock = /** @class */ (function (_super) {
        __extends(IdentParserMock, _super);
        function IdentParserMock() {
            return _super.call(this, [IdentTok]) || this;
        }
        IdentParserMock.prototype.LA = function () {
            return matchers_1.createRegularToken(IdentTok, "bamba");
        };
        return IdentParserMock;
    }(parser_1.Parser));
    var CommaParserMock = /** @class */ (function (_super) {
        __extends(CommaParserMock, _super);
        function CommaParserMock() {
            return _super.call(this, [CommaTok]) || this;
        }
        CommaParserMock.prototype.LA = function () {
            return matchers_1.createRegularToken(CommaTok, ",");
        };
        return CommaParserMock;
    }(parser_1.Parser));
    var EntityParserMock = /** @class */ (function (_super) {
        __extends(EntityParserMock, _super);
        function EntityParserMock() {
            return _super.call(this, [EntityTok]) || this;
        }
        EntityParserMock.prototype.LA = function () {
            return matchers_1.createRegularToken(EntityTok, ",");
        };
        return EntityParserMock;
    }(parser_1.Parser));
    var KeyParserMock = /** @class */ (function (_super) {
        __extends(KeyParserMock, _super);
        function KeyParserMock() {
            return _super.call(this, [KeyTok]) || this;
        }
        KeyParserMock.prototype.LA = function () {
            return matchers_1.createRegularToken(KeyTok, ",");
        };
        return KeyParserMock;
    }(parser_1.Parser));
    describe("The Grammar Lookahead namespace", function () {
        it("can compute the lookahead function for the first OPTION in ActionDec", function () {
            var colonMock = new ColonParserMock();
            var indentMock = new IdentParserMock();
            var laFunc = lookahead_1.buildLookaheadFuncForOptionalProd(1, actionDec, 1, false, lookahead_1.PROD_TYPE.OPTION, lookahead_1.buildSingleAlternativeLookaheadFunction);
            expect(laFunc.call(colonMock)).to.equal(false);
            expect(laFunc.call(indentMock)).to.equal(true);
        });
        it("can compute the lookahead function for the second OPTION in ActionDec", function () {
            var colonParserMock = new ColonParserMock();
            var identParserMock = new IdentParserMock();
            var laFunc = lookahead_1.buildLookaheadFuncForOptionalProd(2, actionDec, 1, false, lookahead_1.PROD_TYPE.OPTION, lookahead_1.buildSingleAlternativeLookaheadFunction);
            expect(laFunc.call(colonParserMock)).to.equal(true);
            expect(laFunc.call(identParserMock)).to.equal(false);
        });
        it("can compute the lookahead function for OPTION with categories", function () {
            var B = tokens_public_1.createToken({ name: "B" });
            var C = tokens_public_1.createToken({ name: "C", categories: [B] });
            var optionRule = new gast_public_1.Rule({
                name: "optionRule",
                definition: [
                    new gast_public_1.Option({
                        definition: [
                            new gast_public_1.Terminal({
                                terminalType: B,
                                idx: 1
                            })
                        ]
                    })
                ]
            });
            var laFunc = lookahead_1.buildLookaheadFuncForOptionalProd(1, optionRule, 1, false, lookahead_1.PROD_TYPE.OPTION, lookahead_1.buildSingleAlternativeLookaheadFunction);
            var laMock = {
                LA: function () {
                    return matchers_1.createRegularToken(C, "c");
                }
            };
            // C can match B (2nd alternative) due to its categories definition
            expect(laFunc.call(laMock)).to.be.true;
        });
        it("can compute the lookahead function for the first MANY in ActionDec", function () {
            var identParserMock = new IdentParserMock();
            var commaParserMock = new CommaParserMock();
            var laFunc = lookahead_1.buildLookaheadFuncForOptionalProd(1, actionDec, 1, false, lookahead_1.PROD_TYPE.REPETITION, lookahead_1.buildSingleAlternativeLookaheadFunction);
            expect(laFunc.call(commaParserMock)).to.equal(true);
            expect(laFunc.call(identParserMock)).to.equal(false);
        });
        it("can compute the lookahead function for lots of ORs sample", function () {
            var keyParserMock = new KeyParserMock();
            var entityParserMock = new EntityParserMock();
            var colonParserMock = new ColonParserMock();
            var commaParserMock = new CommaParserMock();
            var laFunc = lookahead_1.buildLookaheadFuncForOr(1, lotsOfOrs, 1, false, false, lookahead_1.buildAlternativesLookAheadFunc);
            expect(laFunc.call(commaParserMock)).to.equal(0);
            expect(laFunc.call(keyParserMock)).to.equal(0);
            expect(laFunc.call(entityParserMock)).to.equal(1);
            expect(laFunc.call(colonParserMock)).to.equal(undefined);
        });
        it("can compute the lookahead function for OR using categories", function () {
            var A = tokens_public_1.createToken({ name: "A" });
            var B = tokens_public_1.createToken({ name: "B" });
            var C = tokens_public_1.createToken({ name: "C", categories: [B] });
            var orRule = new gast_public_1.Rule({
                name: "orRule",
                definition: [
                    new gast_public_1.Alternation({
                        definition: [
                            new gast_public_1.Flat({
                                definition: [
                                    new gast_public_1.Terminal({
                                        terminalType: A,
                                        idx: 1
                                    })
                                ]
                            }),
                            new gast_public_1.Flat({
                                definition: [
                                    new gast_public_1.Terminal({
                                        terminalType: B,
                                        idx: 1
                                    })
                                ]
                            })
                        ]
                    })
                ]
            });
            var laFunc = lookahead_1.buildLookaheadFuncForOr(1, orRule, 1, false, false, lookahead_1.buildAlternativesLookAheadFunc);
            var laMock = {
                LA: function () {
                    return matchers_1.createRegularToken(C, "c");
                }
            };
            // C can match B (2nd alternative) due to its categories definition
            expect(laFunc.call(laMock)).to.equal(1);
        });
        it("can compute the lookahead function for EMPTY OR sample", function () {
            var commaParserMock = new CommaParserMock();
            var keyParserMock = new KeyParserMock();
            var entityParserMock = new EntityParserMock();
            var laFunc = lookahead_1.buildLookaheadFuncForOr(1, emptyAltOr, 1, false, false, lookahead_1.buildAlternativesLookAheadFunc);
            expect(laFunc.call(keyParserMock)).to.equal(0);
            expect(laFunc.call(entityParserMock)).to.equal(1);
            // none matches so the last empty alternative should be taken (idx 2)
            expect(laFunc.call(commaParserMock)).to.equal(2);
        });
    });
    describe("The chevrotain grammar lookahead capabilities", function () {
        var Alpha = tokens_public_1.createToken({ name: "Alpha" });
        var ExtendsAlpha = tokens_public_1.createToken({
            name: "ExtendsAlpha",
            categories: Alpha
        });
        var ExtendsAlphaAlpha = tokens_public_1.createToken({
            name: "ExtendsAlphaAlpha",
            categories: ExtendsAlpha
        });
        var Beta = tokens_public_1.createToken({ name: "Beta" });
        var Charlie = tokens_public_1.createToken({ name: "Charlie" });
        var Delta = tokens_public_1.createToken({ name: "Delta" });
        var Gamma = tokens_public_1.createToken({ name: "Gamma" });
        tokens_1.augmentTokenTypes([
            Alpha,
            Beta,
            Delta,
            Gamma,
            Charlie,
            ExtendsAlphaAlpha
        ]);
        context("computing lookahead sequences for", function () {
            it("two simple one token alternatives", function () {
                var alt1 = new gast_public_1.Alternation({
                    definition: [
                        new gast_public_1.Flat({
                            definition: [new gast_public_1.Terminal({ terminalType: Alpha })]
                        }),
                        new gast_public_1.Flat({
                            definition: [new gast_public_1.Terminal({ terminalType: Beta })]
                        }),
                        new gast_public_1.Flat({
                            definition: [new gast_public_1.Terminal({ terminalType: Beta })]
                        })
                    ]
                });
                var alt2 = new gast_public_1.Terminal({ terminalType: Gamma });
                var actual = lookahead_1.lookAheadSequenceFromAlternatives([alt1, alt2], 5);
                expect(actual).to.deep.equal([[[Alpha], [Beta]], [[Gamma]]]);
            });
            it("three simple one token alternatives", function () {
                var alt1 = new gast_public_1.Alternation({
                    definition: [
                        new gast_public_1.Flat({
                            definition: [new gast_public_1.Terminal({ terminalType: Alpha })]
                        }),
                        new gast_public_1.Flat({
                            definition: [new gast_public_1.Terminal({ terminalType: Beta })]
                        }),
                        new gast_public_1.Flat({
                            definition: [new gast_public_1.Terminal({ terminalType: Beta })]
                        })
                    ]
                });
                var alt2 = new gast_public_1.Terminal({ terminalType: Gamma });
                var alt3 = new gast_public_1.Flat({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Delta }),
                        new gast_public_1.Terminal({ terminalType: Charlie })
                    ]
                });
                var actual = lookahead_1.lookAheadSequenceFromAlternatives([alt1, alt2, alt3], 5);
                expect(actual).to.deep.equal([
                    [[Alpha], [Beta]],
                    [[Gamma]],
                    [[Delta]]
                ]);
            });
            it("two complex multi token alternatives", function () {
                var alt1 = new gast_public_1.Alternation({
                    definition: [
                        new gast_public_1.Flat({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: Alpha }),
                                new gast_public_1.Terminal({ terminalType: Beta })
                            ]
                        }),
                        new gast_public_1.Flat({
                            definition: [new gast_public_1.Terminal({ terminalType: Beta })]
                        }),
                        new gast_public_1.Flat({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: Alpha }),
                                new gast_public_1.Terminal({ terminalType: Gamma }),
                                new gast_public_1.Terminal({ terminalType: Delta })
                            ]
                        })
                    ]
                });
                var alt2 = new gast_public_1.Alternation({
                    definition: [
                        new gast_public_1.Flat({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: Alpha }),
                                new gast_public_1.Terminal({ terminalType: Delta })
                            ]
                        }),
                        new gast_public_1.Flat({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: Charlie })
                            ]
                        })
                    ]
                });
                var actual = lookahead_1.lookAheadSequenceFromAlternatives([alt1, alt2], 5);
                expect(actual).to.deep.equal([
                    [[Beta], [Alpha, Beta], [Alpha, Gamma]],
                    [[Charlie], [Alpha, Delta]]
                ]);
            });
            it("three complex multi token alternatives", function () {
                var alt1 = new gast_public_1.Alternation({
                    definition: [
                        new gast_public_1.Flat({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: Alpha }),
                                new gast_public_1.Terminal({ terminalType: Beta }),
                                new gast_public_1.Terminal({ terminalType: Gamma })
                            ]
                        }),
                        new gast_public_1.Flat({
                            definition: [new gast_public_1.Terminal({ terminalType: Beta })]
                        })
                    ]
                });
                var alt2 = new gast_public_1.Alternation({
                    definition: [
                        new gast_public_1.Flat({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: Alpha }),
                                new gast_public_1.Terminal({ terminalType: Delta })
                            ]
                        }),
                        new gast_public_1.Flat({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: Charlie })
                            ]
                        }),
                        new gast_public_1.Flat({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: Gamma }),
                                new gast_public_1.Terminal({ terminalType: Gamma })
                            ]
                        })
                    ]
                });
                var alt3 = new gast_public_1.Alternation({
                    definition: [
                        new gast_public_1.Flat({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: Alpha }),
                                new gast_public_1.Terminal({ terminalType: Beta }),
                                new gast_public_1.Terminal({ terminalType: Delta })
                            ]
                        }),
                        new gast_public_1.Flat({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: Charlie }),
                                new gast_public_1.Terminal({ terminalType: Beta })
                            ]
                        })
                    ]
                });
                var actual = lookahead_1.lookAheadSequenceFromAlternatives([alt1, alt2, alt3], 5);
                expect(actual).to.deep.equal([
                    [[Beta], [Alpha, Beta, Gamma]],
                    [[Charlie], [Gamma], [Alpha, Delta]],
                    [[Charlie, Beta], [Alpha, Beta, Delta]]
                ]);
            });
            it("two complex multi token alternatives with shared prefix", function () {
                var alt1 = new gast_public_1.Flat({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Beta }),
                        new gast_public_1.Terminal({ terminalType: Charlie }),
                        new gast_public_1.Terminal({ terminalType: Delta })
                    ]
                });
                var alt2 = new gast_public_1.Flat({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Beta }),
                        new gast_public_1.Terminal({ terminalType: Charlie }),
                        new gast_public_1.Terminal({ terminalType: Delta }),
                        new gast_public_1.Terminal({ terminalType: Gamma }),
                        new gast_public_1.Terminal({ terminalType: Alpha })
                    ]
                });
                var actual = lookahead_1.lookAheadSequenceFromAlternatives([alt1, alt2], 5);
                expect(actual).to.deep.equal([
                    [[Alpha, Beta, Charlie, Delta]],
                    [[Alpha, Beta, Charlie, Delta, Gamma]]
                ]);
            });
            it("simple ambiguous alternatives", function () {
                var alt1 = new gast_public_1.Flat({
                    definition: [new gast_public_1.Terminal({ terminalType: Alpha })]
                });
                var alt2 = new gast_public_1.Flat({
                    definition: [new gast_public_1.Terminal({ terminalType: Alpha })]
                });
                var actual = lookahead_1.lookAheadSequenceFromAlternatives([alt1, alt2], 5);
                expect(actual).to.deep.equal([[[Alpha]], [[Alpha]]]);
            });
            it("complex(multi-token) ambiguous alternatives", function () {
                var alt1 = new gast_public_1.Flat({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Beta }),
                        new gast_public_1.Terminal({ terminalType: Charlie })
                    ]
                });
                var alt2 = new gast_public_1.Flat({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Beta }),
                        new gast_public_1.Terminal({ terminalType: Charlie })
                    ]
                });
                var actual = lookahead_1.lookAheadSequenceFromAlternatives([alt1, alt2], 5);
                expect(actual).to.deep.equal([
                    [[Alpha, Beta, Charlie]],
                    [[Alpha, Beta, Charlie]]
                ]);
            });
        });
        context("computing lookahead functions for", function () {
            var MockParser = /** @class */ (function () {
                function MockParser(inputConstructors) {
                    this.inputConstructors = inputConstructors;
                    this.input = utils_1.map(inputConstructors, function (currConst) {
                        return matchers_1.createRegularToken(currConst);
                    });
                }
                MockParser.prototype.LA = function (howMuch) {
                    if (this.input.length <= howMuch - 1) {
                        return parser_1.END_OF_FILE;
                    }
                    else {
                        return this.input[howMuch - 1];
                    }
                };
                return MockParser;
            }());
            it("inheritance Alternative alternatives - positive", function () {
                var alternatives = [
                    [[ExtendsAlphaAlpha]],
                    [[ExtendsAlpha]],
                    [[Alpha]] // 2
                ];
                var laFunc = lookahead_1.buildAlternativesLookAheadFunc(alternatives, false, tokens_1.tokenStructuredMatcher, false);
                expect(laFunc.call(new MockParser([Alpha]))).to.equal(2);
                expect(laFunc.call(new MockParser([ExtendsAlpha]))).to.equal(1);
                expect(laFunc.call(new MockParser([ExtendsAlphaAlpha]))).to.equal(0);
            });
            it("simple alternatives - positive", function () {
                var alternatives = [
                    [[Alpha], [Beta]],
                    [[Delta], [Gamma]],
                    [[Charlie]] // 2
                ];
                var laFunc = lookahead_1.buildAlternativesLookAheadFunc(alternatives, false, tokens_1.tokenStructuredMatcher, false);
                expect(laFunc.call(new MockParser([Alpha]))).to.equal(0);
                expect(laFunc.call(new MockParser([Beta]))).to.equal(0);
                expect(laFunc.call(new MockParser([Delta]))).to.equal(1);
                expect(laFunc.call(new MockParser([Gamma]))).to.equal(1);
                expect(laFunc.call(new MockParser([Charlie]))).to.equal(2);
            });
            it("simple alternatives - negative", function () {
                var alternatives = [
                    [[Alpha], [Beta]],
                    [[Delta], [Gamma]] // 1
                ];
                var laFunc = lookahead_1.buildAlternativesLookAheadFunc(alternatives, false, tokens_1.tokenStructuredMatcher, false);
                expect(laFunc.call(new MockParser([]))).to.be.undefined;
                expect(laFunc.call(new MockParser([Charlie]))).to.be.undefined;
            });
            it("complex alternatives - positive", function () {
                var alternatives = [
                    [[Alpha, Beta, Gamma], [Alpha, Beta, Delta]],
                    [[Alpha, Beta, Beta]],
                    [[Alpha, Beta]] // 2 - Prefix of '1' alternative
                ];
                var laFunc = lookahead_1.buildAlternativesLookAheadFunc(alternatives, false, tokens_1.tokenStructuredMatcher, false);
                expect(laFunc.call(new MockParser([Alpha, Beta, Gamma]))).to.equal(0);
                expect(laFunc.call(new MockParser([Alpha, Beta, Gamma, Delta]))).to.equal(0);
                expect(laFunc.call(new MockParser([Alpha, Beta, Delta]))).to.equal(0);
                expect(laFunc.call(new MockParser([Alpha, Beta, Beta]))).to.equal(1);
                expect(laFunc.call(new MockParser([Alpha, Beta, Charlie]))).to.equal(2);
            });
            it("complex alternatives - negative", function () {
                var alternatives = [
                    [[Alpha, Beta, Gamma], [Alpha, Beta, Delta]],
                    [[Alpha, Beta, Beta]],
                    [[Alpha, Beta], [Gamma]] // 2
                ];
                var laFunc = lookahead_1.buildAlternativesLookAheadFunc(alternatives, false, tokens_1.tokenStructuredMatcher, false);
                expect(laFunc.call(new MockParser([]))).to.be.undefined;
                expect(laFunc.call(new MockParser([Alpha, Gamma, Gamma]))).to.be
                    .undefined;
                expect(laFunc.call(new MockParser([Charlie]))).to.be.undefined;
                expect(laFunc.call(new MockParser([Beta, Alpha, Beta, Gamma])))
                    .to.be.undefined;
            });
            it("complex alternatives with inheritance - positive", function () {
                var alternatives = [
                    [[ExtendsAlpha, Beta]],
                    [[Alpha, Beta]] // 1
                ];
                var laFunc = lookahead_1.buildAlternativesLookAheadFunc(alternatives, false, tokens_1.tokenStructuredMatcher, false);
                expect(laFunc.call(new MockParser([Alpha, Beta]))).to.equal(1);
                expect(laFunc.call(new MockParser([ExtendsAlphaAlpha, Beta]))).to.equal(0);
                // expect(
                //     laFunc.call(new MockParser([ExtendsAlpha, Beta]))
                // ).to.equal(0)
            });
            it("complex alternatives with inheritance - negative", function () {
                var alternatives = [
                    [[ExtendsAlpha, Beta]],
                    [[Alpha, Gamma]] // 1
                ];
                var laFunc = lookahead_1.buildAlternativesLookAheadFunc(alternatives, false, tokens_1.tokenStructuredMatcher, false);
                expect(laFunc.call(new MockParser([Alpha, Beta]))).to.be
                    .undefined;
                expect(laFunc.call(new MockParser([ExtendsAlphaAlpha, Delta])))
                    .to.be.undefined;
            });
            it("Empty alternatives", function () {
                var alternatives = [
                    [[Alpha]],
                    [[]] // 1
                ];
                var laFunc = lookahead_1.buildAlternativesLookAheadFunc(alternatives, false, tokens_1.tokenStructuredMatcher, false);
                expect(laFunc.call(new MockParser([Alpha]))).to.equal(0);
                expect(laFunc.call(new MockParser([]))).to.equal(1); // empty alternative always matches
                expect(laFunc.call(new MockParser([Delta]))).to.equal(1); // empty alternative always matches
            });
            it("simple optional - positive", function () {
                var alternative = [[Alpha], [Beta], [Charlie]];
                var laFunc = lookahead_1.buildSingleAlternativeLookaheadFunction(alternative, tokens_1.tokenStructuredMatcher, false);
                expect(laFunc.call(new MockParser([Alpha]))).to.be.true;
                expect(laFunc.call(new MockParser([Beta]))).to.be.true;
                expect(laFunc.call(new MockParser([Charlie]))).to.be.true;
            });
            it("simple optional - negative", function () {
                var alternative = [[Alpha], [Beta], [Charlie]];
                var laFunc = lookahead_1.buildSingleAlternativeLookaheadFunction(alternative, tokens_1.tokenStructuredMatcher, false);
                expect(laFunc.call(new MockParser([Delta]))).to.be.false;
                expect(laFunc.call(new MockParser([Gamma]))).to.be.false;
            });
            it("complex optional - positive", function () {
                var alternative = [
                    [Alpha, Beta, Gamma],
                    [Beta],
                    [Charlie, Delta]
                ];
                var laFunc = lookahead_1.buildSingleAlternativeLookaheadFunction(alternative, tokens_1.tokenStructuredMatcher, false);
                expect(laFunc.call(new MockParser([Alpha, Beta, Gamma]))).to.be
                    .true;
                expect(laFunc.call(new MockParser([Beta]))).to.be.true;
                expect(laFunc.call(new MockParser([Charlie, Delta]))).to.be.true;
            });
            it("complex optional - Negative", function () {
                var alternative = [
                    [Alpha, Beta, Gamma],
                    [Beta],
                    [Charlie, Delta]
                ];
                var laFunc = lookahead_1.buildSingleAlternativeLookaheadFunction(alternative, tokens_1.tokenStructuredMatcher, false);
                expect(laFunc.call(new MockParser([Alpha, Charlie, Gamma]))).to
                    .be.false;
                expect(laFunc.call(new MockParser([Charlie]))).to.be.false;
                expect(laFunc.call(new MockParser([Charlie, Beta]))).to.be.false;
            });
            it("complex optional with inheritance - positive", function () {
                var alternative = [[Alpha, ExtendsAlpha, ExtendsAlphaAlpha]];
                var laFunc = lookahead_1.buildSingleAlternativeLookaheadFunction(alternative, tokens_1.tokenStructuredMatcher, false);
                expect(laFunc.call(new MockParser([Alpha, ExtendsAlpha, ExtendsAlphaAlpha]))).to.be.true;
                expect(laFunc.call(new MockParser([
                    ExtendsAlpha,
                    ExtendsAlpha,
                    ExtendsAlphaAlpha
                ]))).to.be.true;
                expect(laFunc.call(new MockParser([
                    ExtendsAlphaAlpha,
                    ExtendsAlpha,
                    ExtendsAlphaAlpha
                ]))).to.be.true;
                expect(laFunc.call(new MockParser([
                    ExtendsAlphaAlpha,
                    ExtendsAlphaAlpha,
                    ExtendsAlphaAlpha
                ]))).to.be.true;
            });
            it("complex optional with inheritance - negative", function () {
                var alternative = [[Alpha, ExtendsAlpha, ExtendsAlphaAlpha]];
                var laFunc = lookahead_1.buildSingleAlternativeLookaheadFunction(alternative, tokens_1.tokenStructuredMatcher, false);
                expect(laFunc.call(new MockParser([Gamma, ExtendsAlpha, ExtendsAlphaAlpha]))).to.be.false;
                expect(laFunc.call(new MockParser([ExtendsAlpha, Alpha, ExtendsAlphaAlpha]))).to.be.false;
                expect(laFunc.call(new MockParser([
                    ExtendsAlphaAlpha,
                    ExtendsAlpha,
                    ExtendsAlpha
                ]))).to.be.false;
            });
        });
    });
});
//# sourceMappingURL=lookahead_spec.js.map