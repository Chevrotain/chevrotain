import {Parser} from "../../../src/parse/parser_public"
import {Token, EOF} from "../../../src/scan/tokens_public"
import {
    ColonTok,
    IdentTok,
    CommaTok,
    EntityTok,
    KeyTok,
    ActionTok,
    actionDec,
    lotsOfOrs,
    emptyAltOr
} from "./samples"
import {
    buildLookaheadFuncForOr,
    buildLookaheadForOption,
    buildLookaheadForMany,
    buildLookaheadForTopLevel,
    lookAheadSequenceFromAlternatives,
    buildAlternativesLookAheadFunc,
    buildSingleAlternativeLookaheadFunction
} from "../../../src/parse/grammar/lookahead"
import {map} from "../../../src/utils/utils"

class ColonParserMock extends Parser {
    protected LA():Token {
        return new ColonTok(":", 0, 1, 1)
    }
}

class IdentParserMock extends Parser {
    protected LA():Token {
        return new IdentTok("bamba", 0, 1, 1)
    }
}

class CommaParserMock extends Parser {
    protected LA():Token {
        return new CommaTok(",", 0, 1, 1)
    }
}

class EntityParserMock extends Parser {
    protected LA():Token {
        return new EntityTok(",", 0, 1, 1)
    }
}

class KeyParserMock extends Parser {
    protected LA():Token {
        return new KeyTok(",", 0, 1, 1)
    }
}

class ActionParserMock extends Parser {
    protected LA():Token {
        return new ActionTok(",", 0, 1, 1)
    }
}

describe("The Grammar Lookahead namespace", () => {

    it("can compute the lookahead function for the first OPTION in ActionDec", () => {
        let laFunc = buildLookaheadForOption(1, actionDec, 1)

        expect(laFunc.call(new ColonParserMock([], []))).to.equal(false)
        expect(laFunc.call(new IdentParserMock([], []))).to.equal(true)
    })

    it("can compute the lookahead function for the second OPTION in ActionDec", () => {
        let laFunc = buildLookaheadForOption(2, actionDec, 1)

        expect(laFunc.call(new ColonParserMock([], []))).to.equal(true)
        expect(laFunc.call(new IdentParserMock([], []))).to.equal(false)
    })

    it("can compute the lookahead function for the first MANY in ActionDec", () => {
        let laFunc = buildLookaheadForMany(1, actionDec, 1)

        expect(laFunc.call(new CommaParserMock([], []))).to.equal(true)
        expect(laFunc.call(new IdentParserMock([], []))).to.equal(false)
    })

    it("can compute the lookahead function for lots of ORs sample", () => {
        let laFunc = buildLookaheadFuncForOr(1, lotsOfOrs, 1)

        expect(laFunc.call(new CommaParserMock([], []))).to.equal(0)
        expect(laFunc.call(new KeyParserMock([], []))).to.equal(0)
        expect(laFunc.call(new EntityParserMock([], []))).to.equal(1)
        expect(laFunc.call(new ColonParserMock([], []))).to.equal(-1)
    })

    it("can compute the lookahead function for EMPTY OR sample", () => {
        let laFunc = buildLookaheadFuncForOr(1, emptyAltOr, 1)

        expect(laFunc.call(new KeyParserMock([], []))).to.equal(0)
        expect(laFunc.call(new EntityParserMock([], []))).to.equal(1)
        // none matches so the last empty alternative should be taken (idx 2)
        expect(laFunc.call(new CommaParserMock([], []))).to.equal(2)
    })

    it("can compute the lookahead function for a Top Level Rule", () => {
        let laFunc = buildLookaheadForTopLevel(actionDec, 1)

        expect(laFunc.call(new ActionParserMock([], []))).to.equal(true)
        expect(laFunc.call(new IdentParserMock([], []))).to.equal(false)
    })

    it("can compute the lookahead function for a Top Level Rule #2", () => {
        let laFunc = buildLookaheadForTopLevel(lotsOfOrs, 1)

        expect(laFunc.call(new CommaParserMock([], []))).to.equal(true)
        expect(laFunc.call(new EntityParserMock([], []))).to.equal(true)
        expect(laFunc.call(new KeyParserMock([], []))).to.equal(true)
        expect(laFunc.call(new ActionParserMock([], []))).to.equal(false)
    })
})

