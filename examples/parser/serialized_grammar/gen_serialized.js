const fs = require("fs")
const path = require("path")
const { Parser } = require("./grammar")
const { clearCache } = require("chevrotain")

// we need to clear the cache to prevent the parser from using a stale grammar
clearCache()
// instantiate parser without serialized grammar (because it doesn't exist yet!)
const parser = new Parser([])
const grammar = parser.getSerializedGastProductions()
// clear cache again in case tests also initialize the parser
clearCache()
// serialized the grammar in a json file
try {
    fs.mkdirSync(path.join(__dirname, "./gen"))
} catch (err) {}
fs.writeFileSync(
    path.join(__dirname, "./gen/grammar.json"),
    JSON.stringify(grammar, null, 2)
)
