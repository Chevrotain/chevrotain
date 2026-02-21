import { expect } from "chai";
import jsdom from "jsdom";
import { VERSION } from "../src/version.js";
import { createSyntaxDiagramsCode } from "../src/api.js";
import { ISerializedGast } from "@chevrotain/types";

// TODO: tests print some warnnings, is this expected?

// A minimal serialized grammar for testing purposes.
// The runtime serialized grammar has additional properties (name, label, pattern, idx, etc.)
// beyond what ISerializedGast declares, so we cast to avoid strict property checks.
const sampleSerializedGrammar = [
  {
    type: "Rule",
    name: "expression",
    orgText: "",
    definition: [
      {
        type: "Alternation",
        idx: 0,
        definition: [
          {
            type: "Alternative",
            definition: [
              {
                type: "Terminal",
                name: "Integer",
                label: "Integer",
                idx: 1,
                pattern: "[0-9]+",
              },
            ],
          },
          {
            type: "Alternative",
            definition: [
              {
                type: "NonTerminal",
                name: "parenExpression",
                idx: 0,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "Rule",
    name: "parenExpression",
    orgText: "",
    definition: [
      {
        type: "Terminal",
        name: "LParen",
        label: "LParen",
        idx: 1,
        pattern: "\\(",
      },
      {
        type: "NonTerminal",
        name: "expression",
        idx: 0,
      },
      {
        type: "Terminal",
        name: "RParen",
        label: "RParen",
        idx: 2,
        pattern: "\\)",
      },
    ],
  },
] as unknown as ISerializedGast[];

// more in depth testing will require jsdom to support SVG elements (WIP).
describe("The @chevrotain/diagrams rendering APIs", function () {
  // The JSDom tests that actually perform network traffic seem unstable...
  this.retries(4);

  it("Produces valid and executable html text with custom options", function (done) {
    this.timeout(20000);
    const { JSDOM } = jsdom;
    const htmlText = createSyntaxDiagramsCode(sampleSerializedGrammar, {
      resourceBase: `https://cdn.jsdelivr.net/npm/@chevrotain/diagrams/diagrams/`,
      css: `https://cdn.jsdelivr.net/npm/@chevrotain/diagrams/diagrams/diagrams.css`,
    });

    const dom = new JSDOM(htmlText, {
      runScripts: "dangerously",
      resources: "usable",
    });

    const document = dom.window.document;

    document.addEventListener(
      "DOMContentLoaded",
      function () {
        try {
          expect(document.scripts.length).to.equal(6);
          expect(document?.scripts?.item(1)?.src).to.include("jsdelivr");
          expect(document.getElementById("diagrams")).to.not.equal(null);
          done();
        } catch (e) {
          done(e);
        }
      },
      false,
    );
  });

  it("Produces valid and executable html text", function (done) {
    this.timeout(20000);
    const { JSDOM } = jsdom;
    let htmlText = createSyntaxDiagramsCode(sampleSerializedGrammar);

    // using a version in the url will fail in release build as the new version number has not been deployed yet.
    htmlText = htmlText.replace(new RegExp(`@${VERSION}`, "g"), "");
    const dom = new JSDOM(htmlText, {
      runScripts: "dangerously",
      resources: "usable",
    });

    const document = dom.window.document;

    document.addEventListener(
      "DOMContentLoaded",
      function () {
        try {
          expect(document.scripts.length).to.equal(6);
          expect(document?.scripts?.item(1)?.src).to.include("unpkg");
          expect(document.getElementById("diagrams")).to.not.equal(null);
          done();
        } catch (e) {
          done(e);
        }
      },
      false,
    );
  });
});
