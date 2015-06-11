/// <reference path="../../src/scan/tokens.ts" />
/// <reference path="../../src/scan/lexer.ts" />
/// <reference path="../utils/matchers.ts" />
/// <reference path="../../libs/lodash.d.ts" />

module chevrotain.lexer.spec {

    import l = chevrotain.lexer
    import tok = chevrotain.tokens
    import matchers = test.matchers


    export class IntegerTok extends tok.Token { static PATTERN = /^[1-9]\d*/ }
    export class IdentifierTok extends tok.Token { static PATTERN = /^[A-Za-z_]\w*/ }
    export class BambaTok extends tok.Token {
        static PATTERN = /^bamba/
        static LONGER_ALT = IdentifierTok
    }

    var patternsToClass = {}
    patternsToClass[BambaTok.PATTERN.toString()] = BambaTok
    patternsToClass[IntegerTok.PATTERN.toString()] = IntegerTok
    patternsToClass[IdentifierTok.PATTERN.toString()] = IdentifierTok
    var patterns:RegExp[] = <any>_.collect(_.values(patternsToClass), "PATTERN")

    var testLexer = new SimpleLexer([BambaTok, IntegerTok, IdentifierTok])

    describe("The Chevrotain Simple Lexer", function () {

        it("can create a token from a string with priority to the First Token class with the longest match #1", function () {
            // this can match either IdentifierTok or BambaTok but should match BambaTok has its pattern is defined before IdentifierTok
            var input = "bamba"
            var result = testLexer.tokenize(input)
            expect(result.tokens[0]).toEqual(jasmine.any(BambaTok))
            expect(result.tokens[0].image).toBe("bamba")
            expect(result.tokens[0].startLine).toBe(1)
            expect(result.tokens[0].startColumn).toBe(1)
        })

        it("can create a token from a string with priority to the First Token class with the longest match #2", function () {
            var input = "bambaMIA"
            var result = testLexer.tokenize(input)
            expect(result.tokens[0]).toEqual(jasmine.any(IdentifierTok))
            expect(result.tokens[0].image).toBe("bambaMIA")
            expect(result.tokens[0].startLine).toBe(1)
            expect(result.tokens[0].startColumn).toBe(1)
        })

        it("can create a token from a string", function () {
            var input = "6666543221231"
            var result = testLexer.tokenize(input)
            expect(result.tokens[0]).toEqual(jasmine.any(IntegerTok))
            expect(result.tokens[0].image).toBe("6666543221231")
            expect(result.tokens[0].startLine).toBe(1)
            expect(result.tokens[0].startColumn).toBe(1)
        })
    })


    class ValidNaPattern extends tok.Token {
        static PATTERN = l.NA
    }

    class InvalidPattern extends tok.Token {
        static PATTERN = "BAMBA"
    }

    class MissingPattern extends tok.Token {}

    class MultiLinePattern extends tok.Token {
        static PATTERN = /bamba/m
    }

    class EndOfInputAnchor extends tok.Token {
        static PATTERN = /BAMBA$/
    }

    class GlobalPattern extends tok.Token {
        static PATTERN = /bamba/g
    }

    class CaseInsensitivePattern extends tok.Token {
        static PATTERN = /bamba/i
    }

    class IntegerValid extends tok.Token {
        static PATTERN = /0\d*/
    }

    class DecimalInvalid extends tok.Token {
        static PATTERN = /0\d*/ // oops we did copy paste and forgot to change the pattern same as Integer
    }

