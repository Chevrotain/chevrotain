"use strict"

/**
 * A template for generating syntax diagrams html file.
 * See: https://github.com/SAP/chevrotain/tree/master/diagrams for more details
 *
 * usage:
 * - npm install in the parent directory (parser) to install dependencies
 * - Run this in file in node.js (node gen_diagrams.js)
 * - open the "generated_diagrams.html" that will be created in this folder using
 *   your favorite browser.
 */
const path = require("path")
const fs = require("fs")
const chevrotain = require("chevrotain")
const grammar = require("./grammar")

// extract the serialized grammar.
const parserInstance = grammar.parserInstance
const serializedGrammar = parserInstance.getSerializedGastProductions()

// create the HTML Text
const htmlText = chevrotain.createSyntaxDiagramsCode(serializedGrammar)

// Write the HTML file to disk
const outPath = path.resolve(__dirname, "./")
fs.writeFileSync(outPath + "/generated_diagrams.html", htmlText)
