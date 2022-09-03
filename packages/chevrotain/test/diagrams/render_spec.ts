import { expect } from "chai"
import jsdom from "jsdom"
import { VERSION } from "../../src/version.js"
import { DDLExampleRecoveryParser } from "../full_flow/error_recovery/sql_statements/sql_recovery_parser.js"
import { createSyntaxDiagramsCode } from "../../src/api.js"

// more in depth testing will require jsdom to support SVG elements (WIP).
// This test-suite takes about 50% of the whole tests execution time :(
describe("The Chevrotain diagrams rendering APIs", function () {
  // The JSDom tests that actually perform network traffic seem unstable...
  this.retries(4)

  let serializedGrammar: any

  before(() => {
    serializedGrammar =
      new DDLExampleRecoveryParser().getSerializedGastProductions()
  })

  it("Produces valid and executable html text with custom options", function (done) {
    this.timeout(20000)
    const { JSDOM } = jsdom
    const htmlText = createSyntaxDiagramsCode(serializedGrammar, {
      resourceBase: `https://cdn.jsdelivr.net/npm/chevrotain/diagrams/`,
      css: `https://cdn.jsdelivr.net/npm/chevrotain/diagrams/diagrams.css`
    })

    const dom = new JSDOM(htmlText, {
      runScripts: "dangerously",
      resources: "usable"
    })

    const document = dom.window.document

    document.addEventListener(
      "DOMContentLoaded",
      function () {
        try {
          expect(document.scripts.length).to.equal(6)
          expect(document?.scripts?.item(1)?.src).to.include("jsdelivr")
          expect(document.getElementById("diagrams")).to.not.equal(null)
          done()
        } catch (e) {
          done(e)
        }
      },
      false
    )
  })

  it("Produces valid and executable html text", function (done) {
    this.timeout(20000)
    const { JSDOM } = jsdom
    let htmlText = createSyntaxDiagramsCode(serializedGrammar)

    // using a version in the url will fail in release build as the new version number has not been deployed yet.
    htmlText = htmlText.replace(new RegExp(`@${VERSION}`, "g"), "")
    const dom = new JSDOM(htmlText, {
      runScripts: "dangerously",
      resources: "usable"
    })

    const document = dom.window.document

    document.addEventListener(
      "DOMContentLoaded",
      function () {
        try {
          expect(document.scripts.length).to.equal(6)
          expect(document?.scripts?.item(1)?.src).to.include("unpkg")
          expect(document.getElementById("diagrams")).to.not.equal(null)
          done()
        } catch (e) {
          done(e)
        }
      },
      false
    )
  })
})
