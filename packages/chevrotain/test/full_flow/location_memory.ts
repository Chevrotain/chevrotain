import type { CstNode } from "@chevrotain/types";

// Run `bun run build` from packages/chevrotain first.
// Token baseline: node --expose-gc lib/test/full_flow/location_memory.js
// Token imported: node --expose-gc lib/test/full_flow/location_memory.js chevrotain
// CST baseline: node --expose-gc lib/test/full_flow/location_memory.js cst
// CST initialized: node --expose-gc lib/test/full_flow/location_memory.js cst chevrotain

async function main() {
  const cstMode = process.argv.includes("cst");
  let initializedCst: CstNode | undefined;

  if (process.argv.includes("chevrotain")) {
    const { createToken, CstParser } = await import(
      new URL("../../chevrotain.mjs", import.meta.url).href
    );

    if (cstMode) {
      const Marker = createToken({ name: "Marker", pattern: /marker/ });

      class EmptyCstParser extends CstParser {
        empty: () => CstNode;

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

  const gc = (globalThis as typeof globalThis & { gc?: () => void }).gc;
  if (gc === undefined) {
    throw new Error("Run this script with node --expose-gc");
  }

  const objectCount = 1_000_000;
  const objects: any[] = new Array(objectCount);

  gc();
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

  gc();
  const after = process.memoryUsage().heapUsed;

  console.log(((after - before) / objectCount).toFixed(1), "bytes per object");
  console.log(
    "keep-alive:",
    objects.at(-1).startOffset,
    initializedCst?.location?.startOffset,
  );
}

void main();
