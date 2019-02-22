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
var parser_traits_1 = require("../../../src/parse/parser/traits/parser_traits");
var parser_1 = require("../../../src/parse/parser/parser");
var samples_1 = require("./samples");
var checks_1 = require("../../../src/parse/grammar/checks");
var tokens_public_1 = require("../../../src/scan/tokens_public");
var utils_1 = require("../../../src/utils/utils");
var gast_public_1 = require("../../../src/parse/grammar/gast/gast_public");
var errors_public_1 = require("../../../src/parse/errors_public");
describe("the grammar validations", function () {
    it("validates every one of the TOP_RULEs in the input", function () {
        var expectedErrorsNoMsg = [
            {
                type: parser_1.ParserDefinitionErrorType.DUPLICATE_PRODUCTIONS,
                ruleName: "qualifiedNameErr1",
                dslName: "CONSUME",
                occurrence: 1,
                parameter: "IdentTok"
            },
            {
                type: parser_1.ParserDefinitionErrorType.DUPLICATE_PRODUCTIONS,
                ruleName: "qualifiedNameErr2",
                dslName: "MANY",
                occurrence: 1
            },
            {
                type: parser_1.ParserDefinitionErrorType.DUPLICATE_PRODUCTIONS,
                ruleName: "qualifiedNameErr2",
                dslName: "CONSUME",
                occurrence: 1,
                parameter: "DotTok"
            },
            {
                type: parser_1.ParserDefinitionErrorType.DUPLICATE_PRODUCTIONS,
                ruleName: "qualifiedNameErr2",
                dslName: "CONSUME",
                occurrence: 2,
                parameter: "IdentTok"
            }
        ];
        var qualifiedNameErr1 = new gast_public_1.Rule({
            name: "qualifiedNameErr1",
            definition: [
                new gast_public_1.Terminal({ terminalType: samples_1.IdentTok, idx: 1 }),
                new gast_public_1.Repetition({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: samples_1.DotTok }),
                        new gast_public_1.Terminal({
                            terminalType: samples_1.IdentTok,
                            idx: 1
                        }) // duplicate Terminal IdentTok with occurrence index 1
                    ]
                })
            ]
        });
        var qualifiedNameErr2 = new gast_public_1.Rule({
            name: "qualifiedNameErr2",
            definition: [
                new gast_public_1.Terminal({ terminalType: samples_1.IdentTok, idx: 1 }),
                new gast_public_1.Repetition({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: samples_1.DotTok }),
                        new gast_public_1.Terminal({
                            terminalType: samples_1.IdentTok,
                            idx: 2
                        })
                    ]
                }),
                new gast_public_1.Repetition({
                    definition: [
                        new gast_public_1.Terminal({ terminalType: samples_1.DotTok }),
                        new gast_public_1.Terminal({
                            terminalType: samples_1.IdentTok,
                            idx: 2
                        })
                    ]
                })
            ]
        });
        var actualErrors = checks_1.validateGrammar([qualifiedNameErr1, qualifiedNameErr2], 5, [], {}, errors_public_1.defaultGrammarValidatorErrorProvider, "bamba");
        expect(actualErrors.length).to.equal(4);
        utils_1.forEach(actualErrors, function (err) { return delete err.message; });
        expect(actualErrors).to.deep.include.members(expectedErrorsNoMsg);
        expect(expectedErrorsNoMsg).to.deep.include.members(actualErrors);
    });
    it("does not allow duplicate grammar rule names", function () {
        var noErrors = checks_1.validateRuleDoesNotAlreadyExist(new gast_public_1.Rule({ name: "A", definition: [] }), [
            new gast_public_1.Rule({ name: "B", definition: [] }),
            new gast_public_1.Rule({ name: "C", definition: [] })
        ], "className", errors_public_1.defaultGrammarValidatorErrorProvider);
        //noinspection BadExpressionStatementJS
        expect(noErrors).to.be.empty;
        var duplicateErr = checks_1.validateRuleDoesNotAlreadyExist(new gast_public_1.Rule({ name: "A", definition: [] }), [
            new gast_public_1.Rule({ name: "A", definition: [] }),
            new gast_public_1.Rule({ name: "A", definition: [] }),
            new gast_public_1.Rule({ name: "B", definition: [] }),
            new gast_public_1.Rule({ name: "C", definition: [] })
        ], "className", errors_public_1.defaultGrammarValidatorErrorProvider);
        //noinspection BadExpressionStatementJS
        expect(duplicateErr).to.have.length(1);
        expect(duplicateErr[0]).to.have.property("message");
        expect(duplicateErr[0]).to.have.property("type", parser_1.ParserDefinitionErrorType.DUPLICATE_RULE_NAME);
        expect(duplicateErr[0]).to.have.property("ruleName", "A");
    });
    it("only allows a subset of ECMAScript identifiers as rule names", function () {
        var res1 = checks_1.validateRuleName(new gast_public_1.Rule({ name: "1baa", definition: [] }), errors_public_1.defaultGrammarValidatorErrorProvider);
        expect(res1).to.have.lengthOf(1);
        expect(res1[0]).to.have.property("message");
        expect(res1[0]).to.have.property("type", parser_1.ParserDefinitionErrorType.INVALID_RULE_NAME);
        expect(res1[0]).to.have.property("ruleName", "1baa");
        var res2 = checks_1.validateRuleName(new gast_public_1.Rule({ name: "שלום", definition: [] }), errors_public_1.defaultGrammarValidatorErrorProvider);
        expect(res2).to.have.lengthOf(1);
        expect(res2[0]).to.have.property("message");
        expect(res2[0]).to.have.property("type", parser_1.ParserDefinitionErrorType.INVALID_RULE_NAME);
        expect(res2[0]).to.have.property("ruleName", "שלום");
        var res3 = checks_1.validateRuleName(new gast_public_1.Rule({ name: "$bamba", definition: [] }), errors_public_1.defaultGrammarValidatorErrorProvider);
        expect(res3).to.have.lengthOf(1);
        expect(res3[0]).to.have.property("message");
        expect(res3[0]).to.have.property("type", parser_1.ParserDefinitionErrorType.INVALID_RULE_NAME);
        expect(res3[0]).to.have.property("ruleName", "$bamba");
    });
    it("does not allow overriding a rule which does not already exist", function () {
        var positive = checks_1.validateRuleIsOverridden("AAA", ["BBB", "CCC"], "className");
        expect(positive).to.have.lengthOf(1);
        expect(positive[0].message).to.contain("Invalid rule override");
        expect(positive[0].type).to.equal(parser_1.ParserDefinitionErrorType.INVALID_RULE_OVERRIDE);
        expect(positive[0].ruleName).to.equal("AAA");
        var negative = checks_1.validateRuleIsOverridden("AAA", ["BBB", "CCC", "AAA"], "className");
        expect(negative).to.have.lengthOf(0);
    });
});
describe("identifyProductionForDuplicates function", function () {
    it("generates DSL code for a ProdRef", function () {
        var dslCode = checks_1.identifyProductionForDuplicates(new gast_public_1.NonTerminal({ nonTerminalName: "ActionDeclaration" }));
        expect(dslCode).to.equal("SUBRULE_#_1_#_ActionDeclaration");
    });
    it("generates DSL code for a OPTION", function () {
        var dslCode = checks_1.identifyProductionForDuplicates(new gast_public_1.Option({ definition: [], idx: 3 }));
        expect(dslCode).to.equal("OPTION_#_3_#_");
    });
    it("generates DSL code for a AT_LEAST_ONE", function () {
        var dslCode = checks_1.identifyProductionForDuplicates(new gast_public_1.RepetitionMandatory({ definition: [] }));
        expect(dslCode).to.equal("AT_LEAST_ONE_#_1_#_");
    });
    it("generates DSL code for a MANY", function () {
        var dslCode = checks_1.identifyProductionForDuplicates(new gast_public_1.Repetition({ definition: [], idx: 5 }));
        expect(dslCode).to.equal("MANY_#_5_#_");
    });
    it("generates DSL code for a OR", function () {
        var dslCode = checks_1.identifyProductionForDuplicates(new gast_public_1.Alternation({ definition: [], idx: 1 }));
        expect(dslCode).to.equal("OR_#_1_#_");
    });
    it("generates DSL code for a Terminal", function () {
        var dslCode = checks_1.identifyProductionForDuplicates(new gast_public_1.Terminal({ terminalType: samples_1.IdentTok, idx: 4 }));
        expect(dslCode).to.equal("CONSUME_#_4_#_IdentTok");
    });
});
describe("OccurrenceValidationCollector GASTVisitor class", function () {
    it("collects all the productions relevant to occurrence validation", function () {
        var qualifiedNameVisitor = new checks_1.OccurrenceValidationCollector();
        samples_1.qualifiedName.accept(qualifiedNameVisitor);
        expect(qualifiedNameVisitor.allProductions.length).to.equal(4);
        // TODO: check set equality
        var actionDecVisitor = new checks_1.OccurrenceValidationCollector();
        samples_1.actionDec.accept(actionDecVisitor);
        expect(actionDecVisitor.allProductions.length).to.equal(13);
        // TODO: check set equality
    });
});
var DummyToken = /** @class */ (function () {
    function DummyToken() {
    }
    DummyToken.PATTERN = /NA/;
    return DummyToken;
}());
var dummyRule = new gast_public_1.Rule({
    name: "dummyRule",
    definition: [new gast_public_1.Terminal({ terminalType: DummyToken })]
});
var dummyRule2 = new gast_public_1.Rule({
    name: "dummyRule2",
    definition: [new gast_public_1.Terminal({ terminalType: DummyToken })]
});
var dummyRule3 = new gast_public_1.Rule({
    name: "dummyRule3",
    definition: [new gast_public_1.Terminal({ terminalType: DummyToken })]
});
describe("the getFirstNoneTerminal function", function () {
    it("can find the firstNoneTerminal of an empty sequence", function () {
        expect(checks_1.getFirstNoneTerminal([])).to.be.empty;
    });
    it("can find the firstNoneTerminal of a sequence with only one item", function () {
        var result = checks_1.getFirstNoneTerminal([
            new gast_public_1.NonTerminal({
                nonTerminalName: "dummyRule",
                referencedRule: dummyRule
            })
        ]);
        expect(result).to.have.length(1);
        expect(utils_1.first(result).name).to.equal("dummyRule");
    });
    it("can find the firstNoneTerminal of a sequence with two items", function () {
        var sqeuence = [
            new gast_public_1.NonTerminal({
                nonTerminalName: "dummyRule",
                referencedRule: dummyRule
            }),
            new gast_public_1.NonTerminal({
                nonTerminalName: "dummyRule2",
                referencedRule: dummyRule2
            })
        ];
        var result = checks_1.getFirstNoneTerminal(sqeuence);
        expect(result).to.have.length(1);
        expect(utils_1.first(result).name).to.equal("dummyRule");
    });
    it("can find the firstNoneTerminal of a sequence with two items where the first is optional", function () {
        var sqeuence = [
            new gast_public_1.Option({
                definition: [
                    new gast_public_1.NonTerminal({
                        nonTerminalName: "dummyRule",
                        referencedRule: dummyRule
                    })
                ]
            }),
            new gast_public_1.NonTerminal({
                nonTerminalName: "dummyRule2",
                referencedRule: dummyRule2
            })
        ];
        var result = checks_1.getFirstNoneTerminal(sqeuence);
        expect(result).to.have.length(2);
        var resultRuleNames = utils_1.map(result, function (currItem) { return currItem.name; });
        expect(resultRuleNames).to.include.members(["dummyRule", "dummyRule2"]);
    });
    it("can find the firstNoneTerminal of an alternation", function () {
        var alternation = [
            new gast_public_1.Alternation({
                definition: [
                    new gast_public_1.Flat({
                        definition: [
                            new gast_public_1.NonTerminal({
                                nonTerminalName: "dummyRule",
                                referencedRule: dummyRule
                            })
                        ]
                    }),
                    new gast_public_1.Flat({
                        definition: [
                            new gast_public_1.NonTerminal({
                                nonTerminalName: "dummyRule2",
                                referencedRule: dummyRule2
                            })
                        ]
                    }),
                    new gast_public_1.Flat({
                        definition: [
                            new gast_public_1.NonTerminal({
                                nonTerminalName: "dummyRule3",
                                referencedRule: dummyRule3
                            })
                        ]
                    })
                ]
            })
        ];
        var result = checks_1.getFirstNoneTerminal(alternation);
        expect(result).to.have.length(3);
        var resultRuleNames = utils_1.map(result, function (currItem) { return currItem.name; });
        expect(resultRuleNames).to.include.members([
            "dummyRule",
            "dummyRule2",
            "dummyRule3"
        ]);
    });
    it("can find the firstNoneTerminal of an optional repetition", function () {
        var alternation = [
            new gast_public_1.Repetition({
                definition: [
                    new gast_public_1.Flat({
                        definition: [
                            new gast_public_1.NonTerminal({
                                nonTerminalName: "dummyRule",
                                referencedRule: dummyRule
                            })
                        ]
                    }),
                    new gast_public_1.Flat({
                        definition: [
                            new gast_public_1.NonTerminal({
                                nonTerminalName: "dummyRule2",
                                referencedRule: dummyRule2
                            })
                        ]
                    })
                ]
            }),
            new gast_public_1.NonTerminal({
                nonTerminalName: "dummyRule3",
                referencedRule: dummyRule3
            })
        ];
        var result = checks_1.getFirstNoneTerminal(alternation);
        expect(result).to.have.length(2);
        var resultRuleNames = utils_1.map(result, function (currItem) { return currItem.name; });
        expect(resultRuleNames).to.include.members(["dummyRule", "dummyRule3"]);
    });
    it("can find the firstNoneTerminal of a mandatory repetition", function () {
        var alternation = [
            new gast_public_1.RepetitionMandatory({
                definition: [
                    new gast_public_1.Flat({
                        definition: [
                            new gast_public_1.NonTerminal({
                                nonTerminalName: "dummyRule",
                                referencedRule: dummyRule
                            })
                        ]
                    }),
                    new gast_public_1.Flat({
                        definition: [
                            new gast_public_1.NonTerminal({
                                nonTerminalName: "dummyRule2",
                                referencedRule: dummyRule2
                            })
                        ]
                    })
                ]
            }),
            new gast_public_1.NonTerminal({
                nonTerminalName: "dummyRule3",
                referencedRule: dummyRule3
            })
        ];
        var result = checks_1.getFirstNoneTerminal(alternation);
        expect(result).to.have.length(1);
        var resultRuleNames = utils_1.map(result, function (currItem) { return currItem.name; });
        expect(resultRuleNames).to.include.members(["dummyRule"]);
    });
});
var PlusTok = /** @class */ (function () {
    function PlusTok() {
    }
    PlusTok.PATTERN = /NA/;
    return PlusTok;
}());
exports.PlusTok = PlusTok;
var MinusTok = /** @class */ (function () {
    function MinusTok() {
    }
    MinusTok.PATTERN = /NA/;
    return MinusTok;
}());
exports.MinusTok = MinusTok;
var StarTok = /** @class */ (function () {
    function StarTok() {
    }
    StarTok.PATTERN = /NA/;
    return StarTok;
}());
exports.StarTok = StarTok;
var ErroneousOccurrenceNumUsageParser1 = /** @class */ (function (_super) {
    __extends(ErroneousOccurrenceNumUsageParser1, _super);
    function ErroneousOccurrenceNumUsageParser1(input) {
        if (input === void 0) { input = []; }
        var _this = _super.call(this, [PlusTok]) || this;
        _this.duplicateRef = _this.RULE("duplicateRef", function () {
            _this.SUBRULE1(_this.anotherRule);
            _this.SUBRULE1(_this.anotherRule);
        });
        _this.anotherRule = _this.RULE("anotherRule", function () {
            _this.CONSUME(PlusTok);
        });
        _this.input = input;
        _this.performSelfAnalysis();
        return _this;
    }
    return ErroneousOccurrenceNumUsageParser1;
}(parser_traits_1.Parser));
var ErroneousOccurrenceNumUsageParser2 = /** @class */ (function (_super) {
    __extends(ErroneousOccurrenceNumUsageParser2, _super);
    function ErroneousOccurrenceNumUsageParser2(input) {
        if (input === void 0) { input = []; }
        var _this = _super.call(this, [PlusTok]) || this;
        _this.duplicateTerminal = _this.RULE("duplicateTerminal", function () {
            _this.CONSUME3(PlusTok);
            _this.CONSUME3(PlusTok);
        });
        _this.input = input;
        _this.performSelfAnalysis();
        return _this;
    }
    return ErroneousOccurrenceNumUsageParser2;
}(parser_traits_1.Parser));
var ErroneousOccurrenceNumUsageParser3 = /** @class */ (function (_super) {
    __extends(ErroneousOccurrenceNumUsageParser3, _super);
    function ErroneousOccurrenceNumUsageParser3(input) {
        if (input === void 0) { input = []; }
        var _this = _super.call(this, [PlusTok, MinusTok]) || this;
        _this.duplicateMany = _this.RULE("duplicateMany", function () {
            _this.MANY(function () {
                _this.CONSUME1(MinusTok);
                _this.MANY(function () {
                    _this.CONSUME1(PlusTok);
                });
            });
        });
        _this.input = input;
        _this.performSelfAnalysis();
        return _this;
    }
    return ErroneousOccurrenceNumUsageParser3;
}(parser_traits_1.Parser));
var myToken = tokens_public_1.createToken({ name: "myToken" });
var myOtherToken = tokens_public_1.createToken({ name: "myOtherToken" });
var ValidOccurrenceNumUsageParser = /** @class */ (function (_super) {
    __extends(ValidOccurrenceNumUsageParser, _super);
    function ValidOccurrenceNumUsageParser(input) {
        if (input === void 0) { input = []; }
        var _this = _super.call(this, [myToken, myOtherToken]) || this;
        _this.anonymousTokens = _this.RULE("anonymousTokens", function () {
            _this.CONSUME1(myToken);
            _this.CONSUME1(myOtherToken);
        });
        _this.input = input;
        _this.performSelfAnalysis();
        return _this;
    }
    return ValidOccurrenceNumUsageParser;
}(parser_traits_1.Parser));
describe("The duplicate occurrence validations full flow", function () {
    it("will throw errors on duplicate Terminals consumption in the same top level rule", function () {
        expect(function () { return new ErroneousOccurrenceNumUsageParser1(); }).to.throw("SUBRULE");
        expect(function () { return new ErroneousOccurrenceNumUsageParser1(); }).to.throw("1");
        expect(function () { return new ErroneousOccurrenceNumUsageParser1(); }).to.throw("duplicateRef");
        expect(function () { return new ErroneousOccurrenceNumUsageParser1(); }).to.throw("anotherRule");
        expect(function () { return new ErroneousOccurrenceNumUsageParser1(); }).to.throw("with numerical suffix: ->1<-");
    });
    it("will throw errors on duplicate Subrules references in the same top level rule", function () {
        expect(function () { return new ErroneousOccurrenceNumUsageParser2(); }).to.throw("CONSUME");
        expect(function () { return new ErroneousOccurrenceNumUsageParser2(); }).to.throw("3");
        expect(function () { return new ErroneousOccurrenceNumUsageParser2(); }).to.throw("PlusTok");
        expect(function () { return new ErroneousOccurrenceNumUsageParser2(); }).to.throw("duplicateTerminal");
    });
    it("will throw errors on duplicate MANY productions in the same top level rule", function () {
        expect(function () { return new ErroneousOccurrenceNumUsageParser3(); }).to.throw("MANY");
        expect(function () { return new ErroneousOccurrenceNumUsageParser3(); }).to.throw("0");
        expect(function () { return new ErroneousOccurrenceNumUsageParser3(); }).to.throw("duplicateMany");
        expect(function () { return new ErroneousOccurrenceNumUsageParser3(); }).to.throw("appears more than once (2 times)");
    });
    it("won't detect issues in a Parser using Tokens created by extendToken(...) utility (anonymous)", function () {
        //noinspection JSUnusedLocalSymbols
        var parser = new ValidOccurrenceNumUsageParser();
    });
});
var InvalidRefParser = /** @class */ (function (_super) {
    __extends(InvalidRefParser, _super);
    function InvalidRefParser(input) {
        if (input === void 0) { input = []; }
        var _this = _super.call(this, [myToken, myOtherToken]) || this;
        _this.one = _this.RULE("one", function () {
            _this.SUBRULE2(_this.oopsTypo);
        });
        _this.input = input;
        _this.performSelfAnalysis();
        return _this;
    }
    return InvalidRefParser;
}(parser_traits_1.Parser));
var InvalidRefParser2 = /** @class */ (function (_super) {
    __extends(InvalidRefParser2, _super);
    function InvalidRefParser2(input) {
        if (input === void 0) { input = []; }
        var _this = _super.call(this, [myToken, myOtherToken]) || this;
        _this.one = _this.RULE("one", function () {
            _this.SUBRULE2(_this.oopsTypo);
        });
        _this.input = input;
        _this.performSelfAnalysis();
        return _this;
    }
    return InvalidRefParser2;
}(parser_traits_1.Parser));
describe("The reference resolver validation full flow", function () {
    it("will throw an error when trying to init a parser with unresolved rule references", function () {
        expect(function () { return new InvalidRefParser(); }).to.throw("oopsTypo");
        expect(function () { return new InvalidRefParser(); }).to.throw("Parser Definition Errors detected");
        expect(function () { return new InvalidRefParser(); }).to.throw("reference to a rule which is not defined");
    });
    it("won't throw an error when trying to init a parser with definition errors but with a flag active to defer handling" +
        "of definition errors", function () {
        ;
        parser_traits_1.Parser.DEFER_DEFINITION_ERRORS_HANDLING = true;
        expect(function () { return new InvalidRefParser2(); }).to.not.throw();
        expect(function () { return new InvalidRefParser2(); }).to.not.throw();
        expect(function () { return new InvalidRefParser2(); }).to.not.throw();
        parser_traits_1.Parser.DEFER_DEFINITION_ERRORS_HANDLING = false;
    });
});
var DuplicateRulesParser = /** @class */ (function (_super) {
    __extends(DuplicateRulesParser, _super);
    function DuplicateRulesParser(input) {
        if (input === void 0) { input = []; }
        var _this = _super.call(this, [myToken, myOtherToken]) || this;
        _this.one = _this.RULE("oops_duplicate", function () { });
        _this.two = _this.RULE("oops_duplicate", function () { });
        _this.input = input;
        _this.performSelfAnalysis();
        return _this;
    }
    return DuplicateRulesParser;
}(parser_traits_1.Parser));
var InvalidRuleNameParser = /** @class */ (function (_super) {
    __extends(InvalidRuleNameParser, _super);
    function InvalidRuleNameParser(input) {
        if (input === void 0) { input = []; }
        var _this = _super.call(this, [myToken, myOtherToken]) || this;
        _this.one = _this.RULE("שלום", function () { });
        _this.input = input;
        _this.performSelfAnalysis();
        return _this;
    }
    return InvalidRuleNameParser;
}(parser_traits_1.Parser));
describe("The rule names validation full flow", function () {
    it("will throw an error when trying to init a parser with duplicate ruleNames", function () {
        expect(function () { return new DuplicateRulesParser(); }).to.throw("is already defined in the grammar");
        expect(function () { return new DuplicateRulesParser(); }).to.throw("DuplicateRulesParser");
        expect(function () { return new DuplicateRulesParser(); }).to.throw("oops_duplicate");
    });
    it("will throw an error when trying to init a parser with an invalid rule names", function () {
        expect(function () { return new InvalidRuleNameParser(); }).to.throw("it must match the pattern");
        expect(function () { return new InvalidRuleNameParser(); }).to.throw("Invalid grammar rule name");
        expect(function () { return new InvalidRuleNameParser(); }).to.throw("שלום");
    });
    it("won't throw an errors when trying to init a parser with definition errors but with a flag active to defer handling" +
        "of definition errors (ruleName validation", function () {
        ;
        parser_traits_1.Parser.DEFER_DEFINITION_ERRORS_HANDLING = true;
        expect(function () { return new InvalidRuleNameParser(); }).to.not.throw();
        expect(function () { return new InvalidRuleNameParser(); }).to.not.throw();
        expect(function () { return new DuplicateRulesParser(); }).to.not.throw();
        expect(function () { return new DuplicateRulesParser(); }).to.not.throw();
        parser_traits_1.Parser.DEFER_DEFINITION_ERRORS_HANDLING = false;
    });
});
var StarToken = /** @class */ (function () {
    function StarToken() {
    }
    StarToken.PATTERN = /NA/;
    return StarToken;
}());
var DirectlyLeftRecursive = /** @class */ (function (_super) {
    __extends(DirectlyLeftRecursive, _super);
    function DirectlyLeftRecursive(input) {
        if (input === void 0) { input = []; }
        var _this = _super.call(this, [StarToken]) || this;
        _this.A = _this.RULE("A", function () {
            _this.SUBRULE1(_this.A);
        });
        _this.input = input;
        _this.performSelfAnalysis();
        return _this;
    }
    return DirectlyLeftRecursive;
}(parser_traits_1.Parser));
var InDirectlyLeftRecursive = /** @class */ (function (_super) {
    __extends(InDirectlyLeftRecursive, _super);
    function InDirectlyLeftRecursive(input) {
        if (input === void 0) { input = []; }
        var _this = _super.call(this, [StarToken]) || this;
        _this.A = _this.RULE("A", function () {
            _this.SUBRULE1(_this.B);
        });
        _this.B = _this.RULE("B", function () {
            _this.SUBRULE1(_this.A);
        });
        _this.input = input;
        _this.performSelfAnalysis();
        return _this;
    }
    return InDirectlyLeftRecursive;
}(parser_traits_1.Parser));
var ComplexInDirectlyLeftRecursive = /** @class */ (function (_super) {
    __extends(ComplexInDirectlyLeftRecursive, _super);
    function ComplexInDirectlyLeftRecursive(input) {
        if (input === void 0) { input = []; }
        var _this = _super.call(this, [StarToken]) || this;
        _this.A = _this.RULE("A", function () {
            _this.SUBRULE1(_this.B);
        });
        _this.B = _this.RULE("B", function () {
            _this.MANY(function () {
                _this.SUBRULE1(_this.A);
            });
            _this.CONSUME(StarToken);
        });
        _this.input = input;
        _this.performSelfAnalysis();
        return _this;
    }
    return ComplexInDirectlyLeftRecursive;
}(parser_traits_1.Parser));
describe("The left recursion detection full flow", function () {
    it("will throw an error when trying to init a parser with direct left recursion", function () {
        expect(function () { return new DirectlyLeftRecursive(); }).to.throw("Left Recursion found in grammar");
        expect(function () { return new DirectlyLeftRecursive(); }).to.throw("A --> A");
    });
    it("will throw an error when trying to init a parser with indirect left recursion", function () {
        expect(function () { return new InDirectlyLeftRecursive(); }).to.throw("Left Recursion found in grammar");
        expect(function () { return new InDirectlyLeftRecursive(); }).to.throw("A --> B --> A");
    });
    it("will throw an error when trying to init a parser with indirect left recursion", function () {
        expect(function () { return new ComplexInDirectlyLeftRecursive(); }).to.throw("Left Recursion found in grammar");
        expect(function () { return new ComplexInDirectlyLeftRecursive(); }).to.throw("A --> B --> A");
    });
});
describe("The empty alternative detection full flow", function () {
    it("will throw an error when an empty alternative is not the last alternative", function () {
        var EmptyAltAmbiguityParser = /** @class */ (function (_super) {
            __extends(EmptyAltAmbiguityParser, _super);
            function EmptyAltAmbiguityParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, [PlusTok, StarTok]) || this;
                _this.noneLastEmpty = _this.RULE("noneLastEmpty", function () {
                    _this.OR1([
                        {
                            ALT: function () {
                                _this.CONSUME1(PlusTok);
                            }
                        },
                        {
                            ALT: parser_1.EMPTY_ALT()
                        },
                        // empty alternative #3 which is not the last one!
                        { ALT: function () { } },
                        {
                            ALT: function () {
                                _this.CONSUME2(StarTok);
                            }
                        }
                    ]);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return EmptyAltAmbiguityParser;
        }(parser_traits_1.Parser));
        expect(function () { return new EmptyAltAmbiguityParser(); }).to.throw("Ambiguous empty alternative");
        expect(function () { return new EmptyAltAmbiguityParser(); }).to.throw("3");
        expect(function () { return new EmptyAltAmbiguityParser(); }).to.throw("2");
    });
    it("will throw an error when an empty alternative is not the last alternative - Indirect", function () {
        var EmptyAltIndirectAmbiguityParser = /** @class */ (function (_super) {
            __extends(EmptyAltIndirectAmbiguityParser, _super);
            function EmptyAltIndirectAmbiguityParser(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, [PlusTok, StarTok]) || this;
                _this.noneLastEmpty = _this.RULE("noneLastEmpty", function () {
                    _this.OR1([
                        {
                            ALT: function () {
                                _this.CONSUME1(PlusTok);
                            }
                        },
                        {
                            ALT: function () {
                                _this.SUBRULE(_this.emptyRule);
                            }
                        },
                        // empty alternative #3 which is not the last one!
                        { ALT: function () { } },
                        {
                            ALT: function () {
                                _this.CONSUME2(StarTok);
                            }
                        }
                    ]);
                });
                _this.emptyRule = _this.RULE("emptyRule", function () { });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return EmptyAltIndirectAmbiguityParser;
        }(parser_traits_1.Parser));
        expect(function () { return new EmptyAltIndirectAmbiguityParser(); }).to.throw("Ambiguous empty alternative");
        expect(function () { return new EmptyAltIndirectAmbiguityParser(); }).to.throw("3");
        expect(function () { return new EmptyAltIndirectAmbiguityParser(); }).to.throw("2");
    });
    it("will detect alternative ambiguity with identical lookaheads", function () {
        var AltAmbiguityParserImplicitOccurence = /** @class */ (function (_super) {
            __extends(AltAmbiguityParserImplicitOccurence, _super);
            function AltAmbiguityParserImplicitOccurence(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, [PlusTok, StarTok]) || this;
                _this.noneLastEmpty = _this.RULE("noneLastEmpty", function () {
                    _this.OR([
                        {
                            ALT: function () {
                                _this.CONSUME1(PlusTok);
                                _this.CONSUME1(StarTok);
                            }
                        },
                        {
                            ALT: function () {
                                _this.CONSUME2(PlusTok);
                                _this.CONSUME2(StarTok);
                            }
                        }
                    ]);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return AltAmbiguityParserImplicitOccurence;
        }(parser_traits_1.Parser));
        expect(function () { return new AltAmbiguityParserImplicitOccurence(); }).to.throw("Ambiguous alternative");
        expect(function () { return new AltAmbiguityParserImplicitOccurence(); }).to.throw("1");
        expect(function () { return new AltAmbiguityParserImplicitOccurence(); }).to.throw("2");
        expect(function () { return new AltAmbiguityParserImplicitOccurence(); }).to.throw("<PlusTok, StarTok> may appears as a prefix path");
    });
    it("will throw an error when an empty alternative is not the last alternative #2", function () {
        var EmptyAltAmbiguityParser2 = /** @class */ (function (_super) {
            __extends(EmptyAltAmbiguityParser2, _super);
            function EmptyAltAmbiguityParser2(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, [PlusTok, StarTok]) || this;
                _this.noneLastEmpty = _this.RULE("noneLastEmpty", function () {
                    _this.OR([
                        // using OR without occurrence suffix, test to check for fix for https://github.com/SAP/chevrotain/issues/101
                        {
                            ALT: parser_1.EMPTY_ALT()
                        },
                        {
                            ALT: function () {
                                _this.CONSUME1(PlusTok);
                            }
                        },
                        {
                            ALT: function () {
                                _this.CONSUME2(StarTok);
                            }
                        }
                    ]);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return EmptyAltAmbiguityParser2;
        }(parser_traits_1.Parser));
        expect(function () { return new EmptyAltAmbiguityParser2(); }).to.throw("Ambiguous empty alternative");
        expect(function () { return new EmptyAltAmbiguityParser2(); }).to.throw("1");
        expect(function () { return new EmptyAltAmbiguityParser2(); }).to.throw("Only the last alternative may be an empty alternative.");
        expect(function () { return new EmptyAltAmbiguityParser2(); }).to.not.throw("undefined");
    });
});
describe("The prefix ambiguity detection full flow", function () {
    it("will throw an error when an a common prefix ambiguity is detected", function () {
        var PrefixAltAmbiguity = /** @class */ (function (_super) {
            __extends(PrefixAltAmbiguity, _super);
            function PrefixAltAmbiguity(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, [PlusTok, MinusTok, StarTok]) || this;
                _this.prefixAltAmbiguity = _this.RULE("prefixAltAmbiguity", function () {
                    _this.OR3([
                        {
                            ALT: function () {
                                _this.CONSUME1(PlusTok);
                                _this.CONSUME1(MinusTok);
                            }
                        },
                        {
                            ALT: function () {
                                _this.CONSUME2(PlusTok);
                                _this.CONSUME2(MinusTok);
                                _this.CONSUME1(StarTok);
                            }
                        }
                    ]);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return PrefixAltAmbiguity;
        }(parser_traits_1.Parser));
        expect(function () { return new PrefixAltAmbiguity(); }).to.throw("OR3");
        expect(function () { return new PrefixAltAmbiguity(); }).to.throw("Ambiguous alternatives");
        expect(function () { return new PrefixAltAmbiguity(); }).to.throw("due to common lookahead prefix");
        expect(function () { return new PrefixAltAmbiguity(); }).to.throw("<PlusTok, MinusTok>");
        expect(function () { return new PrefixAltAmbiguity(); }).to.throw("https://sap.github.io/chevrotain/docs/guide/resolving_grammar_errors.html#COMMON_PREFIX");
    });
    it("will throw an error when an an alts ambiguity is detected", function () {
        var OneTok = tokens_public_1.createToken({ name: "OneTok" });
        var TwoTok = tokens_public_1.createToken({ name: "TwoTok" });
        var Comma = tokens_public_1.createToken({ name: "Comma" });
        var ALL_TOKENS = [OneTok, TwoTok, Comma];
        var AlternativesAmbiguityParser = /** @class */ (function (_super) {
            __extends(AlternativesAmbiguityParser, _super);
            function AlternativesAmbiguityParser() {
                var _this = _super.call(this, ALL_TOKENS) || this;
                _this.main = _this.RULE("main", function () {
                    _this.OR([
                        { ALT: function () { return _this.SUBRULE(_this.alt1); } },
                        { ALT: function () { return _this.SUBRULE(_this.alt2); } }
                    ]);
                });
                _this.alt1 = _this.RULE("alt1", function () {
                    _this.MANY(function () {
                        _this.CONSUME(Comma);
                    });
                    _this.CONSUME(OneTok);
                });
                _this.alt2 = _this.RULE("alt2", function () {
                    _this.MANY(function () {
                        _this.CONSUME(Comma);
                    });
                    _this.CONSUME(TwoTok);
                });
                _this.performSelfAnalysis();
                return _this;
            }
            return AlternativesAmbiguityParser;
        }(parser_traits_1.Parser));
        expect(function () { return new AlternativesAmbiguityParser(); }).to.throw("Ambiguous alternatives: <1 ,2>");
        expect(function () { return new AlternativesAmbiguityParser(); }).to.throw("in <OR> inside <main> Rule");
        expect(function () { return new AlternativesAmbiguityParser(); }).to.throw("Comma, Comma, Comma, Comma");
        expect(function () { return new AlternativesAmbiguityParser(); }).to.throw("interfaces/iparserconfig.html#ignoredissues for more details\n");
    });
    it("will throw an error when an a common prefix ambiguity is detected - implicit occurrence idx", function () {
        var PrefixAltAmbiguity2 = /** @class */ (function (_super) {
            __extends(PrefixAltAmbiguity2, _super);
            function PrefixAltAmbiguity2(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, [PlusTok, MinusTok, StarTok]) || this;
                _this.prefixAltAmbiguity = _this.RULE("prefixAltAmbiguity", function () {
                    _this.OR([
                        {
                            ALT: function () {
                                _this.CONSUME1(PlusTok);
                                _this.CONSUME1(MinusTok);
                            }
                        },
                        {
                            ALT: function () {
                                _this.CONSUME2(PlusTok);
                                _this.CONSUME2(MinusTok);
                                _this.CONSUME1(StarTok);
                            }
                        }
                    ]);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return PrefixAltAmbiguity2;
        }(parser_traits_1.Parser));
        expect(function () { return new PrefixAltAmbiguity2(); }).to.throw("OR");
        expect(function () { return new PrefixAltAmbiguity2(); }).to.throw("Ambiguous alternatives");
        expect(function () { return new PrefixAltAmbiguity2(); }).to.throw("due to common lookahead prefix");
        expect(function () { return new PrefixAltAmbiguity2(); }).to.throw("<PlusTok, MinusTok>");
        expect(function () { return new PrefixAltAmbiguity2(); }).to.throw("https://sap.github.io/chevrotain/docs/guide/resolving_grammar_errors.html#COMMON_PREFIX");
    });
});
describe("The namespace conflict detection full flow", function () {
    it("will throw an error when a Terminal and a NoneTerminal have the same name", function () {
        var Bamba = /** @class */ (function () {
            function Bamba() {
            }
            Bamba.PATTERN = /NA/;
            return Bamba;
        }());
        var A = /** @class */ (function () {
            function A() {
            }
            A.PATTERN = /NA/;
            return A;
        }());
        var NameSpaceConflict = /** @class */ (function (_super) {
            __extends(NameSpaceConflict, _super);
            function NameSpaceConflict(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, [Bamba, A]) || this;
                _this.Bamba = _this.RULE("Bamba", function () {
                    _this.CONSUME(A);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return NameSpaceConflict;
        }(parser_traits_1.Parser));
        expect(function () { return new NameSpaceConflict([]); }).to.throw("The grammar has both a Terminal(Token) and a Non-Terminal(Rule) named: <Bamba>");
    });
});
describe("The nested rule name validation full flow", function () {
    it("will throw an error when a nested name does not start with $(dollar)", function () {
        var A = /** @class */ (function () {
            function A() {
            }
            A.PATTERN = /NA/;
            return A;
        }());
        var NestedNamedInvalid = /** @class */ (function (_super) {
            __extends(NestedNamedInvalid, _super);
            function NestedNamedInvalid(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, [A]) || this;
                _this.someRule = _this.RULE("someRule", function () {
                    _this.OPTION({
                        NAME: "blah",
                        DEF: function () {
                            _this.CONSUME(A);
                        }
                    });
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return NestedNamedInvalid;
        }(parser_traits_1.Parser));
        expect(function () { return new NestedNamedInvalid([]); }).to.throw("Invalid nested rule name: ->blah<- inside rule: ->someRule<-");
    });
});
describe("The duplicated nested name validation full flow", function () {
    it("will throw an error when two nested rules share the same name", function () {
        var A = /** @class */ (function () {
            function A() {
            }
            A.PATTERN = /NA/;
            return A;
        }());
        var B = /** @class */ (function () {
            function B() {
            }
            B.PATTERN = /NA/;
            return B;
        }());
        var NestedNamedDuplicate = /** @class */ (function (_super) {
            __extends(NestedNamedDuplicate, _super);
            function NestedNamedDuplicate(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, [A, B]) || this;
                _this.someRule = _this.RULE("someRule", function () {
                    _this.OPTION({
                        NAME: "$blah",
                        DEF: function () {
                            _this.CONSUME(A);
                        }
                    });
                    _this.OPTION2({
                        NAME: "$blah",
                        DEF: function () {
                            _this.CONSUME(B);
                        }
                    });
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return NestedNamedDuplicate;
        }(parser_traits_1.Parser));
        expect(function () { return new NestedNamedDuplicate([]); }).to.throw("Duplicate nested rule name: ->$blah<- inside rule: ->someRule<-");
    });
});
describe("The invalid token name validation", function () {
    it("will throw an error when a Token is using an invalid name", function () {
        var במבה = /** @class */ (function () {
            function במבה() {
            }
            במבה.PATTERN = /NA/;
            return במבה;
        }());
        var A = /** @class */ (function () {
            function A() {
            }
            A.PATTERN = /NA/;
            return A;
        }());
        var InvalidTokenName = /** @class */ (function (_super) {
            __extends(InvalidTokenName, _super);
            function InvalidTokenName(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, [במבה, A]) || this;
                _this.someRule = _this.RULE("someRule", function () {
                    _this.CONSUME(A);
                });
                _this.input = input;
                _this.performSelfAnalysis();
                return _this;
            }
            return InvalidTokenName;
        }(parser_traits_1.Parser));
        expect(function () { return new InvalidTokenName([]); }).to.throw("Invalid Grammar Token name: ->במבה<- it must match the pattern: ->/^[a-zA-Z_]\\w*$/<-");
    });
});
describe("The no non-empty lookahead validation", function () {
    var EmptyLookaheadParser = /** @class */ (function (_super) {
        __extends(EmptyLookaheadParser, _super);
        function EmptyLookaheadParser(input) {
            if (input === void 0) { input = []; }
            var _this = _super.call(this, [PlusTok]) || this;
            _this.block = _this.RULE("block", function () { return _this.CONSUME(PlusTok); });
            _this.input = input;
            return _this;
        }
        return EmptyLookaheadParser;
    }(parser_traits_1.Parser));
    it("will throw an error when there are no non-empty lookaheads for AT_LEAST_ONE", function () {
        var EmptyLookaheadParserAtLeastOne = /** @class */ (function (_super) {
            __extends(EmptyLookaheadParserAtLeastOne, _super);
            function EmptyLookaheadParserAtLeastOne(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, input) || this;
                _this.someRule = _this.RULE("someRule", function () {
                    return _this.AT_LEAST_ONE(_this.block);
                });
                _this.performSelfAnalysis();
                return _this;
            }
            return EmptyLookaheadParserAtLeastOne;
        }(EmptyLookaheadParser));
        expect(function () { return new EmptyLookaheadParserAtLeastOne(); }).to.throw("The repetition <AT_LEAST_ONE>");
        expect(function () { return new EmptyLookaheadParserAtLeastOne(); }).to.throw("<someRule> can never consume any tokens");
    });
    it("will throw an error when there are no non-empty lookaheads for AT_LEAST_ONE_SEP", function () {
        var EmptyLookaheadParserAtLeastOneSep = /** @class */ (function (_super) {
            __extends(EmptyLookaheadParserAtLeastOneSep, _super);
            function EmptyLookaheadParserAtLeastOneSep(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, input) || this;
                _this.someRule = _this.RULE("someRule", function () {
                    return _this.AT_LEAST_ONE_SEP5({
                        SEP: PlusTok,
                        DEF: _this.block
                    });
                });
                _this.performSelfAnalysis();
                return _this;
            }
            return EmptyLookaheadParserAtLeastOneSep;
        }(EmptyLookaheadParser));
        expect(function () { return new EmptyLookaheadParserAtLeastOneSep(); }).to.throw("The repetition <AT_LEAST_ONE_SEP5>");
        expect(function () { return new EmptyLookaheadParserAtLeastOneSep(); }).to.throw("within Rule <someRule>");
    });
    it("will throw an error when there are no non-empty lookaheads for MANY", function () {
        var EmptyLookaheadParserMany = /** @class */ (function (_super) {
            __extends(EmptyLookaheadParserMany, _super);
            function EmptyLookaheadParserMany(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, input) || this;
                _this.someRule = _this.RULE("someRule", function () {
                    return _this.MANY2(_this.block);
                });
                _this.performSelfAnalysis();
                return _this;
            }
            return EmptyLookaheadParserMany;
        }(EmptyLookaheadParser));
        expect(function () { return new EmptyLookaheadParserMany(); }).to.throw("The repetition <MANY2>");
        expect(function () { return new EmptyLookaheadParserMany(); }).to.throw("<someRule> can never consume any tokens");
    });
    it("will throw an error when there are no non-empty lookaheads for MANY_SEP", function () {
        var EmptyLookaheadParserManySep = /** @class */ (function (_super) {
            __extends(EmptyLookaheadParserManySep, _super);
            function EmptyLookaheadParserManySep(input) {
                if (input === void 0) { input = []; }
                var _this = _super.call(this, input) || this;
                _this.someRule = _this.RULE("someRule", function () {
                    return _this.MANY_SEP3({
                        SEP: PlusTok,
                        DEF: _this.block
                    });
                });
                _this.performSelfAnalysis();
                return _this;
            }
            return EmptyLookaheadParserManySep;
        }(EmptyLookaheadParser));
        expect(function () { return new EmptyLookaheadParserManySep(); }).to.throw("The repetition <MANY_SEP3>");
        expect(function () { return new EmptyLookaheadParserManySep(); }).to.throw("within Rule <someRule>");
    });
    it("will throw an error when there are too many alternatives in an alternation", function () {
        var alternatives = [];
        for (var i = 0; i < 256; i++) {
            alternatives.push(new gast_public_1.Flat({
                definition: [
                    new gast_public_1.NonTerminal({
                        nonTerminalName: "dummyRule",
                        referencedRule: dummyRule
                    })
                ]
            }));
        }
        var ruleWithTooManyAlts = new gast_public_1.Rule({
            name: "blah",
            definition: [new gast_public_1.Alternation({ definition: alternatives })]
        });
        var actual = checks_1.validateTooManyAlts(ruleWithTooManyAlts, errors_public_1.defaultGrammarValidatorErrorProvider);
        expect(actual).to.have.lengthOf(1);
        expect(actual[0].type).to.equal(parser_1.ParserDefinitionErrorType.TOO_MANY_ALTS);
        expect(actual[0].ruleName).to.equal("blah");
        expect(actual[0].message).to.contain("An Alternation cannot have more than 256 alternatives");
    });
});
//# sourceMappingURL=checks_spec.js.map