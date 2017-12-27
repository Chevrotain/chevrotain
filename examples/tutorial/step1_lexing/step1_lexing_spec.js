"use strict"
const expect = require("chai").expect
const _ = require("lodash")
const tokenMatcher = require("../../../lib/chevrotain").tokenMatcher
const lex = require("./step1_lexing").lex
const tokenVocabulary = require("./step1_lexing").tokenVocabulary

describe("Chevrotain Tutorial", () => {
    context("Step 1 - Lexing", () => {
        it("Can Lex a simple input", () => {
            let inputText = "SELECT column1 FROM table2"
            let lexingResult = lex(inputText)

            expect(lexingResult.errors).to.be.empty

            let tokens = lexingResult.tokens
            expect(tokens).to.have.lengthOf(4)
            expect(tokens[0].image).to.equal("SELECT")
            expect(tokens[1].image).to.equal("column1")
            expect(tokens[2].image).to.equal("FROM")
            expect(tokens[3].image).to.equal("table2")

            // tokenMatcher acts as an "instanceof" check for Tokens
            expect(tokenMatcher(tokens[0], tokenVocabulary.Select)).to.be.true
            expect(tokenMatcher(tokens[1], tokenVocabulary.Identifier)).to.be
                .true
            expect(tokenMatcher(tokens[2], tokenVocabulary.From)).to.be.true
            expect(tokenMatcher(tokens[3], tokenVocabulary.Identifier)).to.be
                .true
        })
    })
})
