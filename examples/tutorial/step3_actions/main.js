import assert from "assert";
import { toAstVisitor } from "./step3a_actions_visitor.js";
import { toAstEmbedded } from "./step3b_actions_embedded.js";

let inputText = "SELECT column1, column2 FROM table2 WHERE column2 > 3";

let astFromVisitor = toAstVisitor(inputText);
let astFromEmbedded = toAstEmbedded(inputText);

console.log(JSON.stringify(astFromVisitor, null, "\t"));

assert.deepEqual(
  astFromVisitor,
  astFromEmbedded,
  "Both ASTs should be identical",
);
