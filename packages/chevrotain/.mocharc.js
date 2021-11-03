module.exports = {
  recursive: true,
  require: [
    "./test/test.config",
    "source-map-support/register",
    "ts-node/register"
  ],
  reporter: "spec",
  spec: "./test/**/*spec.ts"
}
