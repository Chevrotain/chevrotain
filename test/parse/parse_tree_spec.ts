/// <reference path="grammar/samples.ts" />
/// <reference path="../../src/text/range.ts" />
/// <reference path="../../src/parse/gast_builder.ts" />
/// <reference path="../utils/matchers.ts" />
/// <reference path="../../libs/lodash.d.ts" />
/// <reference path="../../libs/jasmine.d.ts" />

module chevrotain.gastBuilder.spec {

    import pt = chevrotain.tree
    import tok = chevrotain.tokens

    describe("The ParseTree module", function () {

        it("exposes a constructor and three getters accessing the internal token", function () {
            var ptInstance = new pt.ParseTree(new tok.VirtualToken())
            expect(ptInstance.getImage()).toBe("")
            expect(ptInstance.getColumn()).toBe(-1)
            expect(ptInstance.getLine()).toBe(-1)
        })
    })

}
