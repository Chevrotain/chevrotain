import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { CliOptions, WorkerOptions } from "./types.js";

const DEFAULT_BASELINE_LABEL = "v12.0.0";
const DEFAULT_CURRENT_LABEL = "Current";

function getArg(args: string[], flag: string, defaultValue?: string) {
  const index = args.indexOf(flag);
  return index !== -1 ? args[index + 1] : defaultValue;
}

function hasFlag(args: string[], flag: string) {
  return args.includes(flag);
}

function resolveLibUrl(
  libPath: string,
  defaultHref: string,
  importMetaUrl: string,
) {
  const resolvedPath = libPath || defaultHref;

  if (resolvedPath.startsWith("http") || resolvedPath.startsWith("file:")) {
    return resolvedPath;
  }

  const cwdResolved = path.resolve(process.cwd(), resolvedPath);

  if (path.isAbsolute(resolvedPath) || fs.existsSync(cwdResolved)) {
    return pathToFileURL(cwdResolved).href;
  }

  const repoRoot = fileUrlToRepoRoot(importMetaUrl);
  return pathToFileURL(path.resolve(repoRoot, resolvedPath)).href;
}

function fileUrlToRepoRoot(importMetaUrl: string) {
  return path.resolve(path.dirname(fileURLToPath(importMetaUrl)), "../../..");
}

export function parseCliArgs(
  args: string[],
  importMetaUrl: string,
): CliOptions {
  const localLibHref = new URL(
    "../../chevrotain/lib/chevrotain.mjs",
    importMetaUrl,
  ).href;
  const iterations = parseInt(getArg(args, "--iterations", "5000")!, 10);

  return {
    mode: (getArg(args, "--mode", "warm") as CliOptions["mode"]) ?? "warm",
    selectedParser:
      (getArg(args, "--parser", "all") as CliOptions["selectedParser"]) ??
      "all",
    useCst: hasFlag(args, "--cst"),
    iterations,
    warmup: Math.max(100, Math.floor(iterations * 0.1)),
    samples: Math.max(3, parseInt(getArg(args, "--samples", "7")!, 10)),
    thisPrLibUrl: resolveLibUrl(
      getArg(args, "--lib", localLibHref)!,
      localLibHref,
      importMetaUrl,
    ),
    baselineLibUrl: getArg(args, "--baseline-lib")
      ? resolveLibUrl(
          getArg(args, "--baseline-lib")!,
          localLibHref,
          importMetaUrl,
        )
      : undefined,
    baselineLabel: getArg(args, "--baseline-label", DEFAULT_BASELINE_LABEL)!,
    currentLabel: getArg(args, "--current-label", DEFAULT_CURRENT_LABEL)!,
    jsonOutput: hasFlag(args, "--json"),
    compareRuns: Math.max(
      3,
      parseInt(getArg(args, "--compare-runs", "7")!, 10),
    ),
    compareWarmupRounds: Math.max(
      0,
      parseInt(getArg(args, "--compare-warmup-rounds", "1")!, 10),
    ),
  };
}

export function parseWorkerArgs(
  args: string[],
  importMetaUrl: string,
): WorkerOptions {
  const cliArgs = parseCliArgs(args, importMetaUrl);
  return {
    libUrl: cliArgs.thisPrLibUrl,
    mode: cliArgs.mode,
    selectedParser: cliArgs.selectedParser,
    useCst: cliArgs.useCst,
    iterations: cliArgs.iterations,
    warmup: cliArgs.warmup,
    samples: cliArgs.samples,
  };
}
