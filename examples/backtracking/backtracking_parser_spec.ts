/// <reference path="backtracking_parser.ts" />
/// <reference path="../../src/scan/tokens.ts" />
/// <reference path="../../libs/jasmine.d.ts" />


module chevrotain.examples.backtracking.spec {

    describe("Simple backtracking example", function () {

        var largeFqnTokenVector = [new IdentTok(1, 1, "ns1"), new DotTok(1, 1), new IdentTok(1, 1, "ns2"), new DotTok(1, 1),
            new IdentTok(1, 1, "ns3"), new DotTok(1, 1), new IdentTok(1, 1, "ns4"), new DotTok(1, 1),
            new IdentTok(1, 1, "ns5"), new DotTok(1, 1), new IdentTok(1, 1, "ns6"), new DotTok(1, 1),
            new IdentTok(1, 1, "ns7"), new DotTok(1, 1), new IdentTok(1, 1, "ns8"), new DotTok(1, 1),
            new IdentTok(1, 1, "ns9"), new DotTok(1, 1), new IdentTok(1, 1, "ns10"), new DotTok(1, 1),
            new IdentTok(1, 1, "ns11"), new DotTok(1, 1), new IdentTok(1, 1, "ns12")


        ]
        // element A:ns1.ns2.ns3.ns4.ns5.ns6.ns7.ns8.ns9.ns10.ns11.ns12 default 666;
        // new ElementTok(1, 1), new IdentTok(1, 1, "A"), new ColonTok(1,1),
        // largeFqnTokenVector,new DefaultTok(1,1), new NumberTok(1,1,"666"), new SemiColonTok(1, 1)

        it("can parse an element with Equals and a very long qualified name", function () {
            var input:any = _.flatten([
                // element A:ns1.ns2.ns3.ns4.ns5.ns6.ns7.ns8.ns9.ns10.ns11.ns12 = 666;
                new ElementTok(1, 1), new IdentTok(1, 1, "A"), new ColonTok(1, 1), largeFqnTokenVector, new EqualsTok(1, 1),
                new NumberTok(1, 1, "666"), new SemiColonTok(1, 1),
            ])

            var parser = new BackTrackingParser(input)
            var result = parser.statement(1)

            expect(parser.errors.length).toBe(0)
            expect(parser.isAtEndOfInput()).toBe(true)
            expect(result).toBe(RET_TYPE.WITH_EQUALS)
        })

        it("can parse an element with Default and a very long qualified name", function () {
            var input:any = _.flatten([
                // element A:ns1.ns2.ns3.ns4.ns5.ns6.ns7.ns8.ns9.ns10.ns11.ns12 default 666;
                new ElementTok(1, 1), new IdentTok(1, 1, "A"), new ColonTok(1, 1), largeFqnTokenVector, new DefaultTok(1, 1),
                new NumberTok(1, 1, "666"), new SemiColonTok(1, 1),
            ])

            var parser = new BackTrackingParser(input)
            var result = parser.statement(1)

            expect(parser.errors.length).toBe(0)
            expect(parser.isAtEndOfInput()).toBe(true)
            expect(result).toBe(RET_TYPE.WITH_DEFAULT)
        })


    })

}
