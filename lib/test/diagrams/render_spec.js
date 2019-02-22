"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var version_1 = require("../../src/version");
var createSyntaxDiagramsCode = require("../../src/api")
    .createSyntaxDiagramsCode;
var sql_recovery_parser_1 = require("../full_flow/error_recovery/sql_statements/sql_recovery_parser");
var lt = require("semver").lt;
// more in depth testing will require jsdom to support SVG elements (WIP).
describe("The Chevrotain diagrams rendering APIs", function () {
    var serializedGrammar = new sql_recovery_parser_1.DDLExampleRecoveryParser().getSerializedGastProductions();
    var skipOnBrowser = it;
    if (typeof window !== "undefined" ||
        // This makes the tests run x6 slower.
        process.env.SKIP_JS_DOM) {
        skipOnBrowser = it.skip;
    }
    skipOnBrowser("Produces valid and executable html text with custom options", function (done) {
        this.timeout(20000);
        var jsdom = require("jsdom");
        var JSDOM = jsdom.JSDOM;
        var htmlText = createSyntaxDiagramsCode(serializedGrammar, {
            resourceBase: "https://cdn.jsdelivr.net/npm/chevrotain/diagrams/",
            css: "https://cdn.jsdelivr.net/npm/chevrotain/diagrams/diagrams.css"
        });
        var dom = new JSDOM(htmlText, {
            runScripts: "dangerously",
            resources: "usable"
        });
        var document = dom.window.document;
        document.addEventListener("DOMContentLoaded", function () {
            try {
                expect(document.scripts.length).to.equal(6);
                expect(document.scripts.item(1).src).to.include("jsdelivr");
                expect(document.getElementById("diagrams")).to.not.equal(null);
                done();
            }
            catch (e) {
                done(e);
            }
        }, false);
    });
    skipOnBrowser("Produces valid and executable html text", function (done) {
        this.timeout(20000);
        var jsdom = require("jsdom");
        var JSDOM = jsdom.JSDOM;
        var htmlText = createSyntaxDiagramsCode(serializedGrammar);
        // using a version in the url will fail in release build as the new version number has not been deployed yet.
        htmlText = htmlText.replace(new RegExp("@" + version_1.VERSION, "g"), "");
        var dom = new JSDOM(htmlText, {
            runScripts: "dangerously",
            resources: "usable"
        });
        var document = dom.window.document;
        document.addEventListener("DOMContentLoaded", function () {
            try {
                expect(document.scripts.length).to.equal(6);
                expect(document.scripts.item(1).src).to.include("unpkg");
                expect(document.getElementById("diagrams")).to.not.equal(null);
                done();
            }
            catch (e) {
                done(e);
            }
        }, false);
    });
});
//# sourceMappingURL=render_spec.js.map