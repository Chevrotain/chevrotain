const fs = require("fs")
const path = require("path")
const { Parser } = require("./grammar")

// instantiate parser without serialized grammar (because it doesn't exist yet!)
const parser = new Parser([])
const grammar = parser.getSerializedGastProductions()
// serialized the grammar in a json file
try {
    fs.mkdirSync(path.join(__dirname, "./gen"))
} catch (err) {}
fs.writeFileSync(
    path.join(__dirname, "./gen/grammar.json"),
    JSON.stringify(grammar, null, 2)
)
