import {map, keys} from "../../src/utils/utils"
import {extendLazyToken, LazyToken, Token, extendToken} from "../../src/scan/tokens_public"
import {Lexer, LexerDefinitionErrorType, IMultiModeLexerDefinition} from "../../src/scan/lexer_public"
import {
    findMissingPatterns,
    findInvalidPatterns,
    findUnsupportedFlags,
    findDuplicatePatterns,
    findEndOfInputAnchor,
    findInvalidGroupType,
    addStartOfInput,
    analyzeTokenClasses,
    countLineTerminators
} from "../../src/scan/lexer"
import {setEquality} from "../utils/matchers"


function defineLexerSpecs(contextName, extendToken) {

    context(contextName, () => {

        const IntegerTok = extendToken("IntegerTok", /^[1-9]\d*/)
        const IdentifierTok = extendToken("IdentifierTok", /^[A-Za-z_]\w*/)
        const BambaTok = extendToken("BambaTok", /^bamba/)
        BambaTok.LONGER_ALT = IdentifierTok


        let testLexer = new Lexer([BambaTok, IntegerTok, IdentifierTok])

        describe("The Chevrotain Lexers", () => {

            it("can create a token from a string with priority to the First Token class with the longest match #1", () => {
                // this can match either IdentifierTok or BambaTok but should match BambaTok has its pattern is defined before IdentifierTok
                let input = "bamba"
                let result = testLexer.tokenize(input)
                expect(result.tokens[0]).to.be.an.instanceof(BambaTok)
                expect(result.tokens[0].image).to.equal("bamba")
                expect(result.tokens[0].startLine).to.equal(1)
                expect(result.tokens[0].startColumn).to.equal(1)
            })

            it("can create a token from a string with priority to the First Token class with the longest match #2", () => {
                let input = "bambaMIA"
                let result = testLexer.tokenize(input)
                expect(result.tokens[0]).to.be.an.instanceof(IdentifierTok)
                expect(result.tokens[0].image).to.equal("bambaMIA")
                expect(result.tokens[0].startLine).to.equal(1)
                expect(result.tokens[0].startColumn).to.equal(1)
            })

            it("can create a token from a string", () => {
                let input = "6666543221231"
                let result = testLexer.tokenize(input)
                expect(result.tokens[0]).to.be.an.instanceof(IntegerTok)
                expect(result.tokens[0].image).to.equal("6666543221231")
                expect(result.tokens[0].startLine).to.equal(1)
                expect(result.tokens[0].startColumn).to.equal(1)
            })
        })

        const ValidNaPattern = extendToken("ValidNaPattern", Lexer.NA)

        const ValidNaPattern2 = extendToken("ValidNaPattern2", Lexer.NA)

        // TODO: not sure this API allows invalid stuff
        const InvalidPattern = extendToken("InvalidPattern", "BAMBA")
        const MissingPattern = extendToken("MissingPattern", undefined)

        const MultiLinePattern = extendToken("MultiLinePattern", /bamba/m)

        const GlobalPattern = extendToken("GlobalPattern", /bamba/g)

        const CaseInsensitivePattern = extendToken("CaseInsensitivePattern", /bamba/i)

        const IntegerValid = extendToken("IntegerValid", /0\d*/)

        // oops we did copy paste and forgot to change the pattern (same as Integer)
        const DecimalInvalid = extendToken("DecimalInvalid", /0\d*/)

        const Skipped = extendToken("Skipped")
        Skipped.GROUP = Lexer.SKIPPED

        const Special = extendToken("Special")
        Special.GROUP = "Strange"

        const InvalidGroupNumber = extendToken("InvalidGroupNumber", /\d\d\d/)
        InvalidGroupNumber.GROUP = 666

        describe("The Simple Lexer Validations", () => {

            it("won't detect valid patterns as missing", () => {
                let result = findMissingPatterns([BambaTok, IntegerTok, IdentifierTok])
                expect(result.errors).to.be.empty
                expect(result.valid).to.deep.equal([BambaTok, IntegerTok, IdentifierTok])
            })

            it("will detect missing patterns", () => {
                let tokenClasses = [ValidNaPattern, MissingPattern]
                let result = findMissingPatterns(tokenClasses)
                expect(result.errors.length).to.equal(1)
                expect(result.errors[0].tokenClasses).to.deep.equal([MissingPattern])
                expect(result.errors[0].type).to.equal(LexerDefinitionErrorType.MISSING_PATTERN)
                expect(result.errors[0].message).to.contain("MissingPattern")
                expect(result.valid).to.deep.equal([ValidNaPattern])
            })

            it("won't detect valid patterns as invalid", () => {
                let result = findInvalidPatterns([BambaTok, IntegerTok, IdentifierTok, ValidNaPattern])
                expect(result.errors).to.be.empty
                expect(result.valid).to.deep.equal([BambaTok, IntegerTok, IdentifierTok, ValidNaPattern])
            })

            it("will detect invalid patterns as invalid", () => {
                let tokenClasses = [ValidNaPattern, InvalidPattern]
                let result = findInvalidPatterns(tokenClasses)
                expect(result.errors.length).to.equal(1)
                expect(result.errors[0].tokenClasses).to.deep.equal([InvalidPattern])
                expect(result.errors[0].type).to.equal(LexerDefinitionErrorType.INVALID_PATTERN)
                expect(result.errors[0].message).to.contain("InvalidPattern")
                expect(result.valid).to.deep.equal([ValidNaPattern])
            })

            it("won't detect valid patterns as using unsupported flags", () => {
                let errors = findUnsupportedFlags([BambaTok, IntegerTok, IdentifierTok, CaseInsensitivePattern])
                expect(errors).to.be.empty
            })

            it("will detect patterns using unsupported multiline flag", () => {
                let tokenClasses = [ValidNaPattern, MultiLinePattern]
                let errors = findUnsupportedFlags(tokenClasses)
                expect(errors.length).to.equal(1)
                expect(errors[0].tokenClasses).to.deep.equal([MultiLinePattern])
                expect(errors[0].type).to.equal(LexerDefinitionErrorType.UNSUPPORTED_FLAGS_FOUND)
                expect(errors[0].message).to.contain("MultiLinePattern")
            })

            it("will detect patterns using unsupported global flag", () => {
                let tokenClasses = [ValidNaPattern, GlobalPattern]
                let errors = findUnsupportedFlags(tokenClasses)
                expect(errors.length).to.equal(1)
                expect(errors[0].tokenClasses).to.deep.equal([GlobalPattern])
                expect(errors[0].type).to.equal(LexerDefinitionErrorType.UNSUPPORTED_FLAGS_FOUND)
                expect(errors[0].message).to.contain("GlobalPattern")
            })

            it("won't detect valid patterns as duplicates", () => {
                let errors = findDuplicatePatterns([MultiLinePattern, IntegerValid])
                expect(errors).to.be.empty
            })

            it("won't detect NA patterns as duplicates", () => {
                let errors = findDuplicatePatterns([ValidNaPattern, ValidNaPattern2])
                expect(errors).to.be.empty
            })

            it("will detect patterns using unsupported end of input anchor", () => {
                let InvalidToken = extendToken("InvalidToken", /BAMBA$/)
                let tokenClasses = [ValidNaPattern, InvalidToken]
                let errors = findEndOfInputAnchor(tokenClasses)
                expect(errors.length).to.equal(1)
                expect(errors[0].tokenClasses).to.deep.equal([InvalidToken])
                expect(errors[0].type).to.equal(LexerDefinitionErrorType.EOI_ANCHOR_FOUND)
                expect(errors[0].message).to.contain("InvalidToken")
            })

            it("won't detect valid patterns as using unsupported end of input anchor", () => {
                let errors = findEndOfInputAnchor([IntegerTok, IntegerValid])
                expect(errors).to.be.empty
            })

            it("will detect identical patterns for different classes", () => {
                let tokenClasses = [DecimalInvalid, IntegerValid]
                let errors = findDuplicatePatterns(tokenClasses)
                expect(errors.length).to.equal(1)
                expect(errors[0].tokenClasses).to.deep.equal([DecimalInvalid, IntegerValid])
                expect(errors[0].type).to.equal(LexerDefinitionErrorType.DUPLICATE_PATTERNS_FOUND)
                expect(errors[0].message).to.contain("IntegerValid")
                expect(errors[0].message).to.contain("DecimalInvalid")
            })

            it("won't detect valid groups as unsupported", () => {
                let errors = findInvalidGroupType([IntegerTok, Skipped, Special])
                //noinspection BadExpressionStatementJS
                expect(errors).to.be.empty
            })

            it("will detect unsupported group types", () => {
                let tokenClasses = [InvalidGroupNumber]
                let errors = findInvalidGroupType(tokenClasses)
                expect(errors.length).to.equal(1)
                expect(errors[0].tokenClasses).to.deep.equal([InvalidGroupNumber])
                expect(errors[0].type).to.equal(LexerDefinitionErrorType.INVALID_GROUP_TYPE_FOUND)
                expect(errors[0].message).to.contain("InvalidGroupNumber")
            })
        })


        const PatternNoStart = extendToken("PatternNoStart", /bamba/i)

        const Keyword = extendToken("Keyword", Lexer.NA)
        const If = extendToken("If", /if/, Keyword)
        const Else = extendToken("Else", /else/, Keyword)
        const Return = extendToken("Return", /return/, Keyword)
        const Integer = extendToken("Integer", /[1-9]\d*/)

        const Punctuation = extendToken("Punctuation", Lexer.NA)
        const LParen = extendToken("Return", /\(/, Punctuation)
        const RParen = extendToken("Return", /\)/, Punctuation)

        const Whitespace = extendToken("Whitespace", /(\t| )/)
        Whitespace.GROUP = Lexer.SKIPPED

        const NewLine = extendToken("NewLine", /(\n|\r|\r\n)/)
        NewLine.GROUP = Lexer.SKIPPED

        const WhitespaceNotSkipped = extendToken("WhitespaceNotSkipped", /\s+/)

        const Comment = extendToken("Comment", /\/\/.+/)
        Comment.GROUP = "comments"

        const WhitespaceOrAmp = extendToken("WhitespaceOrAmp", /\s+|&/)


        describe("The Simple Lexer transformations", () => {

            it("can transform a pattern to one with startOfInput mark ('^') #1 (NO OP)", () => {
                let orgSource = BambaTok.PATTERN.source
                let transPattern = addStartOfInput(BambaTok.PATTERN)
                expect(transPattern.source).to.equal("^(?:" + orgSource + ")")
                expect(/^\^/.test(transPattern.source)).to.equal(true)
            })

            it("can transform a pattern to one with startOfInput mark ('^') #2", () => {
                let orgSource = PatternNoStart.PATTERN.source
                let transPattern = addStartOfInput(PatternNoStart.PATTERN)
                expect(transPattern.source).to.equal("^(?:" + orgSource + ")")
                expect(/^\^/.test(transPattern.source)).to.equal(true)
            })

            it("can transform/analyze an array of Token Classes into matched/ignored/patternToClass", () => {
                let tokenClasses = [Keyword, If, Else, Return, Integer, Punctuation, LParen, RParen, Whitespace, NewLine]
                let analyzeResult = analyzeTokenClasses(tokenClasses)
                expect(analyzeResult.allPatterns.length).to.equal(8)
                let allPatternsString = map(analyzeResult.allPatterns, (pattern) => {
                    return pattern.source
                })
                setEquality(allPatternsString, ["^(?:(\\t| ))", "^(?:(\\n|\\r|\\r\\n))",
                    "^(?:\\()", "^(?:\\))", "^(?:[1-9]\\d*)", "^(?:if)", "^(?:else)", "^(?:return)"])

                let patternIdxToClass = analyzeResult.patternIdxToClass
                expect(keys(patternIdxToClass).length).to.equal(8)
                expect(patternIdxToClass[0]).to.equal(If)
                expect(patternIdxToClass[1]).to.equal(Else)
                expect(patternIdxToClass[2]).to.equal(Return)
                expect(patternIdxToClass[3]).to.equal(Integer)
                expect(patternIdxToClass[4]).to.equal(LParen)
                expect(patternIdxToClass[5]).to.equal(RParen)
                expect(patternIdxToClass[6]).to.equal(Whitespace)
                expect(patternIdxToClass[7]).to.equal(NewLine)
            })

            it("can count the number of line terminators in a string", () => {
                expect(countLineTerminators("bamba\r\nbisli\r")).to.equal(2)
                expect(countLineTerminators("\r\r\r1234\r\n")).to.equal(4)
                expect(countLineTerminators("aaaa\raaa\n\r1234\n")).to.equal(4)
            })
        })

        describe("The Simple Lexer Full flow", () => {

            const EndOfInputAnchor = extendToken("EndOfInputAnchor", /BAMBA$/)
            it("can create a simple Lexer from a List of Token Classes", () => {
                let ifElseLexer = new Lexer([Keyword, If, Else, Return, Integer, Punctuation, LParen, RParen, Whitespace, NewLine])
                //noinspection BadExpressionStatementJS
                expect(ifElseLexer.lexerDefinitionErrors).to.be.empty

                let input = "if (666) return 1\n" +
                    "\telse return 2"

                let lexResult = ifElseLexer.tokenize(input)

                expect(lexResult.tokens[0].image).to.equal("if")
                expect(lexResult.tokens[0].startOffset).to.equal(0)
                expect(lexResult.tokens[0].endOffset).to.equal(1)
                expect(lexResult.tokens[0].startLine).to.equal(1)
                expect(lexResult.tokens[0].startColumn).to.equal(1)
                expect(lexResult.tokens[0]).to.be.an.instanceOf(If)

                expect(lexResult.tokens[1].image).to.equal("(")
                expect(lexResult.tokens[1].startOffset).to.equal(3)
                expect(lexResult.tokens[1].endOffset).to.equal(3)
                expect(lexResult.tokens[1].startLine).to.equal(1)
                expect(lexResult.tokens[1].startColumn).to.equal(4)
                expect(lexResult.tokens[1]).to.be.an.instanceOf(LParen)

                expect(lexResult.tokens[2].image).to.equal("666")
                expect(lexResult.tokens[2].startOffset).to.equal(4)
                expect(lexResult.tokens[2].endOffset).to.equal(6)
                expect(lexResult.tokens[2].startLine).to.equal(1)
                expect(lexResult.tokens[2].startColumn).to.equal(5)
                expect(lexResult.tokens[2]).to.be.an.instanceOf(Integer)

                expect(lexResult.tokens[3].image).to.equal(")")
                expect(lexResult.tokens[3].startOffset).to.equal(7)
                expect(lexResult.tokens[3].endOffset).to.equal(7)
                expect(lexResult.tokens[3].startLine).to.equal(1)
                expect(lexResult.tokens[3].startColumn).to.equal(8)
                expect(lexResult.tokens[3]).to.be.an.instanceOf(RParen)

                expect(lexResult.tokens[4].image).to.equal("return")
                expect(lexResult.tokens[4].startOffset).to.equal(9)
                expect(lexResult.tokens[4].endOffset).to.equal(14)
                expect(lexResult.tokens[4].startLine).to.equal(1)
                expect(lexResult.tokens[4].startColumn).to.equal(10)
                expect(lexResult.tokens[4]).to.be.an.instanceOf(Return)

                expect(lexResult.tokens[5].image).to.equal("1")
                expect(lexResult.tokens[5].startOffset).to.equal(16)
                expect(lexResult.tokens[5].endOffset).to.equal(16)
                expect(lexResult.tokens[5].startLine).to.equal(1)
                expect(lexResult.tokens[5].startColumn).to.equal(17)
                expect(lexResult.tokens[5]).to.be.an.instanceOf(Integer)

                expect(lexResult.tokens[6].image).to.equal("else")
                expect(lexResult.tokens[6].startOffset).to.equal(19)
                expect(lexResult.tokens[6].endOffset).to.equal(22)
                expect(lexResult.tokens[6].startLine).to.equal(2)
                expect(lexResult.tokens[6].startColumn).to.equal(2)
                expect(lexResult.tokens[6]).to.be.an.instanceOf(Else)

                expect(lexResult.tokens[7].image).to.equal("return")
                expect(lexResult.tokens[7].startOffset).to.equal(24)
                expect(lexResult.tokens[7].endOffset).to.equal(29)
                expect(lexResult.tokens[7].startLine).to.equal(2)
                expect(lexResult.tokens[7].startColumn).to.equal(7)
                expect(lexResult.tokens[7]).to.be.an.instanceOf(Return)

                expect(lexResult.tokens[8].image).to.equal("2")
                expect(lexResult.tokens[8].startOffset).to.equal(31)
                expect(lexResult.tokens[8].endOffset).to.equal(31)
                expect(lexResult.tokens[8].startLine).to.equal(2)
                expect(lexResult.tokens[8].startColumn).to.equal(14)
                expect(lexResult.tokens[8]).to.be.an.instanceOf(Integer)
            })

            it("Will throw an error during the creation of a Lexer if the Lexer's definition is invalid", () => {
                expect(() => new Lexer([EndOfInputAnchor, If, Else])).to.throw(/Errors detected in definition of Lexer/)
                expect(() => new Lexer([EndOfInputAnchor, If, Else])).to.throw(/EndOfInputAnchor/)
            })

            it("can defer the throwing of errors during the creation of a Lexer if the Lexer's definition is invalid", () => {
                expect(() => new Lexer([EndOfInputAnchor, If, Else], true)).to.not.throw(/Errors detected in definition of Lexer/)
                expect(() => new Lexer([EndOfInputAnchor, If, Else], true)).to.not.throw(/EndOfInputAnchor/)

                let lexerWithErrs = new Lexer([EndOfInputAnchor, If, Else], true)
                //noinspection BadExpressionStatementJS
                expect(lexerWithErrs.lexerDefinitionErrors).to.not.be.empty
                // even when the Error handling is deferred, actual usage of an invalid lexer is not permitted!
                expect(() => lexerWithErrs.tokenize("else")).to.throw(/Unable to Tokenize because Errors detected in definition of Lexer/)
                expect(() => lexerWithErrs.tokenize("else")).to.throw(/EndOfInputAnchor/)
            })

            it("can skip invalid character inputs and only report one error per sequence of characters skipped", () => {
                let ifElseLexer = new Lexer([Keyword, If, Else, Return, Integer, Punctuation, LParen, RParen, Whitespace, NewLine])

                let input = "if (666) return 1@#$@#$\n" +
                    "\telse return 2"

                let lexResult = ifElseLexer.tokenize(input)
                expect(lexResult.errors.length).to.equal(1)
                expect(lexResult.errors[0].message).to.contain("@")
                expect(lexResult.errors[0].line).to.equal(1)
                expect(lexResult.errors[0].column).to.equal(18)
                expect(lexResult.errors[0].length).to.equal(6)

                expect(lexResult.tokens[0].image).to.equal("if")
                expect(lexResult.tokens[0].startOffset).to.equal(0)
                expect(lexResult.tokens[0].startLine).to.equal(1)
                expect(lexResult.tokens[0].startColumn).to.equal(1)
                expect(lexResult.tokens[0]).to.be.an.instanceOf(If)

                expect(lexResult.tokens[1].image).to.equal("(")
                expect(lexResult.tokens[1].startOffset).to.equal(3)
                expect(lexResult.tokens[1].startLine).to.equal(1)
                expect(lexResult.tokens[1].startColumn).to.equal(4)
                expect(lexResult.tokens[1]).to.be.an.instanceOf(LParen)

                expect(lexResult.tokens[2].image).to.equal("666")
                expect(lexResult.tokens[2].startOffset).to.equal(4)
                expect(lexResult.tokens[2].startLine).to.equal(1)
                expect(lexResult.tokens[2].startColumn).to.equal(5)
                expect(lexResult.tokens[2]).to.be.an.instanceOf(Integer)

                expect(lexResult.tokens[3].image).to.equal(")")
                expect(lexResult.tokens[3].startOffset).to.equal(7)
                expect(lexResult.tokens[3].startLine).to.equal(1)
                expect(lexResult.tokens[3].startColumn).to.equal(8)
                expect(lexResult.tokens[3]).to.be.an.instanceOf(RParen)

                expect(lexResult.tokens[4].image).to.equal("return")
                expect(lexResult.tokens[4].startOffset).to.equal(9)
                expect(lexResult.tokens[4].startLine).to.equal(1)
                expect(lexResult.tokens[4].startColumn).to.equal(10)
                expect(lexResult.tokens[4]).to.be.an.instanceOf(Return)

                expect(lexResult.tokens[5].image).to.equal("1")
                expect(lexResult.tokens[5].startOffset).to.equal(16)
                expect(lexResult.tokens[5].startLine).to.equal(1)
                expect(lexResult.tokens[5].startColumn).to.equal(17)
                expect(lexResult.tokens[5]).to.be.an.instanceOf(Integer)

                expect(lexResult.tokens[6].image).to.equal("else")
                expect(lexResult.tokens[6].startOffset).to.equal(25)
                expect(lexResult.tokens[6].startLine).to.equal(2)
                expect(lexResult.tokens[6].startColumn).to.equal(2)
                expect(lexResult.tokens[6]).to.be.an.instanceOf(Else)

                expect(lexResult.tokens[7].image).to.equal("return")
                expect(lexResult.tokens[7].startOffset).to.equal(30)
                expect(lexResult.tokens[7].startLine).to.equal(2)
                expect(lexResult.tokens[7].startColumn).to.equal(7)
                expect(lexResult.tokens[7]).to.be.an.instanceOf(Return)

                expect(lexResult.tokens[8].image).to.equal("2")
                expect(lexResult.tokens[8].startOffset).to.equal(37)
                expect(lexResult.tokens[8].startLine).to.equal(2)
                expect(lexResult.tokens[8].startColumn).to.equal(14)
                expect(lexResult.tokens[8]).to.be.an.instanceOf(Integer)
            })

            it("won't go into infinite loops when skipping at end of input", () => {
                let ifElseLexer = new Lexer([Keyword, If, Else, Return, Integer, Punctuation, LParen, RParen, Whitespace, NewLine])

                let input = "if&&&&&&&&&&&&&&&&&&&&&&&&&&&&"
                let lexResult = ifElseLexer.tokenize(input)
                expect(lexResult.errors.length).to.equal(1)
                expect(lexResult.errors[0].message).to.contain("&")
                expect(lexResult.errors[0].line).to.equal(1)
                expect(lexResult.errors[0].column).to.equal(3)
                expect(lexResult.errors[0].length).to.equal(28)

                expect(lexResult.tokens[0].image).to.equal("if")
                expect(lexResult.tokens[0].startOffset).to.equal(0)
                expect(lexResult.tokens[0].startLine).to.equal(1)
                expect(lexResult.tokens[0].startColumn).to.equal(1)
                expect(lexResult.tokens[0]).to.be.an.instanceOf(If)
            })

            it("can deal with line terminators during resync", () => {
                let ifElseLexer = new Lexer([If, Else]) // no newLine tokens those will be resynced

                let input = "if\r\nelse\rif\r"
                let lexResult = ifElseLexer.tokenize(input)
                expect(lexResult.errors.length).to.equal(3)
                expect(lexResult.errors[0].message).to.contain("\r")
                expect(lexResult.errors[0].line).to.equal(1)
                expect(lexResult.errors[0].column).to.equal(3)
                expect(lexResult.errors[0].length).to.equal(2)

                expect(lexResult.errors[1].message).to.contain("\r")
                expect(lexResult.errors[1].line).to.equal(2)
                expect(lexResult.errors[1].column).to.equal(5)
                expect(lexResult.errors[1].length).to.equal(1)

                expect(lexResult.errors[2].message).to.contain("\r")
                expect(lexResult.errors[2].line).to.equal(3)
                expect(lexResult.errors[2].column).to.equal(3)
                expect(lexResult.errors[2].length).to.equal(1)

                expect(lexResult.tokens[0].image).to.equal("if")
                expect(lexResult.tokens[0].startOffset).to.equal(0)
                expect(lexResult.tokens[0].startLine).to.equal(1)
                expect(lexResult.tokens[0].startColumn).to.equal(1)
                expect(lexResult.tokens[0]).to.be.an.instanceOf(If)

                expect(lexResult.tokens[1].image).to.equal("else")
                expect(lexResult.tokens[1].startOffset).to.equal(4)
                expect(lexResult.tokens[1].startLine).to.equal(2)
                expect(lexResult.tokens[1].startColumn).to.equal(1)
                expect(lexResult.tokens[1]).to.be.an.instanceOf(Else)

                expect(lexResult.tokens[2].image).to.equal("if")
                expect(lexResult.tokens[2].startOffset).to.equal(9)
                expect(lexResult.tokens[2].startLine).to.equal(3)
                expect(lexResult.tokens[2].startColumn).to.equal(1)
                expect(lexResult.tokens[2]).to.be.an.instanceOf(If)
            })


            it("can deal with line terminators inside multi-line Tokens", () => {
                let ifElseLexer = new Lexer([If, Else, WhitespaceNotSkipped])

                let input = "if\r\r\telse\rif\n"
                let lexResult = ifElseLexer.tokenize(input)

                expect(lexResult.tokens[0].image).to.equal("if")
                expect(lexResult.tokens[0].startOffset).to.equal(0)
                expect(lexResult.tokens[0].startLine).to.equal(1)
                expect(lexResult.tokens[0].startColumn).to.equal(1)
                expect(lexResult.tokens[0].endLine).to.equal(1)
                expect(lexResult.tokens[0].endColumn).to.equal(2)
                expect(lexResult.tokens[0]).to.be.an.instanceOf(If)

                expect(lexResult.tokens[1].image).to.equal("\r\r\t")
                expect(lexResult.tokens[1].startOffset).to.equal(2)
                expect(lexResult.tokens[1].startLine).to.equal(1)
                expect(lexResult.tokens[1].startColumn).to.equal(3)
                expect(lexResult.tokens[1].endLine).to.equal(3)
                expect(lexResult.tokens[1].endColumn).to.equal(1)
                expect(lexResult.tokens[1]).to.be.an.instanceOf(WhitespaceNotSkipped)

                expect(lexResult.tokens[2].image).to.equal("else")
                expect(lexResult.tokens[2].startOffset).to.equal(5)
                expect(lexResult.tokens[2].startLine).to.equal(3)
                expect(lexResult.tokens[2].startColumn).to.equal(2)
                expect(lexResult.tokens[2].endLine).to.equal(3)
                expect(lexResult.tokens[2].endColumn).to.equal(5)
                expect(lexResult.tokens[2]).to.be.an.instanceOf(Else)

                expect(lexResult.tokens[3].image).to.equal("\r")
                expect(lexResult.tokens[3].startOffset).to.equal(9)
                expect(lexResult.tokens[3].startLine).to.equal(3)
                expect(lexResult.tokens[3].startColumn).to.equal(6)
                expect(lexResult.tokens[3].endLine).to.equal(3)
                expect(lexResult.tokens[3].endColumn).to.equal(6)
                expect(lexResult.tokens[3]).to.be.an.instanceOf(WhitespaceNotSkipped)

                expect(lexResult.tokens[4].image).to.equal("if")
                expect(lexResult.tokens[4].startOffset).to.equal(10)
                expect(lexResult.tokens[4].startLine).to.equal(4)
                expect(lexResult.tokens[4].startColumn).to.equal(1)
                expect(lexResult.tokens[4].endLine).to.equal(4)
                expect(lexResult.tokens[4].endColumn).to.equal(2)
                expect(lexResult.tokens[4]).to.be.an.instanceOf(If)

                expect(lexResult.tokens[5].image).to.equal("\n")
                expect(lexResult.tokens[5].startOffset).to.equal(12)
                expect(lexResult.tokens[5].startLine).to.equal(4)
                expect(lexResult.tokens[5].startColumn).to.equal(3)
                expect(lexResult.tokens[5].endLine).to.equal(4)
                expect(lexResult.tokens[5].endColumn).to.equal(3)
                expect(lexResult.tokens[5]).to.be.an.instanceOf(WhitespaceNotSkipped)

            })

            it("can deal with Tokens which may or may not be a lineTerminator", () => {
                let ifElseLexer = new Lexer([If, Else, WhitespaceOrAmp])

                let input = "if\r\r\telse&if"
                let lexResult = ifElseLexer.tokenize(input)

                expect(lexResult.tokens[0].image).to.equal("if")
                expect(lexResult.tokens[0].startOffset).to.equal(0)
                expect(lexResult.tokens[0].startLine).to.equal(1)
                expect(lexResult.tokens[0].startColumn).to.equal(1)
                expect(lexResult.tokens[0].endLine).to.equal(1)
                expect(lexResult.tokens[0].endColumn).to.equal(2)
                expect(lexResult.tokens[0]).to.be.an.instanceOf(If)

                expect(lexResult.tokens[1].image).to.equal("\r\r\t")
                expect(lexResult.tokens[1].startOffset).to.equal(2)
                expect(lexResult.tokens[1].startLine).to.equal(1)
                expect(lexResult.tokens[1].startColumn).to.equal(3)
                expect(lexResult.tokens[1].endLine).to.equal(3)
                expect(lexResult.tokens[1].endColumn).to.equal(1)
                expect(lexResult.tokens[1]).to.be.an.instanceOf(WhitespaceOrAmp)

                expect(lexResult.tokens[2].image).to.equal("else")
                expect(lexResult.tokens[2].startOffset).to.equal(5)
                expect(lexResult.tokens[2].startLine).to.equal(3)
                expect(lexResult.tokens[2].startColumn).to.equal(2)
                expect(lexResult.tokens[2].endLine).to.equal(3)
                expect(lexResult.tokens[2].endColumn).to.equal(5)
                expect(lexResult.tokens[2]).to.be.an.instanceOf(Else)

                expect(lexResult.tokens[3].image).to.equal("&")
                expect(lexResult.tokens[3].startOffset).to.equal(9)
                expect(lexResult.tokens[3].startLine).to.equal(3)
                expect(lexResult.tokens[3].startColumn).to.equal(6)
                expect(lexResult.tokens[3].endLine).to.equal(3)
                expect(lexResult.tokens[3].endColumn).to.equal(6)
                expect(lexResult.tokens[3]).to.be.an.instanceOf(WhitespaceOrAmp)

                expect(lexResult.tokens[4].image).to.equal("if")
                expect(lexResult.tokens[4].startOffset).to.equal(10)
                expect(lexResult.tokens[4].startLine).to.equal(3)
                expect(lexResult.tokens[4].startColumn).to.equal(7)
                expect(lexResult.tokens[4].endLine).to.equal(3)
                expect(lexResult.tokens[4].endColumn).to.equal(8)
                expect(lexResult.tokens[4]).to.be.an.instanceOf(If)

            })

            it("supports Token groups", () => {
                let ifElseLexer = new Lexer([If, Else, Comment])
                let input = "if//else"
                let lexResult = ifElseLexer.tokenize(input)

                expect(lexResult.tokens[0].image).to.equal("if")
                expect(lexResult.tokens[0].startOffset).to.equal(0)
                expect(lexResult.tokens[0].startLine).to.equal(1)
                expect(lexResult.tokens[0].startColumn).to.equal(1)
                expect(lexResult.tokens[0].endLine).to.equal(1)
                expect(lexResult.tokens[0].endColumn).to.equal(2)
                expect(lexResult.tokens[0]).to.be.an.instanceOf(If)

                expect(lexResult.groups).to.have.property("comments")
                // tslint:disable
                expect(lexResult.groups["comments"]).to.have.length(1)
                let comment = lexResult.groups["comments"][0]
                // tslint:enable
                expect(comment.image).to.equal("//else")
                expect(comment.startOffset).to.equal(2)
                expect(comment.startLine).to.equal(1)
                expect(comment.startColumn).to.equal(3)
                expect(comment.endLine).to.equal(1)
                expect(comment.endColumn).to.equal(8)
                expect(comment).to.be.an.instanceOf(Comment)
            })

            context("lexer modes", () => {

                const One = extendToken("One", /1/)
                const Two = extendToken("Two", /2/)
                const Three = extendToken("Three", /3/)

                const Alpha = extendToken("Alpha", /A/)
                const Beta = extendToken("Beta", /B/)
                const Gamma = extendToken("Gamma", /G/)

                const Hash = extendToken("Hash", /#/)
                const Caret = extendToken("Caret", /\^/)
                const Amp = extendToken("Amp", /&/)

                const NUMBERS = extendToken("NUMBERS", /NUMBERS/)
                NUMBERS.PUSH_MODE = "numbers"

                const LETTERS = extendToken("LETTERS", /LETTERS/)
                LETTERS.PUSH_MODE = "letters"

                const SIGNS = extendToken("SIGNS", /SIGNS/)
                SIGNS.PUSH_MODE = "signs"

                const ExitNumbers = extendToken("ExitNumbers", /EXIT_NUMBERS/)
                ExitNumbers.POP_MODE = true

                const ExitLetters = extendToken("ExitLetters", /EXIT_LETTERS/)
                ExitLetters.POP_MODE = true


                const ExitSigns = extendToken("ExitSigns", /EXIT_SIGNS/)
                ExitSigns.POP_MODE = true

                const Whitespace = extendToken("Whitespace", /(\t| )/)
                Whitespace.GROUP = Lexer.SKIPPED


                let modeLexerDefinition:IMultiModeLexerDefinition = {
                    modes:       {
                        "numbers": [One, Two, Three, ExitNumbers, LETTERS, Whitespace],
                        "letters": [Alpha, Beta, Gamma, ExitLetters, SIGNS, Whitespace],
                        "signs":   [Hash, Caret, Amp, ExitSigns, NUMBERS, Whitespace]
                    },
                    defaultMode: "numbers"
                }

                let ModeLexer = new Lexer(modeLexerDefinition)

                it("supports 'context' lexer modes full flow", () => {
                    let input = "1 LETTERS G A G SIGNS & EXIT_SIGNS B EXIT_LETTERS 3"
                    let lexResult = ModeLexer.tokenize(input)
                    expect(lexResult.errors).to.be.empty

                    let images = map(lexResult.tokens, (currTok) => currTok.image)
                    expect(images).to.deep.equal([
                        "1",
                        "LETTERS",
                        "G",
                        "A",
                        "G",
                        "SIGNS",
                        "&",
                        "EXIT_SIGNS",
                        "B", // back in letters mode
                        "EXIT_LETTERS",
                        "3" // back in numbers mode
                    ])
                })

                it("allows choosing the initial Mode", () => {
                    let input = "A G SIGNS ^"
                    let lexResult = ModeLexer.tokenize(input, "letters")
                    expect(lexResult.errors).to.be.empty

                    let images = map(lexResult.tokens, (currTok) => currTok.image)
                    expect(images).to.deep.equal([
                        "A",
                        "G",
                        "SIGNS",
                        "^"
                    ])
                })

                it("won't allow lexing tokens that are not in the current mode's set", () => {
                    let input = "1 LETTERS 1 A"
                    let lexResult = ModeLexer.tokenize(input)
                    expect(lexResult.errors).to.have.lengthOf(1)
                    expect(lexResult.errors[0].message).to.include("skipped 1")
                    expect(lexResult.errors[0].message).to.include(">1<")

                    let images = map(lexResult.tokens, (currTok) => currTok.image)

                    expect(images).to.deep.equal([
                        "1",
                        "LETTERS",
                        "A" // the second "1" is missing because its not allowed in the "letters" mode
                    ])
                })

                it("Will create a lexer error and skip the mode popping when there is no lexer mode to pop", () => {
                    let input = "1 EXIT_NUMBERS 2"
                    let lexResult = ModeLexer.tokenize(input)
                    expect(lexResult.errors).to.have.lengthOf(1)
                    expect(lexResult.errors[0].message).to.include(">EXIT_NUMBERS<")
                    expect(lexResult.errors[0].message).to.include("Unable to pop")
                    expect(lexResult.errors[0].line).to.equal(1)
                    expect(lexResult.errors[0].column).to.equal(3)
                    expect(lexResult.errors[0].length).to.equal(12)

                    let images = map(lexResult.tokens, (currTok) => currTok.image)
                    expect(images).to.deep.equal([
                        "1",
                        "EXIT_NUMBERS",
                        "2"
                    ])
                })

                it("Will detect Token definitions with push modes values that does not exist", () => {
                    const One = extendToken("One", /1/)
                    const Two = extendToken("Two", /2/)

                    const Alpha = extendToken("Alpha", /A/)
                    const Beta = extendToken("Beta", /B/)
                    const Gamma = extendToken("Gamma", /G/)

                    const EnterNumbers = extendToken("EnterNumbers", /NUMBERS/)
                    EnterNumbers.PUSH_MODE = "numbers"

                    let lexerDef:IMultiModeLexerDefinition = {
                        modes: {
                            "letters":      [Alpha, Beta, Gamma, Whitespace, EnterNumbers],
                            // the numbers mode has a typo! so the PUSH_MODE in the 'EnterNumbers' is invalid
                            "nuMbers_TYPO": [One, Two, Whitespace]
                        },

                        defaultMode: "letters"
                    }

                    let badLexer = new Lexer(lexerDef, true)
                    expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(1)
                    expect(badLexer.lexerDefinitionErrors[0].tokenClasses).to.deep.equal([EnterNumbers])
                    expect(badLexer.lexerDefinitionErrors[0].type).to.equal(LexerDefinitionErrorType.PUSH_MODE_DOES_NOT_EXIST)
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("PUSH_MODE")
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("EnterNumbers")
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("which does not exist")
                })

                it("Will detect a multiMode Lexer definition which is missing the <modes> property", () => {

                    let lexerDef:any = {
                        modes___: { //  typo in 'modes' property name
                        },

                        defaultMode: ""
                    }

                    let badLexer = new Lexer(lexerDef, true)
                    expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(1)
                    expect(badLexer.lexerDefinitionErrors[0].type).to.equal(
                        LexerDefinitionErrorType.MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY)
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("MultiMode Lexer cannot be initialized")
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("without a <modes> property")
                })

                it("Will detect a multiMode Lexer definition which is missing the <defaultMode> property", () => {

                    let lexerDef:any = {
                        modes: {},

                        defaultMode___: "" //  typo in 'defaultMode' property name
                    }

                    let badLexer = new Lexer(lexerDef, true)
                    expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(1)
                    expect(badLexer.lexerDefinitionErrors[0].type).to.equal(LexerDefinitionErrorType.MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE)
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("MultiMode Lexer cannot be initialized")
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("without a <defaultMode> property")
                })

                it("Will detect a multiMode Lexer definition " +
                    "which has an invalid (missing the value) of the <defaultMode> property", () => {

                    let lexerDef:any = {
                        modes: {
                            "bamba": []
                        },

                        defaultMode: "bisli"
                    }
                    let badLexer = new Lexer(lexerDef, true)
                    expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(1)
                    expect(badLexer.lexerDefinitionErrors[0].type).to.equal(
                        LexerDefinitionErrorType.MULTI_MODE_LEXER_DEFAULT_MODE_VALUE_DOES_NOT_EXIST)
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("MultiMode Lexer cannot be initialized")
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("which does not exist")
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("bisli")
                })

                it("Will detect a Lexer definition which has undefined Token classes", () => {

                    let lexerDef:any = [
                        Alpha, Beta, /* this is undefined */, Gamma
                    ]
                    let badLexer = new Lexer(lexerDef, true)
                    expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(1)
                    expect(badLexer.lexerDefinitionErrors[0].type).to.equal(
                        LexerDefinitionErrorType.LEXER_DEFINITION_CANNOT_CONTAIN_UNDEFINED)
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include(
                        "A Lexer cannot be initialized using an undefined Token Class")
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("2")
                })

                it("Will detect a Lexer definition which has mixed Lazy and None Lazy Tokens", () => {
                    class LazyTok1 extends LazyToken {static PATTERN = /A/}
                    class LazyTok2 extends LazyToken {static PATTERN = /B/}
                    class LazyTok3 extends LazyToken {static PATTERN = /C/}
                    class NotLazyTok1 extends Token {static PATTERN = /D/}
                    class NotLazyTok2 extends Token {static PATTERN = /E/}

                    let lexerDef:any = [
                        LazyTok1, LazyTok2, LazyTok3, NotLazyTok1, NotLazyTok2
                    ]

                    let badLexer = new Lexer(lexerDef, true)
                    expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(1)
                    expect(badLexer.lexerDefinitionErrors[0].type).to.equal(
                        LexerDefinitionErrorType.LEXER_DEFINITION_CANNOT_MIX_LAZY_AND_NOT_LAZY)
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include(
                        "A Lexer cannot be defined using a mix of both Lazy and Non-Lazy Tokens:")
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("LazyTok1")
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("LazyTok2")
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("LazyTok3")
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("NotLazyTok1")
                    expect(badLexer.lexerDefinitionErrors[0].message).to.include("NotLazyTok2")
                })
            })
        })
    })
}

defineLexerSpecs("Regular Tokens Mode", extendToken)
defineLexerSpecs("Lazy Tokens Mode", extendLazyToken)
