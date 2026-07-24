// Run `bun run build` from packages/chevrotain first.
// Token baseline: node --expose-gc test/full_flow/location_memory.mjs
// Token imported: node --expose-gc test/full_flow/location_memory.mjs chevrotain
// CST baseline: node --expose-gc test/full_flow/location_memory.mjs cst
// CST initialized: node --expose-gc test/full_flow/location_memory.mjs cst chevrotain

const cstMode = process.argv.includes("cst");
let initializedCst;

if (process.argv.includes("chevrotain")) {
  const { createToken, CstParser } = await import("../../lib/chevrotain.mjs");

  if (cstMode) {
    const Marker = createToken({ name: "Marker", pattern: /marker/ });

    class EmptyCstParser extends CstParser {
      constructor() {
        super([Marker], { nodeLocationTracking: "full" });
        this.empty = this.RULE("empty", () => {});
        this.performSelfAnalysis();
      }
    }

    const parser = new EmptyCstParser();
    parser.input = [];
    initializedCst = parser.empty();
  }
}

if (global.gc === undefined) {
  throw new Error("Run this script with node --expose-gc");
}

const objectCount = 1_000_000;
const objects = new Array(objectCount);

global.gc();
const before = process.memoryUsage().heapUsed;

if (cstMode) {
  for (let i = 0; i < objectCount; i++) {
    objects[i] = {
      startOffset: i,
      startLine: 1,
      startColumn: 1,
      endOffset: i + 1,
      endLine: 1,
      endColumn: 2,
    };
  }
} else {
  for (let i = 0; i < objectCount; i++) {
    objects[i] = {
      image: "",
      startOffset: i,
      endOffset: i + 1,
      startLine: 1,
      endLine: 1,
      startColumn: 1,
      endColumn: 2,
      tokenTypeIdx: 1,
      tokenType: null,
    };
  }
}

global.gc();
const after = process.memoryUsage().heapUsed;

console.log(((after - before) / objectCount).toFixed(1), "bytes per object");
console.log(
  "keep-alive:",
  objects.at(-1).startOffset,
  initializedCst?.location?.startOffset,
);
