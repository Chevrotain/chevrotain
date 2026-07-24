// Run `bun run build` from packages/chevrotain first.
// Baseline: node --expose-gc lib/test/full_flow/token_memory.js
// Imported: node --expose-gc lib/test/full_flow/token_memory.js --import-chevrotain

interface TokenShape {
  image: string;
  startOffset: number;
  endOffset: number;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  tokenTypeIdx: number;
  tokenType: null;
}

async function main() {
  if (process.argv.includes("--import-chevrotain")) {
    await import(new URL("../../chevrotain.mjs", import.meta.url).href);
  }

  const gc = (globalThis as typeof globalThis & { gc?: () => void }).gc;
  if (gc === undefined) {
    throw new Error("Run this script with node --expose-gc");
  }

  const objectCount = 1_000_000;
  const objects: TokenShape[] = new Array(objectCount);

  gc();
  const before = process.memoryUsage().heapUsed;

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

  gc();
  const after = process.memoryUsage().heapUsed;

  console.log(((after - before) / objectCount).toFixed(1), "bytes per object");
  // This later read keeps the objects live during the preceding GC. The log runs
  // after the heap sample, so it is excluded from `after`.
  console.log("keep-alive:", objects[objectCount - 1].startOffset);
}

void main();
