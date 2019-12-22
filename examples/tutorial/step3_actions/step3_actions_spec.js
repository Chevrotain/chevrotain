"use strict"
const expect = require("chai").expect
const _ = require("lodash")
const toAstVisitor = require("./step3a_actions_visitor").toAst
const toAstEmbedded = require("./step3b_actions_embedded").toAst

describe("Chevrotain Tutorial", () => {
  context("Step 3a - Actions (semantics) using CST Visitor", () => {
    it("Can convert a simple input to an AST", () => {
      const inputText = "SELECT column1, column2 FROM table2 WHERE column2 > 3"
      const ast = toAstVisitor(inputText)

      expect(ast).to.deep.equal({
        type: "SELECT_STMT",
        selectClause: {
          type: "SELECT_CLAUSE",
          columns: ["column1", "column2"]
        },
        fromClause: {
          type: "FROM_CLAUSE",
          table: "table2"
        },
        whereClause: {
          condition: {
            lhs: "column2",
            operator: ">",
            rhs: "3",
            type: "EXPRESSION"
          },
          type: "WHERE_CLAUSE"
        }
      })
    })
  })

  context("Step 3a - Actions (semantics) using embedded actions", () => {
    it("Can convert a simple input to an AST", () => {
      const inputText = "SELECT column1, column2 FROM table2 WHERE column2 > 3"
      const ast = toAstEmbedded(inputText)

      expect(ast).to.deep.equal({
        type: "SELECT_STMT",
        selectClause: {
          type: "SELECT_CLAUSE",
          columns: ["column1", "column2"]
        },
        fromClause: {
          type: "FROM_CLAUSE",
          table: "table2"
        },
        whereClause: {
          condition: {
            lhs: "column2",
            operator: ">",
            rhs: "3",
            type: "EXPRESSION"
          },
          type: "WHERE_CLAUSE"
        }
      })
    })
  })
})
