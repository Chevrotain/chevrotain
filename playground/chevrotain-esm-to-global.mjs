import * as chevrotain from "https://unpkg.com/chevrotain/lib/chevrotain.min.mjs";

// "import * from" returns a `Module` object which needs to be destructured first
const spreadChevrotain = { ...chevrotain };
window.chevrotain = spreadChevrotain;
