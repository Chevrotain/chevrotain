module.exports = {
  recursive: true,
  require: ["./test/test.config.mjs"],
  reporter: "spec",
  spec: "./lib/test/**/*spec.js"
}
