describe('Performance Page Test', function () {

    it("clicking 'root' shows the right headings", function () {
        cy.visit('http://sap.github.io/chevrotain/performance/')

        // ensure the result table is empty before we started
        cy.get(".value:visible").then((vals) => {
            vals.each((i, val) => {
                expect(val.innerHTML).to.eq("&nbsp;")
            })
        })

        cy.get(":checkbox:visible").uncheck().check()
        // Ohm is too slow to be benched in CI containers.
        cy.get(".Ohm").find(":checkbox").uncheck()

        // start The benchmark
        cy.get('#runAllButton').click()

        // the runAllButton changing it's text to Re-run would indicate the end of the benchmark.
        cy.get('#runAllButton').contains('Re-run', {timeout: 200000}).then((x) => {
            cy.get(".value:visible").then((vals) => {
                vals.each((i, val) => {
                    // working directly on the DOM because my JQuery skills are weak :)
                    // I don't think this direct access would even be possible in selenium.
                    if (val.parentElement.parentElement.classList[1] !== "Ohm") {
                        // ensure the result table has valid numerical results
                        expect(/\d+(\.\d+)?/.test(val.innerHTML)).to.be.true
                    }
                })
            })
        })
    })
})

