/**
 * An Example of implementing an INI file Grammar with Chevrotain.
 *
 * INI files are simple configuration files with sections, key-value pairs,
 * and comments. For example:
 *
 *   ; database settings
 *   [database]
 *   host = localhost
 *   port = 3306
 *
 * This example demonstrates using a multi-mode lexer to handle the
 * context-sensitive nature of INI files: the text after "=" is a free-form
 * value (may contain special characters), while text elsewhere is
 * structured (identifiers, brackets, etc.).
 *
 * This is a pure grammar without any actions (either embedded or via a CST Visitor).
 */
import { createToken, Lexer, CstParser } from "chevrotain";

// ----------------- lexer -----------------

// Shared tokens (used in multiple modes)
const NewLine = createToken({ name: "NewLine", pattern: /\r?\n/ });

// Tokens for the default mode (section headers, keys, comments)
const Comment = createToken({ name: "Comment", pattern: /[;#][^\r\n]*/ });
const LBracket = createToken({ name: "LBracket", pattern: /\[/ });
const RBracket = createToken({ name: "RBracket", pattern: /]/ });

// The "=" sign switches the lexer into "value" mode
const Equals = createToken({
  name: "Equals",
  pattern: /=/,
  push_mode: "value_mode",
});

// Identifier used for both section names and property keys
const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z_][a-zA-Z0-9_. -]*/,
});

const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /[ \t]+/,
  group: Lexer.SKIPPED,
});

// Tokens for value mode (everything after "=")
// Value consumes all text until end of line
const Value = createToken({ name: "Value", pattern: /[^\r\n]+/ });

// NewLine in value mode pops back to default mode
const ValueNewLine = createToken({
  name: "ValueNewLine",
  pattern: /\r?\n/,
  pop_mode: true,
});

const ValueWhiteSpace = createToken({
  name: "ValueWhiteSpace",
  pattern: /[ \t]+/,
  group: Lexer.SKIPPED,
});

const multiModeLexerDefinition = {
  modes: {
    none_value_mode: [
      WhiteSpace,
      Comment,
      NewLine,
      LBracket,
      RBracket,
      Equals,
      Identifier,
    ],
    value_mode: [ValueWhiteSpace, ValueNewLine, Value],
  },
  defaultMode: "none_value_mode",
};

const IniLexer = new Lexer(multiModeLexerDefinition);

// The parser needs a flat list of all token types
const allTokens = [
  WhiteSpace,
  ValueWhiteSpace,
  Comment,
  NewLine,
  ValueNewLine,
  LBracket,
  RBracket,
  Equals,
  Identifier,
  Value,
];

// ----------------- parser -----------------

class IniParser extends CstParser {
  constructor() {
    super(allTokens);

    const $ = this;

    // An INI file is a sequence of entries (sections, properties, comments, blank lines)
    $.RULE("iniFile", () => {
      $.MANY(() => {
        $.SUBRULE($.entry);
      });
    });

    // Each entry is either a section header, a property, a comment, or a blank line
    $.RULE("entry", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.section) },
        { ALT: () => $.SUBRULE($.property) },
        { ALT: () => $.SUBRULE($.comment) },
        { ALT: () => $.CONSUME(NewLine) },
      ]);
    });

    // [sectionName]
    $.RULE("section", () => {
      $.CONSUME(LBracket);
      $.CONSUME(Identifier);
      $.CONSUME(RBracket);
      $.CONSUME(NewLine);
    });

    $.RULE("property", () => {
      $.CONSUME(Identifier);
      $.CONSUME(Equals);
      $.OPTION(() => {
        $.CONSUME(Value);
      });
      $.CONSUME(ValueNewLine);
    });

    // ; comment text or # comment text
    $.RULE("comment", () => {
      $.CONSUME(Comment);
      $.CONSUME(NewLine);
    });

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    this.performSelfAnalysis();
  }
}

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
const parser = new IniParser();

export function parseIni(text) {
  // Ensure input ends with a newline (INI lines are newline-terminated)
  const normalizedText = text.endsWith("\n") ? text : text + "\n";

  const lexResult = IniLexer.tokenize(normalizedText);

  parser.input = lexResult.tokens;

  const cst = parser.iniFile();

  return {
    cst: cst,
    lexErrors: lexResult.errors,
    parseErrors: parser.errors,
  };
}
