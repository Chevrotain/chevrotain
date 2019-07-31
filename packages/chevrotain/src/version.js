"use strict"
exports.__esModule = true
// needs a separate module as this is required inside chevrotain productive code
// and also in the entry point for webpack(api.ts).
// A separate file avoids cyclic dependencies and webpack errors.
exports.VERSION = "4.8.1"
