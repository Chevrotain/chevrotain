"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var first_1 = require("../../../src/parse/grammar/first");
var samples_1 = require("./samples");
var matchers_1 = require("../../utils/matchers");
var gast_public_1 = require("../../../src/parse/grammar/gast/gast_public");
describe("The Grammar Ast first model", function () {
    it("can compute the first for a terminal", function () {
        var terminal = new gast_public_1.Terminal({ terminalType: samples_1.EntityTok });
        var actual = first_1.first(terminal);
        expect(actual.length).to.equal(1);
        expect(actual[0]).to.equal(samples_1.EntityTok);
        var terminal2 = new gast_public_1.Terminal({ terminalType: samples_1.CommaTok });
        var actual2 = first_1.first(terminal2);
        expect(actual2.length).to.equal(1);
        expect(actual2[0]).to.equal(samples_1.CommaTok);
    });
    it("can compute the first for a Sequence production ", function () {
        var seqProduction = new gast_public_1.Flat({
            definition: [new gast_public_1.Terminal({ terminalType: samples_1.EntityTok })]
        });
        var actual = first_1.first(seqProduction);
        expect(actual.length).to.equal(1);
        expect(actual[0]).to.equal(samples_1.EntityTok);
        var seqProduction2 = new gast_public_1.Flat({
            definition: [
                new gast_public_1.Terminal({ terminalType: samples_1.EntityTok }),
                new gast_public_1.Option({
                    definition: [new gast_public_1.Terminal({ terminalType: samples_1.NamespaceTok })]
                })
            ]
        });
        var actual2 = first_1.first(seqProduction2);
        expect(actual2.length).to.equal(1);
        expect(actual2[0]).to.equal(samples_1.EntityTok);
    });
    it("can compute the first for an alternatives production ", function () {
        var altProduction = new gast_public_1.Alternation({
            definition: [
                new gast_public_1.Flat({
                    definition: [new gast_public_1.Terminal({ terminalType: samples_1.EntityTok })]
                }),
                new gast_public_1.Flat({
                    definition: [new gast_public_1.Terminal({ terminalType: samples_1.NamespaceTok })]
                }),
                new gast_public_1.Flat({
                    definition: [new gast_public_1.Terminal({ terminalType: samples_1.TypeTok })]
                })
            ]
        });
        var actual = first_1.first(altProduction);
        expect(actual.length).to.equal(3);
        expect(actual[0]).to.equal(samples_1.EntityTok);
        expect(actual[1]).to.equal(samples_1.NamespaceTok);
        expect(actual[2]).to.equal(samples_1.TypeTok);
    });
    it("can compute the first for an production with optional prefix", function () {
        var withOptionalPrefix = new gast_public_1.Flat({
            definition: [
                new gast_public_1.Option({
                    definition: [new gast_public_1.Terminal({ terminalType: samples_1.NamespaceTok })]
                }),
                new gast_public_1.Terminal({ terminalType: samples_1.EntityTok })
            ]
        });
        var actual = first_1.first(withOptionalPrefix);
        matchers_1.setEquality(actual, [samples_1.NamespaceTok, samples_1.EntityTok]);
        var withTwoOptPrefix = new gast_public_1.Flat({
            definition: [
                new gast_public_1.Option({
                    definition: [new gast_public_1.Terminal({ terminalType: samples_1.NamespaceTok })]
                }),
                new gast_public_1.Option({
                    definition: [new gast_public_1.Terminal({ terminalType: samples_1.ColonTok })]
                }),
                new gast_public_1.Terminal({ terminalType: samples_1.EntityTok }),
                new gast_public_1.Option({
                    definition: [new gast_public_1.Terminal({ terminalType: samples_1.ConstTok })]
                })
            ]
        });
        var actual2 = first_1.first(withTwoOptPrefix);
        matchers_1.setEquality(actual2, [samples_1.NamespaceTok, samples_1.ColonTok, samples_1.EntityTok]);
    });
});
//# sourceMappingURL=first_spec.js.map