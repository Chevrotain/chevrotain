# Implementation Languages Examples

Chevrotain is a **JavaScript**(ECMAScript) Parsing DSL, However that does not mean Chevrotain Parsers can only be written using
pure JavaScript. It is possible to create Chevrotain Parsers using different flavors of JavaScript or even using
compile to JS languages.

The following examples all implement the same JSON parser using a variety of implementation languages:

- [ECMAScript 5](https://github.com/SAP/Chevrotain/blob/master/examples/implementation_languages/ecma5/ecma5_json.js)

- [ECMAScript 6/2015](https://github.com/SAP/Chevrotain/blob/master/examples/implementation_languages/ecma6/ecma6_json.js)

- [TypeScript](https://github.com/SAP/Chevrotain/blob/master/examples/implementation_languages/typescript/typescript_json.ts)

- [CoffeeScript](https://github.com/SAP/chevrotain/blob/master/examples/implementation_languages/coffeescript/coffeescript_json.coffee)

To run all the implementation languages examples's tests:

- `npm install` (only once)
- `npm test`
