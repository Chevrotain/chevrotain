namespace chevrotain.examples.backtracking.spec {

    describe("Simple backtracking example", function () {

        // TODO: modify example to use the Chevrotain Lexer to increase readability
        let largeFqnTokenVector = [
            new IdentTok("ns1", 0, 1, 1), new DotTok(".", 0, 1, 1), new IdentTok("ns2", 0, 1, 1), new DotTok(".", 0, 1, 1),
            new IdentTok("ns3", 0, 1, 1), new DotTok(".", 0, 1, 1), new IdentTok("ns4", 0, 1, 1), new DotTok(".", 0, 1, 1),
            new IdentTok("ns5", 0, 1, 1), new DotTok(".", 0, 1, 1), new IdentTok("ns6", 0, 1, 1), new DotTok(".", 0, 1, 1),
            new IdentTok("ns7", 0, 1, 1), new DotTok(".", 0, 1, 1), new IdentTok("ns8", 0, 1, 1), new DotTok(".", 0, 1, 1),
            new IdentTok("ns9", 0, 1, 1), new DotTok(".", 0, 1, 1), new IdentTok("ns10", 0, 1, 1), new DotTok(".", 0, 1, 1),
            new IdentTok("ns11", 0, 1, 1), new DotTok(".", 0, 1, 1), new IdentTok("ns12", 0, 1, 1)


        ]
        // element A:ns1.ns2.ns3.ns4.ns5.ns6.ns7.ns8.ns9.ns10.ns11.ns12 default 666;
        // new ElementTok(1, 1), new IdentTok("A" , 0, 1, 1), new ColonTok(1,1),
        // largeFqnTokenVector,new DefaultTok(1,1), new NumberTok(1,1,"666"), new SemiColonTok(";", 0, 1, 1)

        it("can parse an element with Equals and a very long qualified name", function () {
            let input:any = _.flatten([
                // element A:ns1.ns2.ns3.ns4.ns5.ns6.ns7.ns8.ns9.ns10.ns11.ns12 = 666;
                new ElementTok("element", 0, 1, 1), new IdentTok("A", 0, 1, 1), new ColonTok(":", 0, 1, 1),
                largeFqnTokenVector, new EqualsTok("=", 0, 1, 1), new NumberTok("666", 0, 1, 1), new SemiColonTok(";", 0, 1, 1),
            ])

            let parser = new BackTrackingParser(input)
            let result = parser.statement()

            expect(parser.errors.length).to.equal(0)
            expect(parser.isAtEndOfInput()).to.equal(true)
            expect(result).to.equal(RET_TYPE.WITH_EQUALS)
        })

        it("can parse an element with Default and a very long qualified name", function () {
            let input:any = _.flatten([
                // element A:ns1.ns2.ns3.ns4.ns5.ns6.ns7.ns8.ns9.ns10.ns11.ns12 default 666;
                new ElementTok("element", 0, 1, 1), new IdentTok("A", 0, 1, 1), new ColonTok(":", 0, 1, 1), largeFqnTokenVector,
                new DefaultTok("deafult", 0, 1, 1), new NumberTok("666", 0, 1, 1), new SemiColonTok(";", 0, 1, 1),
            ])

            let parser = new BackTrackingParser(input)
            let result = parser.statement()

            expect(parser.errors.length).to.equal(0)
            expect(parser.isAtEndOfInput()).to.equal(true)
            expect(result).to.equal(RET_TYPE.WITH_DEFAULT)
        })


    })

}
