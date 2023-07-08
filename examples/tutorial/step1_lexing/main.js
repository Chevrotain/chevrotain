import { lex } from "./step1_lexing.js";

const inputText = "SELECT column1 FROM table2";
const lexingResult = lex(inputText);
console.log(JSON.stringify(lexingResult, null, "\t"));
