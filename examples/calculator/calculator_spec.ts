/// <reference path="calculator.ts" />
/// <reference path="../../src/parse/recognizer.ts" />
/// <reference path="../../src/scan/tokens.ts" />
/// <reference path="../../libs/jasmine.d.ts" />


module chevrotain.examples.calculator.spec {

    import recog = chevrotain.recognizer

    function expValue(text:string):number {
        var lexResult = CalculatorLexer.tokenize(text)
        expect(lexResult.errors.length).toBe(0)
        var calculator = new Calculator(lexResult.tokens)
        var expValue = calculator.expression()
        expect(calculator.errors.length).toBe(0)
        expect(calculator.isAtEndOfInput()).toBe(true)
        return expValue
    }

    describe("The Simple Calculator example", function () {

        it("can calculate an expression", function () {
            expect(expValue("1 + 2")).toBe(3)
        })

        it("can calculate an expression with operator precedence", function () {
            // if it was evaluated left to right without taking into account precedence the result would have been 9
            expect(expValue("1 + 2 * 3")).toBe(7)
        })

        it("can calculate an expression with operator precedence #2", function () {
            expect(expValue("(1 + 2) * 3")).toBe(9)
        })

        it("can calculate an expression with many parenthesis", function () {
            expect(expValue("((((666))))")).toBe(666)
        })

    })
}
