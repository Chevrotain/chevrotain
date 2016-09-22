import {Parser} from "../../../src/parse/parser_public"
import {Token, EOF} from "../../../src/scan/tokens_public"
import {gast} from "../../../src/parse/grammar/gast_public"
import {ColonTok, IdentTok, CommaTok, EntityTok, KeyTok, actionDec, lotsOfOrs, emptyAltOr} from "./samples"
import {
    buildLookaheadFuncForOr,
    buildLookaheadForOption,
    buildLookaheadForMany,
    lookAheadSequenceFromAlternatives,
    buildAlternativesLookAheadFunc,
    buildSingleAlternativeLookaheadFunction
} from "../../../src/parse/grammar/lookahead"
import {map} from "../../../src/utils/utils"
import {augmentTokenClasses, tokenInstanceofMatcher, tokenClassIdentity, tokenInstanceIdentity} from "../../../src/scan/tokens"

class ColonParserMock extends Parser {
    constructor() {
        super([], [ColonTok])
    }

    protected LA():Token {
        return new ColonTok(":", 0, 1, 1)
    }
}

class IdentParserMock extends Parser {
    constructor() {
        super([], [IdentTok])
    }

    protected LA():Token {
        return new IdentTok("bamba", 0, 1, 1)
    }
}

class CommaParserMock extends Parser {
    constructor() {
        super([], [CommaTok])
    }

    protected LA():Token {
        return new CommaTok(",", 0, 1, 1)
    }
}

class EntityParserMock extends Parser {
    constructor() {
        super([], [EntityTok])
    }

    protected LA():Token {
        return new EntityTok(",", 0, 1, 1)
    }
}

class KeyParserMock extends Parser {
    constructor() {
        super([], [KeyTok])
    }

    protected LA():Token {
        return new KeyTok(",", 0, 1, 1)
    }
}

describe("The Grammar Lookahead namespace", () => {

    it("can compute the lookahead function for the first OPTION in ActionDec", () => {
        let colonMock = new ColonParserMock()
        let indentMock = new IdentParserMock()

        let laFunc = buildLookaheadForOption(1, actionDec, 1, tokenInstanceofMatcher, tokenClassIdentity, tokenInstanceIdentity, false)

        expect(laFunc.call(colonMock)).to.equal(false)
        expect(laFunc.call(indentMock)).to.equal(true)
    })

    it("can compute the lookahead function for the second OPTION in ActionDec", () => {
        let colonParserMock = new ColonParserMock()
        let identParserMock = new IdentParserMock()

        let laFunc = buildLookaheadForOption(2, actionDec, 1, tokenInstanceofMatcher, tokenClassIdentity, tokenInstanceIdentity, false)

        expect(laFunc.call(colonParserMock)).to.equal(true)
        expect(laFunc.call(identParserMock)).to.equal(false)
    })

    it("can compute the lookahead function for the first MANY in ActionDec", () => {
        let identParserMock = new IdentParserMock()
        let commaParserMock = new CommaParserMock()

        let laFunc = buildLookaheadForMany(1, actionDec, 1, tokenInstanceofMatcher, tokenClassIdentity, tokenInstanceIdentity, false)

        expect(laFunc.call(commaParserMock)).to.equal(true)
        expect(laFunc.call(identParserMock)).to.equal(false)
    })

    it("can compute the lookahead function for lots of ORs sample", () => {
        let keyParserMock = new KeyParserMock()
        let entityParserMock = new EntityParserMock()
        let colonParserMock = new ColonParserMock()
        let commaParserMock = new CommaParserMock()

        let laFunc = buildLookaheadFuncForOr(1,
            lotsOfOrs,
            1,
            false,
            tokenInstanceofMatcher,
            tokenClassIdentity,
            tokenInstanceIdentity,
            false)

        expect(laFunc.call(commaParserMock)).to.equal(0)
        expect(laFunc.call(keyParserMock)).to.equal(0)
        expect(laFunc.call(entityParserMock)).to.equal(1)
        expect(laFunc.call(colonParserMock)).to.equal(undefined)
    })

    it("can compute the lookahead function for EMPTY OR sample", () => {
        let commaParserMock = new CommaParserMock()
        let keyParserMock = new KeyParserMock()
        let entityParserMock = new EntityParserMock()

        let laFunc = buildLookaheadFuncForOr(1,
            emptyAltOr,
            1,
            false,
            tokenInstanceofMatcher,
            tokenClassIdentity,
            tokenInstanceIdentity,
            false)

        expect(laFunc.call(keyParserMock)).to.equal(0)
        expect(laFunc.call(entityParserMock)).to.equal(1)
        // none matches so the last empty alternative should be taken (idx 2)
        expect(laFunc.call(commaParserMock)).to.equal(2)
    })
})

