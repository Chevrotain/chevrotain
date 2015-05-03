/// <reference path="../../src/scan/tokens.ts" />
/// <reference path="../../src/scan/lexer.ts" />
/// <reference path="../utils/matchers.ts" />
/// <reference path="../../libs/lodash.d.ts" />

module chevrotain.lexer.spec {

    import l = chevrotain.lexer
    import tok = chevrotain.tokens
    import matchers = test.matchers

    export class BambaTok extends tok.Token { static PATTERN = /^bamba/ }
    export class IntegerTok extends tok.Token { static PATTERN = /^[1-9]\d*/ }
    export class IdentifierTok extends tok.Token { static PATTERN = /^[A-Za-z_]\w*/ }

    var patternsToClass = {}
    patternsToClass[BambaTok.PATTERN.toString()] = BambaTok
    patternsToClass[IntegerTok.PATTERN.toString()] = IntegerTok
    patternsToClass[IdentifierTok.PATTERN.toString()] = IdentifierTok
    var patterns:RegExp[] = <any>_.collect(_.values(patternsToClass), "PATTERN")


    describe("The Chevrotain Simple Lexer", function () {

        it("can create a token from a string with priority to the First Token class with the longest match #1", function () {
            // this can match either IdentifierTok or BambaTok but should match BambaTok has its pattern is defined before IdentifierTok
            var input = "bamba bisli"
            var result = l.tokenizeOne(input, 0, patterns, patternsToClass)
            expect(result.offset).toBe(5)
            expect(result.token).toEqual(jasmine.any(BambaTok))
            expect(result.token.image).toBe("bamba")
        })

        it("can create a token from a string with priority to the First Token class with the longest match #2", function () {
            var input = "bambaMIA 666"
            var result = l.tokenizeOne(input, 0, patterns, patternsToClass)
            expect(result.offset).toBe(8)
            expect(result.token).toEqual(jasmine.any(IdentifierTok))
            expect(result.token.image).toBe("bambaMIA")
        })

        it("can create a token from a string", function () {
            var input = "6666543221231 bamab"
            var result = l.tokenizeOne(input, 0, patterns, patternsToClass)
            expect(result.offset).toBe(13)
            expect(result.token).toEqual(jasmine.any(IntegerTok))
            expect(result.token.image).toBe("6666543221231")
        })

        it("can create a token from a string", function () {
            var input = "[1,2,3]"
            var result = l.tokenizeOne(input, 0, patterns, patternsToClass)
            expect(result).toBe(l.NOTHING_CONSUMED())
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

    class GlobalPattern extends tok.Token {
        static PATTERN = /bamba/g
    }

    class CaseInsensitivePattern extends tok.Token {
        static PATTERN = /bamba/i
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
            var result = l.findUnsupportedFlags([ValidNaPattern, GlobalPattern])
            expect(result.length).toBe(1)
            expect(_.contains(result[0], "GlobalPattern")).toBe(true)
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
        static IGNORE = true
    }
    class NewLine extends tok.Token {
        static PATTERN = /(\n|\r|\r\n)/
        static IGNORE = true
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
            expect(analyzeResult.ignorePatterns.length).toBe(2)
            var ignorePatternsString = _.map(analyzeResult.ignorePatterns, (pattern) => {
                return pattern.source
            })
            matchers.arrayEqualityNoOrder(ignorePatternsString, ["^(?:(\\t| ))", "^(?:(\\n|\\r|\\r\\n))"])

            expect(analyzeResult.matchPatterns.length).toBe(6)
            var matchPatternsString = _.map(analyzeResult.matchPatterns, (pattern) => {
                return pattern.source
            })
            matchers.arrayEqualityNoOrder(matchPatternsString,
                ["^(?:\\()", "^(?:\\))", "^(?:[1-9]\\d*)", "^(?:if)", "^(?:else)", "^(?:return)"])

            var patternToClass = analyzeResult.patternToClass
            expect(_.keys(patternToClass).length).toBe(8)
            expect(patternToClass["/^(?:\\()/"]).toBe(LParen)
            expect(patternToClass["/^(?:\\))/"]).toBe(RParen)
            expect(patternToClass["/^(?:[1-9]\\d*)/"]).toBe(Integer)
            expect(patternToClass["/^(?:if)/"]).toBe(If)
            expect(patternToClass["/^(?:else)/"]).toBe(Else)
            expect(patternToClass["/^(?:return)/"]).toBe(Return)
            expect(patternToClass["/^(?:(\\t| ))/"]).toBe(Whitespace)
            expect(patternToClass["/^(?:(\\n|\\r|\\r\\n))/"]).toBe(NewLine)
        })

        it("can build an offset to lineColumn dictionary for a string", function () {
            var text = "ab\r" +
                "c\r\n" +
                "def\r"

            var offsetToLC = l.buildOffsetToLineColumnDict(text)
            expect(offsetToLC.length).toBe(10)
            expect(offsetToLC[0]).toEqual({line: 1, column: 1})
            expect(offsetToLC[1]).toEqual({line: 1, column: 2})
            expect(offsetToLC[2]).toEqual({line: 1, column: 3})
            expect(offsetToLC[3]).toEqual({line: 2, column: 1})
            expect(offsetToLC[4]).toEqual({line: 2, column: 2})
            expect(offsetToLC[5]).toEqual({line: 2, column: 3})
            expect(offsetToLC[6]).toEqual({line: 3, column: 1})
            expect(offsetToLC[7]).toEqual({line: 3, column: 2})
            expect(offsetToLC[8]).toEqual({line: 3, column: 3})
            expect(offsetToLC[9]).toEqual({line: 3, column: 4})
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
            expect(lexResult.ignored).toEqual([new Whitespace(1, 3, " "), new Whitespace(1, 9, " "), new Whitespace(1, 16, " "),
                new NewLine(1, 18, "\n"), new Whitespace(2, 1, "\t"), new Whitespace(2, 6, " "), new Whitespace(2, 13, " ")])
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
            expect(lexResult.ignored).toEqual([new Whitespace(1, 3, " "), new Whitespace(1, 9, " "), new Whitespace(1, 16, " "),
                new NewLine(1, 24, "\n"), new Whitespace(2, 1, "\t"), new Whitespace(2, 6, " "), new Whitespace(2, 13, " ")])
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
            expect(lexResult.ignored.length).toBe(0)
        })
    })
}


