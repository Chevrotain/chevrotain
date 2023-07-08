/**
 * This example demonstrate implementing a lexer for a language using python style indentation.
 * This is achieved by using custom Token patterns which allow running user defined logic
 * to match tokens.
 *
 * The logic is simple:
 * - Indentation tokens (Indent, Outdent) can only be created for whitespace on the beginning of a line.
 * - Change in the "level" of the indentation will create either Indent(increase) or Outdent(decrease).
 * - Same indentation level will be parsed as "regular" whitespace and be ignored.
 * - To implement this the previous Ident levels will be saved in a stack.
 *
 * For additional details on custom token patterns, see the docs:
 * https://chevrotain.io/docs/guide/custom_token_patterns.html#background
 */

import { createToken, createTokenInstance, Lexer } from "chevrotain";
import _ from "lodash";

// State required for matching the indentations
let indentStack = [0];

/**
 * This custom Token matcher uses Lexer context ("matchedTokens" and "groups" arguments)
 * combined with state via closure ("indentStack" and "lastTextMatched") to match indentation.
 *
 * @param {string} text - the full text to lex, sent by the Chevrotain lexer.
 * @param {number} offset - the offset to start matching in the text.
 * @param {IToken[]} matchedTokens - Tokens lexed so far, sent by the Chevrotain Lexer.
 * @param {object} groups - Token groups already lexed, sent by the Chevrotain Lexer.
 * @param {string} type - determines if this function matches Indent or Outdent tokens.
 * @returns {*}
 */
function matchIndentBase(text, offset, matchedTokens, groups, type) {
  const noTokensMatchedYet = _.isEmpty(matchedTokens);
  const newLines = groups.nl;
  const noNewLinesMatchedYet = _.isEmpty(newLines);
  const isFirstLine = noTokensMatchedYet && noNewLinesMatchedYet;
  const isStartOfLine =
    // only newlines matched so far
    (noTokensMatchedYet && !noNewLinesMatchedYet) ||
    // Both newlines and other Tokens have been matched AND the offset is just after the last newline
    (!noTokensMatchedYet &&
      !noNewLinesMatchedYet &&
      offset === _.last(newLines).startOffset + 1);

  // indentation can only be matched at the start of a line.
  if (isFirstLine || isStartOfLine) {
    let match;
    let currIndentLevel = undefined;

    const wsRegExp = / +/y;
    wsRegExp.lastIndex = offset;
    match = wsRegExp.exec(text);
    // possible non-empty indentation
    if (match !== null) {
      currIndentLevel = match[0].length;
    }
    // "empty" indentation means indentLevel of 0.
    else {
      currIndentLevel = 0;
    }

    const prevIndentLevel = _.last(indentStack);
    // deeper indentation
    if (currIndentLevel > prevIndentLevel && type === "indent") {
      indentStack.push(currIndentLevel);
      return match;
    }
    // shallower indentation
    else if (currIndentLevel < prevIndentLevel && type === "outdent") {
      const matchIndentIndex = _.findLastIndex(
        indentStack,
        (stackIndentDepth) => stackIndentDepth === currIndentLevel,
      );

      // any outdent must match some previous indentation level.
      if (matchIndentIndex === -1) {
        throw Error(`invalid outdent at offset: ${offset}`);
      }

      const numberOfDedents = indentStack.length - matchIndentIndex - 1;

      // This is a little tricky
      // 1. If there is no match (0 level indent) than this custom token
      //    matcher would return "null" and so we need to add all the required outdents ourselves.
      // 2. If there was match (> 0 level indent) than we need to add minus one number of outsents
      //    because the lexer would create one due to returning a none null result.
      let iStart = match !== null ? 1 : 0;
      for (let i = iStart; i < numberOfDedents; i++) {
        indentStack.pop();
        matchedTokens.push(
          createTokenInstance(Outdent, "", NaN, NaN, NaN, NaN, NaN, NaN),
        );
      }

      // even though we are adding fewer outdents directly we still need to update the indent stack fully.
      if (iStart === 1) {
        indentStack.pop();
      }
      return match;
    } else {
      // same indent, this should be lexed as simple whitespace and ignored
      return null;
    }
  } else {
    // indentation cannot be matched under other circumstances
    return null;
  }
}

// customize matchIndentBase to create separate functions of Indent and Outdent.
export const matchIndent = _.partialRight(matchIndentBase, "indent");
export const matchOutdent = _.partialRight(matchIndentBase, "outdent");

export const If = createToken({ name: "If", pattern: /if/ });
export const Else = createToken({ name: "Else", pattern: /else/ });
export const Print = createToken({ name: "Print", pattern: /print/ });
export const IntegerLiteral = createToken({
  name: "IntegerLiteral",
  pattern: /\d+/,
});
export const Colon = createToken({ name: "Colon", pattern: /:/ });
export const LParen = createToken({ name: "LParen", pattern: /\(/ });
export const RParen = createToken({ name: "RParen", pattern: /\)/ });
export const Spaces = createToken({
  name: "Spaces",
  pattern: / +/,
  group: Lexer.SKIPPED,
});

// newlines are not skipped, by setting their group to "nl" they are saved in the lexer result
// and thus we can check before creating an indentation token that the last token matched was a newline.
export const Newline = createToken({
  name: "Newline",
  pattern: /\n|\r\n?/,
  group: "nl",
});

// define the indentation tokens using custom token patterns
export const Indent = createToken({
  name: "Indent",
  pattern: matchIndent,
  // custom token patterns should explicitly specify the line_breaks option
  line_breaks: false,
});
export const Outdent = createToken({
  name: "Outdent",
  pattern: matchOutdent,
  // custom token patterns should explicitly specify the line_breaks option
  line_breaks: false,
});

export const customPatternLexer = new Lexer([
  Newline,
  // indentation tokens must appear before Spaces, otherwise all indentation will always be consumed as spaces.
  // Outdent must appear before Indent for handling zero spaces outdents.
  Outdent,
  Indent,

  Spaces,
  If,
  Else,
  Print,
  IntegerLiteral,
  Colon,
  LParen,
  RParen,
]);

export function tokenize(text) {
  // have to reset the indent stack between processing of different text inputs
  indentStack = [0];

  const lexResult = customPatternLexer.tokenize(text);

  //add remaining Outdents
  while (indentStack.length > 1) {
    lexResult.tokens.push(
      createTokenInstance(Outdent, "", NaN, NaN, NaN, NaN, NaN, NaN),
    );
    indentStack.pop();
  }

  if (lexResult.errors.length > 0) {
    throw new Error("sad sad panda lexing errors detected");
  }
  return lexResult;
}
