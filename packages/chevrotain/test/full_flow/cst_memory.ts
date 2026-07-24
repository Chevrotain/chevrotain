import type { CstNode } from "@chevrotain/types";

// Run `bun run build` from packages/chevrotain first.
// Baseline: node --expose-gc lib/test/full_flow/cst_memory.js
// Initialized: node --expose-gc lib/test/full_flow/cst_memory.js --create-empty-cst

interface CstLocationShape {
  startOffset: number;
  startLine: number;
  startColumn: number;
  endOffset: number;
  endLine: number;
  endColumn: number;
}

async function main() {
  let initializedCst: CstNode | undefined;

  if (process.argv.includes("--create-empty-cst")) {
    const { createToken, CstParser } = await import(
      new URL("../../chevrotain.mjs", import.meta.url).href
    );
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

  const gc = (globalThis as typeof globalThis & { gc?: () => void }).gc;
  if (gc === undefined) {
    throw new Error("Run this script with node --expose-gc");
  }

  const objectCount = 1_000_000;
  const objects: CstLocationShape[] = new Array(objectCount);

  gc();
  const before = process.memoryUsage().heapUsed;

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

  gc();
  const after = process.memoryUsage().heapUsed;

  console.log(((after - before) / objectCount).toFixed(1), "bytes per object");
  // These later reads keep the objects (and CST shape metadata) live during the
  // preceding GC. The log runs after the heap sample, so it is excluded from `after`.
  console.log(
    "keep-alive:",
    objects[objectCount - 1].startOffset,
    initializedCst?.location?.startOffset,
  );
}

void main();
