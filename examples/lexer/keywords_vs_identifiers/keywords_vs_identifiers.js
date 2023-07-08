/**
 * This example shows how to resolve the keywords vs identifiers ambiguity.
 * The order of TokenTypes in the lexer definition matters.
 *
 * If we place keywords before the Identifier, then identifiers that have a keyword-like prefix will not be
 * lexed correctly. For example, the keyword "for" and the identifier "formal".
 * The token vector will be ["for", "mal"] instead of ["formal"].
 *
 * On the other hand, if we place keywords after the Identifier, then they will never
 * be lexed as keywords, as all keywords are usually valid identifiers.
 *
 * The solution is to place the keywords BEFORE the Identifier with an additional property, longer_alt,
 * telling the lexer to prefer the longer identifier alternative if one is found.
 */

import { createToken, Lexer } from "chevrotain";

export const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-z]\w+/,
});

export const While = createToken({
  name: "While",
  pattern: /while/,
  longer_alt: Identifier,
});
export const For = createToken({
  name: "For",
  pattern: /for/,
  longer_alt: Identifier,
});
export const Do = createToken({
  name: "Do",
  pattern: /do/,
  longer_alt: Identifier,
});
export const Whitespace = createToken({
  name: "Whitespace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

const keywordsVsIdentifiersLexer = new Lexer([
  Whitespace, // Whitespace is very common in most languages so placing it first generally speeds up the lexing process.

  While, // the actual keywords (While/For/Do) must appear BEFORE the Identifier Token, as they are all a valid prefix of it's PATTERN.
  For, // However, the edge case of an Identifier with a prefix, which is a valid keyword, must still be handled. For example:
  Do, // 'do' vs 'done' or 'for' vs 'forEach'. This is solved by defining 'Keyword.LONGER_ALT = Identifier',
  // thus each time a Keyword is detected, the Lexer will also try to match a LONGER Identifier.

  Identifier, // As mentioned above, the Identifier Token must appear after ALL the Keyword Tokens.
]);

export function tokenize(text) {
  const lexResult = keywordsVsIdentifiersLexer.tokenize(text);

  if (lexResult.errors.length > 0) {
    throw new Error("sad sad panda lexing errors detected");
  }
  return lexResult;
}
