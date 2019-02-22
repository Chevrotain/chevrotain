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
var samples_1 = require("./samples");
var interpreter_1 = require("../../../src/parse/grammar/interpreter");
var matchers_1 = require("../../utils/matchers");
var tokens_public_1 = require("../../../src/scan/tokens_public");
var utils_1 = require("../../../src/utils/utils");
var lexer_public_1 = require("../../../src/scan/lexer_public");
var tokens_1 = require("../../../src/scan/tokens");
var parser_traits_1 = require("../../../src/parse/parser/traits/parser_traits");
var gast_public_1 = require("../../../src/parse/grammar/gast/gast_public");
describe("The Grammar Interpeter namespace", function () {
    describe("The NextAfterTokenWalker", function () {
        it("can compute the next possible token types From ActionDec in scope of ActionDec #1", function () {
            var caPath = {
                ruleStack: ["actionDec"],
                occurrenceStack: [1],
                lastTok: samples_1.ActionTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(1);
            expect(possibleNextTokTypes[0]).to.equal(samples_1.IdentTok);
        });
        it("can compute the next possible token types From ActionDec in scope of ActionDec #2", function () {
            var caPath = {
                ruleStack: ["actionDec"],
                occurrenceStack: [1],
                lastTok: samples_1.IdentTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(1);
            expect(possibleNextTokTypes[0]).to.equal(samples_1.LParenTok);
        });
        it("can compute the next possible token types From ActionDec in scope of ActionDec #3", function () {
            var caPath = {
                ruleStack: ["actionDec"],
                occurrenceStack: [1],
                lastTok: samples_1.LParenTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(2);
            matchers_1.setEquality(possibleNextTokTypes, [samples_1.IdentTok, samples_1.RParenTok]);
        });
        it("can compute the next possible token types From ActionDec in scope of ActionDec #4", function () {
            var caPath = {
                ruleStack: ["actionDec"],
                occurrenceStack: [1],
                lastTok: samples_1.CommaTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(1);
            expect(possibleNextTokTypes[0]).to.equal(samples_1.IdentTok);
        });
        it("can compute the next possible token types From ActionDec in scope of ActionDec #5", function () {
            var caPath = {
                ruleStack: ["actionDec"],
                occurrenceStack: [1],
                lastTok: samples_1.RParenTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(2);
            matchers_1.setEquality(possibleNextTokTypes, [samples_1.SemicolonTok, samples_1.ColonTok]);
        });
        it("can compute the next possible token types From ActionDec in scope of ActionDec #6", function () {
            var caPath = {
                ruleStack: ["actionDec"],
                occurrenceStack: [1],
                lastTok: samples_1.ColonTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(1);
            expect(possibleNextTokTypes[0]).to.equal(samples_1.IdentTok);
        });
        it("can compute the next possible token types From ActionDec in scope of ActionDec #7", function () {
            var caPath = {
                ruleStack: ["actionDec"],
                occurrenceStack: [1],
                lastTok: samples_1.SemicolonTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(0);
        });
        it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #1", function () {
            var caPath = {
                ruleStack: ["actionDec", "paramSpec"],
                occurrenceStack: [1, 1],
                lastTok: samples_1.IdentTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(1);
            expect(possibleNextTokTypes[0]).to.equal(samples_1.ColonTok);
        });
        it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #2", function () {
            var caPath = {
                ruleStack: ["actionDec", "paramSpec"],
                occurrenceStack: [1, 1],
                lastTok: samples_1.ColonTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(1);
            expect(possibleNextTokTypes[0]).to.equal(samples_1.IdentTok);
        });
        it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #3", function () {
            var caPath = {
                ruleStack: ["actionDec", "paramSpec"],
                occurrenceStack: [1, 1],
                lastTok: samples_1.LSquareTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(1);
            expect(possibleNextTokTypes[0]).to.equal(samples_1.RSquareTok);
        });
        it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #4", function () {
            var caPath = {
                ruleStack: ["actionDec", "paramSpec"],
                occurrenceStack: [1, 1],
                lastTok: samples_1.RSquareTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(2);
            matchers_1.setEquality(possibleNextTokTypes, [samples_1.CommaTok, samples_1.RParenTok]);
        });
        it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #1", function () {
            var caPath = {
                ruleStack: ["actionDec", "paramSpec"],
                occurrenceStack: [1, 2],
                lastTok: samples_1.IdentTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(1);
            expect(possibleNextTokTypes[0]).to.equal(samples_1.ColonTok);
        });
        it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #2", function () {
            var caPath = {
                ruleStack: ["actionDec", "paramSpec"],
                occurrenceStack: [1, 2],
                lastTok: samples_1.ColonTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(1);
            expect(possibleNextTokTypes[0]).to.equal(samples_1.IdentTok);
        });
        it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #3", function () {
            var caPath = {
                ruleStack: ["actionDec", "paramSpec"],
                occurrenceStack: [1, 2],
                lastTok: samples_1.LSquareTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(1);
            expect(possibleNextTokTypes[0]).to.equal(samples_1.RSquareTok);
        });
        it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #4", function () {
            var caPath = {
                ruleStack: ["actionDec", "paramSpec"],
                occurrenceStack: [1, 2],
                lastTok: samples_1.RSquareTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(2);
            matchers_1.setEquality(possibleNextTokTypes, [samples_1.CommaTok, samples_1.RParenTok]);
        });
        it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #1", function () {
            var caPath = {
                ruleStack: ["actionDec", "paramSpec", "qualifiedName"],
                occurrenceStack: [1, 1, 1],
                lastTok: samples_1.IdentTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(4);
            matchers_1.setEquality(possibleNextTokTypes, [
                samples_1.DotTok,
                samples_1.LSquareTok,
                samples_1.CommaTok,
                samples_1.RParenTok
            ]);
        });
        it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #2", function () {
            var caPath = {
                ruleStack: ["actionDec", "paramSpec", "qualifiedName"],
                occurrenceStack: [1, 1, 1],
                lastTok: samples_1.DotTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(1);
            expect(possibleNextTokTypes[0]).to.equal(samples_1.IdentTok);
        });
        it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #3", function () {
            var caPath = {
                ruleStack: ["actionDec", "paramSpec", "qualifiedName"],
                occurrenceStack: [1, 1, 1],
                lastTok: samples_1.IdentTok,
                lastTokOccurrence: 2
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.actionDec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(4);
            matchers_1.setEquality(possibleNextTokTypes, [
                samples_1.DotTok,
                samples_1.LSquareTok,
                samples_1.CommaTok,
                samples_1.RParenTok
            ]);
        });
        it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #3", function () {
            var caPath = {
                ruleStack: ["paramSpec", "qualifiedName"],
                occurrenceStack: [1, 1],
                lastTok: samples_1.IdentTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.paramSpec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(2);
            matchers_1.setEquality(possibleNextTokTypes, [samples_1.DotTok, samples_1.LSquareTok]);
        });
        it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #3", function () {
            var caPath = {
                ruleStack: ["paramSpec", "qualifiedName"],
                occurrenceStack: [1, 1],
                lastTok: samples_1.DotTok,
                lastTokOccurrence: 1
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.paramSpec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(1);
            expect(possibleNextTokTypes[0]).to.equal(samples_1.IdentTok);
        });
        it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #3", function () {
            var caPath = {
                ruleStack: ["paramSpec", "qualifiedName"],
                occurrenceStack: [1, 1],
                lastTok: samples_1.IdentTok,
                lastTokOccurrence: 2
            };
            var possibleNextTokTypes = new interpreter_1.NextAfterTokenWalker(samples_1.paramSpec, caPath).startWalking();
            expect(possibleNextTokTypes.length).to.equal(2);
            matchers_1.setEquality(possibleNextTokTypes, [samples_1.DotTok, samples_1.LSquareTok]);
        });
        it("will fail if we try to compute the next token starting from a rule that does not match the path", function () {
            var caPath = {
                ruleStack: ["I_WILL_FAIL_THE_WALKER", "qualifiedName"],
                occurrenceStack: [1, 1],
                lastTok: samples_1.IdentTok,
                lastTokOccurrence: 2
            };
            var walker = new interpreter_1.NextAfterTokenWalker(samples_1.paramSpec, caPath);
            expect(function () { return walker.startWalking(); }).to.throw("The path does not start with the walker's top Rule!");
        });
    });
});
describe("The NextTerminalAfterManyWalker", function () {
    it("can compute the next possible token types after the MANY in QualifiedName", function () {
        var rule = new gast_public_1.Rule({
            name: "TwoRepetitionRule",
            definition: [
                new gast_public_1.Repetition({
                    definition: [
                        new gast_public_1.Terminal({
                            terminalType: samples_1.IdentTok,
                            idx: 1
                        })
                    ],
                    idx: 2
                }),
                new gast_public_1.Terminal({
                    terminalType: samples_1.IdentTok,
                    idx: 2
                }),
                new gast_public_1.Repetition({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: samples_1.DotTok }),
                        new gast_public_1.Terminal({
                            terminalType: samples_1.IdentTok,
                            idx: 3
                        })
                    ]
                })
            ]
        });
        var result = new interpreter_1.NextTerminalAfterManyWalker(rule, 1).startWalking();
        //noinspection BadExpressionStatementJS
        expect(result.occurrence).to.be.undefined;
        //noinspection BadExpressionStatementJS
        expect(result.token).to.be.undefined;
    });
    it("can compute the next possible token types after the MANY in paramSpec inside ActionDec", function () {
        var result = new interpreter_1.NextTerminalAfterManyWalker(samples_1.actionDec, 1).startWalking();
        expect(result.occurrence).to.equal(1);
        expect(result.token).to.equal(samples_1.RParenTok);
    });
});
describe("The NextTerminalAfterManySepWalker", function () {
    it("can compute the next possible token types after the MANY_SEP in QualifiedName", function () {
        var result = new interpreter_1.NextTerminalAfterManySepWalker(samples_1.callArguments, 1).startWalking();
        //noinspection BadExpressionStatementJS
        expect(result.occurrence).to.be.undefined;
        //noinspection BadExpressionStatementJS
        expect(result.token).to.be.undefined;
    });
    it("can compute the next possible token types after the MANY in paramSpec inside ActionDec", function () {
        var result = new interpreter_1.NextTerminalAfterManySepWalker(samples_1.actionDecSep, 1).startWalking();
        expect(result.occurrence).to.equal(1);
        expect(result.token).to.equal(samples_1.RParenTok);
    });
});
describe("The NextTerminalAfterAtLeastOneWalker", function () {
    it("can compute the next possible token types after an AT_LEAST_ONE production", function () {
        var result = new interpreter_1.NextTerminalAfterAtLeastOneWalker(samples_1.atLeastOneRule, 1).startWalking();
        expect(result.occurrence).to.equal(2);
        expect(result.token).to.equal(samples_1.DotTok);
        var result2 = new interpreter_1.NextTerminalAfterAtLeastOneWalker(samples_1.atLeastOneRule, 2).startWalking();
        expect(result2.occurrence).to.equal(1);
        expect(result2.token).to.equal(samples_1.DotTok);
        var result3 = new interpreter_1.NextTerminalAfterAtLeastOneWalker(samples_1.atLeastOneRule, 3).startWalking();
        expect(result3.occurrence).to.equal(1);
        expect(result3.token).to.equal(samples_1.CommaTok);
    });
    it("can compute the next possible token types after an AT_LEAST_ONE production - EMPTY", function () {
        var atLeastOneRule = new gast_public_1.Rule({
            name: "atLeastOneRule",
            definition: [
                new gast_public_1.RepetitionMandatory({
                    definition: [
                        new gast_public_1.Terminal({
                            terminalType: samples_1.DotTok,
                            idx: 1
                        })
                    ]
                })
            ]
        });
        var result = new interpreter_1.NextTerminalAfterAtLeastOneWalker(atLeastOneRule, 1).startWalking();
        expect(result.occurrence).to.be.undefined;
        expect(result.token).to.be.undefined;
    });
});
describe("The NextTerminalAfterAtLeastOneSepWalker", function () {
    it("can compute the next possible token types after an AT_LEAST_ONE_SEP production", function () {
        var result = new interpreter_1.NextTerminalAfterAtLeastOneSepWalker(samples_1.atLeastOneSepRule, 1).startWalking();
        expect(result.occurrence).to.equal(2);
        expect(result.token).to.equal(samples_1.DotTok);
        var result2 = new interpreter_1.NextTerminalAfterAtLeastOneSepWalker(samples_1.atLeastOneSepRule, 2).startWalking();
        expect(result2.occurrence).to.equal(1);
        expect(result2.token).to.equal(samples_1.DotTok);
        var result3 = new interpreter_1.NextTerminalAfterAtLeastOneSepWalker(samples_1.atLeastOneSepRule, 3).startWalking();
        expect(result3.occurrence).to.equal(1);
        expect(result3.token).to.equal(samples_1.CommaTok);
    });
    it("can compute the next possible token types after an AT_LEAST_ONE_SEP production EMPTY", function () {
        var result = new interpreter_1.NextTerminalAfterAtLeastOneSepWalker(samples_1.qualifiedNameSep, 1).startWalking();
        //noinspection BadExpressionStatementJS
        expect(result.occurrence).to.be.undefined;
        //noinspection BadExpressionStatementJS
        expect(result.token).to.be.undefined;
    });
});
describe("The chevrotain grammar interpreter capabilities", function () {
    function extractPartialPaths(newResultFormat) {
        return utils_1.map(newResultFormat, function (currItem) { return currItem.partialPath; });
    }
    var Alpha = /** @class */ (function () {
        function Alpha() {
        }
        Alpha.PATTERN = /NA/;
        return Alpha;
    }());
    var Beta = /** @class */ (function () {
        function Beta() {
        }
        Beta.PATTERN = /NA/;
        return Beta;
    }());
    var Gamma = /** @class */ (function () {
        function Gamma() {
        }
        Gamma.PATTERN = /NA/;
        return Gamma;
    }());
    var Comma = /** @class */ (function () {
        function Comma() {
        }
        Comma.PATTERN = /NA/;
        return Comma;
    }());
    tokens_1.augmentTokenTypes([Alpha, Beta, Gamma, Comma]);
    context("can calculate the next possible paths in a", function () {
        it("Sequence", function () {
            var seq = [
                new gast_public_1.Terminal({ terminalType: Alpha }),
                new gast_public_1.Terminal({ terminalType: Beta }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(seq, 1))).to.deep.equal([[Alpha]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(seq, 2))).to.deep.equal([[Alpha, Beta]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(seq, 3))).to.deep.equal([[Alpha, Beta, Gamma]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(seq, 4))).to.deep.equal([[Alpha, Beta, Gamma]]);
        });
        it("Optional", function () {
            var seq = [
                new gast_public_1.Terminal({ terminalType: Alpha }),
                new gast_public_1.Option({
                    definition: [new gast_public_1.Terminal({ terminalType: Beta })]
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(seq, 1))).to.deep.equal([[Alpha]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(seq, 2))).to.deep.equal([[Alpha, Beta], [Alpha, Gamma]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(seq, 3))).to.deep.equal([[Alpha, Beta, Gamma], [Alpha, Gamma]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(seq, 4))).to.deep.equal([[Alpha, Beta, Gamma], [Alpha, Gamma]]);
        });
        it("Alternation", function () {
            var alts = [
                new gast_public_1.Alternation({
                    definition: [
                        new gast_public_1.Flat({
                            definition: [new gast_public_1.Terminal({ terminalType: Alpha })]
                        }),
                        new gast_public_1.Flat({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: Beta }),
                                new gast_public_1.Terminal({ terminalType: Beta })
                            ]
                        }),
                        new gast_public_1.Flat({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: Beta }),
                                new gast_public_1.Terminal({ terminalType: Alpha }),
                                new gast_public_1.Terminal({ terminalType: Gamma })
                            ]
                        })
                    ]
                })
            ];
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(alts, 1))).to.deep.equal([[Alpha], [Beta], [Beta]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(alts, 2))).to.deep.equal([[Alpha], [Beta, Beta], [Beta, Alpha]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(alts, 3))).to.deep.equal([[Alpha], [Beta, Beta], [Beta, Alpha, Gamma]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(alts, 4))).to.deep.equal([[Alpha], [Beta, Beta], [Beta, Alpha, Gamma]]);
        });
        it("Repetition", function () {
            var rep = [
                new gast_public_1.Repetition({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Alpha })
                    ]
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(rep, 1))).to.deep.equal([[Alpha], [Gamma]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(rep, 2))).to.deep.equal([[Alpha, Alpha], [Gamma]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(rep, 3))).to.deep.equal([
                [Alpha, Alpha, Alpha],
                [Alpha, Alpha, Gamma],
                [Gamma]
            ]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(rep, 4))).to.deep.equal([
                [Alpha, Alpha, Alpha, Alpha],
                [Alpha, Alpha, Gamma],
                [Gamma]
            ]);
        });
        it("Mandatory Repetition", function () {
            var repMand = [
                new gast_public_1.RepetitionMandatory({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Alpha })
                    ]
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(repMand, 1))).to.deep.equal([[Alpha]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(repMand, 2))).to.deep.equal([[Alpha, Alpha]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(repMand, 3))).to.deep.equal([[Alpha, Alpha, Alpha], [Alpha, Alpha, Gamma]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(repMand, 4))).to.deep.equal([
                [Alpha, Alpha, Alpha, Alpha],
                [Alpha, Alpha, Gamma]
            ]);
        });
        it("Repetition with Separator", function () {
            // same as Mandatory Repetition because currently possiblePaths only cares about
            // the first repetition.
            var rep = [
                new gast_public_1.RepetitionWithSeparator({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Alpha })
                    ],
                    separator: Comma
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(rep, 1))).to.deep.equal([[Alpha], [Gamma]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(rep, 2))).to.deep.equal([[Alpha, Alpha], [Gamma]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(rep, 3))).to.deep.equal([
                [Alpha, Alpha, Comma],
                [Alpha, Alpha, Gamma],
                [Gamma]
            ]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(rep, 4))).to.deep.equal([
                [Alpha, Alpha, Comma, Alpha],
                [Alpha, Alpha, Gamma],
                [Gamma]
            ]);
        });
        it("Mandatory Repetition with Separator", function () {
            // same as Mandatory Repetition because currently possiblePaths only cares about
            // the first repetition.
            var repMandSep = [
                new gast_public_1.RepetitionMandatoryWithSeparator({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Alpha })
                    ],
                    separator: Comma
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(repMandSep, 1))).to.deep.equal([[Alpha]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(repMandSep, 2))).to.deep.equal([[Alpha, Alpha]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(repMandSep, 3))).to.deep.equal([[Alpha, Alpha, Comma], [Alpha, Alpha, Gamma]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(repMandSep, 4))).to.deep.equal([
                [Alpha, Alpha, Comma, Alpha],
                [Alpha, Alpha, Gamma]
            ]);
        });
        it("NonTerminal", function () {
            var someSubRule = new gast_public_1.Rule({
                name: "blah",
                definition: [new gast_public_1.Terminal({ terminalType: Beta })]
            });
            var seq = [
                new gast_public_1.Terminal({ terminalType: Alpha }),
                new gast_public_1.NonTerminal({
                    nonTerminalName: "blah",
                    referencedRule: someSubRule
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(seq, 1))).to.deep.equal([[Alpha]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(seq, 2))).to.deep.equal([[Alpha, Beta]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(seq, 3))).to.deep.equal([[Alpha, Beta, Gamma]]);
            expect(extractPartialPaths(interpreter_1.possiblePathsFrom(seq, 4))).to.deep.equal([[Alpha, Beta, Gamma]]);
        });
    });
    context("can calculate the next possible single tokens for: ", function () {
        function INPUT(tokTypes) {
            return utils_1.map(tokTypes, function (currTokType) { return matchers_1.createRegularToken(currTokType); });
        }
        function pluckTokenTypes(arr) {
            return utils_1.map(arr, function (currItem) { return currItem.nextTokenType; });
        }
        it("Sequence positive", function () {
            var seq = [
                new gast_public_1.Flat({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Beta }),
                        new gast_public_1.Terminal({ terminalType: Gamma })
                    ]
                })
            ];
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(seq, INPUT([]), tokens_1.tokenStructuredMatcher, 5)), [Alpha]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(seq, INPUT([Alpha]), tokens_1.tokenStructuredMatcher, 5)), [Beta]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(seq, INPUT([Alpha, Beta]), tokens_1.tokenStructuredMatcher, 5)), [Gamma]);
        });
        it("Sequence negative", function () {
            var seq = [
                new gast_public_1.Flat({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Beta }),
                        new gast_public_1.Terminal({ terminalType: Gamma })
                    ]
                })
            ];
            // negative
            expect(interpreter_1.nextPossibleTokensAfter(seq, INPUT([Alpha, Beta, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(seq, INPUT([Alpha, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(seq, INPUT([Beta]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
        });
        it("Optional positive", function () {
            var seq = [
                new gast_public_1.Terminal({ terminalType: Alpha }),
                new gast_public_1.Option({
                    definition: [new gast_public_1.Terminal({ terminalType: Beta })]
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            // setEquality(pluckTokenTypes(nextPossibleTokensAfter(seq, INPUT([]), tokenStructuredMatcher, 5)), [Alpha])
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(seq, INPUT([Alpha]), tokens_1.tokenStructuredMatcher, 5)), [Beta, Gamma]);
            // setEquality(pluckTokenTypes(nextPossibleTokensAfter(seq, INPUT([Alpha, Beta]), tokenStructuredMatcher, 5)), [Gamma])
        });
        it("Optional Negative", function () {
            var seq = [
                new gast_public_1.Terminal({ terminalType: Alpha }),
                new gast_public_1.Option({
                    definition: [new gast_public_1.Terminal({ terminalType: Beta })]
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            expect(interpreter_1.nextPossibleTokensAfter(seq, INPUT([Beta]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(seq, INPUT([Alpha, Alpha]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(seq, INPUT([Alpha, Beta, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
        });
        it("Alternation positive", function () {
            var alts = [
                new gast_public_1.Alternation({
                    definition: [
                        new gast_public_1.Flat({
                            definition: [new gast_public_1.Terminal({ terminalType: Alpha })]
                        }),
                        new gast_public_1.Flat({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: Beta }),
                                new gast_public_1.Terminal({ terminalType: Beta })
                            ]
                        }),
                        new gast_public_1.Flat({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: Beta }),
                                new gast_public_1.Terminal({ terminalType: Alpha }),
                                new gast_public_1.Terminal({ terminalType: Gamma })
                            ]
                        }),
                        new gast_public_1.Flat({
                            definition: [new gast_public_1.Terminal({ terminalType: Gamma })]
                        })
                    ]
                })
            ];
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(alts, INPUT([]), tokens_1.tokenStructuredMatcher, 5)), [Alpha, Beta, Beta, Gamma]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(alts, INPUT([Beta]), tokens_1.tokenStructuredMatcher, 5)), [Beta, Alpha]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(alts, INPUT([Beta, Alpha]), tokens_1.tokenStructuredMatcher, 5)), [Gamma]);
        });
        it("Alternation Negative", function () {
            var alts = [
                new gast_public_1.Alternation({
                    definition: [
                        new gast_public_1.Flat({
                            definition: [new gast_public_1.Terminal({ terminalType: Alpha })]
                        }),
                        new gast_public_1.Flat({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: Beta }),
                                new gast_public_1.Terminal({ terminalType: Beta })
                            ]
                        }),
                        new gast_public_1.Flat({
                            definition: [
                                new gast_public_1.Terminal({ terminalType: Beta }),
                                new gast_public_1.Terminal({ terminalType: Alpha }),
                                new gast_public_1.Terminal({ terminalType: Gamma })
                            ]
                        })
                    ]
                })
            ];
            expect(interpreter_1.nextPossibleTokensAfter(alts, INPUT([Alpha]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(alts, INPUT([Gamma, Alpha]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(alts, INPUT([Beta, Beta]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(alts, INPUT([Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
        });
        it("Repetition - positive", function () {
            var rep = [
                new gast_public_1.Repetition({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Beta })
                    ]
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(rep, INPUT([]), tokens_1.tokenStructuredMatcher, 5)), [Alpha, Gamma]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(rep, INPUT([Alpha]), tokens_1.tokenStructuredMatcher, 5)), [Beta]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(rep, INPUT([Alpha, Beta]), tokens_1.tokenStructuredMatcher, 5)), [Alpha, Gamma]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(rep, INPUT([Alpha, Beta, Alpha]), tokens_1.tokenStructuredMatcher, 5)), [Beta]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(rep, INPUT([Alpha, Beta, Alpha, Beta]), tokens_1.tokenStructuredMatcher, 5)), [Alpha, Gamma]);
        });
        it("Repetition - negative", function () {
            var rep = [
                new gast_public_1.Repetition({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Beta })
                    ]
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            expect(interpreter_1.nextPossibleTokensAfter(rep, INPUT([Beta]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(rep, INPUT([Alpha, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(rep, INPUT([Alpha, Beta, Alpha, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(rep, INPUT([Alpha, Beta, Alpha, Beta, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
        });
        it("Mandatory Repetition - positive", function () {
            var repMand = [
                new gast_public_1.RepetitionMandatory({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Beta })
                    ]
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([]), tokens_1.tokenStructuredMatcher, 5)), [Alpha]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Alpha]), tokens_1.tokenStructuredMatcher, 5)), [Beta]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta]), tokens_1.tokenStructuredMatcher, 5)), [Alpha, Gamma]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta, Alpha]), tokens_1.tokenStructuredMatcher, 5)), [Beta]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta, Alpha, Beta]), tokens_1.tokenStructuredMatcher, 5)), [Alpha, Gamma]);
        });
        it("Mandatory Repetition - negative", function () {
            var repMand = [
                new gast_public_1.RepetitionMandatory({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Beta })
                    ]
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            expect(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Beta]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Alpha, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta, Alpha, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta, Alpha, Beta, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
        });
        it("Repetition with Separator - positive", function () {
            var repSep = [
                new gast_public_1.RepetitionWithSeparator({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Beta })
                    ],
                    separator: Comma
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(repSep, INPUT([]), tokens_1.tokenStructuredMatcher, 5)), [Alpha, Gamma]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(repSep, INPUT([Alpha]), tokens_1.tokenStructuredMatcher, 5)), [Beta]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(repSep, INPUT([Alpha, Beta]), tokens_1.tokenStructuredMatcher, 5)), [Comma, Gamma]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(repSep, INPUT([Alpha, Beta, Comma]), tokens_1.tokenStructuredMatcher, 5)), [Alpha]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(repSep, INPUT([Alpha, Beta, Comma, Alpha, Beta]), tokens_1.tokenStructuredMatcher, 5)), [Comma, Gamma]);
        });
        it("Repetition with Separator - negative", function () {
            var repMand = [
                new gast_public_1.RepetitionWithSeparator({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Beta })
                    ],
                    separator: Comma
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            expect(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Comma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Alpha, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta, Comma, Alpha, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta, Comma, Alpha, Beta, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
        });
        it("Repetition with Separator Mandatory - positive", function () {
            var repSep = [
                new gast_public_1.RepetitionMandatoryWithSeparator({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Beta })
                    ],
                    separator: Comma
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(repSep, INPUT([]), tokens_1.tokenStructuredMatcher, 5)), [Alpha]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(repSep, INPUT([Alpha]), tokens_1.tokenStructuredMatcher, 5)), [Beta]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(repSep, INPUT([Alpha, Beta]), tokens_1.tokenStructuredMatcher, 5)), [Comma, Gamma]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(repSep, INPUT([Alpha, Beta, Comma]), tokens_1.tokenStructuredMatcher, 5)), [Alpha]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(repSep, INPUT([Alpha, Beta, Comma, Alpha, Beta]), tokens_1.tokenStructuredMatcher, 5)), [Comma, Gamma]);
        });
        it("Repetition with Separator Mandatory - negative", function () {
            var repMand = [
                new gast_public_1.RepetitionMandatoryWithSeparator({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: Alpha }),
                        new gast_public_1.Terminal({ terminalType: Beta })
                    ],
                    separator: Comma
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            expect(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Comma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Alpha, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta, Comma, Alpha, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta, Comma, Alpha, Beta, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
        });
        it("NonTerminal - positive", function () {
            var someSubRule = new gast_public_1.Rule({
                name: "blah",
                definition: [new gast_public_1.Terminal({ terminalType: Beta })]
            });
            var seq = [
                new gast_public_1.Terminal({ terminalType: Alpha }),
                new gast_public_1.NonTerminal({
                    nonTerminalName: "blah",
                    referencedRule: someSubRule
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(seq, INPUT([]), tokens_1.tokenStructuredMatcher, 5)), [Alpha]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(seq, INPUT([Alpha]), tokens_1.tokenStructuredMatcher, 5)), [Beta]);
            matchers_1.setEquality(pluckTokenTypes(interpreter_1.nextPossibleTokensAfter(seq, INPUT([Alpha, Beta]), tokens_1.tokenStructuredMatcher, 5)), [Gamma]);
        });
        it("NonTerminal - negative", function () {
            var someSubRule = new gast_public_1.Rule({
                name: "blah",
                definition: [new gast_public_1.Terminal({ terminalType: Beta })]
            });
            var seq = [
                new gast_public_1.Terminal({ terminalType: Alpha }),
                new gast_public_1.NonTerminal({
                    nonTerminalName: "blah",
                    referencedRule: someSubRule
                }),
                new gast_public_1.Terminal({ terminalType: Gamma })
            ];
            expect(interpreter_1.nextPossibleTokensAfter(seq, INPUT([Beta]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(seq, INPUT([Alpha, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
            expect(interpreter_1.nextPossibleTokensAfter(seq, INPUT([Alpha, Beta, Gamma]), tokens_1.tokenStructuredMatcher, 5)).to.be.empty;
        });
    });
});
describe("issue 391 - WITH_SEP variants do not take SEP into account in lookahead", function () {
    it("Reproduce issue", function () {
        var LParen = tokens_public_1.createToken({
            name: "LParen",
            pattern: /\(/
        });
        var RParen = tokens_public_1.createToken({
            name: "RParen",
            pattern: /\)/
        });
        var Comma = tokens_public_1.createToken({ name: "Comma", pattern: /,/ });
        var FatArrow = tokens_public_1.createToken({
            name: "FatArrow",
            pattern: /=>/
        });
        var Identifier = tokens_public_1.createToken({
            name: "Identifier",
            pattern: /[a-zA-Z]+/
        });
        var WhiteSpace = tokens_public_1.createToken({
            name: "WhiteSpace",
            pattern: /\s+/,
            group: lexer_public_1.Lexer.SKIPPED,
            line_breaks: true
        });
        var allTokens = [
            WhiteSpace,
            LParen,
            RParen,
            Comma,
            FatArrow,
            Identifier
        ];
        var issue391Lexer = new lexer_public_1.Lexer(allTokens);
        var Issue391Parser = /** @class */ (function (_super) {
            __extends(Issue391Parser, _super);
            function Issue391Parser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, allTokens, {
                    maxLookahead: 4
                }) || this;
                _this.topRule = _this.RULE("topRule", function () {
                    return _this.OR9([
                        {
                            // Lambda Function
                            ALT: function () {
                                _this.CONSUME1(LParen);
                                _this.MANY_SEP({
                                    SEP: Comma,
                                    DEF: function () {
                                        _this.CONSUME1(Identifier);
                                    }
                                });
                                _this.CONSUME1(RParen);
                                _this.CONSUME1(FatArrow);
                            }
                        },
                        {
                            // Parenthesis Expression
                            ALT: function () {
                                _this.CONSUME2(LParen);
                                _this.CONSUME2(Identifier);
                                _this.CONSUME2(RParen);
                            }
                        }
                    ]);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return Issue391Parser;
        }(parser_traits_1.Parser));
        expect(function () { return new Issue391Parser([]); }).to.not.throw("Ambiguous alternatives: <1 ,2>");
        var myParser = new Issue391Parser([]);
        function testInput(input) {
            var tokens = issue391Lexer.tokenize(input).tokens;
            myParser.input = tokens;
            myParser.topRule();
            expect(myParser.errors).to.be.empty;
        }
        testInput("(x, y) => ");
        testInput("() =>");
        testInput("(x) =>");
        testInput("(x)");
    });
});
//# sourceMappingURL=interperter_spec.js.map