    describe("The Simple Lexer Validations", function () {

        it("won't detect valid patterns as missing", function () {
            var result = l.findMissingPatterns([BambaTok, IntegerTok, IdentifierTok])
            expect(_.isEmpty(result)).toBe(true)
        })

        it("will detect missing patterns", function () {
            var tokenClasses = [ValidNaPattern, MissingPattern]
            var result = l.findMissingPatterns(tokenClasses)
            expect(result.length).toBe(1)
            expect(_.contains(result[0], "MissingPattern")).toBe(true)
            // TODO: use toThrowError once jasmine_node_coverage updates to jasmine 2.0
            expect(() => {l.validatePatterns(tokenClasses)}).toThrow()
        })

        it("won't detect valid patterns as invalid", function () {
            var result = l.findInvalidPatterns([BambaTok, IntegerTok, IdentifierTok, ValidNaPattern])
            expect(_.isEmpty(result)).toBe(true)
        })

        it("will detect invalid patterns as invalid", function () {
            var tokenClasses = [ValidNaPattern, InvalidPattern]
            var result = l.findInvalidPatterns(tokenClasses)
            expect(result.length).toBe(1)
            expect(_.contains(result[0], "InvalidPattern")).toBe(true)
            expect(() => {l.validatePatterns(tokenClasses)}).toThrow()
        })

        it("won't detect valid patterns as using unsupported flags", function () {
            var result = l.findUnsupportedFlags([BambaTok, IntegerTok, IdentifierTok, CaseInsensitivePattern])
            expect(_.isEmpty(result)).toBe(true)
        })

        it("will detect patterns using unsupported multiline flag", function () {
            var tokenClasses = [ValidNaPattern, MultiLinePattern]
            var result = l.findUnsupportedFlags(tokenClasses)
            expect(result.length).toBe(1)
            expect(_.contains(result[0], "MultiLinePattern")).toBe(true)
            expect(() => {l.validatePatterns(tokenClasses)}).toThrow()
        })

        it("will detect patterns using unsupported global flag", function () {
            var tokenClasses = [ValidNaPattern, GlobalPattern]
            var result = l.findUnsupportedFlags(tokenClasses)
            expect(result.length).toBe(1)
            expect(_.contains(result[0], "GlobalPattern")).toBe(true)
            expect(() => {l.validatePatterns(tokenClasses)}).toThrow()
        })

        it("won't detect valid patterns as duplicates", function () {
            var result = l.findDuplicatePatterns([MultiLinePattern, IntegerValid])
            expect(result.length).toBe(0)
        })

        it("will detect patterns using unsupported end of input anchor", function () {
            var tokenClasses = [ValidNaPattern, EndOfInputAnchor]
            var result = l.findEndOfInputAnchor([ValidNaPattern, EndOfInputAnchor])
            expect(result.length).toBe(1)
            expect(_.contains(result[0], "EndOfInputAnchor")).toBe(true)
            expect(() => {l.validatePatterns(tokenClasses)}).toThrow()
        })

        it("won't detect valid patterns as using unsupported end of input anchor", function () {
            var result = l.findEndOfInputAnchor([IntegerTok, IntegerValid])
            expect(result.length).toBe(0)
        })

        it("will detect identical patterns for different classes", function () {
            var tokenClasses = [DecimalInvalid, IntegerValid]
            var result = l.findDuplicatePatterns(tokenClasses)
            expect(result.length).toBe(1)
            expect(_.contains(result[0], "IntegerValid")).toBe(true)
            expect(_.contains(result[0], "DecimalInvalid")).toBe(true)
            expect(() => {l.validatePatterns(tokenClasses)}).toThrow()
        })
    })

    class PatternNoStart extends tok.Token { static PATTERN = /bamba/i }

    class Keyword extends tok.Token { static PATTERN = l.NA }
    class If extends Keyword { static PATTERN = /if/ }
    class Else extends Keyword { static PATTERN = /else/ }
    class Return extends Keyword { static PATTERN = /return/ }
    class Integer extends tok.Token { static PATTERN = /[1-9]\d*/ }
    class Punctuation extends tok.Token { static PATTERN = l.NA }
    class LParen extends Punctuation { static PATTERN = /\(/ }
    class RParen extends Punctuation { static PATTERN = /\)/ }

    class Whitespace extends tok.Token {
        static PATTERN = /(\t| )/
        static GROUP = SKIPPED
    }
    class NewLine extends tok.Token {
        static PATTERN = /(\n|\r|\r\n)/
        static GROUP = SKIPPED
    }

    describe("The Simple Lexer transformations", function () {

        it("can transform a pattern to one with startOfInput mark ('^') #1 (NO OP)", function () {
            var orgSource = BambaTok.PATTERN.source
            var transPattern = l.addStartOfInput(BambaTok.PATTERN)
            expect(transPattern.source).toEqual("^(?:" + orgSource + ")")
            expect(_.startsWith(transPattern.source, "^")).toBe(true)
        })

        it("can transform a pattern to one with startOfInput mark ('^') #2", function () {
            var orgSource = PatternNoStart.PATTERN.source
            var transPattern = l.addStartOfInput(PatternNoStart.PATTERN)
            expect(transPattern.source).toEqual("^(?:" + orgSource + ")")
            expect(_.startsWith(transPattern.source, "^")).toBe(true)
        })

        it("can transform/analyze an array of Token Classes into matched/ignored/patternToClass", function () {
            var tokenClasses = [Keyword, If, Else, Return, Integer, Punctuation, LParen, RParen, Whitespace, NewLine]
            var analyzeResult = l.analyzeTokenClasses(tokenClasses)
            expect(analyzeResult.allPatterns.length).toBe(8)
            var allPatternsString = _.map(analyzeResult.allPatterns, (pattern) => {
                return pattern.source
            })
            matchers.arrayEqualityNoOrder(allPatternsString, ["^(?:(\\t| ))", "^(?:(\\n|\\r|\\r\\n))",
                "^(?:\\()", "^(?:\\))", "^(?:[1-9]\\d*)", "^(?:if)", "^(?:else)", "^(?:return)"])

            var patternIdxToClass = analyzeResult.patternIdxToClass
            expect(_.keys(patternIdxToClass).length).toBe(8)
            expect(patternIdxToClass[0]).toBe(If);
            expect(patternIdxToClass[1]).toBe(Else);
            expect(patternIdxToClass[2]).toBe(Return);
            expect(patternIdxToClass[3]).toBe(Integer);
            expect(patternIdxToClass[4]).toBe(LParen);
            expect(patternIdxToClass[5]).toBe(RParen);
            expect(patternIdxToClass[6]).toBe(Whitespace);
            expect(patternIdxToClass[7]).toBe(NewLine);
        })

        it("can count the number of line terminators in a string", function () {
            expect(l.countLineTerminators("bamba\r\nbisli\r")).toBe(2)
            expect(l.countLineTerminators("\r\r\r1234\r\n")).toBe(4)
            expect(l.countLineTerminators("aaaa\raaa\n\r1234\n")).toBe(4)
        })
    })

