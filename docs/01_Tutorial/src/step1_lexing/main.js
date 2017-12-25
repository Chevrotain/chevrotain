const lex = require("./step1_lexing").lex

let inputText = "SELECT column1 FROM table2"
let lexingResult = lex(inputText)
console.log(JSON.stringify(lexingResult, null, "\t"))
