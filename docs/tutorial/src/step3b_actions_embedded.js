"use strict"
// Written Docs for this tutorial step can be found here:
// https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step3b_adding_actions_embedded.md

// Tutorial Step 3:

// Adding a actions(semantics) embedded in the grammar.
// This is the highest performance approach, but its also verbose and none modular
// Therefore using the CST Visitor is the recommended approach:
// https://github.com/SAP/chevrotain/blob/master/docs/tutorial/src/step3a_actions_visitor.js

const selectLexer = require("./step1_lexing")
const Parser = require("chevrotain").Parser
const tokenVocabulary = selectLexer.tokenVocabulary

// individual imports, prefer ES6 imports if supported in your runtime/transpiler...
const Select = tokenVocabulary.Select
const From = tokenVocabulary.From
const Where = tokenVocabulary.Where
const Identifier = tokenVocabulary.Identifier
const Integer = tokenVocabulary.Integer
const GreaterThan = tokenVocabulary.GreaterThan
const LessThan = tokenVocabulary.LessThan
const Comma = tokenVocabulary.Comma

// ----------------- parser -----------------
class SelectParserEmbedded extends Parser {

    constructor(input) {
        super(input, tokenVocabulary)
        const $ = this

        this.selectStatement = $.RULE("selectStatement", () => {
            let select, from, where

            select = $.SUBRULE($.selectClause)
            from = $.SUBRULE($.fromClause)
            $.OPTION(() => {
                where = $.SUBRULE($.whereClause)
            })

            // Each Grammar rule can return a value, these values can be combined to create a new data structure
            // in our case an AST.
            return {
                type:         "SELECT_STMT",
                selectClause: select,
                fromClause:   from,
                // may be undefined if the OPTION was not entered.
                whereClause:  where
            }
        })

        this.selectClause = $.RULE("selectClause", () => {
            let columns = []

            $.CONSUME(Select)
            $.AT_LEAST_ONE_SEP({
                SEP: Comma, DEF: () => {
                    columns.push($.CONSUME(Identifier).image)
                }
            })

            return {
                type:    "SELECT_CLAUSE",
                columns: columns
            }
        })

        this.fromClause = $.RULE("fromClause", () => {
            let table

            $.CONSUME(From)
            table = $.CONSUME(Identifier).image

            return {
                type:  "FROM_CLAUSE",
                table: table
            }
        })

        this.whereClause = $.RULE("whereClause", () => {
            let condition

            $.CONSUME(Where)
            condition = $.SUBRULE($.expression)

            return {
                type:      "WHERE_CLAUSE",
                condition: condition
            }
        })

        this.expression = $.RULE("expression", () => {
            let lhs, operator, rhs

            lhs = $.SUBRULE($.atomicExpression)
            operator = $.SUBRULE($.relationalOperator)
            rhs = $.SUBRULE2($.atomicExpression) // note the '2' suffix to distinguish
            // from the 'SUBRULE(atomicExpression)'
            // 2 lines above.

            return {
                type:     "EXPRESSION",
                lhs:      lhs,
                operator: operator,
                rhs:      rhs
            }
        })

        this.atomicExpression = $.RULE("atomicExpression", () => {
            return $.OR([
                {ALT: () => $.CONSUME(Integer)},
                {ALT: () => $.CONSUME(Identifier)}
            ]).image
        })

        this.relationalOperator = $.RULE("relationalOperator", () => {
            return $.OR([
                {ALT: () => $.CONSUME(GreaterThan)},
                {ALT: () => $.CONSUME(LessThan)}
            ]).image
        })

        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this)
    }
}

// We only ever need one as the parser internal state is reset for each new input.
const parserInstance = new SelectParserEmbedded([])

module.exports = {
    toAst: function(inputText) {
        let lexResult = selectLexer.lex(inputText)

        // ".input" is a setter which will reset the parser's internal's state.
        parserInstance.input = lexResult.tokens

        // No semantic actions so this won't return anything yet.
        let ast = parserInstance.selectStatement()

        if (parserInstance.errors.length > 0) {
            throw Error("Sad sad panda, parsing errors detected!\n" + parserInstance.errors[0].message)
        }

        return ast
    }
}
