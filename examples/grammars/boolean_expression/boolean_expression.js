/**
 * An Example of implementing a Boolean Expression Grammar with Chevrotain.
 *
 * Supports expressions like:
 *   (A AND B) OR NOT C
 *   NOT (TRUE AND FALSE) OR X
 *   A AND B AND C
 *
 * Operator precedence (low to high): OR < AND < NOT < atom
 *
 * This demonstrates:
 * - Operator precedence via nested grammar rules (same technique as arithmetic
 *   expressions, but applied to logical operators)
 * - The `longer_alt` property to disambiguate keywords (AND, OR, NOT, TRUE, FALSE)
 *   from general variable identifiers
 * - Recursive unary prefix operator (NOT)
 *
 * This is a pure grammar without any actions (either embedded or via a CST Visitor).
 */
import { createToken, Lexer, CstParser } from "chevrotain";

// ----------------- lexer -----------------

const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

// Variable must be defined before keywords so that `longer_alt` can reference it.
const Variable = createToken({
  name: "Variable",
  pattern: /[a-zA-Z_]\w*/,
});

// Keywords use `longer_alt` to avoid matching prefixes of identifiers.
// For example, "ORDER" should be lexed as a Variable, not as "OR" + "DER".
const And = createToken({
  name: "And",
  pattern: /AND/,
  longer_alt: Variable,
});
const Or = createToken({
  name: "Or",
  pattern: /OR/,
  longer_alt: Variable,
});
const Not = createToken({
  name: "Not",
  pattern: /NOT/,
  longer_alt: Variable,
});
const True = createToken({
  name: "True",
  pattern: /TRUE/,
  longer_alt: Variable,
});
const False = createToken({
  name: "False",
  pattern: /FALSE/,
  longer_alt: Variable,
});

const LParen = createToken({ name: "LParen", pattern: /\(/ });
const RParen = createToken({ name: "RParen", pattern: /\)/ });

// Token order: keywords before Variable so they are matched preferentially.
// The `longer_alt` ensures identifiers like "ANDROID" are not split into "AND" + "ROID".
const allTokens = [
  WhiteSpace,
  And,
  Or,
  Not,
  True,
  False,
  LParen,
  RParen,
  Variable,
];

const BooleanLexer = new Lexer(allTokens);

// ----------------- parser -----------------

class BooleanExpressionParser extends CstParser {
  constructor() {
    super(allTokens);

    const $ = this;

    // Top-level rule
    $.RULE("expression", () => {
      $.SUBRULE($.orExpression);
    });

    // Lowest precedence: OR
    // orExpression → andExpression (OR andExpression)*
    $.RULE("orExpression", () => {
      $.SUBRULE($.andExpression, { LABEL: "lhs" });
      $.MANY(() => {
        $.CONSUME(Or);
        $.SUBRULE2($.andExpression, { LABEL: "rhs" });
      });
    });

    // Middle precedence: AND
    // andExpression → notExpression (AND notExpression)*
    $.RULE("andExpression", () => {
      $.SUBRULE($.notExpression, { LABEL: "lhs" });
      $.MANY(() => {
        $.CONSUME(And);
        $.SUBRULE2($.notExpression, { LABEL: "rhs" });
      });
    });

    // Higher precedence: NOT (unary prefix, recursive)
    // notExpression → NOT notExpression | atomicExpression
    $.RULE("notExpression", () => {
      $.OR([
        {
          ALT: () => {
            $.CONSUME(Not);
            $.SUBRULE($.notExpression);
          },
        },
        { ALT: () => $.SUBRULE($.atomicExpression) },
      ]);
    });

    // Highest precedence: atoms and parenthesized sub-expressions
    // atomicExpression → Variable | TRUE | FALSE | "(" expression ")"
    $.RULE("atomicExpression", () => {
      $.OR([
        { ALT: () => $.CONSUME(Variable) },
        { ALT: () => $.CONSUME(True) },
        { ALT: () => $.CONSUME(False) },
        {
          ALT: () => {
            $.CONSUME(LParen);
            $.SUBRULE($.expression);
            $.CONSUME(RParen);
          },
        },
      ]);
    });

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    this.performSelfAnalysis();
  }
}

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
const parser = new BooleanExpressionParser();

export function parseBooleanExpression(text) {
  const lexResult = BooleanLexer.tokenize(text);

  parser.input = lexResult.tokens;

  const cst = parser.expression();

  return {
    cst: cst,
    lexErrors: lexResult.errors,
    parseErrors: parser.errors,
  };
}