    describe("The Simple Lexer Full flow", function () {

        it("can create a simple Lexer from a List of Token Classes", function () {
            var ifElseLexer = new l.SimpleLexer([Keyword, If, Else, Return, Integer, Punctuation, LParen, RParen, Whitespace, NewLine])

            var input = "if (666) return 1\n" +
                "\telse return 2"

            var lexResult = ifElseLexer.tokenize(input)
            expect(lexResult.tokens).toEqual([new If(1, 1, "if"), new LParen(1, 4, "("), new Integer(1, 5, "666"), new RParen(1, 8, ")"),
                new Return(1, 10, "return"), new Integer(1, 17, "1"), new Else(2, 2, "else"), new Return(2, 7, "return"),
                new Integer(2, 14, "2")
            ])
            // TODO: support returning skipped tokens under certain conditions (token groups)
            //expect(lexResult.skipped).toEqual([new Whitespace(1, 3, " "), new Whitespace(1, 9, " "), new Whitespace(1, 16, " "),
            //    new NewLine(1, 18, "\n"), new Whitespace(2, 1, "\t"), new Whitespace(2, 6, " "), new Whitespace(2, 13, " ")])
        })


        it("can skip invalid character inputs and only report one error per sequence of characters skipped", function () {
            var ifElseLexer = new l.SimpleLexer([Keyword, If, Else, Return, Integer, Punctuation, LParen, RParen, Whitespace, NewLine])

            var input = "if (666) return 1@#$@#$\n" +
                "\telse return 2"

            var lexResult = ifElseLexer.tokenize(input)
            expect(lexResult.errors.length).toBe(1)
            expect(_.contains(lexResult.errors[0].message, "@")).toBe(true)
            expect(lexResult.errors[0].line).toBe(1)
            expect(lexResult.errors[0].column).toBe(18)
            expect(lexResult.tokens).toEqual([new If(1, 1, "if"), new LParen(1, 4, "("), new Integer(1, 5, "666"), new RParen(1, 8, ")"),
                new Return(1, 10, "return"), new Integer(1, 17, "1"), new Else(2, 2, "else"), new Return(2, 7, "return"),
                new Integer(2, 14, "2")
            ])
            // TODO: support returning skipped tokens under certain conditions (token groups)
            //expect(lexResult.skipped).toEqual([new Whitespace(1, 3, " "), new Whitespace(1, 9, " "), new Whitespace(1, 16, " "),
            //    new NewLine(1, 24, "\n"), new Whitespace(2, 1, "\t"), new Whitespace(2, 6, " "), new Whitespace(2, 13, " ")])
        })

        it("won't go into infinite loops when skipping at end of input", function () {
            var ifElseLexer = new l.SimpleLexer([Keyword, If, Else, Return, Integer, Punctuation, LParen, RParen, Whitespace, NewLine])

            var input = "if&&&&&&&&&&&&&&&&&&&&&&&&&&&&"
            var lexResult = ifElseLexer.tokenize(input)
            expect(lexResult.errors.length).toBe(1)
            expect(_.contains(lexResult.errors[0].message, "&")).toBe(true)
            expect(lexResult.errors[0].line).toBe(1)
            expect(lexResult.errors[0].column).toBe(3)
            expect(lexResult.tokens).toEqual([new If(1, 1, "if")])
        })

        it("can deal with line terminators during resync", function () {
            var ifElseLexer = new l.SimpleLexer([If, Else]) // no newLine tokens those will be resynced

            var input = "if\r\nelse\rif\r"
            var lexResult = ifElseLexer.tokenize(input)
            expect(lexResult.errors.length).toBe(3)
            expect(_.contains(lexResult.errors[0].message, "\r")).toBe(true)
            expect(lexResult.errors[0].line).toBe(1)
            expect(lexResult.errors[0].column).toBe(3)

            expect(_.contains(lexResult.errors[1].message, "\r")).toBe(true)
            expect(lexResult.errors[1].line).toBe(2)
            expect(lexResult.errors[1].column).toBe(5)

            expect(_.contains(lexResult.errors[1].message, "\r")).toBe(true)
            expect(lexResult.errors[2].line).toBe(3)
            expect(lexResult.errors[2].column).toBe(3)
            expect(lexResult.tokens).toEqual([new If(1, 1, "if"), new Else(2, 1, "else"), new If(3, 1, "if")])
        })
    })
}


