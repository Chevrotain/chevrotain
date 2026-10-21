/**
 * Measures the cost of raising parsing errors (NoViableAltException / EarlyExitException).
 *
 * Building these error messages requires the expected lookahead paths of the failing production.
 * For wide alternations whose alternatives share common prefixes (which forces deeper lookahead),
 * computing those paths can dominate parsing time of erroneous input, e.g. in editors / language
 * servers that continuously re-parse incomplete text.
 *
 * Usage (from packages/chevrotain, after `bun run build`):
 *   node benchmark_node/error_messages.js
 */
import { createToken, EmbeddedActionsParser, Lexer } from "../lib/src/api.js";

const PREFIX_TOKENS = 10;
const ALTERNATIVES = 30;
const ITERATIONS = 200;

const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});
const Unknown = createToken({ name: "Unknown", pattern: /\?/ });
const prefixTokens = Array.from({ length: PREFIX_TOKENS }, (_, idx) =>
  createToken({ name: `P${idx}`, pattern: new RegExp(`p${idx}\\b`) }),
);
const keywords = Array.from({ length: ALTERNATIVES }, (_, idx) =>
  createToken({ name: `Kw${idx}`, pattern: new RegExp(`kw${idx}\\b`) }),
);
const Comma = createToken({ name: "Comma", pattern: /,/ });
const allTokens = [WhiteSpace, Unknown, Comma, ...keywords, ...prefixTokens];
const lexer = new Lexer(allTokens);

class ErrorsBenchmarkParser extends EmbeddedActionsParser {
  constructor(config) {
    super(allTokens, config);
    this.performSelfAnalysis();
  }

  prefixPart = this.RULE("prefixPart", () => {
    this.OR(
      prefixTokens.map((tokType, idx) => ({
        ALT: () => this.consume(idx, tokType),
      })),
    );
  });

  // Every alternative starts with the same two-token prefix (PREFIX_TOKENS^2 combinations),
  // and only the third token distinguishes them.
  wideAlternation = this.RULE("wideAlternation", () => {
    this.OR(
      keywords.map((keyword, idx) => ({
        ALT: () => {
          this.subrule(idx * 2, this.prefixPart);
          this.subrule(idx * 2 + 1, this.prefixPart);
          this.consume(idx, keyword);
        },
      })),
    );
  });

  list = this.RULE("list", () => {
    this.AT_LEAST_ONE_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.wideAlternation),
    });
  });
}

function measure(name, parser, text) {
  const tokens = lexer.tokenize(text).tokens;
  // warm up and sanity check
  parser.input = tokens;
  parser.list();
  if (parser.errors.length === 0) {
    throw Error(`expected parsing errors for: ${text}`);
  }

  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    parser.input = tokens;
    parser.list();
  }
  const perParse = (performance.now() - start) / ITERATIONS;
  console.log(
    `${name.padEnd(40)} ${perParse.toFixed(3).padStart(10)} ms/parse  (${parser.errors.length} error(s), first message ${parser.errors[0].message.length} chars)`,
  );
}

for (const recoveryEnabled of [false, true]) {
  const parser = new ErrorsBenchmarkParser({ recoveryEnabled });
  const suffix = recoveryEnabled ? " (recovery)" : "";
  measure(`NoViableAlt${suffix}`, parser, "p1 p2 ?");
  measure(`EarlyExit${suffix}`, parser, "?");
  measure(
    `NoViableAlt in list${suffix}`,
    parser,
    "p1 p2 kw1, p3 p4 ?, p5 p6 kw2",
  );
}
