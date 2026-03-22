import { parseCliArgs } from "./args.js";
import {
  measureComparison,
  measureRuntimeComparison,
  runWorker,
} from "./compare.js";
import {
  printFixtureStats,
  printTable,
  printWarmLexThroughputComparison,
  printWarmLexThroughputSingle,
  toComparisonRows,
  toSingleBuildRows,
} from "./output.js";

const options = parseCliArgs(process.argv.slice(2), import.meta.url);

if (options.baselineLibUrl || options.compareRuntime) {
  const comparison = options.compareRuntime
    ? measureRuntimeComparison(options)
    : measureComparison(options);
  const baselineLabel = options.compareRuntime ? "Node" : options.baselineLabel;
  const currentLabel = options.compareRuntime ? "Bun" : options.currentLabel;

  if (options.jsonOutput) {
    console.log(
      JSON.stringify({
        mode: options.mode,
        runtime: options.runtime,
        comparisonMode: options.compareRuntime ? "runtime" : "build",
        parser: comparison.parser,
        iterations: options.iterations,
        warmup: options.warmup,
        samples: options.samples,
        compareRuns: options.compareRuns,
        compareWarmupRounds: options.compareWarmupRounds,
        baseline: {
          label: baselineLabel,
          lib: options.compareRuntime
            ? options.thisPrLibUrl
            : options.baselineLibUrl,
        },
        thisPr: {
          label: currentLabel,
          lib: options.thisPrLibUrl,
        },
        rows: comparison.rows.map((row) => ({
          fixture: row.fixture,
          phase: row.phase,
          baseline: row.baseline,
          thisPr: row.thisPr,
          deltaPct: Number.isFinite(row.deltaPct)
            ? Math.round(row.deltaPct * 10) / 10
            : row.deltaPct,
          note: row.note || null,
        })),
      }),
    );
    process.exit(0);
  }

  console.log("\nChevrotain benchmark");
  console.log(`  parser:     ${comparison.parser}`);
  console.log(`  comparison: ${options.compareRuntime ? "runtime" : "build"}`);
  console.log(
    `  runtime:    ${options.compareRuntime ? "node vs bun" : options.runtime}`,
  );
  console.log(`  mode:       ${options.mode}`);
  console.log(
    `  iterations: ${options.iterations.toLocaleString()} (+ ${options.warmup.toLocaleString()} warmup)`,
  );
  console.log(`  fixtures:   ${comparison.fixtures.join(", ")}`);
  console.log(
    `  compare-runs: ${options.compareRuns} (+ ${options.compareWarmupRounds} warmup round${options.compareWarmupRounds === 1 ? "" : "s"})`,
  );
  console.log(
    `  ${baselineLabel}: ${options.compareRuntime ? options.thisPrLibUrl : options.baselineLibUrl}`,
  );
  console.log(`  ${currentLabel}: ${options.thisPrLibUrl}\n`);

  const table = toComparisonRows(comparison.rows, baselineLabel, currentLabel);
  printTable(table.headers, table.rows);
  printFixtureStats(comparison.rows);
  printWarmLexThroughputComparison(
    comparison.rows,
    baselineLabel,
    currentLabel,
  );
  process.exit(0);
}

const result = runWorker(options.thisPrLibUrl, options);

if (options.jsonOutput) {
  console.log(
    JSON.stringify({
      mode: options.mode,
      runtime: options.runtime,
      parser: result.parser,
      iterations: options.iterations,
      warmup: options.warmup,
      samples: options.samples,
      baseline: null,
      thisPr: {
        label: options.currentLabel,
        lib: options.thisPrLibUrl,
      },
      rows: result.rows,
    }),
  );
  process.exit(0);
}

console.log("\nChevrotain benchmark");
console.log(`  parser:     ${result.parser}`);
console.log(`  runtime:    ${options.runtime}`);
console.log(`  mode:       ${options.mode}`);
console.log(
  `  iterations: ${options.iterations.toLocaleString()} (+ ${options.warmup.toLocaleString()} warmup)`,
);
console.log(`  fixtures:   ${result.fixtures.join(", ")}`);
console.log(`  ${options.currentLabel}: ${options.thisPrLibUrl}\n`);

const table = toSingleBuildRows(result.rows, options.currentLabel);
printTable(table.headers, table.rows);
printFixtureStats(result.rows);
printWarmLexThroughputSingle(result.rows, options.currentLabel);
