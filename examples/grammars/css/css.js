// wrapping in UMD to allow code to work both in node.js (the tests/specs)
// and in the browser (css_diagrams.html)
;(function(root, factory) {
    if (typeof module === "object" && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require("chevrotain"), require("xregexp"))
    } else {
        // Browser globals (root is window)\
        root["parser"] = factory(root.chevrotain, root.XRegExp).CssParser
    }
})(this, function(chevrotain, XRegExp) {
    return {
        parseCss: function(text) {
            var lexResult = CssLexer.tokenize(text)
            // setting a new input will RESET the parser instance's state.
            parser.input = lexResult.tokens
            // any top level rule may be used as an entry point
            var value = parser.stylesheet()

            return {
                value: value, // this is a pure grammar, the value will always be <undefined>
                lexErrors: lexResult.errors,
                parseErrors: parser.errors
            }
        },

        // exporting a the CSS Parser constructor the enable drawing the diagrams
        CssParser: Parser
    }
})
