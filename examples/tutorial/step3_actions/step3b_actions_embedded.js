// Written Docs for this tutorial step can be found here:
// https://chevrotain.io/docs/tutorial/step3b_adding_actions_embedded.html

// Tutorial Step 3:

// Adding a actions(semantics) embedded in the grammar.
// This is the highest performance approach, but its also verbose and none modular
// Therefore using the CST Visitor is the recommended approach:
// https://chevrotain.io/docs/tutorial/step3a_adding_actions_visitor.html
import {
  lex,
  Select,
  Comma,
  From,
  GreaterThan,
  Identifier,
  Integer,
  LessThan,
  allTokens,
  Where,
} from "../step1_lexing/step1_lexing.js";
import { EmbeddedActionsParser } from "chevrotain";

// ----------------- parser -----------------
class SelectParserEmbedded extends EmbeddedActionsParser {
  constructor() {
    super(allTokens);
    const $ = this;

    this.selectStatement = $.RULE("selectStatement", () => {
      let select, from, where;

      select = $.SUBRULE($.selectClause);
      from = $.SUBRULE($.fromClause);
      $.OPTION(() => {
        where = $.SUBRULE($.whereClause);
      });

      // Each Grammar rule can return a value, these values can be combined to create a new data structure
      // in our case an AST.
      return {
        type: "SELECT_STMT",
        selectClause: select,
        fromClause: from,
        // may be undefined if the OPTION was not entered.
        whereClause: where,
      };
    });

    this.selectClause = $.RULE("selectClause", () => {
      const columns = [];

      $.CONSUME(Select);
      $.AT_LEAST_ONE_SEP({
        SEP: Comma,
        DEF: () => {
          columns.push($.CONSUME(Identifier).image);
        },
      });

      return {
        type: "SELECT_CLAUSE",
        columns: columns,
      };
    });

    this.fromClause = $.RULE("fromClause", () => {
      let table;

      $.CONSUME(From);
      table = $.CONSUME(Identifier).image;

      return {
        type: "FROM_CLAUSE",
        table: table,
      };
    });

    this.whereClause = $.RULE("whereClause", () => {
      let condition;

      $.CONSUME(Where);
      condition = $.SUBRULE($.expression);

      return {
        type: "WHERE_CLAUSE",
        condition: condition,
      };
    });

    this.expression = $.RULE("expression", () => {
      let lhs, operator, rhs;

      lhs = $.SUBRULE($.atomicExpression);
      operator = $.SUBRULE($.relationalOperator);
      rhs = $.SUBRULE2($.atomicExpression); // note the '2' suffix to distinguish
      // from the 'SUBRULE(atomicExpression)'
      // 2 lines above.

      return {
        type: "EXPRESSION",
        lhs: lhs,
        operator: operator,
        rhs: rhs,
      };
    });

    this.atomicExpression = $.RULE("atomicExpression", () => {
      return $.OR([
        { ALT: () => $.CONSUME(Integer) },
        { ALT: () => $.CONSUME(Identifier) },
      ]).image;
    });

    this.relationalOperator = $.RULE("relationalOperator", () => {
      return $.OR([
        {
          ALT: () => $.CONSUME(GreaterThan),
        },
        {
          ALT: () => $.CONSUME(LessThan),
        },
      ]).image;
    });

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self-analysis phase.
    this.performSelfAnalysis();
  }
}

// We only ever need one as the parser internal state is reset for each new input.
const parserInstance = new SelectParserEmbedded();

export function toAstEmbedded(inputText) {
  const lexResult = lex(inputText);

  // ".input" is a setter which will reset the parser's internal's state.
  parserInstance.input = lexResult.tokens;

  // No semantic actions so this won't return anything yet.
  const ast = parserInstance.selectStatement();

  if (parserInstance.errors.length > 0) {
    throw Error(
      "Sad sad panda, parsing errors detected!\n" +
        parserInstance.errors[0].message,
    );
  }

  return ast;
}
