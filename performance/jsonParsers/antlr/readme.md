## Background

Due to readability, transparency and legacy reasons, we would like to separate the antlr4
runtime and the generated parser.

This has resulted in ever-growing complexity in including antlr4 in this benchmark.

TODO: consider alternatives:
1. bundling everything together in a single file to reduce complexity.
   Perhaps only after antlr + esbuild bundling bug is fixed?
  - https://github.com/antlr/antlr4/issues/4211
2. Using ECMAScript modules in the browser (without bundling?).

## Updating Antlr4 runtime

1. update the version in the root `package.json` file + run `yarn`
2. update the version in the `generate.sh` script.
3. update the version (in file name) in the `pack_antlr4` script in root package.json.
4. remove the previous `dist/antlr_4_x_y.js` file.
5. bundle a the new runtime with `pack_antlr4` script in root package.json.
6. update the script tag for the newly generated `dist/antlr_4_x_y.js` in the [antlr.html](./antlr.html) file.
7. [Re-generate](#regenerate-grammar) the grammar
8. [Modify the generated sources](#changes-to-the-generated-files).
9. Update the [antlr-api-adapter.js](./dist/antlr-api-adapter.js) if needed.
10. test that everything still works.

## Regenerate Grammar

For example, during antlr4 version update.
See the included `./generate.sh` script.

Note this script requires `Java` and `curl`.

### Changes to the generated files

Some modifications will have to be made afterward to the generated files.
(Inspect the diffs at start and end of generated files).

1. removing `import` statements
   - antlr4 var will be available globally via script tags in the html file.
2. removing export statements
3. Wrapping the file in an [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE)
4. exporting the parser and lexer objects via the IIFE global variable.

## Notes on the `antlr-api-adapter.js`

Antlr4 npm package does not include its (unbundled) source code.
Instead it contains a dist dir with multiple bundled artifacts.

