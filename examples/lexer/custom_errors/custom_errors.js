import { createToken, Lexer } from "chevrotain";

const A = createToken({ name: "A", pattern: /A/ });
const B = createToken({ name: "B", pattern: /B/ });
const C = createToken({ name: "C", pattern: /C/ });
const Whitespace = createToken({
  name: "Whitespace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

// A link to the detailed API for the ILexerErrorMessageProvider can be found here:
// https://chevrotain.io/docs/features/custom_errors.html
const OyVeyErrorMessageProvider = {
  buildUnexpectedCharactersMessage(
    fullText,
    startOffset,
    length,
    // eslint-disable-next-line  no-unused-vars -- template
    line,
    // eslint-disable-next-line  no-unused-vars -- template
    column,
    // eslint-disable-next-line  no-unused-vars -- template
    mode,
  ) {
    return (
      `Oy Vey!!! unexpected character: ->${fullText.charAt(
        startOffset,
      )}<- at offset: ${startOffset},` + ` skipped ${length} characters.`
    );
  },
};

const CustomErrorsLexer = new Lexer([Whitespace, A, B, C], {
  errorMessageProvider: OyVeyErrorMessageProvider,
});

export function tokenize(text) {
  const lexResult = CustomErrorsLexer.tokenize(text);
  return lexResult;
}
