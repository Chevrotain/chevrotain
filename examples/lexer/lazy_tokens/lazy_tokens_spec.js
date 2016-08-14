var fs = require("fs")
var path = require("path")
var expect = require("chai").expect
var lexers = require("./lazy_tokens")

var pkgPath = path.join(__dirname, "../..//../package.json")
var jsonSample = fs.readFileSync(pkgPath, "utf8")

var lazyLexer = lexers.lazyLexer
var regularLexer = lexers.regularLexer

describe("The Chevrotain Lexer support for both Lazy And Non-Lazy(Regular) Tokens", function() {

    it("Will produce identical output with both types of lexers", function() {
        var lazyResult = lazyLexer.tokenize(jsonSample)
        var regularResult = regularLexer.tokenize(jsonSample)

        expect(lazyResult.groups).to.deep.equal(regularResult.groups)
        expect(lazyResult.errors).to.deep.equal(regularResult.errors)
        expect(lazyResult.tokens).to.have.lengthOf(regularResult.tokens.length)

        for (var i = 0; i < lazyResult.tokens.length; i++) {
            var currLazyTok = lazyResult.tokens[i]
            var currRegularTok = regularResult.tokens[i]

            expect(currLazyTok.image).to.equal(currRegularTok.image)
            expect(currLazyTok.startLine).to.equal(currRegularTok.startLine)
            expect(currLazyTok.endLine).to.equal(currRegularTok.endLine)
            expect(currLazyTok.startColumn).to.equal(currRegularTok.startColumn)
            expect(currLazyTok.endColumn).to.equal(currRegularTok.endColumn)
            expect(currLazyTok.startOffset).to.equal(currRegularTok.startOffset)
            expect(currLazyTok.endOffset).to.equal(currRegularTok.endOffset)
        }
    });

    it("Will be faster in Lazy Lexer mode", function() {
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

        var lazyTime = benchmark(lazyLexer)
        var regularTime = benchmark(regularLexer)

        if (lazyTime < regularTime) {
            console.log("Lazy is faster by: " + (regularTime / lazyTime).toFixed(3))
        }
        else {
            console.log("Regular is faster by: " + ((lazyTime / regularTime)).toFixed(3))
        }

        // TODO: not sure CI(Travis) containers are reliable enough to have an assertion on performance,
        // may need to only log the result this to the console if this randomly fails
        expect(lazyTime).to.be.lessThan(regularTime)
    });
});
