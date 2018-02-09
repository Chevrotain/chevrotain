const { expect } = require("chai")

describe("The experimental Content Assist Parser Example", () => {
    const getContentAssist = require("./experimental_content_assist_in_parser_flow")
        .getContentAssist

    const symbolTable = {
        tableNames: ["employees", "managers", "aliens", "allies"],
        columnNames: ["name", "age", "tenure", "salary"]
    }

    context("works even on invalid inputs!", () => {
        it("missing <FROM> keyword", () => {
            // content assist point:                                   ^
            const inputText = "SELECT name, age, salary managers WHERE ag > 67" // MISSING the <FROM> between salary and managers
            const suggestions = getContentAssist(inputText, 42, symbolTable)
            expect(suggestions)
                .to.have.members(["age"])
                .and.to.have.lengthOf(1)
        })

        it("redundant Comma", () => {
            // content assist point:                    ^
            const inputText = "SELECT name, age, FROM empl " // redundant <comma> after age
            const suggestions = getContentAssist(inputText, 27, symbolTable)
            expect(suggestions)
                .to.have.members(["employees"])
                .and.to.have.lengthOf(1)
        })

        it("missing <SELECT> keyword", () => {
            // content assist point:   ^
            const inputText = "name, age  " // missing the <SELECT> at the beginning of the statement
            const suggestions = getContentAssist(inputText, 10, symbolTable)
            expect(suggestions)
                .to.have.members(["FROM"])
                .and.to.have.lengthOf(1)
        })
    })

    context("can perform content assist in <selectClause>", () => {
        it("after column names", () => {
            // content assist point:          ^
            const inputText = "SELECT name, age  "
            const suggestions = getContentAssist(inputText, 17, symbolTable)
            expect(suggestions)
                .to.have.members(["FROM"])
                .and.to.have.lengthOf(1)

            // content assist point:                    ^
            const inputTextWithSuffix = "SELECT name, age   aliens"
            expect(
                getContentAssist(inputTextWithSuffix, 17, symbolTable)
            ).to.deep.equal(suggestions)
        })

        it("after column names with prefix", () => {
            // content assist point:       ^
            const inputText = "SELECT name FR  "
            const suggestions = getContentAssist(inputText, 13, symbolTable)
            expect(suggestions)
                .to.have.members(["FROM"])
                .and.to.have.lengthOf(1)

            // content assist point:                 ^
            const inputTextWithSuffix = "SELECT name FR  managers"
            expect(
                getContentAssist(inputTextWithSuffix, 13, symbolTable)
            ).to.deep.equal(suggestions)
        })

        it("in column names", () => {
            // content assist point:      ^
            const inputText = "SELECT name,  "
            const suggestions = getContentAssist(inputText, 13, symbolTable)
            expect(suggestions)
                .to.have.members(["name", "age", "tenure", "salary"])
                .and.to.have.lengthOf(4)

            // content assist point:                ^
            const inputTextWithSuffix = "SELECT name,   salary"
            expect(
                getContentAssist(inputTextWithSuffix, 13, symbolTable)
            ).to.deep.equal(suggestions)
        })

        it("in column names with prefix", () => {
            // content assist point:         ^
            const inputText = "SELECT name, sal "
            const suggestions = getContentAssist(inputText, 16, symbolTable)
            expect(suggestions)
                .to.have.members(["salary"])
                .and.to.have.lengthOf(1)

            // content assist point:                   ^
            const inputTextWithSuffix = "SELECT name, sal FROM"
            expect(
                getContentAssist(inputTextWithSuffix, 16, symbolTable)
            ).to.deep.equal(suggestions)
        })
    })

    context("can perform content assist in <fromClause>", () => {
        it("after table name", () => {
            // content assist point:                      ^
            const inputText = "SELECT name, age FROM aliens  "
            const suggestions = getContentAssist(inputText, 29, symbolTable)
            expect(suggestions)
                .to.have.members(["WHERE"])
                .and.to.have.lengthOf(1)

            // content assist point:                                ^
            const inputTextWithSuffix = "SELECT name, age FROM aliens   WHERE"
            expect(
                getContentAssist(inputTextWithSuffix, 29, symbolTable)
            ).to.deep.equal(suggestions)
        })

        it("after table name with prefix", () => {
            // content assist point:                         ^
            const inputText = "SELECT name, age FROM aliens WHE "
            const suggestions = getContentAssist(inputText, 32, symbolTable)
            expect(suggestions)
                .to.have.members(["WHERE"])
                .and.to.have.lengthOf(1)

            // content assist point:                                   ^
            const inputTextWithSuffix =
                "SELECT name, age FROM aliens WHE  age > 99"
            expect(
                getContentAssist(inputTextWithSuffix, 32, symbolTable)
            ).to.deep.equal(suggestions)
        })

        it("in table name", () => {
            // content assist point:               ^
            const inputText = "SELECT name, age FROM  "
            const suggestions = getContentAssist(inputText, 22, symbolTable)
            expect(suggestions)
                .to.have.members(["employees", "managers", "aliens", "allies"])
                .and.to.have.lengthOf(4)

            // content assist point:                         ^
            const inputTextWithSuffix = "SELECT name, age FROM   where age < 99"
            expect(
                getContentAssist(inputTextWithSuffix, 22, symbolTable)
            ).to.deep.equal(suggestions)
        })

        it("in table name with prefix", () => {
            // content assist point:            ^
            const inputText = "SELECT name FROM al "
            const suggestions = getContentAssist(inputText, 19, symbolTable)
            expect(suggestions)
                .to.have.members(["aliens", "allies"])
                .and.to.have.lengthOf(2)

            // content assist point:                      ^
            const inputTextWithSuffix = "SELECT name FROM al  WHERE"
            expect(
                getContentAssist(inputTextWithSuffix, 19, symbolTable)
            ).to.deep.equal(suggestions)
        })
    })

    context("can perform content assist in <whereClause>", () => {
        it("after WHERE keyword", () => {
            // content assist point:                            ^
            const inputText = "SELECT name, age FROM aliens WHERE  "
            const suggestions = getContentAssist(inputText, 35, symbolTable)
            expect(suggestions)
                .to.have.members(["name", "age", "tenure", "salary"])
                .and.to.have.lengthOf(4)

            // content assist point:                                      ^
            const inputTextWithSuffix =
                "SELECT name, age FROM aliens WHERE   > tenure"
            expect(
                getContentAssist(inputTextWithSuffix, 35, symbolTable)
            ).to.deep.equal(suggestions)
        })

        it("after column name keyword with prefix", () => {
            // content assist point:                               ^
            const inputText = "SELECT name, age FROM aliens WHERE ten  "
            const suggestions = getContentAssist(inputText, 38, symbolTable)
            expect(suggestions)
                .to.have.members(["tenure"])
                .and.to.have.lengthOf(1)

            // content assist point:                                         ^
            const inputTextWithSuffix =
                "SELECT name, age FROM aliens WHERE ten  < age"
            expect(
                getContentAssist(inputTextWithSuffix, 38, symbolTable)
            ).to.deep.equal(suggestions)
        })

        it("after operator", () => {
            // content assist point:                                    ^
            const inputText = "SELECT name, age FROM managers WHERE age >  "
            const suggestions = getContentAssist(inputText, 43, symbolTable)
            expect(suggestions)
                .to.have.members(["name", "age", "tenure", "salary"])
                .and.to.have.lengthOf(4)
        })

        it("after operator with prefix", () => {
            // content assist point:                                       ^
            const inputText = "SELECT name, age FROM managers WHERE age >  na "
            const suggestions = getContentAssist(inputText, 46, symbolTable)
            expect(suggestions)
                .to.have.members(["name"])
                .and.to.have.lengthOf(1)
        })
    })
})
