const expect = require("chai").expect
const { tokenize } = require("./custom_errors")

describe("A Chevrotain Lexer ability to customize error messages.", () => {
    it("Can create an 'Oy Vey' error message", () => {
        // Only A-C are supported
        const text = `A B C D`
        const lexResult = tokenize(text)

        expect(lexResult.errors).to.have.lengthOf(1)
        expect(lexResult.errors[0].message).to.include("Oy Vey!!!")
    })
})
