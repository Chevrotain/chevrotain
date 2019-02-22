"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var backtracking_parser_1 = require("./backtracking_parser");
var utils_1 = require("../../../src/utils/utils");
var matchers_1 = require("../../utils/matchers");
describe("Simple backtracking example", function () {
    // for side effect of augmenting the tokens metadata
    new backtracking_parser_1.BackTrackingParser();
    // TODO: modify example to use the Chevrotain Lexer to increase readability
    var largeFqnTokenVector = [
        matchers_1.createRegularToken(backtracking_parser_1.IdentTok, "ns1"),
        matchers_1.createRegularToken(backtracking_parser_1.DotTok, "."),
        matchers_1.createRegularToken(backtracking_parser_1.IdentTok, "ns2"),
        matchers_1.createRegularToken(backtracking_parser_1.DotTok, "."),
        matchers_1.createRegularToken(backtracking_parser_1.IdentTok, "ns3"),
        matchers_1.createRegularToken(backtracking_parser_1.DotTok, "."),
        matchers_1.createRegularToken(backtracking_parser_1.IdentTok, "ns4"),
        matchers_1.createRegularToken(backtracking_parser_1.DotTok, "."),
        matchers_1.createRegularToken(backtracking_parser_1.IdentTok, "ns5"),
        matchers_1.createRegularToken(backtracking_parser_1.DotTok, "."),
        matchers_1.createRegularToken(backtracking_parser_1.IdentTok, "ns6"),
        matchers_1.createRegularToken(backtracking_parser_1.DotTok, "."),
        matchers_1.createRegularToken(backtracking_parser_1.IdentTok, "ns7"),
        matchers_1.createRegularToken(backtracking_parser_1.DotTok, "."),
        matchers_1.createRegularToken(backtracking_parser_1.IdentTok, "ns8"),
        matchers_1.createRegularToken(backtracking_parser_1.DotTok, "."),
        matchers_1.createRegularToken(backtracking_parser_1.IdentTok, "ns9"),
        matchers_1.createRegularToken(backtracking_parser_1.DotTok, "."),
        matchers_1.createRegularToken(backtracking_parser_1.IdentTok, "ns10"),
        matchers_1.createRegularToken(backtracking_parser_1.DotTok, "."),
        matchers_1.createRegularToken(backtracking_parser_1.IdentTok, "ns11"),
        matchers_1.createRegularToken(backtracking_parser_1.DotTok, "."),
        matchers_1.createRegularToken(backtracking_parser_1.IdentTok, "ns12")
    ];
    // element A:ns1.ns2.ns3.ns4.ns5.ns6.ns7.ns8.ns9.ns10.ns11.ns12 default 666;
    // new ElementTok(1, 1), new IdentTok("A" , 0, 1, 1), new ColonTok(1,1),
    // largeFqnTokenVector,new DefaultTok(1,1), new NumberTok(1,1,"666"), createRegularToken(SemiColonTok, ";")
    it("can parse an element with Equals and a very long qualified name", function () {
        var input = utils_1.flatten([
            // element A:ns1.ns2.ns3.ns4.ns5.ns6.ns7.ns8.ns9.ns10.ns11.ns12 = 666;
            matchers_1.createRegularToken(backtracking_parser_1.ElementTok, "element"),
            matchers_1.createRegularToken(backtracking_parser_1.IdentTok, "A"),
            matchers_1.createRegularToken(backtracking_parser_1.ColonTok, ":"),
            largeFqnTokenVector,
            matchers_1.createRegularToken(backtracking_parser_1.EqualsTok, "="),
            matchers_1.createRegularToken(backtracking_parser_1.NumberTok, "666"),
            matchers_1.createRegularToken(backtracking_parser_1.SemiColonTok, ";")
        ]);
        var parser = new backtracking_parser_1.BackTrackingParser();
        parser.input = input;
        var result = parser.statement();
        expect(parser.errors.length).to.equal(0);
        expect(result).to.equal(backtracking_parser_1.RET_TYPE.WITH_EQUALS);
    });
    it("can parse an element with Default and a very long qualified name", function () {
        var input = utils_1.flatten([
            // element A:ns1.ns2.ns3.ns4.ns5.ns6.ns7.ns8.ns9.ns10.ns11.ns12 default 666;
            matchers_1.createRegularToken(backtracking_parser_1.ElementTok, "element"),
            matchers_1.createRegularToken(backtracking_parser_1.IdentTok, "A"),
            matchers_1.createRegularToken(backtracking_parser_1.ColonTok, ":"),
            largeFqnTokenVector,
            matchers_1.createRegularToken(backtracking_parser_1.DefaultTok, "deafult"),
            matchers_1.createRegularToken(backtracking_parser_1.NumberTok, "666"),
            matchers_1.createRegularToken(backtracking_parser_1.SemiColonTok, ";")
        ]);
        var parser = new backtracking_parser_1.BackTrackingParser();
        parser.input = input;
        var result = parser.statement();
        expect(parser.errors.length).to.equal(0);
        expect(result).to.equal(backtracking_parser_1.RET_TYPE.WITH_DEFAULT);
    });
});
//# sourceMappingURL=backtracking_parser_spec.js.map