var expect = require("chai").expect;
var multiModeLexer = require("./multi_mode_lexer");

describe('The Chevrotain Lexer ability switch between Lexer modes', function() {

    it('Can Lex an input that requires multiple modes successfully', function() {

        var input = "1 LETTERS G A G SIGNS & EXIT_SIGNS B EXIT_LETTERS 3"
        var lexResult = multiModeLexer.tokenize(input)
        expect(lexResult.errors).to.be.empty

        var images = lexResult.tokens.map(function(currTok) {
            return currTok.image
        })
        expect(images).to.deep.equal([
            // by default starting with the "first" mode "numbers_mode".
            // The ".tokenize" method can accept an optional inital mode argument as the second parameter.
            "1",
            "LETTERS", // entering "letters_mode"
            "G",
            "A",
            "G",
            "SIGNS", // entering "signs_mode".
            "&",
            "EXIT_SIGNS", // popping the last mode, we are now back in "letters_mode"
            "B",
            "EXIT_LETTERS", // popping the last mode, we are now back in "numbers_mode"
            "3"
        ])
    });

    it('Will create a Lexing error when a Token which is not supported in the current mode is encountred', function() {

        var input = "1 LETTERS 2" // 2 is not allowed in letters mode!
        var lexResult = multiModeLexer.tokenize(input)
        expect(lexResult.errors).to.have.lengthOf(1)
        expect(lexResult.errors[0].message).to.contain("unexpected character")
        expect(lexResult.errors[0].message).to.contain("2")
        expect(lexResult.errors[0].message).to.contain("at offset: 10")

        var images = lexResult.tokens.map(function(currTok) {
            return currTok.image
        })
        expect(images).to.deep.equal([
            "1",
            "LETTERS"
        ])

    });

});
