// the ecmaQuirks parser uses /y regExp flag
if (typeof new RegExp("(?:)").sticky === "boolean") {
    var parse_1 = require("./ecma_quirks").parse;
    describe("ECMAScript Quirks Example (ScannerLess Mode)", function () {
        it("can parse a valid text successfully", function () {
            var result = parse_1("return ;");
            expect(result.errors).to.be.empty;
        });
        it("can parse a valid text successfully #2", function () {
            var result = parse_1("return 1;");
            expect(result.errors).to.be.empty;
        });
        it("can parse a valid text successfully #3 - Division", function () {
            var result = parse_1("return 8 / 2 ;");
            expect(result.errors).to.be.empty;
        });
        it("can parse a valid text successfully #3 - RegExp", function () {
            var result = parse_1("return /123/ ;");
            expect(result.errors).to.be.empty;
        });
        it("can parse a valid text successfully #3 - RegExp and Division", function () {
            var result = parse_1("return /123/ / 5 ;");
            expect(result.errors).to.be.empty;
        });
    });
}
//# sourceMappingURL=ecma_quirks_spec.js.map