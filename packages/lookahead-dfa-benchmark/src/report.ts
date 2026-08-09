import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { BenchmarkRun } from "./benchmark_runner.ts";

function markdownTable(rows: Record<string, unknown>[]): string {
  const headings = Object.keys(rows[0]);
  const escape = (value: unknown) => String(value).replaceAll("|", "\\|");
  return [
    `| ${headings.join(" | ")} |`,
    `| ${headings.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${Object.values(row).map(escape).join(" | ")} |`),
  ].join("\n");
}

export function writeReport(
  run: BenchmarkRun,
  maxSelectionRegressionPercent: number,
  summary: string,
): string {
  const rows = run.scenarioResults.flatMap((scenario) => {
    const original = scenario.variants.find(
      (variant) => variant.name === "Original",
    )!;
    return scenario.variants.map((variant) => ({
      Scenario: scenario.scenario,
      Variant: variant.name,
      "M calls/s": (variant.callsPerSecond / 1e6).toFixed(2),
      "vs original": `${(
        (variant.callsPerSecond / original.callsPerSecond) *
        100
      ).toFixed(1)}%`,
      "Build us": variant.buildMicros.toFixed(2),
      "Production selected": variant.productionSelected,
      States: variant.states ?? "-",
      Transitions: variant.transitions ?? "-",
      "Max candidates": variant.maxCandidates ?? "-",
    }));
  });
  const selectionErrorReport =
    run.selectionErrors.length === 0
      ? `No production selection errors exceeded ${maxSelectionRegressionPercent}%.`
      : markdownTable(
          run.selectionErrors.map((error) => ({
            Scenario: error.scenario,
            "Production selected": error.productionSelected,
            "Faster variant": error.fasterVariant,
            "Selected M calls/s": (error.selectedCallsPerSecond / 1e6).toFixed(
              2,
            ),
            "Faster M calls/s": (error.fasterCallsPerSecond / 1e6).toFixed(2),
            Regression: `${error.regressionPercent.toFixed(1)}%`,
          })),
        );
  const reportDirectory = new URL("../report/", import.meta.url);
  const reportUrl = new URL("lookahead_dfa_benchmark.md", reportDirectory);
  mkdirSync(reportDirectory, { recursive: true });
  writeFileSync(
    reportUrl,
    `# DFA Lookahead Microbenchmark

- Generated: ${new Date().toISOString()}
- Node: ${process.version}
- V8: ${process.versions.v8}
- Platform: ${process.platform} ${process.arch}
- Selection regression threshold: ${maxSelectionRegressionPercent}%

${markdownTable(rows)}

## Production Selection Errors (>${maxSelectionRegressionPercent}%)

${selectionErrorReport}

${summary}
`,
  );
  return fileURLToPath(reportUrl);
}
