describe('My First Test', function () {

    it("clicking 'root' shows the right headings", function () {
        cy.visit('http://sap.github.io/chevrotain/performance/')

        cy.get(".value:visible").then((vals) => {
            vals.each((i, val) => {
                expect(val.innerHTML).to.eq("&nbsp;")
            })
        })

        cy.get(".Ohm").find(":checkbox").check()
        cy.get('#runAllButton').click()

        cy.get('#runAllButton').contains('Re-run', {timeout: 200000}).then((x) => {
            cy.get(".value:visible").then((vals) => {
                vals.each((i, val) => {
                    expect(/\d+(\.\d+)?/.test(val.innerHTML)).to.be.true
                })
            })
        })
    })
})

