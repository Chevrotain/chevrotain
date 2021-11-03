module.exports = {
  recursive: true,
  require: ["./test/test.config", "ts-node/register"],
  reporter: "spec",
  spec: "./test/**/*spec.ts"
}
