import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type {
  BenchmarkRuntime,
  CliOptions,
  ComparisonRow,
  WorkerResult,
} from "./types.js";

const MS_PARITY_THRESHOLD = 0.2;

function median(values: number[]) {
  const xs = [...values].sort((a, b) => a - b);
  return xs[Math.floor(xs.length / 2)];
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function isMillisecondPhase(phase: string) {
  return (
    phase === "construction" || phase === "cold" || phase === "first-parse"
  );
}

function getParityNote(phase: string, absoluteDeltaMs: number) {
  if (!isMillisecondPhase(phase)) {
    return "";
  }

  if (absoluteDeltaMs <= MS_PARITY_THRESHOLD) {
    return `parity (<= ${MS_PARITY_THRESHOLD.toFixed(1)} ms)`;
  }

  return "";
}

function getRuntimeCommand(options: CliOptions) {
  return options.runtime === "bun" ? "bun" : process.execPath;
}

export function runWorker(
  libUrl: string,
  options: CliOptions,
  runtimeOverride?: BenchmarkRuntime,
): WorkerResult {
  const workerPath = fileURLToPath(new URL("./worker.js", import.meta.url));
  const args = [
    workerPath,
    "--lib",
    libUrl,
    "--mode",
    options.mode,
    "--parser",
    options.selectedParser,
    "--iterations",
    String(options.iterations),
    "--samples",
    String(options.samples),
    "--json",
  ];

  if (options.useCst) {
    args.push("--cst");
  }

  const result = spawnSync(
    runtimeOverride === undefined
      ? getRuntimeCommand(options)
      : runtimeOverride === "bun"
        ? "bun"
        : process.execPath,
    args,
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `Benchmark subprocess failed for ${libUrl}\n${result.stderr || result.stdout}`,
    );
  }

  return JSON.parse(result.stdout) as WorkerResult;
}

export function measureComparison(options: CliOptions) {
  return finalizeComparison(
    options,
    () => runWorker(options.baselineLibUrl!, options),
    () => runWorker(options.thisPrLibUrl, options),
  );
}

export function measureRuntimeComparison(options: CliOptions) {
  return finalizeComparison(
    options,
    () => runWorker(options.thisPrLibUrl, options, "node"),
    () => runWorker(options.thisPrLibUrl, options, "bun"),
  );
}

function finalizeComparison(
  options: CliOptions,
  runBaseline: () => WorkerResult,
  runCurrent: () => WorkerResult,
) {
  const roundPairs: Array<{ baseline: WorkerResult; current: WorkerResult }> =
    [];
  const totalRounds = options.compareWarmupRounds + options.compareRuns;

  for (let i = 0; i < totalRounds; i++) {
    let baselineMeasurement: WorkerResult;
    let currentMeasurement: WorkerResult;

    if (i % 2 === 0) {
      baselineMeasurement = runBaseline();
      currentMeasurement = runCurrent();
    } else {
      currentMeasurement = runCurrent();
      baselineMeasurement = runBaseline();
    }

    if (i >= options.compareWarmupRounds) {
      roundPairs.push({
        baseline: baselineMeasurement,
        current: currentMeasurement,
      });
    }
  }

  const rowOrder = roundPairs[0].baseline.rows.map(
    (row) => `${row.fixture}::${row.phase}`,
  );
  const pairedMetrics = new Map<
    string,
    {
      fixture: string;
      phase: ComparisonRow["phase"];
      baselineValues: number[];
      currentValues: number[];
      deltaPctValues: number[];
      absoluteDeltaValues: number[];
    }
  >();

  for (const pair of roundPairs) {
    pair.baseline.rows.forEach((baselineRow, index) => {
      const currentRow = pair.current.rows[index];
      const key = `${baselineRow.fixture}::${baselineRow.phase}`;
      const entry = pairedMetrics.get(key) ?? {
        fixture: baselineRow.fixture,
        phase: baselineRow.phase,
        baselineValues: [],
        currentValues: [],
        deltaPctValues: [],
        absoluteDeltaValues: [],
      };

      entry.baselineValues.push(baselineRow.thisPr);
      entry.currentValues.push(currentRow.thisPr);
      entry.absoluteDeltaValues.push(
        Math.abs(currentRow.thisPr - baselineRow.thisPr),
      );

      if (baselineRow.thisPr !== 0) {
        entry.deltaPctValues.push(
          ((currentRow.thisPr - baselineRow.thisPr) / baselineRow.thisPr) * 100,
        );
      }

      pairedMetrics.set(key, entry);
    });
  }

  const rows: ComparisonRow[] = rowOrder.map((key) => {
    const entry = pairedMetrics.get(key)!;
    const baseline = round(median(entry.baselineValues), 3);
    const thisPr = round(median(entry.currentValues), 3);
    const deltaPct =
      entry.deltaPctValues.length === 0
        ? Number.NaN
        : median(entry.deltaPctValues);

    return {
      fixture: entry.fixture,
      phase: entry.phase,
      baseline,
      thisPr,
      deltaPct,
      note: getParityNote(entry.phase, median(entry.absoluteDeltaValues)),
      baselineThroughput: roundPairThroughput(
        roundPairs[0].baseline.rows.find(
          (row) => key === `${row.fixture}::${row.phase}`,
        )!,
        "baseline",
        roundPairs,
      ),
      thisPrThroughput: roundPairThroughput(
        roundPairs[0].current.rows.find(
          (row) => key === `${row.fixture}::${row.phase}`,
        )!,
        "current",
        roundPairs,
      ),
    };
  });

  return {
    parser: roundPairs[0].current.parser,
    fixtures: roundPairs[0].current.fixtures,
    rows,
  };
}

function roundPairThroughput(
  referenceRow: WorkerResult["rows"][number],
  side: "baseline" | "current",
  roundPairs: Array<{ baseline: WorkerResult; current: WorkerResult }>,
) {
  if (!referenceRow.throughput) {
    return undefined;
  }

  const sourceRows = roundPairs
    .map((pair) =>
      side === "baseline" ? pair.baseline.rows : pair.current.rows,
    )
    .map((rows) =>
      rows.find(
        (row) =>
          row.fixture === referenceRow.fixture &&
          row.phase === referenceRow.phase,
      ),
    )
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const charsPerSec = median(
    sourceRows.map((row) => row.throughput?.charsPerSec ?? Number.NaN),
  );
  const tokensPerSec = median(
    sourceRows.map((row) => row.throughput?.tokensPerSec ?? Number.NaN),
  );

  return {
    charsPerOp: referenceRow.throughput.charsPerOp,
    tokensPerOp: referenceRow.throughput.tokensPerOp,
    charsPerSec: round(charsPerSec, 0),
    tokensPerSec: round(tokensPerSec, 0),
  };
}
