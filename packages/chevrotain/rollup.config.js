const typescriptPlugin = require("@rollup/plugin-typescript")
const { default: nodeResolvePlugin } = require("@rollup/plugin-node-resolve")
const typescript = require("typescript")
const { terser } = require("rollup-plugin-terser")
const commonjsPlugin = require("@rollup/plugin-commonjs")

module.exports = {
  input: "src/api.ts",
  output: [
    ["es", false],
    ["es", true],
    ["umd", false],
    ["umd", true]
  ].map(([format, compress]) => ({
    format: format,
    entryFileNames:
      "chevrotain-bundle" +
      (compress ? ".min" : "") +
      (format === "es" ? ".mjs" : ".js"),
    sourcemap: true,
    dir: "lib",
    name: "chevrotain",
    exports: "named",
    plugins: compress
      ? [
          terser({
            compress: {
              passes: 3,
              unsafe: true,
              ecma: 7
            },
            toplevel: true,
            mangle: {
              properties: { regex: /^_/ }
            }
          })
        ]
      : []
  })),
  external: {},
  plugins: [
    typescriptPlugin({ typescript }),
    nodeResolvePlugin(),
    commonjsPlugin()
  ],
  onwarn: function (warning, warn) {
    if ("THIS_IS_UNDEFINED" === warning.code) return
    // if ('CIRCULAR_DEPENDENCY' === warning.code) return
    warn(warning)
  }
}
