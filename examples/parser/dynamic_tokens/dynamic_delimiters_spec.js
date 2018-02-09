const { expect } = require("chai")
const parse = require("./dynamic_delimiters")

describe("The Dynamic Delimiters Example", () => {
    it("Can Parse an array using built-in comma delimiter", () => {
        const actual = parse("[1, 2, 3, 4, 5]").value
        expect(actual).to.equal("12345")
    })

    it("Can Parse an array using custom dynamic '_' delimiter", () => {
        const actual = parse("[1 _ 2 _ 4 _ 8]", /_/).value
        expect(actual).to.equal("1248")
    })

    it("Can Parse an array using BOTH custom and built in delimiters", () => {
        const actual = parse("[3 _ 6, 9 _ 12]", /_/).value
        expect(actual).to.equal("36912")
    })
})
