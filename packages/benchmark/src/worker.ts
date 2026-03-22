import { parseWorkerArgs } from "./args.js";
import { measureLibrary } from "./measure.js";

const options = parseWorkerArgs(process.argv.slice(2), import.meta.url);
const chevrotain = (await import(options.libUrl)) as Record<string, unknown>;
const result = measureLibrary(chevrotain, options);

console.log(JSON.stringify(result));
