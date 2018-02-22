"use strict"
// Written Docs for this tutorial step can be found here:
// https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step3a_adding_actions_separated.md

// Tutorial Step 3a:

// Adding Actions(semantics) to our grammar using a CST Visitor.

const selectLexer = require("../step1_lexing/step1_lexing")
// re-using the parser implemented in step two.
const parser = require("../step2_parsing/step2_parsing")
const SelectParser = parser.SelectParser

// A new parser instance  with CST output enabled.
const parserInstance = new SelectParser([], { outputCst: true })
// The base visitor class can be accessed via the a parser instance.
const BaseSQLVisitor = parserInstance.getBaseCstVisitorConstructor()

class SQLToAstVisitor extends BaseSQLVisitor {
    constructor() {
        super()
        this.validateVisitor()
    }

    selectStatement(ctx) {
        // "this.visit" can be used to visit none-terminals and will invoke the correct visit method for the CstNode passed.
        let select = this.visit(ctx.selectClause)

        //  "this.visit" can work on either a CstNode or an Array of CstNodes.
        //  If an array is passed (ctx.fromClause is an array) it is equivalent
        //  to passing the first element of that array
        let from = this.visit(ctx.fromClause)

        // "whereClause" is optional, "this.visit" will ignore empty arrays (optional)
        let where = this.visit(ctx.whereClause)

        return {
            type: "SELECT_STMT",
            selectClause: select,
            fromClause: from,
            whereClause: where
        }
    }

    selectClause(ctx) {
        // Each Terminal or Non-Terminal in a grammar rule are collected into
        // an array with the same name(key) in the ctx object.
        let columns = ctx.Identifier.map(identToken => identToken.image)

        return {
            type: "SELECT_CLAUSE",
            columns: columns
        }
    }

    fromClause(ctx) {
        let tableName = ctx.Identifier[0].image

        return {
            type: "FROM_CLAUSE",
            table: tableName
        }
    }

    whereClause(ctx) {
        let condition = this.visit(ctx.expression)

        return {
            type: "WHERE_CLAUSE",
            condition: condition
        }
    }

    expression(ctx) {
        let lhs = this.visit(ctx.atomicExpression[0])
        // The second [1] atomicExpression is the right hand side
        let rhs = this.visit(ctx.atomicExpression[1])
        let operator = this.visit(ctx.relationalOperator)

        return {
            type: "EXPRESSION",
            lhs: lhs,
            operator: operator,
            rhs: rhs
        }
    }

    // these two visitor methods will return a string.
    atomicExpression(ctx) {
        if (ctx.Integer) {
            return ctx.Integer[0].image
        } else {
            return ctx.Identifier[0].image
        }
    }

    relationalOperator(ctx) {
        if (ctx.GreaterThan) {
            return ctx.GreaterThan[0].image
        } else {
            return ctx.LessThan[0].image
        }
    }
}

// Our visitor has no state, so a single instance is sufficient.
const toAstVisitorInstance = new SQLToAstVisitor()

module.exports = {
    toAst: function(inputText) {
        let lexResult = selectLexer.lex(inputText)

        // ".input" is a setter which will reset the parser's internal's state.
        parserInstance.input = lexResult.tokens

        // Automatic CST created when parsing
        let cst = parserInstance.selectStatement()

        if (parserInstance.errors.length > 0) {
            throw Error(
                "Sad sad panda, parsing errors detected!\n" +
                    parserInstance.errors[0].message
            )
        }

        let ast = toAstVisitorInstance.visit(cst)

        return ast
    }
}
