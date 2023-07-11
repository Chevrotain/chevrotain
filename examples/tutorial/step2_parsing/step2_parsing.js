// Written Docs for this tutorial step can be found here:
// https://chevrotain.io/docs/tutorial/step2_parsing.html

// Tutorial Step 2:

// Adding a Parser (grammar only, only reads the input without any actions).
// Using the Token Vocabulary defined in the previous step.

import {
  selectLexer,
  allTokens,
  Select,
  From,
  Where,
  LessThan,
  GreaterThan,
  Comma,
  Identifier,
  Integer,
} from "../step1_lexing/step1_lexing.js";
import { CstParser } from "chevrotain";

// ----------------- parser -----------------
export class SelectParser extends CstParser {
  constructor() {
    super(allTokens);

    // for conciseness
    const $ = this;

    $.RULE("selectStatement", () => {
      $.SUBRULE($.selectClause);
      $.SUBRULE($.fromClause);
      $.OPTION(() => {
        $.SUBRULE($.whereClause);
      });
    });

    $.RULE("selectClause", () => {
      $.CONSUME(Select);
      $.AT_LEAST_ONE_SEP({
        SEP: Comma,
        DEF: () => {
          $.CONSUME(Identifier);
        },
      });
    });

    $.RULE("fromClause", () => {
      $.CONSUME(From);
      $.CONSUME(Identifier);
    });

    $.RULE("whereClause", () => {
      $.CONSUME(Where);
      $.SUBRULE($.expression);
    });

    // The "rhs" and "lhs" (Right/Left Hand Side) labels will provide easy
    // to use names during CST Visitor (step 3a).
    $.RULE("expression", () => {
      $.SUBRULE($.atomicExpression, { LABEL: "lhs" });
      $.SUBRULE($.relationalOperator);
      $.SUBRULE2($.atomicExpression, { LABEL: "rhs" }); // note the '2' suffix to distinguish
      // from the 'SUBRULE(atomicExpression)'
      // 2 lines above.
    });

    $.RULE("atomicExpression", () => {
      $.OR([
        { ALT: () => $.CONSUME(Integer) },
        { ALT: () => $.CONSUME(Identifier) },
      ]);
    });

    $.RULE("relationalOperator", () => {
      $.OR([
        { ALT: () => $.CONSUME(GreaterThan) },
        { ALT: () => $.CONSUME(LessThan) },
      ]);
    });

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    this.performSelfAnalysis();
  }
}

// We only ever need one as the parser internal state is reset for each new input.
const parserInstance = new SelectParser();

export function parse(inputText) {
  const lexResult = selectLexer.tokenize(inputText);

  // ".input" is a setter which will reset the parser's internal state.
  parserInstance.input = lexResult.tokens;

  // No semantic actions so this won't return anything yet.
  parserInstance.selectStatement();

  if (parserInstance.errors.length > 0) {
    throw Error(
      "Sad sad panda, parsing errors detected!\n" +
        parserInstance.errors[0].message
    );
  }
}