describe("The chevrotain grammar lookahead capabilities", () => {

    class Alpha extends Token {
        constructor() {super("A", 1, 1, 1, 1)}
    }

    class ExtendsAlpha extends Alpha {
    }

    class ExtendsAlphaAlpha extends ExtendsAlpha {
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

    augmentTokenClasses([Alpha, Beta, Delta, Gamma, Charlie, ExtendsAlphaAlpha])

    context("computing lookahead sequences for", () => {

        it("two simple one token alternatives", () => {
            let alt1 = new gast.Alternation([
                new gast.Flat([new gast.Terminal(Alpha)]),
                new gast.Flat([new gast.Terminal(Beta)]),
                new gast.Flat([new gast.Terminal(Beta)])
            ])
            let alt2 = new gast.Terminal(Gamma)

            let actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5)
            expect(actual).to.deep.equal([
                [[Alpha], [Beta]],
                [[Gamma]]
            ])
        })

        it("three simple one token alternatives", () => {
            let alt1 = new gast.Alternation([
                new gast.Flat([new gast.Terminal(Alpha)]),
                new gast.Flat([new gast.Terminal(Beta)]),
                new gast.Flat([new gast.Terminal(Beta)])
            ])
            let alt2 = new gast.Terminal(Gamma)
            let alt3 = new gast.Flat([new gast.Terminal(Delta), new gast.Terminal(Charlie)])

            let actual = lookAheadSequenceFromAlternatives([alt1, alt2, alt3], 5)
            expect(actual).to.deep.equal([
                [[Alpha], [Beta]],
                [[Gamma]],
                [[Delta]]
            ])
        })

        it("two complex multi token alternatives", () => {
            let alt1 = new gast.Alternation([
                new gast.Flat([new gast.Terminal(Alpha), new gast.Terminal(Beta)]),
                new gast.Flat([new gast.Terminal(Beta)]),
                new gast.Flat([new gast.Terminal(Alpha), new gast.Terminal(Gamma), new gast.Terminal(Delta)])
            ])
            let alt2 = new gast.Alternation([
                new gast.Flat([new gast.Terminal(Alpha), new gast.Terminal(Delta)]),
                new gast.Flat([new gast.Terminal(Charlie)])
            ])

            let actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5)
            expect(actual).to.deep.equal([
                [[Beta], [Alpha, Beta], [Alpha, Gamma]],
                [[Charlie], [Alpha, Delta]]
            ])
        })

        it("three complex multi token alternatives", () => {
            let alt1 = new gast.Alternation([
                new gast.Flat([new gast.Terminal(Alpha), new gast.Terminal(Beta), new gast.Terminal(Gamma)]),
                new gast.Flat([new gast.Terminal(Beta)])
            ])
            let alt2 = new gast.Alternation([
                new gast.Flat([new gast.Terminal(Alpha), new gast.Terminal(Delta)]),
                new gast.Flat([new gast.Terminal(Charlie)]),
                new gast.Flat([new gast.Terminal(Gamma), new gast.Terminal(Gamma)]),
            ])
            let alt3 = new gast.Alternation([
                new gast.Flat([new gast.Terminal(Alpha), new gast.Terminal(Beta), new gast.Terminal(Delta)]),
                new gast.Flat([new gast.Terminal(Charlie), new gast.Terminal(Beta)])
            ])


            let actual = lookAheadSequenceFromAlternatives([alt1, alt2, alt3], 5)
            expect(actual).to.deep.equal([
                [[Beta], [Alpha, Beta, Gamma]],
                [[Charlie], [Gamma], [Alpha, Delta]],
                [[Charlie, Beta], [Alpha, Beta, Delta]]
            ])

        })

        it("two complex multi token alternatives with shared prefix", () => {
            let alt1 = new gast.Flat([
                new gast.Terminal(Alpha),
                new gast.Terminal(Beta),
                new gast.Terminal(Charlie),
                new gast.Terminal(Delta)
            ])

            let alt2 = new gast.Flat([
                new gast.Terminal(Alpha),
                new gast.Terminal(Beta),
                new gast.Terminal(Charlie),
                new gast.Terminal(Delta),
                new gast.Terminal(Gamma),
                new gast.Terminal(Alpha)
            ])

            let actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5)
            expect(actual).to.deep.equal([
                [[Alpha, Beta, Charlie, Delta]],
                [[Alpha, Beta, Charlie, Delta, Gamma]]
            ])
        })

        it("simple ambiguous alternatives", () => {
            let alt1 = new gast.Flat([new gast.Terminal(Alpha)])
            let alt2 = new gast.Flat([new gast.Terminal(Alpha)])

            let actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5)
            expect(actual).to.deep.equal([
                [[Alpha]],
                [[Alpha]]
            ])
        })

        it("complex(multi-token) ambiguous alternatives", () => {
            let alt1 = new gast.Flat([
                new gast.Terminal(Alpha),
                new gast.Terminal(Beta),
                new gast.Terminal(Charlie)
            ])

            let alt2 = new gast.Flat([
                new gast.Terminal(Alpha),
                new gast.Terminal(Beta),
                new gast.Terminal(Charlie)
            ])

            let actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5)
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

        it("inheritance Alternative alternatives - positive", () => {
            let alternatives = [
                [[ExtendsAlphaAlpha]],  // 0
                [[ExtendsAlpha]], // 1
                [[Alpha]]           // 2
            ]
            let laFunc = buildAlternativesLookAheadFunc(alternatives,
                false,
                tokenInstanceofMatcher,
                tokenClassIdentity,
                tokenInstanceIdentity,
                false)

            expect(laFunc.call(new MockParser([Alpha]))).to.equal(2)
            expect(laFunc.call(new MockParser([ExtendsAlpha]))).to.equal(1)
            expect(laFunc.call(new MockParser([ExtendsAlphaAlpha]))).to.equal(0)
        })


        it("simple alternatives - positive", () => {
            let alternatives = [
                [[Alpha], [Beta]],  // 0
                [[Delta], [Gamma]], // 1
                [[Charlie]]           // 2
            ]
            let laFunc = buildAlternativesLookAheadFunc(alternatives,
                false,
                tokenInstanceofMatcher,
                tokenClassIdentity,
                tokenInstanceIdentity,
                false)

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
            let laFunc = buildAlternativesLookAheadFunc(alternatives,
                false,
                tokenInstanceofMatcher,
                tokenClassIdentity,
                tokenInstanceIdentity,
                false)

            expect(laFunc.call(new MockParser([]))).to.be.undefined
            expect(laFunc.call(new MockParser([Charlie]))).to.be.undefined
        })

        it("complex alternatives - positive", () => {
            let alternatives = [
                [[Alpha, Beta, Gamma], [Alpha, Beta, Delta]],  // 0
                [[Alpha, Beta, Beta]],                         // 1
                [[Alpha, Beta]]                                // 2 - Prefix of '1' alternative
            ]
            let laFunc = buildAlternativesLookAheadFunc(alternatives,
                false,
                tokenInstanceofMatcher,
                tokenClassIdentity,
                tokenInstanceIdentity,
                false)

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
            let laFunc = buildAlternativesLookAheadFunc(alternatives,
                false,
                tokenInstanceofMatcher,
                tokenClassIdentity,
                tokenInstanceIdentity,
                false)

            expect(laFunc.call(new MockParser([]))).to.be.undefined
            expect(laFunc.call(new MockParser([Alpha, Gamma, Gamma]))).to.be.undefined
            expect(laFunc.call(new MockParser([Charlie]))).to.be.undefined
            expect(laFunc.call(new MockParser([Beta, Alpha, Beta, Gamma]))).to.be.undefined
        })

        it("Empty alternatives", () => {
            let alternatives = [
                [[Alpha]],  // 0
                [[]]        // 1
            ]
            let laFunc = buildAlternativesLookAheadFunc(alternatives,
                false,
                tokenInstanceofMatcher,
                tokenClassIdentity,
                tokenInstanceIdentity,
                false)

            expect(laFunc.call(new MockParser([Alpha]))).to.equal(0)
            expect(laFunc.call(new MockParser([]))).to.equal(1) // empty alternative always matches
            expect(laFunc.call(new MockParser([Delta]))).to.equal(1) // empty alternative always matches
        })

        it("simple optional - positive", () => {
            let alternative = [[Alpha], [Beta], [Charlie]]
            let laFunc = buildSingleAlternativeLookaheadFunction(alternative,
                tokenInstanceofMatcher,
                tokenClassIdentity,
                tokenInstanceIdentity,
                false)

            expect(laFunc.call(new MockParser([Alpha]))).to.be.true
            expect(laFunc.call(new MockParser([Beta]))).to.be.true
            expect(laFunc.call(new MockParser([Charlie]))).to.be.true
        })

        it("simple optional - negative", () => {
            let alternative = [[Alpha], [Beta], [Charlie]]
            let laFunc = buildSingleAlternativeLookaheadFunction(alternative,
                tokenInstanceofMatcher,
                tokenClassIdentity,
                tokenInstanceIdentity,
                false)

            expect(laFunc.call(new MockParser([Delta]))).to.be.false
            expect(laFunc.call(new MockParser([Gamma]))).to.be.false
        })

        it("complex optional - positive", () => {
            let alternative = [[Alpha, Beta, Gamma], [Beta], [Charlie, Delta]]
            let laFunc = buildSingleAlternativeLookaheadFunction(alternative,
                tokenInstanceofMatcher,
                tokenClassIdentity,
                tokenInstanceIdentity,
                false)

            expect(laFunc.call(new MockParser([Alpha, Beta, Gamma]))).to.be.true
            expect(laFunc.call(new MockParser([Beta]))).to.be.true
            expect(laFunc.call(new MockParser([Charlie, Delta]))).to.be.true
        })

        it("complex optional - Negative", () => {
            let alternative = [[Alpha, Beta, Gamma], [Beta], [Charlie, Delta]]
            let laFunc = buildSingleAlternativeLookaheadFunction(alternative,
                tokenInstanceofMatcher,
                tokenClassIdentity,
                tokenInstanceIdentity,
                false)

            expect(laFunc.call(new MockParser([Alpha, Charlie, Gamma]))).to.be.false
            expect(laFunc.call(new MockParser([Charlie]))).to.be.false
            expect(laFunc.call(new MockParser([Charlie, Beta]))).to.be.false
        })
    })

})


