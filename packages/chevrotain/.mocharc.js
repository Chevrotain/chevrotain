module.exports = {
  recursive: true,
  require: ["./test/test.config", "source-map-support/register"],
  reporter: "spec",
  spec: "./lib/test/**/atn*spec.js"
}
