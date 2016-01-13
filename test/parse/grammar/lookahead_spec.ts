import {Parser} from "../../../src/parse/parser_public"
import {Token} from "../../../src/scan/tokens_public"
import {ColonTok, IdentTok, CommaTok, EntityTok, KeyTok, ActionTok, actionDec, lotsOfOrs, emptyAltOr} from "./samples"
import {
    checkAlternativesAmbiguities,
    buildLookaheadForTopLevel,
    buildLookaheadForOr,
    buildLookaheadForOption,
    buildLookaheadForMany
} from "../../../src/parse/grammar/lookahead"

class ColonParserMock extends Parser {
    protected NEXT_TOKEN():Token {
        return new ColonTok(":", 0, 1, 1)
    }
}

class IdentParserMock extends Parser {
    protected NEXT_TOKEN():Token {
        return new IdentTok("bamba", 0, 1, 1)
    }
}

class CommaParserMock extends Parser {
    protected NEXT_TOKEN():Token {
        return new CommaTok(",", 0, 1, 1)
    }
}

class EntityParserMock extends Parser {
    protected NEXT_TOKEN():Token {
        return new EntityTok(",", 0, 1, 1)
    }
}

class KeyParserMock extends Parser {
    protected NEXT_TOKEN():Token {
        return new KeyTok(",", 0, 1, 1)
    }
}

class ActionParserMock extends Parser {
    protected NEXT_TOKEN():Token {
        return new ActionTok(",", 0, 1, 1)
    }
}

describe("The Grammar Lookahead namespace", function () {
    "use strict"

    it("can compute the lookahead function for the first OPTION in ActionDec", function () {
        let laFunc = buildLookaheadForOption(1, actionDec)

        expect(laFunc.call(new ColonParserMock([], []))).to.equal(false)
        expect(laFunc.call(new IdentParserMock([], []))).to.equal(true)
    })

    it("can compute the lookahead function for the second OPTION in ActionDec", function () {
        let laFunc = buildLookaheadForOption(2, actionDec)

        expect(laFunc.call(new ColonParserMock([], []))).to.equal(true)
        expect(laFunc.call(new IdentParserMock([], []))).to.equal(false)
    })

    it("can compute the lookahead function for the first MANY in ActionDec", function () {
        let laFunc = buildLookaheadForMany(1, actionDec)

        expect(laFunc.call(new CommaParserMock([], []))).to.equal(true)
        expect(laFunc.call(new IdentParserMock([], []))).to.equal(false)
    })

    it("can compute the lookahead function for lots of ORs sample", function () {
        let laFunc = buildLookaheadForOr(1, lotsOfOrs)

        expect(laFunc.call(new CommaParserMock([], []))).to.equal(0)
        expect(laFunc.call(new KeyParserMock([], []))).to.equal(0)
        expect(laFunc.call(new EntityParserMock([], []))).to.equal(1)
        expect(laFunc.call(new ColonParserMock([], []))).to.equal(-1)
    })

    it("can compute the lookahead function for EMPTY OR sample", function () {
        let laFunc = buildLookaheadForOr(1, emptyAltOr)

        expect(laFunc.call(new KeyParserMock([], []))).to.equal(0)
        expect(laFunc.call(new EntityParserMock([], []))).to.equal(1)
        // none matches so the last empty alternative should be taken (idx 2)
        expect(laFunc.call(new CommaParserMock([], []))).to.equal(2)
    })

    it("can compute the lookahead function for a Top Level Rule", function () {
        let laFunc = buildLookaheadForTopLevel(actionDec)

        expect(laFunc.call(new ActionParserMock([], []))).to.equal(true)
        expect(laFunc.call(new IdentParserMock([], []))).to.equal(false)
    })

    it("can compute the lookahead function for a Top Level Rule #2", function () {
        let laFunc = buildLookaheadForTopLevel(lotsOfOrs)

        expect(laFunc.call(new CommaParserMock([], []))).to.equal(true)
        expect(laFunc.call(new EntityParserMock([], []))).to.equal(true)
        expect(laFunc.call(new KeyParserMock([], []))).to.equal(true)
        expect(laFunc.call(new ActionParserMock([], []))).to.equal(false)
    })
})

class A extends Token {}
class B extends Token {}
class C extends Token {}
class D extends Token {}
class E extends Token {}

describe("The Grammar Lookahead namespace", function () {

    it("can detect ambiguities when calculating lookahead functions for OR alternatives", function () {
        let input = [[A, B], [C, D], [E, C]]
        let ambiguities = checkAlternativesAmbiguities(input)
        expect(ambiguities.length).to.equal(1)
        expect(ambiguities[0].alts).to.deep.equal([2, 3])
    })
})
