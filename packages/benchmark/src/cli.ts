import { parseCliArgs } from "./args.js";
import { measureComparison } from "./compare.js";
import { measureLibrary } from "./measure.js";
import { printTable, toComparisonRows, toSingleBuildRows } from "./output.js";

const options = parseCliArgs(process.argv.slice(2), import.meta.url);

if (options.baselineLibUrl) {
  const comparison = measureComparison(options);

  if (options.jsonOutput) {
    console.log(
      JSON.stringify({
        mode: options.mode,
        parser: comparison.parser,
        iterations: options.iterations,
        warmup: options.warmup,
        samples: options.samples,
        compareRuns: options.compareRuns,
        compareWarmupRounds: options.compareWarmupRounds,
        baseline: {
          label: options.baselineLabel,
          lib: options.baselineLibUrl,
        },
        thisPr: {
          label: options.currentLabel,
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
  console.log(`  mode:       ${options.mode}`);
  console.log(
    `  iterations: ${options.iterations.toLocaleString()} (+ ${options.warmup.toLocaleString()} warmup)`,
  );
  console.log(`  fixtures:   ${comparison.fixtures.join(", ")}`);
  console.log(
    `  compare-runs: ${options.compareRuns} (+ ${options.compareWarmupRounds} warmup round${options.compareWarmupRounds === 1 ? "" : "s"})`,
  );
  console.log(`  ${options.baselineLabel}: ${options.baselineLibUrl}`);
  console.log(`  ${options.currentLabel}: ${options.thisPrLibUrl}\n`);

  const table = toComparisonRows(
    comparison.rows,
    options.baselineLabel,
    options.currentLabel,
  );
  printTable(table.headers, table.rows);
  process.exit(0);
}

const chevrotain = (await import(options.thisPrLibUrl)) as Record<
  string,
  unknown
>;
const result = measureLibrary(chevrotain, options);

if (options.jsonOutput) {
  console.log(
    JSON.stringify({
      mode: options.mode,
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
console.log(`  mode:       ${options.mode}`);
console.log(
  `  iterations: ${options.iterations.toLocaleString()} (+ ${options.warmup.toLocaleString()} warmup)`,
);
console.log(`  fixtures:   ${result.fixtures.join(", ")}`);
console.log(`  ${options.currentLabel}: ${options.thisPrLibUrl}\n`);

const table = toSingleBuildRows(result.rows, options.currentLabel);
printTable(table.headers, table.rows);
