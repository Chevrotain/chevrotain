"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var samples_1 = require("./samples");
var follow_1 = require("../../../src/parse/grammar/follow");
var matchers_1 = require("../../utils/matchers");
var gast_public_1 = require("../../../src/parse/grammar/gast/gast_public");
describe("The Grammar Ast Follows model", function () {
    it("can build a followNamePrefix from a Terminal", function () {
        var terminal = new gast_public_1.Terminal({ terminalType: samples_1.IdentTok });
        var actual = follow_1.buildInProdFollowPrefix(terminal);
        expect(actual).to.equal("IdentTok1_~IN~_");
        var terminal2 = new gast_public_1.Terminal({ terminalType: samples_1.EntityTok });
        terminal2.idx = 3;
        var actual2 = follow_1.buildInProdFollowPrefix(terminal2);
        expect(actual2).to.equal("EntityTok3_~IN~_");
    });
    it("can build a followName prefix from a TopLevel Production and index", function () {
        var prod = new gast_public_1.Rule({ name: "bamba", definition: [] });
        var index = 5;
        var actual = follow_1.buildBetweenProdsFollowPrefix(prod, index);
        expect(actual).to.equal("bamba5_~IN~_");
    });
    it("can compute the follows for Top level production ref in ActionDec", function () {
        var actual = new follow_1.ResyncFollowsWalker(samples_1.actionDec).startWalking();
        var actualFollowNames = actual.keys();
        expect(actualFollowNames.length).to.equal(3);
        expect(actual.get("paramSpec1_~IN~_actionDec").length).to.equal(2);
        matchers_1.setEquality(actual.get("paramSpec1_~IN~_actionDec"), [
            samples_1.CommaTok,
            samples_1.RParenTok
        ]);
        expect(actual.get("paramSpec2_~IN~_actionDec").length).to.equal(2);
        matchers_1.setEquality(actual.get("paramSpec1_~IN~_actionDec"), [
            samples_1.CommaTok,
            samples_1.RParenTok
        ]);
        expect(actual.get("qualifiedName1_~IN~_actionDec").length).to.equal(1);
        matchers_1.setEquality(actual.get("qualifiedName1_~IN~_actionDec"), [samples_1.SemicolonTok]);
    });
    it("can compute all follows for a set of top level productions", function () {
        var actual = follow_1.computeAllProdsFollows([samples_1.actionDec]);
        expect(actual.keys().length).to.equal(3);
    });
});
//# sourceMappingURL=follow_spec.js.map