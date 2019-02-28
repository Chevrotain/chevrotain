const path = require("path")
const TerserPlugin = require("terser-webpack-plugin")
const { allTokens } = require("./src/our_grammar")

// extract the names of the TokenTypes to avoid name mangling them.
const allTokenNames = allTokens.map(tokenType => tokenType.name)

module.exports = {
    mode: "production",
    entry: "./src/our_grammar.js",
    output: {
        path: path.resolve(__dirname, "./lib/"),
        filename: "webpacked.min.js",
        library: "blah",
        libraryTarget: "umd",
        // https://github.com/webpack/webpack/issues/6784#issuecomment-375941431
        globalObject: "typeof self !== 'undefined' ? self : this"
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    mangle: {
                        // Avoid mangling TokenType names.
                        reserved: allTokenNames
                    }
                }
            })
        ]
    }
}
