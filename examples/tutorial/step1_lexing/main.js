const lex = require("./step1_lexing").lex

const inputText = "SELECT column1 FROM table2"
const lexingResult = lex(inputText)
console.log(JSON.stringify(lexingResult, null, "\t"))
