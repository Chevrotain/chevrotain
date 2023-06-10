module.exports = {
  reporter: ["lcov", "text"],
  exclude: [
    "lib/test/**/*.*",
    "test/test.config.js",
    // unable to exclude specific deperacted function in this file
    // due to transpilation step "moving" the ignore comments around.
    "lib/src/parse/errors_public.js"
  ]
}
