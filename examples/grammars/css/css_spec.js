const assert = require("assert")
const parseCss = require("./css").parseCss

describe("The CSS Grammar", () => {
    it("can parse a simple CSS without errors", () => {
        const inputText =
            "svg.railroad-diagram path {\r\n" +
            "    stroke-width: 3;\r\n" +
            "    stroke: black;\r\n" +
            "    fill: rgba(0, 0, 0, 0);\r\n" +
            "}\r\n" +
            "\r\nsvg.railroad-diagram text {" +
            "\r\n    font: bold 14px monospace;" +
            "\r\n    text-anchor: middle;" +
            "\r\n}" +
            "\r\n" +
            "\r\nsvg.railroad-diagram text.label {" +
            "\r\n    text-anchor: start;" +
            "\r\n}" +
            "\r\n" +
            "\r\nsvg.railroad-diagram text.comment {" +
            "\r\n    font: italic 12px monospace;" +
            "\r\n}" +
            "\r\n" +
            "\r\nsvg.railroad-diagram g.non-terminal rect {" +
            "\r\n    fill: hsl(223, 100%, 83%);\r\n" +
            "}\r\n" +
            "\r\nsvg.railroad-diagram rect {" +
            "\r\n    stroke-width: 3;" +
            "\r\n    stroke: black;" +
            "\r\n    fill: hsl(190, 100%, 83%);" +
            "\r\n}" +
            "\r\n" +
            "\r\n.diagramHeader {" +
            "\r\n    display: inline-block;" +
            "\r\n    -webkit-touch-callout: default;" +
            "\r\n    -webkit-user-select: text;" +
            "\r\n    -khtml-user-select: text;" +
            "\r\n    -moz-user-select: text;" +
            "\r\n    -ms-user-select: text;" +
            "\r\n    user-select: text;" +
            "\r\n    font-weight: bold;" +
            "\r\n    font-family: monospace;" +
            "\r\n    font-size: 18px;" +
            "\r\n    margin-bottom: -8px;" +
            "\r\n    text-align: center;" +
            "\r\n}" +
            "\r\n" +
            "\r\n.diagramHeaderDef {" +
            "\r\n    background-color: lightgreen;" +
            "\r\n}" +
            "\r\n" +
            "\r\nsvg.railroad-diagram text {" +
            "\r\n    -webkit-touch-callout: default;" +
            "\r\n    -webkit-user-select: text;" +
            "\r\n    -khtml-user-select: text;" +
            "\r\n    -moz-user-select: text;" +
            "\r\n    -ms-user-select: text;" +
            "\r\n    user-select: text;" +
            "\r\n}" +
            "\r\n" +
            "\r\nsvg.railroad-diagram g.non-terminal rect.diagramRectUsage {" +
            "\r\n    color: green;" +
            "\r\n    fill: yellow;" +
            "\r\n    stroke: 5;" +
            "\r\n}" +
            "\r\n" +
            "\r\nsvg.railroad-diagram g.terminal rect.diagramRectUsage {" +
            "\r\n    color: green;" +
            "\r\n    fill: yellow;" +
            "\r\n    stroke: 5;" +
            "\r\n}" +
            "\r\n" +
            "\r\ndiv {" +
            "\r\n    -webkit-touch-callout: none;" +
            "\r\n    -webkit-user-select: none;" +
            "\r\n    -khtml-user-select: none;" +
            "\r\n    -moz-user-select: none;" +
            "\r\n    -ms-user-select: none;" +
            "\r\n    user-select: none;" +
            "\r\n}" +
            "\r\n" +
            "\r\nsvg {" +
            "\r\n    width: 100%;" +
            "\r\n}" +
            "\r\n" +
            "\r\nsvg.railroad-diagram g.non-terminal text {" +
            "\r\n    cursor: pointer;" +
            "\r\n}"
        const result = parseCss(inputText)

        assert.equal(result.lexErrors, 0)
        assert.equal(result.parseErrors.length, 0)
    })
})
