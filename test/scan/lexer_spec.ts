import {Token} from "../../src/scan/tokens_public"
import {
    Lexer,
    LexerDefinitionErrorType,
    IMultiModeLexerDefinition
} from "../../src/scan/lexer_public"
import {
    findMissingPatterns,
    countLineTerminators,
    analyzeTokenClasses,
    addStartOfInput,
    findInvalidGroupType,
    findEndOfInputAnchor,
    findDuplicatePatterns,
    findUnsupportedFlags,
    findInvalidPatterns
} from "../../src/scan/lexer"
import {setEquality} from "../utils/matchers"
import {map, values, keys} from "../../src/utils/utils"


export class IntegerTok extends Token { static PATTERN = /^[1-9]\d*/ }
export class IdentifierTok extends Token { static PATTERN = /^[A-Za-z_]\w*/ }
export class BambaTok extends Token {
    static PATTERN = /^bamba/
    static LONGER_ALT = IdentifierTok
}

let patternsToClass = {}
patternsToClass[BambaTok.PATTERN.toString()] = BambaTok
patternsToClass[IntegerTok.PATTERN.toString()] = IntegerTok
patternsToClass[IdentifierTok.PATTERN.toString()] = IdentifierTok
let patterns:RegExp[] = map(values(patternsToClass), (item) => item.PATTERN)

let testLexer = new Lexer([BambaTok, IntegerTok, IdentifierTok])

