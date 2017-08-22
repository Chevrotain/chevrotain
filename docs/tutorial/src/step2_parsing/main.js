const parse = require("./step2_parsing").parse

let inputText = "SELECT column1 FROM table2"
// step into the parse function to debug the full flow
parse(inputText)

// no output here so nothing to show...
