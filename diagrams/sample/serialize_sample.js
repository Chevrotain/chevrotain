var path = require("path")
var serializer = require("../src/diagrams_serializer")

// Docs: Replace the contents of these three variables with values relevant for your grammar's use case.
var dummy_sample = require("./dummy_sample")
var parserInstance = new dummy_sample.DummySampleParser([])
var outPath = path.join(__dirname, '../generated/generated_serialized_grammar.js')


serializer.serializeGrammarToFile(outPath, "serializedGrammar", parserInstance)
