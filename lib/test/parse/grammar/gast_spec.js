"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var gast_1 = require("../../../src/parse/grammar/gast/gast");
var tokens_public_1 = require("../../../src/scan/tokens_public");
var gast_public_1 = require("../../../src/parse/grammar/gast/gast_public");
describe("GAst namespace", function () {
    describe("the ProdRef class", function () {
        it("will always return a valid empty definition, even if it's ref is unresolved", function () {
            var prodRef = new gast_public_1.NonTerminal({
                nonTerminalName: "SomeGrammarRuleName"
            });
            expect(prodRef.definition).to.be.an.instanceof(Array);
        });
    });
    describe("the mappings between a GAst instance and its matching DSL method name for: ", function () {
        var Comma = /** @class */ (function () {
            function Comma() {
            }
            Comma.PATTERN = /NA/;
            return Comma;
        }());
        it("Terminal", function () {
            var gastInstance = new gast_public_1.Terminal({ terminalType: Comma });
            expect(gast_1.getProductionDslName(gastInstance)).to.equal("CONSUME");
        });
        it("NonTerminal", function () {
            var gastInstance = new gast_public_1.NonTerminal({
                nonTerminalName: "bamba"
            });
            expect(gast_1.getProductionDslName(gastInstance)).to.equal("SUBRULE");
        });
        it("Option", function () {
            var gastInstance = new gast_public_1.Option({ definition: [] });
            expect(gast_1.getProductionDslName(gastInstance)).to.equal("OPTION");
        });
        it("Alternation", function () {
            var gastInstance = new gast_public_1.Alternation({ definition: [] });
            expect(gast_1.getProductionDslName(gastInstance)).to.equal("OR");
        });
        it("RepetitionMandatory", function () {
            var gastInstance = new gast_public_1.RepetitionMandatory({ definition: [] });
            expect(gast_1.getProductionDslName(gastInstance)).to.equal("AT_LEAST_ONE");
        });
        it("RepetitionMandatoryWithSeparator", function () {
            var gastInstance = new gast_public_1.RepetitionMandatoryWithSeparator({
                definition: [],
                separator: Comma
            });
            expect(gast_1.getProductionDslName(gastInstance)).to.equal("AT_LEAST_ONE_SEP");
        });
        it("RepetitionWithSeparator", function () {
            var gastInstance = new gast_public_1.RepetitionWithSeparator({
                definition: [],
                separator: Comma
            });
            expect(gast_1.getProductionDslName(gastInstance)).to.equal("MANY_SEP");
        });
        it("Repetition", function () {
            var gastInstance = new gast_public_1.Repetition({ definition: [] });
            expect(gast_1.getProductionDslName(gastInstance)).to.equal("MANY");
        });
    });
    describe("the GAst serialization capabilities", function () {
        var A = tokens_public_1.createToken({ name: "A" });
        A.LABEL = "bamba";
        var B = tokens_public_1.createToken({ name: "B", pattern: /[a-zA-Z]\w*/ });
        var C = tokens_public_1.createToken({ name: "C" });
        var D = tokens_public_1.createToken({ name: "D" });
        var Comma = tokens_public_1.createToken({ name: "Comma" });
        var WithLiteral = tokens_public_1.createToken({
            name: "WithLiteral",
            pattern: "bamba"
        });
        it("can serialize a NonTerminal", function () {
            var input = new gast_public_1.NonTerminal({
                nonTerminalName: "qualifiedName"
            });
            var actual = gast_public_1.serializeProduction(input);
            expect(actual).to.deep.equal({
                type: "NonTerminal",
                name: "qualifiedName",
                idx: 1
            });
        });
        it("can serialize a Flat", function () {
            var input = new gast_public_1.Flat({
                definition: [
                    new gast_public_1.Terminal({ terminalType: WithLiteral }),
                    new gast_public_1.NonTerminal({ nonTerminalName: "bamba" })
                ]
            });
            var actual = gast_public_1.serializeProduction(input);
            expect(actual).to.deep.equal({
                type: "Flat",
                definition: [
                    {
                        type: "Terminal",
                        name: "WithLiteral",
                        pattern: "bamba",
                        label: "WithLiteral",
                        idx: 1
                    },
                    {
                        type: "NonTerminal",
                        name: "bamba",
                        idx: 1
                    }
                ]
            });
        });
        it("can serialize a Option", function () {
            var input = new gast_public_1.Option({
                definition: [
                    new gast_public_1.Terminal({ terminalType: C }),
                    new gast_public_1.NonTerminal({ nonTerminalName: "bamba" })
                ]
            });
            var actual = gast_public_1.serializeProduction(input);
            expect(actual).to.deep.equal({
                type: "Option",
                idx: 1,
                definition: [
                    {
                        type: "Terminal",
                        name: "C",
                        label: "C",
                        idx: 1
                    },
                    {
                        type: "NonTerminal",
                        name: "bamba",
                        idx: 1
                    }
                ]
            });
        });
        it("can serialize a RepetitionMandatory", function () {
            var input = new gast_public_1.RepetitionMandatory({
                name: "repMany",
                definition: [
                    new gast_public_1.Terminal({ terminalType: C }),
                    new gast_public_1.NonTerminal({ nonTerminalName: "bamba" })
                ]
            });
            var actual = gast_public_1.serializeProduction(input);
            expect(actual).to.deep.equal({
                type: "RepetitionMandatory",
                idx: 1,
                name: "repMany",
                definition: [
                    {
                        type: "Terminal",
                        name: "C",
                        label: "C",
                        idx: 1
                    },
                    {
                        type: "NonTerminal",
                        name: "bamba",
                        idx: 1
                    }
                ]
            });
        });
        it("can serialize a RepetitionMandatoryWithSeparator", function () {
            var input = new gast_public_1.RepetitionMandatoryWithSeparator({
                name: "repManyWithSep",
                definition: [
                    new gast_public_1.Terminal({ terminalType: C }),
                    new gast_public_1.NonTerminal({ nonTerminalName: "bamba" })
                ],
                separator: Comma
            });
            var actual = gast_public_1.serializeProduction(input);
            expect(actual).to.deep.equal({
                type: "RepetitionMandatoryWithSeparator",
                idx: 1,
                name: "repManyWithSep",
                separator: {
                    type: "Terminal",
                    name: "Comma",
                    label: "Comma",
                    idx: 1
                },
                definition: [
                    {
                        type: "Terminal",
                        name: "C",
                        label: "C",
                        idx: 1
                    },
                    {
                        type: "NonTerminal",
                        name: "bamba",
                        idx: 1
                    }
                ]
            });
        });
        it("can serialize a Repetition", function () {
            var input = new gast_public_1.Repetition({
                name: "rep",
                definition: [
                    new gast_public_1.Terminal({ terminalType: C }),
                    new gast_public_1.NonTerminal({ nonTerminalName: "bamba" })
                ]
            });
            var actual = gast_public_1.serializeProduction(input);
            expect(actual).to.deep.equal({
                type: "Repetition",
                idx: 1,
                name: "rep",
                definition: [
                    {
                        type: "Terminal",
                        name: "C",
                        label: "C",
                        idx: 1
                    },
                    {
                        type: "NonTerminal",
                        name: "bamba",
                        idx: 1
                    }
                ]
            });
        });
        it("can serialize a RepetitionWithSeparator", function () {
            var input = new gast_public_1.RepetitionWithSeparator({
                name: "repWithSep",
                definition: [
                    new gast_public_1.Terminal({ terminalType: C }),
                    new gast_public_1.NonTerminal({ nonTerminalName: "bamba" })
                ],
                separator: Comma
            });
            var actual = gast_public_1.serializeProduction(input);
            expect(actual).to.deep.equal({
                type: "RepetitionWithSeparator",
                idx: 1,
                name: "repWithSep",
                separator: {
                    type: "Terminal",
                    name: "Comma",
                    label: "Comma",
                    idx: 1
                },
                definition: [
                    {
                        type: "Terminal",
                        name: "C",
                        label: "C",
                        idx: 1
                    },
                    {
                        type: "NonTerminal",
                        name: "bamba",
                        idx: 1
                    }
                ]
            });
        });
        it("can serialize a Alternation", function () {
            var input = new gast_public_1.Alternation({
                name: "alt",
                definition: [
                    new gast_public_1.Flat({
                        definition: [new gast_public_1.Terminal({ terminalType: A })]
                    }),
                    new gast_public_1.Flat({
                        definition: [new gast_public_1.Terminal({ terminalType: B })]
                    }),
                    new gast_public_1.Flat({
                        definition: [new gast_public_1.Terminal({ terminalType: C })]
                    })
                ]
            });
            var actual = gast_public_1.serializeProduction(input);
            expect(actual).to.deep.equal({
                type: "Alternation",
                idx: 1,
                name: "alt",
                definition: [
                    {
                        type: "Flat",
                        definition: [
                            {
                                type: "Terminal",
                                name: "A",
                                label: "bamba",
                                idx: 1
                            }
                        ]
                    },
                    {
                        type: "Flat",
                        definition: [
                            {
                                type: "Terminal",
                                name: "B",
                                label: "B",
                                pattern: "[a-zA-Z]\\w*",
                                idx: 1
                            }
                        ]
                    },
                    {
                        type: "Flat",
                        definition: [
                            {
                                type: "Terminal",
                                name: "C",
                                label: "C",
                                idx: 1
                            }
                        ]
                    }
                ]
            });
        });
        it("can serialize a Terminal with a custom label", function () {
            var input = new gast_public_1.Terminal({ terminalType: A });
            var actual = gast_public_1.serializeProduction(input);
            expect(actual).to.deep.equal({
                type: "Terminal",
                name: "A",
                label: "bamba",
                idx: 1
            });
        });
        it("can serialize a Terminal with a pattern", function () {
            var input = new gast_public_1.Terminal({ terminalType: B });
            var actual = gast_public_1.serializeProduction(input);
            expect(actual).to.deep.equal({
                type: "Terminal",
                name: "B",
                label: "B",
                pattern: "[a-zA-Z]\\w*",
                idx: 1
            });
        });
        it("can serialize a Rule", function () {
            var input = new gast_public_1.Rule({
                name: "myRule",
                orgText: "",
                definition: [
                    new gast_public_1.Terminal({ terminalType: C }),
                    new gast_public_1.NonTerminal({ nonTerminalName: "bamba" })
                ]
            });
            var actual = gast_public_1.serializeProduction(input);
            expect(actual).to.deep.equal({
                type: "Rule",
                name: "myRule",
                orgText: "",
                definition: [
                    {
                        type: "Terminal",
                        name: "C",
                        label: "C",
                        idx: 1
                    },
                    {
                        type: "NonTerminal",
                        name: "bamba",
                        idx: 1
                    }
                ]
            });
        });
        it("can serialize an array of Rules", function () {
            var input = [
                new gast_public_1.Rule({
                    name: "myRule",
                    orgText: "",
                    definition: [
                        new gast_public_1.Terminal({ terminalType: C }),
                        new gast_public_1.NonTerminal({ nonTerminalName: "bamba" })
                    ]
                }),
                new gast_public_1.Rule({
                    name: "myRule2",
                    orgText: "",
                    definition: [
                        new gast_public_1.Terminal({ terminalType: D }),
                        new gast_public_1.NonTerminal({ nonTerminalName: "bisli" })
                    ]
                })
            ];
            var actual = gast_public_1.serializeGrammar(input);
            expect(actual).to.deep.equal([
                {
                    type: "Rule",
                    name: "myRule",
                    orgText: "",
                    definition: [
                        {
                            type: "Terminal",
                            name: "C",
                            label: "C",
                            idx: 1
                        },
                        {
                            type: "NonTerminal",
                            name: "bamba",
                            idx: 1
                        }
                    ]
                },
                {
                    type: "Rule",
                    orgText: "",
                    name: "myRule2",
                    definition: [
                        {
                            type: "Terminal",
                            name: "D",
                            label: "D",
                            idx: 1
                        },
                        {
                            type: "NonTerminal",
                            name: "bisli",
                            idx: 1
                        }
                    ]
                }
            ]);
        });
    });
});
//# sourceMappingURL=gast_spec.js.map