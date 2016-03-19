/// <reference path="../libs/lodash.d.ts" />
// referencing the d.ts from the root project because
// "../node_modules/chevrotain/lib/chevrotain.d.ts" will only be updated during a release build
// so the integration test will run using the previously released version of the d.ts instead of the
// "master/development" version.
/// <reference path="../../../dev/chevrotain.d.ts" />
/// <reference path="../src/parse_tree.ts" />
/// <reference path="../src/ecmascript5_tokens.ts" />
/// <reference path="../src/ecmascript5_lexer.ts" />
/// <reference path="../src/ecmascript5_parser.ts" />
