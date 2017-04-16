const expect = require("chai").expect
const tokenMatcher = require("chevrotain").tokenMatcher
const lex = require("./step1_lexing").lex
const parse = require("./step2_parsing").parse
const toAstVisitor = require("./step3a_actions_visitor").toAst
const toAstEmbedded = require("./step3b_actions_embedded").toAst
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
            expect(tokenMatcher(tokens[1], tokenVocabulary.Identifier)).to.be.true
            expect(tokenMatcher(tokens[2], tokenVocabulary.From)).to.be.true
            expect(tokenMatcher(tokens[3], tokenVocabulary.Identifier)).to.be.true
        })
    })

    context("Step 2 - Parsing", () => {
        it("Can Parse a simple input", () => {
            let inputText = "SELECT column1 FROM table2"
            expect(() => parse(inputText)).to.not.throw()
        })

        it("Will throw an error for an invalid input", () => {
            // missing table name
            let inputText = "SELECT FROM table2"
            expect(() => parse(inputText))
                .to.throw("expecting at least one iteration which starts with one of these possible Token sequences")
            expect(() => parse(inputText))
                .to.throw("<[Identifier]> but found: 'FROM'")
        })
    })

    context("Step 3a - Actions (semantics) using CST Visitor", () => {
        it("Can convert a simple input to an AST", () => {
            let inputText = "SELECT column1, column2 FROM table2 WHERE column2 > 3"
            let ast = toAstVisitor(inputText)

            expect(ast).to.deep.equal({
                "type":         "SELECT_STMT",
                "selectClause": {
                    "type":    "SELECT_CLAUSE",
                    "columns": [
                        "column1",
                        "column2"
                    ]
                },
                "fromClause":   {
                    "type":  "FROM_CLAUSE",
                    "table": "table2"
                },
                "whereClause":  {
                    "condition": {
                        "lhs":      "column2",
                        "operator": ">",
                        "rhs":      "3",
                        "type":     "EXPRESSION"
                    },
                    "type":      "WHERE_CLAUSE"
                }
            })
        })
    })

    context("Step 3a - Actions (semantics) using embedded actions", () => {
        it("Can convert a simple input to an AST", () => {
            let inputText = "SELECT column1, column2 FROM table2 WHERE column2 > 3"
            let ast = toAstEmbedded(inputText)

            expect(ast).to.deep.equal({
                "type":         "SELECT_STMT",
                "selectClause": {
                    "type":    "SELECT_CLAUSE",
                    "columns": [
                        "column1",
                        "column2"
                    ]
                },
                "fromClause":   {
                    "type":  "FROM_CLAUSE",
                    "table": "table2"
                },
                "whereClause":  {
                    "condition": {
                        "lhs":      "column2",
                        "operator": ">",
                        "rhs":      "3",
                        "type":     "EXPRESSION"
                    },
                    "type":      "WHERE_CLAUSE"
                }
            })
        })
    })
})
