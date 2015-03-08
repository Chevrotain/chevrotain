/// <reference path="grammar/Samples.ts" />
/// <reference path="../../src/text/Range.ts" />
/// <reference path="../../src/parse/GAstBuilder.ts" />
/// <reference path="../utils/Matchers.ts" />
/// <reference path="../../libs/lodash.d.ts" />
/// <reference path="../../libs/jasmine.d.ts" />

module chevrotain.parse.grammar.gast.builder.spec {

    import pt = chevrotain.parse.tree
    import tok = chevrotain.scan.tokens

    describe("The ParseTree module", function () {

        it("exposes a constructor and three getters accessing the internal token", function () {
            var ptInstance = new pt.ParseTree(new tok.VirtualToken())
            expect(ptInstance.getImage()).toBe("")
            expect(ptInstance.getColumn()).toBe(-1)
            expect(ptInstance.getLine()).toBe(-1)
        })
    })

}
