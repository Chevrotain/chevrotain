var fs = require("fs")
var path = require("path")
var expect = require("chai").expect
var lexers = require("./token_types")

var pkgPath = path.join(__dirname, "../..//../package.json")
var jsonSample = fs.readFileSync(pkgPath, "utf8")

var chevrotain = require("chevrotain")
var getImage = chevrotain.getImage
var getStartOffset = chevrotain.getStartOffset
var getEndOffset = chevrotain.getEndOffset
var getStartLine = chevrotain.getStartLine
var getEndLine = chevrotain.getEndLine
var getStartColumn = chevrotain.getStartColumn
var getEndColumn = chevrotain.getEndColumn


var lazyLexer = lexers.lazyLexer
var regularLexer = lexers.regularLexer
var simpleLazyLexer = lexers.simpleLazyLexer

describe("The Chevrotain Lexer support for Multiple kinds of Tokens", function() {

    it("Will produce identical output with all Lexers for all types of Tokens", function() {
        var lazyResult = lazyLexer.tokenize(jsonSample)
        var regularResult = regularLexer.tokenize(jsonSample)
        var simpleLazyResult = simpleLazyLexer.tokenize(jsonSample)

        expect(lazyResult.groups).to.deep.equal(regularResult.groups)
        expect(lazyResult.errors).to.deep.equal(regularResult.errors)
        expect(simpleLazyResult.groups).to.deep.equal(regularResult.groups)
        expect(simpleLazyResult.errors).to.deep.equal(regularResult.errors)

        expect(lazyResult.tokens).to.have.lengthOf(regularResult.tokens.length)
        expect(simpleLazyResult.tokens).to.have.lengthOf(regularResult.tokens.length)

        for (var i = 0; i < lazyResult.tokens.length; i++) {
            var currLazyTok = lazyResult.tokens[i]
            var currRegularTok = regularResult.tokens[i]
            var currSimpleLazyTok = simpleLazyResult.tokens[i]

            expect(getImage(currLazyTok)).to.equal(getImage(currRegularTok))
            expect(getStartLine(currLazyTok)).to.equal(getStartLine(currRegularTok))
            expect(getEndLine(currLazyTok)).to.equal(getEndLine(currRegularTok))
            expect(getStartColumn(currLazyTok)).to.equal(getStartColumn(currRegularTok))
            expect(getEndColumn(currLazyTok)).to.equal(getEndColumn(currRegularTok))
            expect(getStartOffset(currLazyTok)).to.equal(getStartOffset(currRegularTok))
            expect(getEndOffset(currLazyTok)).to.equal(getEndOffset(currRegularTok))

            expect(getImage(currSimpleLazyTok)).to.equal(getImage(currRegularTok))
            expect(getStartLine(currSimpleLazyTok)).to.equal(getStartLine(currRegularTok))
            expect(getEndLine(currSimpleLazyTok)).to.equal(getEndLine(currRegularTok))
            expect(getStartColumn(currSimpleLazyTok)).to.equal(getStartColumn(currRegularTok))
            expect(getEndColumn(currSimpleLazyTok)).to.equal(getEndColumn(currRegularTok))
            expect(getStartOffset(currSimpleLazyTok)).to.equal(getStartOffset(currRegularTok))
            expect(getEndOffset(currSimpleLazyTok)).to.equal(getEndOffset(currRegularTok))
        }
    });

    it("Will be fastest with SimpleLazy tokens and slowest with Regular Tokens", function() {
        this.timeout(20000)
        // lets build a large json
        var largeJsonSample = ""
        for (var j = 0; j < 100; j++) {
            largeJsonSample += jsonSample + " "
        }

        function benchmark(lexer) {
            var start = new Date().getTime()
            for (var k = 0; k < 100; k++) {
                lexer.tokenize(largeJsonSample)
            }
            var end = new Date().getTime()
            return end - start
        }

        var results = {
            "Regular Tokens":     benchmark(regularLexer) + "ms",
            "Lazy Tokens":        benchmark(lazyLexer) + "ms",
            "Simple Lazy Tokens": benchmark(simpleLazyLexer) + "ms"
        }

        console.log("Total Time results for 100 iterations of parsing a large JSON sample (~300k)")
        console.log(JSON.stringify(results, null, "\t"))

        // CI(Travis) containers are not consistent enough to use an assertion on performance,
    });
});