describe("The Chevrotain Simple Lexer", () => {

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

class ValidNaPattern extends Token {
    static PATTERN = Lexer.NA
}

class ValidNaPattern2 extends Token {
    static PATTERN = Lexer.NA
}

class InvalidPattern extends Token {
    static PATTERN = "BAMBA"
}

class MissingPattern extends Token {}

class MultiLinePattern extends Token {
    static PATTERN = /bamba/m
}

class EndOfInputAnchor extends Token {
    static PATTERN = /BAMBA$/
}

class GlobalPattern extends Token {
    static PATTERN = /bamba/g
}

class CaseInsensitivePattern extends Token {
    static PATTERN = /bamba/i
}

class IntegerValid extends Token {
    static PATTERN = /0\d*/
}

class DecimalInvalid extends Token {
    static PATTERN = /0\d*/ // oops we did copy paste and forgot to change the pattern same as Integer
}

class Skipped extends Token {
    static GROUP = Lexer.SKIPPED
}

class Special extends Token {
    static GROUP = "Strange"
}

class InvalidGroupNumber extends Token {
    static PATTERN = /\d\d\d/
    static GROUP = 666
}

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
        let tokenClasses = [ValidNaPattern, EndOfInputAnchor]
        let errors = findEndOfInputAnchor(tokenClasses)
        expect(errors.length).to.equal(1)
        expect(errors[0].tokenClasses).to.deep.equal([EndOfInputAnchor])
        expect(errors[0].type).to.equal(LexerDefinitionErrorType.EOI_ANCHOR_FOUND)
        expect(errors[0].message).to.contain("EndOfInputAnchor")
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

class PatternNoStart extends Token { static PATTERN = /bamba/i }

class Keyword extends Token { static PATTERN = Lexer.NA }
class If extends Keyword { static PATTERN = /if/ }
class Else extends Keyword { static PATTERN = /else/ }
class Return extends Keyword { static PATTERN = /return/ }
class Integer extends Token { static PATTERN = /[1-9]\d*/ }
class Punctuation extends Token { static PATTERN = Lexer.NA }
class LParen extends Punctuation { static PATTERN = /\(/ }
class RParen extends Punctuation { static PATTERN = /\)/ }

class Whitespace extends Token {
    static PATTERN = /(\t| )/
    static GROUP = Lexer.SKIPPED
}

class NewLine extends Token {
    static PATTERN = /(\n|\r|\r\n)/
    static GROUP = Lexer.SKIPPED
}

class WhitespaceNotSkipped extends Token {
    static PATTERN = /\s+/
}

class Comment extends Token {
    static PATTERN = /\/\/.+/
    static GROUP = "comments"
}

class WhitespaceOrAmp extends Token {
    static PATTERN = /\s+|&/
}


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

    it("can create a simple Lexer from a List of Token Classes", () => {
        let ifElseLexer = new Lexer([Keyword, If, Else, Return, Integer, Punctuation, LParen, RParen, Whitespace, NewLine])
        //noinspection BadExpressionStatementJS
        expect(ifElseLexer.lexerDefinitionErrors).to.be.empty

        let input = "if (666) return 1\n" +
            "\telse return 2"

        let lexResult = ifElseLexer.tokenize(input)
        expect(lexResult.tokens).to.deep.equal([new If("if", 0, 1, 1), new LParen("(", 3, 1, 4), new Integer("666", 4, 1, 5),
            new RParen(")", 7, 1, 8), new Return("return", 9, 1, 10), new Integer("1", 16, 1, 17), new Else("else", 19, 2, 2),
            new Return("return", 24, 2, 7), new Integer("2", 31, 2, 14)
        ])
        // TODO: support returning skipped tokens under certain conditions (token groups)
        //expect(lexResult.skipped).to.deep.equal([new Whitespace(1, 3, " "), new Whitespace(1, 9, " "), new Whitespace(1, 16, " "),
        //    new NewLine(1, 18, "\n"), new Whitespace(2, 1, "\t"), new Whitespace(2, 6, " "), new Whitespace(2, 13, " ")])
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
        expect(lexResult.tokens).to.deep.equal([new If("if", 0, 1, 1), new LParen("(", 3, 1, 4), new Integer("666", 4, 1, 5),
            new RParen(")", 7, 1, 8), new Return("return", 9, 1, 10), new Integer("1", 16, 1, 17), new Else("else", 25, 2, 2),
            new Return("return", 30, 2, 7), new Integer("2", 37, 2, 14)
        ])
        // TODO: support returning skipped tokens under certain conditions (token groups)
        //expect(lexResult.skipped).to.deep.equal([new Whitespace(1, 3, " "), new Whitespace(1, 9, " "), new Whitespace(1, 16, " "),
        //    new NewLine(1, 24, "\n"), new Whitespace(2, 1, "\t"), new Whitespace(2, 6, " "), new Whitespace(2, 13, " ")])
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
        expect(lexResult.tokens).to.deep.equal([new If("if", 0, 1, 1)])
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
        expect(lexResult.tokens).to.deep.equal([new If("if", 0, 1, 1), new Else("else", 4, 2, 1), new If("if", 9, 3, 1)])
    })

    it("can deal with line terminators inside multi-line Tokens", () => {
        let ifElseLexer = new Lexer([If, Else, WhitespaceNotSkipped])

        let input = "if\r\r\telse\rif\n"
        let lexResult = ifElseLexer.tokenize(input)

        expect(lexResult.tokens).to.deep.equal([
            new If("if", 0, 1, 1, 1, 2),
            new WhitespaceNotSkipped("\r\r\t", 2, 1, 3, 3, 1),
            new Else("else", 5, 3, 2, 3, 5),
            new WhitespaceNotSkipped("\r", 9, 3, 6, 3, 6),
            new If("if", 10, 4, 1, 4, 2),
            new WhitespaceNotSkipped("\n", 12, 4, 3, 4, 3),
        ])
    })

    it("can deal with Tokens which may or may not be a lineTerminator", () => {
        let ifElseLexer = new Lexer([If, Else, WhitespaceOrAmp])

        let input = "if\r\r\telse&if"
        let lexResult = ifElseLexer.tokenize(input)

        expect(lexResult.tokens).to.deep.equal([
            new If("if", 0, 1, 1, 1, 2),
            new WhitespaceOrAmp("\r\r\t", 2, 1, 3, 3, 1),
            new Else("else", 5, 3, 2, 3, 5),
            new WhitespaceOrAmp("&", 9, 3, 6, 3, 6),
            new If("if", 10, 3, 7, 3, 8),
        ])
    })

    it("supports Token groups", () => {
        let ifElseLexer = new Lexer([If, Else, Comment])
        let input = "if//else"
        let lexResult = ifElseLexer.tokenize(input)

        expect(lexResult.tokens).to.deep.equal([
            new If("if", 0, 1, 1, 1, 2),
        ])

        expect((<any>lexResult.groups).comments).to.deep.equal([
            new Comment("//else", 2, 1, 3, 1, 8),
        ])
    })

    context("lexer modes", () => {

        class One extends Token { static PATTERN = /1/ }
        class Two extends Token { static PATTERN = /2/ }
        class Three extends Token { static PATTERN = /3/ }

        class Alpha extends Token { static PATTERN = /A/ }
        class Beta extends Token { static PATTERN = /B/ }
        class Gamma extends Token { static PATTERN = /G/ }

        class Hash extends Token { static PATTERN = /#/ }
        class Caret extends Token { static PATTERN = /\^/ }
        class Amp extends Token { static PATTERN = /&/ }

        class NUMBERS extends Token {
            static PATTERN = /NUMBERS/
            static PUSH_MODE = "numbers"
        }

        class LETTERS extends Token {
            static PATTERN = /LETTERS/
            static PUSH_MODE = "letters"
        }

        class SIGNS extends Token {
            static PATTERN = /SIGNS/
            static PUSH_MODE = "signs"
        }

        class ExitNumbers extends Token {
            static PATTERN = /EXIT_NUMBERS/
            static POP_MODE = true
        }

        class ExitLetters extends Token {
            static PATTERN = /EXIT_LETTERS/
            static POP_MODE = true
        }

        class ExitSigns extends Token {
            static PATTERN = /EXIT_SIGNS/
            static POP_MODE = true
        }

        class Whitespace extends Token {
            static PATTERN = /(\t| )/
            static GROUP = Lexer.SKIPPED
        }

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
            class One extends Token { static PATTERN = /1/ }
            class Two extends Token { static PATTERN = /2/ }

            class Alpha extends Token { static PATTERN = /A/ }
            class Beta extends Token { static PATTERN = /B/ }
            class Gamma extends Token { static PATTERN = /G/ }

            class EnterNumbers extends Token {
                static PATTERN = /NUMBERS/
                static PUSH_MODE = "numbers"
            }

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
            expect(badLexer.lexerDefinitionErrors[0].type).to.equal(LexerDefinitionErrorType.MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY)
            expect(badLexer.lexerDefinitionErrors[0].message).to.include("MultiMode Lexer cannot be initialized")
            expect(badLexer.lexerDefinitionErrors[0].message).to.include("without a <modes> property")
        })

        it("Will detect a multiMode Lexer definition which is missing the <defaultMode> property", () => {

            let lexerDef:any = {
                modes: {
                },

                defaultMode___: "" //  typo in 'defaultMode' property name
            }

            let badLexer = new Lexer(lexerDef, true)
            expect(badLexer.lexerDefinitionErrors).to.have.lengthOf(1)
            expect(badLexer.lexerDefinitionErrors[0].type).to.equal(LexerDefinitionErrorType.MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE)
            expect(badLexer.lexerDefinitionErrors[0].message).to.include("MultiMode Lexer cannot be initialized")
            expect(badLexer.lexerDefinitionErrors[0].message).to.include("without a <defaultMode> property")
        })


    })

})