describe("The chevrotain grammar lookahead capabilities", () => {

    class Alpha extends Token {
        constructor() {super("A", 1, 1, 1, 1)}
    }

    class Beta extends Token {
        constructor() {super("A", 1, 1, 1, 1)}
    }

    class Charlie extends Token {
        constructor() {super("A", 1, 1, 1, 1)}
    }

    class Delta extends Token {
        constructor() {super("A", 1, 1, 1, 1)}
    }

    class Gamma extends Token {
        constructor() {super("A", 1, 1, 1, 1)}
    }

    context("computing lookahead sequences for", () => {

        it("two simple one token alternatives", () => {
            let alt1 = [[Alpha], [Beta], [Beta]]
            let alt2 = [[Gamma]]

            let actual = lookAheadSequenceFromAlternatives([alt1, alt2])
            expect(actual).to.deep.equal([
                [[Alpha], [Beta]],
                [[Gamma]]
            ])
        })

        it("three simple one token alternatives", () => {
            let alt1 = [[Alpha], [Beta], [Beta]]
            let alt2 = [[Gamma]]
            let alt3 = [[Delta, Charlie]]

            let actual = lookAheadSequenceFromAlternatives([alt1, alt2, alt3])
            expect(actual).to.deep.equal([
                [[Alpha], [Beta]],
                [[Gamma]],
                [[Delta]]
            ])
        })

        it("two complex multi token alternatives", () => {
            let alt1 = [[Alpha, Beta], [Beta], [Alpha, Gamma, Delta]]
            let alt2 = [[Alpha, Delta], [Charlie]]

            let actual = lookAheadSequenceFromAlternatives([alt1, alt2])
            expect(actual).to.deep.equal([
                [[Alpha, Beta], [Beta], [Alpha, Gamma]],
                [[Alpha, Delta], [Charlie]]
            ])
        })

        it("three complex multi token alternatives", () => {
            let alt1 = [[Alpha, Beta, Gamma], [Beta]]
            let alt2 = [[Alpha, Delta], [Charlie], [Gamma, Gamma]] // [Charlie] is also prefix of alt3
            let alt3 = [[Alpha, Beta, Delta], [Charlie, Beta]]

            let actual = lookAheadSequenceFromAlternatives([alt1, alt2, alt3])
            expect(actual).to.deep.equal([
                [[Alpha, Beta, Gamma], [Beta]],
                [[Alpha, Delta], [Charlie], [Gamma]],
                [[Alpha, Beta, Delta], [Charlie, Beta]]
            ])

        })

        it("two complex multi token alternatives with shared prefix", () => {
            let alt1 = [[Alpha, Beta, Charlie, Delta]]
            let alt2 = [[Alpha, Beta, Charlie, Delta, Gamma, Alpha]]

            let actual = lookAheadSequenceFromAlternatives([alt1, alt2])
            expect(actual).to.deep.equal([
                [[Alpha, Beta, Charlie, Delta]],
                [[Alpha, Beta, Charlie, Delta, Gamma]]
            ])
        })

        it("simple ambiguous alternatives", () => {
            let alt1 = [[Alpha]]
            let alt2 = [[Alpha]]

            let actual = lookAheadSequenceFromAlternatives([alt1, alt2])
            expect(actual).to.deep.equal([
                [[Alpha]],
                [[Alpha]]
            ])
        })

        it("complex(multi-token) ambiguous alternatives", () => {
            let alt1 = [[Alpha, Beta, Charlie]]
            let alt2 = [[Alpha, Beta, Charlie]]

            let actual = lookAheadSequenceFromAlternatives([alt1, alt2])
            expect(actual).to.deep.equal([
                [[Alpha, Beta, Charlie]],
                [[Alpha, Beta, Charlie]]
            ])
        })
    })

    context("computing lookahead functions for", () => {

        class MockParser {

            public input:Token[]

            constructor(public inputConstructors:Function[]) {
                this.input = map(inputConstructors, (currCost) => new currCost())
            }

            LA(howMuch:number):Token {
                if (this.input.length <= howMuch - 1) {
                    return new EOF()
                }
                else {
                    return this.input[howMuch - 1]
                }
            }
        }

        it("simple alternatives - positive", () => {
            let alternatives = [
                [[Alpha], [Beta]],  // 0
                [[Delta], [Gamma]], // 1
                [[Charlie]]           // 2
            ]
            let laFunc = buildAlternativesLookAheadFunc(alternatives)

            expect(laFunc.call(new MockParser([Alpha]))).to.equal(0)
            expect(laFunc.call(new MockParser([Beta]))).to.equal(0)
            expect(laFunc.call(new MockParser([Delta]))).to.equal(1)
            expect(laFunc.call(new MockParser([Gamma]))).to.equal(1)
            expect(laFunc.call(new MockParser([Charlie]))).to.equal(2)
        })

        it("simple alternatives - negative", () => {
            let alternatives = [
                [[Alpha], [Beta]],  // 0
                [[Delta], [Gamma]]  // 1
            ]
            let laFunc = buildAlternativesLookAheadFunc(alternatives)

            expect(laFunc.call(new MockParser([]))).to.equal(-1)
            expect(laFunc.call(new MockParser([Charlie]))).to.equal(-1)
        })

        it("complex alternatives - positive", () => {
            let alternatives = [
                [[Alpha, Beta, Gamma], [Alpha, Beta, Delta]],  // 0
                [[Alpha, Beta, Beta]],                         // 1
                [[Alpha, Beta]]                                // 2 - Prefix of '1' alternative
            ]
            let laFunc = buildAlternativesLookAheadFunc(alternatives)

            expect(laFunc.call(new MockParser([Alpha, Beta, Gamma]))).to.equal(0)
            expect(laFunc.call(new MockParser([Alpha, Beta, Gamma, Delta]))).to.equal(0)
            expect(laFunc.call(new MockParser([Alpha, Beta, Delta]))).to.equal(0)
            expect(laFunc.call(new MockParser([Alpha, Beta, Beta]))).to.equal(1)
            expect(laFunc.call(new MockParser([Alpha, Beta, Charlie]))).to.equal(2)
        })

        it("complex alternatives - negative", () => {
            let alternatives = [
                [[Alpha, Beta, Gamma], [Alpha, Beta, Delta]],  // 0
                [[Alpha, Beta, Beta]],                         // 1
                [[Alpha, Beta], [Gamma]]                       // 2
            ]
            let laFunc = buildAlternativesLookAheadFunc(alternatives)

            expect(laFunc.call(new MockParser([]))).to.equal(-1)
            expect(laFunc.call(new MockParser([Alpha, Gamma, Gamma]))).to.equal(-1)
            expect(laFunc.call(new MockParser([Charlie]))).to.equal(-1)
            expect(laFunc.call(new MockParser([Beta, Alpha, Beta, Gamma]))).to.equal(-1)
        })

        it("Empty alternatives", () => {
            let alternatives = [
                [[Alpha]],  // 0
                [[]]        // 1
            ]
            let laFunc = buildAlternativesLookAheadFunc(alternatives)

            expect(laFunc.call(new MockParser([Alpha]))).to.equal(0)
            expect(laFunc.call(new MockParser([]))).to.equal(1) // empty alternative always matches
            expect(laFunc.call(new MockParser([Delta]))).to.equal(1) // empty alternative always matches
        })

        it("simple optional - positive", () => {
            let alternative = [[Alpha], [Beta], [Charlie]]
            let laFunc = buildSingleAlternativeLookaheadFunction(alternative)

            expect(laFunc.call(new MockParser([Alpha]))).to.be.true
            expect(laFunc.call(new MockParser([Beta]))).to.be.true
            expect(laFunc.call(new MockParser([Charlie]))).to.be.true
        })

        it("simple optional - negative", () => {
            let alternative = [[Alpha], [Beta], [Charlie]]
            let laFunc = buildSingleAlternativeLookaheadFunction(alternative)

            expect(laFunc.call(new MockParser([Delta]))).to.be.false
            expect(laFunc.call(new MockParser([Gamma]))).to.be.false
        })

        it("complex optional - positive", () => {
            let alternative = [[Alpha, Beta, Gamma], [Beta], [Charlie, Delta]]
            let laFunc = buildSingleAlternativeLookaheadFunction(alternative)

            expect(laFunc.call(new MockParser([Alpha, Beta, Gamma]))).to.be.true
            expect(laFunc.call(new MockParser([Beta]))).to.be.true
            expect(laFunc.call(new MockParser([Charlie, Delta]))).to.be.true
        })

        it("complex optional - Negative", () => {
            let alternative = [[Alpha, Beta, Gamma], [Beta], [Charlie, Delta]]
            let laFunc = buildSingleAlternativeLookaheadFunction(alternative)

            expect(laFunc.call(new MockParser([Alpha, Charlie, Gamma]))).to.be.false
            expect(laFunc.call(new MockParser([Charlie]))).to.be.false
            expect(laFunc.call(new MockParser([Charlie, Beta]))).to.be.false
        })
    })

})


