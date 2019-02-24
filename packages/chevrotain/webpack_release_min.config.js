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
        filename: "chevrotain.min.js",
        library: "chevrotain",
        libraryTarget: "umd",
        umdNamedDefine: true,
        // https://github.com/webpack/webpack/issues/6784#issuecomment-375941431
        globalObject: "typeof self !== 'undefined' ? self : this"
    },
    optimization: {
        minimize: true
    },
    plugins: [new webpack.BannerPlugin({ banner: banner, raw: true })]
}
