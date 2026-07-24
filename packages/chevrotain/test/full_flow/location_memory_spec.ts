import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect } from "chai";

const harnessPath = fileURLToPath(
  new URL("./location_memory.js", import.meta.url),
);

function measureRetainedBytes(args: string[]): number {
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
    const baseline = measureRetainedBytes([]);
    const imported = measureRetainedBytes(["chevrotain"]);

    expect(
      imported,
      `baseline: ${baseline}, imported: ${imported}`,
    ).to.be.at.most(baseline * 1.1);
  });

  it("does not increase CST location size after creating an empty CST", function () {
    this.timeout(20_000);
    const baseline = measureRetainedBytes(["cst"]);
    const initialized = measureRetainedBytes(["cst", "chevrotain"]);

    expect(
      initialized,
      `baseline: ${baseline}, initialized: ${initialized}`,
    ).to.be.at.most(baseline * 1.1);
  });
});
