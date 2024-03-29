/*
 * An example showing how to customize the error messages produced by the parser.
 * This is done by providing a custom "errorMessageProvider" during parser initialization.
 * A link to the detailed API for the IParserErrorMessageProvider can be found here:
 * https://chevrotain.io/docs/features/custom_errors.html
 */
import {
  createToken,
  Lexer,
  CstParser,
  defaultParserErrorProvider,
} from "chevrotain";

// ----------------- lexer -----------------
const Alpha = createToken({ name: "Alpha", pattern: /A/ });
const Bravo = createToken({ name: "Bravo", pattern: /B/ });
const Charlie = createToken({ name: "Charlie", pattern: /C/ });

const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

const allTokens = [WhiteSpace, Alpha, Bravo, Charlie];

const PhoneticLexer = new Lexer(allTokens);

// ----------------- Custom Error Provider ------------
const myErrorProvider = {
  buildMismatchTokenMessage: function (options) {
    // override mismatch tokens errors when Bravo is expected
    // Imagine Bravo is a terminating Token such as "SemiColon"
    if (options.expected === Bravo) {
      return "expecting Bravo at end of " + options.ruleName;
    } else {
      // fallback to the default behavior otherwise.
      return defaultParserErrorProvider.buildMismatchTokenMessage(options);
    }
  },
  buildNotAllInputParsedMessage: function (options) {
    // changing the template of the error message #1
    return `very bad dog! you still have some input remaining at offset:${options.firstRedundant.startOffset}`;
  },

  buildNoViableAltMessage: function (options) {
    // defer to the default implementation for `buildNoViableAltMessage`
    return defaultParserErrorProvider.buildNoViableAltMessage(options);
  },

  buildEarlyExitMessage: function (options) {
    // translating the error message to Spanish
    return `Esperando por lo menos una iteración de: ${options.expectedIterationPaths[0][0].name}`;
  },
};

// ----------------- parser -----------------
class CustomErrorsParser extends CstParser {
  constructor() {
    super(allTokens, {
      // passing our custom error message provider
      errorMessageProvider: myErrorProvider,
    });

    const $ = this;

    $.RULE("mis_match", () => {
      $.CONSUME(Alpha);
      // we will call this rule with [Alpha, Charlie] to produce a mismatch Token Exception.
      $.CONSUME(Bravo);
    });

    $.RULE("mis_match_override", () => {
      $.CONSUME(Alpha);
      // we will call this rule with [Alpha, Charlie] to produce a mismatch Token Exception.
      // This time we are overriding the message created by the ErrorProvider
      $.CONSUME(Bravo, { ERR_MSG: "We want Bravo!!!" });
    });

    $.RULE("redundant_input", () => {
      $.CONSUME(Alpha);
      $.CONSUME(Bravo);

      // we will this rule with three Tokens input [Alpha, Bravo, Charlie]
      // so a redundant input error will be thrown
      console.log($.LA(1).image);
    });

    $.RULE("no_viable_alternative", () => {
      // prettier-ignore
      $.OR([
            // We will call this rule with an input: [Charlie] so none of the alternatives would match
            // and an error will be thrown
            {ALT: () => $.CONSUME(Alpha)},
            {ALT: () => $.CONSUME(Bravo)}
        ])
    });

    $.RULE("early_exit", () => {
      $.CONSUME(Alpha);

      // We will call thi rule with an input: [Alpha] so the mandatory repetition will
      // fail to match at least one iteration of Bravo.
      $.AT_LEAST_ONE(() => {
        $.CONSUME(Bravo);
      });
    });

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    this.performSelfAnalysis();
  }
}

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
const parser = new CustomErrorsParser();

function parseStartingWithRule(ruleName) {
  return function (text) {
    const lexResult = PhoneticLexer.tokenize(text);
    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens;
    // just invoke which ever rule you want as the start rule. its all just plain javascript...
    // eslint-disable-next-line  no-unused-vars -- template
    const cst = parser[ruleName]();

    // we are only interested in the errors in this scenario.
    return parser.errors;
  };
}

export const parseMismatch = parseStartingWithRule("mis_match");
export const parseMismatchOverride =
  parseStartingWithRule("mis_match_override");
export const parseRedundant = parseStartingWithRule("redundant_input");
export const parseNoViable = parseStartingWithRule("no_viable_alternative");
export const parseEarlyExit = parseStartingWithRule("early_exit");
