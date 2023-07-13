import * as chevrotain from "../../../lib/chevrotain.mjs";

// "import * from" returns a `Module` object which needs to be destructured first
const spreadChevrotain = { ...chevrotain };
// legacy code expects chevrotain on the webWorker "global"
self.chevrotain = spreadChevrotain;