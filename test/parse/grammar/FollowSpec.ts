/// <reference path="Samples.ts" />
/// <reference path="../../../src/parse/grammar/Follow.ts" />
/// <reference path="../../../src/scan/Tokens.ts" />
/// <reference path="../../../src/parse/grammar/GAst.ts" />
/// <reference path="../../utils/Matchers.ts" />
/// <reference path="../../../libs/lodash.d.ts" />
/// <reference path="../../../libs/jasmine.d.ts" />


module chevrotain.parse.grammar.follow.spec {

    import t = test.parser.grammar.samples;
    import gast = chevrotain.parse.grammar.gast;
    import samples = test.parser.grammar.samples;
    import matchers = test.matchers;

    describe("The Grammar Ast Follows model", function () {
        "use strict";

        it("can build a followNamePrefix from a Terminal", function () {
            var terminal = new gast.Terminal(t.IdentTok);
            var actual = buildInProdFollowPrefix(terminal);
            expect(actual).toBe("Ident1_IN_");

            var terminal2 = new gast.Terminal(t.EntityTok);
            terminal2.occurrenceInParent = 3;
            var actual2 = buildInProdFollowPrefix(terminal2);
            expect(actual2).toBe("Entity3_IN_");
        });

        it("can build a followName prefix from a TopLevel Production and index", function () {
            var prod = new gast.TOP_LEVEL("bamba", []);
            var index = 5;

            var actual = buildBetweenProdsFollowPrefix(prod, index);
            expect(actual).toBe("bamba5_IN_");
        });

        it("can compute the follows for terminals IN qualifiedName Production", function () {
            var actual:any = new InRuleFollowsWalker(samples.qualifiedName).startWalking();
            var actualPairs = actual.entries();
            expect(actualPairs.length).toBe(3);
            expect(actual.get('Ident1_IN_qualifiedName').length).toBe(1);
            expect(actual.get('Ident1_IN_qualifiedName')[0]).toBe(t.DotTok);
            expect(actual.get('Ident2_IN_qualifiedName').length).toBe(1);
            expect(actual.get('Ident2_IN_qualifiedName')[0]).toBe(t.DotTok);
            expect(actual.get('Dot1_IN_qualifiedName').length).toBe(1);
            expect(actual.get('Dot1_IN_qualifiedName')[0]).toBe(t.IdentTok);
        });

        it("can compute the follows for terminals IN Cardinality Production", function () {
            var actual:any = new InRuleFollowsWalker(samples.cardinality).startWalking();
            var actualPairs = actual.entries();
            expect(actualPairs.length).toBe(6);
            expect(actual.get('LSquare1_IN_cardinality').length).toBe(1);
            expect(actual.get('LSquare1_IN_cardinality')[0]).toBe(t.UnsignedIntegerLiteralTok);
            expect(actual.get('UnsignedIntegerLiteral1_IN_cardinality').length).toBe(1);
            expect(actual.get('UnsignedIntegerLiteral1_IN_cardinality')[0]).toBe(t.DotDotTok);
            expect(actual.get('DotDot1_IN_cardinality').length).toBe(2);
            matchers.arrayEqualityNoOrder(actual.get('DotDot1_IN_cardinality'), [t.UnsignedIntegerLiteralTok, t.AsteriskTok]);
            expect(actual.get('UnsignedIntegerLiteral2_IN_cardinality').length).toBe(1);
            expect(actual.get('UnsignedIntegerLiteral2_IN_cardinality')[0]).toBe(t.RSquareTok);
            expect(actual.get('Asterisk1_IN_cardinality').length).toBe(1);
            expect(actual.get('Asterisk1_IN_cardinality')[0]).toBe(t.RSquareTok);
            expect(actual.get('RSquare1_IN_cardinality').length).toBe(0);
        });

        it("can compute the follows for terminals IN AbsActionDeclaration Production", function () {
            var actual:any = new InRuleFollowsWalker(samples.actionDec).startWalking();
            var actualPairs = actual.entries();
            expect(actualPairs.length).toBe(7);

            expect(actual.get('Action1_IN_actionDec').length).toBe(1);
            expect(actual.get('Action1_IN_actionDec')[0]).toBe(t.IdentTok);
            expect(actual.get('Ident1_IN_actionDec').length).toBe(1);
            expect(actual.get('Ident1_IN_actionDec')[0]).toBe(t.LParenTok);
            expect(actual.get('LParen1_IN_actionDec').length).toBe(1);
            expect(actual.get('LParen1_IN_actionDec')[0]).toBe(t.RParenTok);
            expect(actual.get('Comma1_IN_actionDec').length).toBe(0);
            expect(actual.get('RParen1_IN_actionDec').length).toBe(2);
            matchers.arrayEqualityNoOrder(actual.get('RParen1_IN_actionDec'), [t.ColonTok, t.SemicolonTok]);
            expect(actual.get('Colon1_IN_actionDec').length).toBe(0);
            expect(actual.get('Semicolon1_IN_actionDec').length).toBe(0);
        });

        it("can compute the follows for Top level production ref in ActionDec", function () {
            var actual:any = new ResyncFollowsWalker(samples.actionDec).startWalking();
            var actualPairs = actual.entries();
            expect(actualPairs.length).toBe(3);
            expect(actual.get('ParamSpec1_IN_actionDec').length).toBe(2);
            matchers.arrayEqualityNoOrder(actual.get('ParamSpec1_IN_actionDec'), [t.CommaTok, t.RParenTok]);
            expect(actual.get('ParamSpec2_IN_actionDec').length).toBe(2);
            matchers.arrayEqualityNoOrder(actual.get('ParamSpec1_IN_actionDec'), [t.CommaTok, t.RParenTok]);
            expect(actual.get('qualifiedName1_IN_actionDec').length).toBe(1);
            matchers.arrayEqualityNoOrder(actual.get('qualifiedName1_IN_actionDec'), [t.SemicolonTok]);
        });

        it("can compute all follows for a set of top level productions", function () {
            var actual = computeAllProdsFollows([samples.actionDec]);
            var actualPairs = _.union(actual.inRuleFollows.entries(), actual.reSyncFollows.entries());
            expect(actualPairs.length).toBe(10);
        });


    });

}
