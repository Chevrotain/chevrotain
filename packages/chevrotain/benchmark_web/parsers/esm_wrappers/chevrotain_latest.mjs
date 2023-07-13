import * as chevrotain from "https://unpkg.com/chevrotain/lib/chevrotain.mjs";

// "import * from" returns a `Module` object which needs to be destructured first
const spreadChevrotain = { ...chevrotain };
// legacy code expects chevrotain on the webWorker "global"
self.chevrotain = spreadChevrotain;