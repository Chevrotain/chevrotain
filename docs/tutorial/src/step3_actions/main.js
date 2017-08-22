const assert = require("assert")
const toAstVisitor = require("./step3a_actions_visitor").toAst
const toAstEmbedded = require("./step3b_actions_embedded").toAst

let inputText = "SELECT column1, column2 FROM table2 WHERE column2 > 3"

let astFromVisitor = toAstVisitor(inputText)
let astFromEmbedded = toAstEmbedded(inputText)

console.log(JSON.stringify(astFromVisitor, null, "\t"))

assert.deepEqual(
    astFromVisitor,
    astFromEmbedded,
    "Both ASTs should be identical"
)
