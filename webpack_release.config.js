const path = require("path")
const webpack = require("webpack")
const jf = require("jsonfile")
const pkg = jf.readFileSync("./package.json")

const banner = `/*! ${pkg.name} - v${pkg.version} */`

module.exports = {
    mode: "production",
    stats: {
        colors: true,
        modules: true,
        reasons: true
    },
    entry: "./lib/src/api.js",
    output: {
        path: path.resolve(__dirname, "./lib/"),
        filename: "chevrotain.js",
        library: "chevrotain",
        libraryTarget: "umd",
        umdNamedDefine: true
    },
    optimization: {
        minimize: false
    },
    plugins: [new webpack.BannerPlugin({ banner: banner, raw: true })]
}
