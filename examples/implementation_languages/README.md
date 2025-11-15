# Implementation Languages Examples

Chevrotain is a **JavaScript**(ECMAScript) Parsing DSL, However that does not mean Chevrotain Parsers can only be written using
pure JavaScript. It is possible to create Chevrotain Parsers using different flavors of JavaScript or even using
compile to JS languages.

The following examples all implement the same JSON parser using a variety of implementation languages:

- [Modern ECMAScript](https://github.com/chevrotain/chevrotain/blob/master/examples/implementation_languages/modern_ecmascript/modern_ecmascript_json.mjs)

- [TypeScript](https://github.com/chevrotain/chevrotain/blob/master/examples/implementation_languages/typescript/typescript_json.ts)
  - [Generated CST d.ts signatures](https://github.com/chevrotain/chevrotain/blob/master/examples/implementation_languages/typescript/json_cst.d.ts)
  - [Script to generate CST d.ts signatures](https://github.com/chevrotain/chevrotain/blob/master/examples/implementation_languages/typescript/scripts/gen_dts_signatures.js)

To run all the implementation languages examples tests:

- `npm install` (only once)
- `npm test`
