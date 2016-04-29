import {gast} from "../../../src/parse/grammar/gast_public"

let Terminal = gast.Terminal
let Option = gast.Option
let Alternation = gast.Alternation
let Flat = gast.Flat

import {first} from "../../../src/parse/grammar/first"
import {EntityTok, CommaTok, NamespaceTok, TypeTok, ColonTok, ConstTok} from "./samples"
import {setEquality} from "../../utils/matchers"

describe("The Grammar Ast first model", () => {
    "use strict"

    it("can compute the first for a terminal", () => {
        let terminal = new Terminal(EntityTok)
        let actual = first(terminal)
        expect(actual.length).to.equal(1)
        expect(actual[0]).to.equal(EntityTok)

        let terminal2 = new Terminal(CommaTok)
        let actual2 = first(terminal2)
        expect(actual2.length).to.equal(1)
        expect(actual2[0]).to.equal(CommaTok)
    })

    it("can compute the first for a Sequence production ", () => {
        let seqProduction = new Flat([new Terminal(EntityTok)])
        let actual = first(seqProduction)
        expect(actual.length).to.equal(1)
        expect(actual[0]).to.equal(EntityTok)

        let seqProduction2 = new Flat(
            [
                new Terminal(EntityTok),
                new Option([new Terminal(NamespaceTok)])
            ])
        let actual2 = first(seqProduction2)
        expect(actual2.length).to.equal(1)
        expect(actual2[0]).to.equal(EntityTok)
    })

    it("can compute the first for an alternatives production ", () => {
        let altProduction = new Alternation(
            [
                new Flat([
                    new Terminal(EntityTok),
                ]),
                new Flat([
                    new Terminal(NamespaceTok),
                ]),
                new Flat([
                    new Terminal(TypeTok)
                ])
            ])
        let actual = first(altProduction)
        expect(actual.length).to.equal(3)
        expect(actual[0]).to.equal(EntityTok)
        expect(actual[1]).to.equal(NamespaceTok)
        expect(actual[2]).to.equal(TypeTok)

    })

    it("can compute the first for an production with optional prefix", () => {
        let withOptionalPrefix = new Flat(
            [
                new Option([new Terminal(NamespaceTok)]),
                new Terminal(EntityTok)
            ])
        let actual = first(withOptionalPrefix)
        setEquality(actual, [NamespaceTok, EntityTok])


        let withTwoOptPrefix = new Flat(
            [
                new Option([new Terminal(NamespaceTok)]),
                new Option([new Terminal(ColonTok)]),
                new Terminal(EntityTok),
                new Option([new Terminal(ConstTok)])
            ])
        let actual2 = first(withTwoOptPrefix)
        setEquality(actual2, [NamespaceTok, ColonTok, EntityTok])
    })

})
