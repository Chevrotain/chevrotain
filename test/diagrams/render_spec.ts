"use strict"
import { VERSION } from "../../src/version"
const createSyntaxDiagramsCode = require("../../src/api")
    .createSyntaxDiagramsCode
import { DDLExampleRecoveryParser } from "../full_flow/error_recovery/sql_statements/sql_recovery_parser"

const { lt } = require("semver")

// more in depth testing will require jsdom to support SVG elements (WIP).
describe("The Chevrotain diagrams rendering APIs", function() {
    const serializedGrammar = new DDLExampleRecoveryParser().getSerializedGastProductions()

    let skipOnNode4AndBrowser = it
    if (
        typeof window !== "undefined" ||
        lt(process.version, "6.0.0") ||
        // This makes the tests run x6 slower.
        process.env.SKIP_JS_DOM
    ) {
        skipOnNode4AndBrowser = <any>it.skip
    }

    skipOnNode4AndBrowser(
        "Produces valid and executable html text with custom options",
        function(done) {
            this.timeout(5000)
            const jsdom = require("jsdom")
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
                function() {
                    try {
                        expect(document.scripts.length).to.equal(6)
                        expect(document.scripts.item(1).src).to.include(
                            "jsdelivr"
                        )
                        expect(
                            document.getElementById("diagrams")
                        ).to.not.equal(null)
                        done()
                    } catch (e) {
                        done(e)
                    }
                },
                false
            )
        }
    )

    skipOnNode4AndBrowser("Produces valid and executable html text", function(
        done
    ) {
        this.timeout(5000)
        const jsdom = require("jsdom")
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
            function() {
                try {
                    expect(document.scripts.length).to.equal(6)
                    expect(document.scripts.item(1).src).to.include("unpkg")
                    expect(document.getElementById("diagrams")).to.not.equal(
                        null
                    )
                    done()
                } catch (e) {
                    done(e)
                }
            },
            false
        )
    })
})
