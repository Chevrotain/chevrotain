import { expect } from "chai";
import { toAstVisitor } from "./step3a_actions_visitor.js";
import { toAstEmbedded } from "./step3b_actions_embedded.js";

describe("Chevrotain Tutorial", () => {
  context("Step 3a - Actions (semantics) using CST Visitor", () => {
    it("Can convert a simple input to an AST", () => {
      const inputText = "SELECT column1, column2 FROM table2 WHERE column2 > 3";
      const ast = toAstVisitor(inputText);

      expect(ast).to.deep.equal({
        type: "SELECT_STMT",
        selectClause: {
          type: "SELECT_CLAUSE",
          columns: ["column1", "column2"],
        },
        fromClause: {
          type: "FROM_CLAUSE",
          table: "table2",
        },
        whereClause: {
          condition: {
            lhs: "column2",
            operator: ">",
            rhs: "3",
            type: "EXPRESSION",
          },
          type: "WHERE_CLAUSE",
        },
      });
    });
  });

  context("Step 3a - Actions (semantics) using embedded actions", () => {
    it("Can convert a simple input to an AST", () => {
      const inputText = "SELECT column1, column2 FROM table2 WHERE column2 > 3";
      const ast = toAstEmbedded(inputText);

      expect(ast).to.deep.equal({
        type: "SELECT_STMT",
        selectClause: {
          type: "SELECT_CLAUSE",
          columns: ["column1", "column2"],
        },
        fromClause: {
          type: "FROM_CLAUSE",
          table: "table2",
        },
        whereClause: {
          condition: {
            lhs: "column2",
            operator: ">",
            rhs: "3",
            type: "EXPRESSION",
          },
          type: "WHERE_CLAUSE",
        },
      });
    });
  });
});
