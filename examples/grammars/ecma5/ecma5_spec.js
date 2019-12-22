"use strict"

const path = require("path")
const fs = require("fs")
const expect = require("chai").expect
const parse = require("./ecma5_api").parse

describe("The ECMAScript5 Grammar", () => {
  const samplePath = path.resolve(
    __dirname,
    "../../implementation_languages/ecma5/ecma5_json.js"
  )
  const sampleText = fs.readFileSync(samplePath, "utf8").toString()
  it("can parse a large input without errors", () => {
    expect(() => parse(sampleText)).to.not.throw()
  })
})
