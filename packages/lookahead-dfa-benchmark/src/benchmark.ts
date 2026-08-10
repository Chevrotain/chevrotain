import { runBenchmark, type BenchmarkOptions } from "./benchmark_runner.ts";
import { writeReport } from "./report.ts";
import { SCENARIOS } from "./scenarios.ts";

const SMOKE = process.argv.includes("--smoke");
const MAX_SELECTION_REGRESSION_PERCENT = 5;
const options: BenchmarkOptions = {
  batchSize: 100,
  sampleCount: SMOKE ? 1 : 9,
  sampleDurationMs: SMOKE ? 2 : 25,
  warmupDurationMs: SMOKE ? 0 : 25,
  maxSelectionRegressionPercent: MAX_SELECTION_REGRESSION_PERCENT,
};

const run = runBenchmark(
  SCENARIOS,
  options,
  SMOKE
    ? undefined
    : (current, total, name) => console.log(`[${current}/${total}] ${name}`),
);
const summary = `${run.scenarioCount} scenarios verified; ${run.variantCount} variants measured; checksum=${run.checksum}`;

if (SMOKE) {
  console.log(
    `DFA lookahead smoke: ${run.scenarioCount} scenarios, ${run.variantCount} variants passed`,
  );
} else {
  const reportPath = writeReport(
    run,
    MAX_SELECTION_REGRESSION_PERCENT,
    summary,
  );
  console.log(summary);
  console.log(
    `${run.selectionErrors.length} production selection mistakes exceeded ${MAX_SELECTION_REGRESSION_PERCENT}%`,
  );
  console.log(`Report: ${reportPath}`);
}
