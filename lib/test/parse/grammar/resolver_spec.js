"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lang_extensions_1 = require("../../../src/lang/lang_extensions");
var resolver_1 = require("../../../src/parse/grammar/resolver");
var parser_1 = require("../../../src/parse/parser/parser");
var gast_public_1 = require("../../../src/parse/grammar/gast/gast_public");
var errors_public_1 = require("../../../src/parse/errors_public");
var gast_resolver_public_1 = require("../../../src/parse/grammar/gast/gast_resolver_public");
var tokens_public_1 = require("../../../src/scan/tokens_public");
var gast_1 = require("../../../src/parse/grammar/gast/gast");
var utils_1 = require("../../../src/utils/utils");
describe("The RefResolverVisitor", function () {
    it("will fail when trying to resolve a ref to a grammar rule that does not exist", function () {
        var ref = new gast_public_1.NonTerminal({ nonTerminalName: "missingRule" });
        var topLevel = new gast_public_1.Rule({ name: "TOP", definition: [ref] });
        var topLevelRules = new lang_extensions_1.HashTable();
        topLevelRules.put("TOP", topLevel);
        var resolver = new resolver_1.GastRefResolverVisitor(topLevelRules, errors_public_1.defaultGrammarResolverErrorProvider);
        resolver.resolveRefs();
        expect(resolver.errors).to.have.lengthOf(1);
        expect(resolver.errors[0].message).to.contain("Invalid grammar, reference to a rule which is not defined: ->missingRule<-");
        expect(resolver.errors[0].message).to.contain("inside top level rule: ->TOP<-");
        expect(resolver.errors[0].type).to.equal(parser_1.ParserDefinitionErrorType.UNRESOLVED_SUBRULE_REF);
        expect(resolver.errors[0].ruleName).to.equal("TOP");
    });
});
describe("The assignOccurrenceIndices utility", function () {
    it("will correctly add indices for DSL methods", function () {
        var A = tokens_public_1.createToken({ name: "A" });
        var B = tokens_public_1.createToken({ name: "B" });
        var rule = new gast_public_1.Rule({
            name: "rule",
            definition: [
                new gast_public_1.Terminal({ terminalType: A }),
                new gast_public_1.NonTerminal({
                    nonTerminalName: "otherRule"
                }),
                new gast_public_1.Option({
                    definition: [new gast_public_1.Terminal({ terminalType: B })]
                }),
                new gast_public_1.Alternation({
                    definition: [
                        new gast_public_1.Flat({
                            definition: [new gast_public_1.Terminal({ terminalType: B })]
                        })
                    ]
                }),
                new gast_public_1.Repetition({
                    definition: [new gast_public_1.Terminal({ terminalType: B })]
                }),
                new gast_public_1.RepetitionMandatory({
                    definition: [new gast_public_1.Terminal({ terminalType: B })]
                }),
                new gast_public_1.RepetitionWithSeparator({
                    definition: [new gast_public_1.Terminal({ terminalType: B })],
                    separator: A
                }),
                new gast_public_1.RepetitionMandatoryWithSeparator({
                    definition: [
                        new gast_public_1.NonTerminal({
                            nonTerminalName: "otherRule"
                        })
                    ],
                    separator: A
                }),
                new gast_public_1.Option({
                    definition: [new gast_public_1.Terminal({ terminalType: B })]
                }),
                new gast_public_1.Alternation({
                    definition: [
                        new gast_public_1.Flat({
                            definition: [new gast_public_1.Terminal({ terminalType: B })]
                        })
                    ]
                }),
                new gast_public_1.Repetition({
                    definition: [new gast_public_1.Terminal({ terminalType: B })]
                }),
                new gast_public_1.RepetitionMandatory({
                    definition: [new gast_public_1.Terminal({ terminalType: B })]
                }),
                new gast_public_1.RepetitionWithSeparator({
                    definition: [new gast_public_1.Terminal({ terminalType: B })],
                    separator: A
                }),
                new gast_public_1.RepetitionMandatoryWithSeparator({
                    definition: [
                        new gast_public_1.NonTerminal({
                            nonTerminalName: "otherRule"
                        })
                    ],
                    separator: A
                })
            ]
        });
        gast_resolver_public_1.assignOccurrenceIndices({ rules: [rule] });
        var methodsCollector = new gast_1.DslMethodsCollectorVisitor();
        rule.accept(methodsCollector);
        utils_1.forEach(methodsCollector.dslMethods, function (currMethodArr) {
            var indices = utils_1.map(currMethodArr, function (currMethod) { return currMethod.idx; });
            expect(indices.length).to.equal(utils_1.uniq(indices).length);
        });
    });
});
//# sourceMappingURL=resolver_spec.js.map