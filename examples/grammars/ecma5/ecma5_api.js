import { tokenize } from "./ecma5_lexer.js";
import { ECMAScript5Parser } from "./ecma5_parser.js";

const parserInstance = new ECMAScript5Parser();

export function parse(str) {
  const tokens = tokenize(str);
  parserInstance.input = tokens;
  parserInstance.orgText = str;
  parserInstance.Program();

  if (parserInstance.errors.length > 0) {
    throw Error("Sad Sad Panda");
  }
}
