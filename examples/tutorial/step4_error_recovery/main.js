import { parseJsonToCst } from "./step4_error_recovery.js";

let invalidInput = '{ "key"   666}'; // missing comma
let parsingResult = parseJsonToCst(invalidInput);

// Even though we had a syntax error (missing comma), the whole input was parsed
// inspect the parsing result to see both the syntax error and that the output Parse Tree (CST)
// Which even includes the '666' and '}'
console.log(JSON.stringify(parsingResult, null, "\t"));
