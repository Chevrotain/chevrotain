import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect } from "chai";

const tokenHarnessPath = fileURLToPath(
  new URL("./token_memory.js", import.meta.url),
);
const cstHarnessPath = fileURLToPath(
  new URL("./cst_memory.js", import.meta.url),
);

// One boxed HeapNumber adds 16 bytes: 16.7% for tokens and 22.2% for CST
// locations. This tolerates measurement noise while still catching one boxed field.
const MAX_MEMORY_RATIO = 1.1;

function measureRetainedBytes(harnessPath: string, args: string[]): number {
  const env = { ...process.env };
  delete env.NODE_V8_COVERAGE;

  const result = spawnSync(
    process.execPath,
    ["--expose-gc", harnessPath, ...args],
    { encoding: "utf8", env },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.error?.message);
  }

  const bytes = Number.parseFloat(result.stdout);
  expect(bytes).to.be.greaterThan(0);
  return bytes;
}

describe("location object memory", () => {
  it("does not increase token size when Chevrotain is imported", function () {
    this.timeout(20_000);
    const baseline = measureRetainedBytes(tokenHarnessPath, []);
    const imported = measureRetainedBytes(tokenHarnessPath, [
      "--import-chevrotain",
    ]);

    expect(
      imported,
      `baseline: ${baseline}, imported: ${imported}`,
    ).to.be.at.most(baseline * MAX_MEMORY_RATIO);
  });

  it("does not increase CST location size after creating an empty CST", function () {
    this.timeout(20_000);
    const baseline = measureRetainedBytes(cstHarnessPath, []);
    const initialized = measureRetainedBytes(cstHarnessPath, [
      "--create-empty-cst",
    ]);

    expect(
      initialized,
      `baseline: ${baseline}, initialized: ${initialized}`,
    ).to.be.at.most(baseline * MAX_MEMORY_RATIO);
  });
});
