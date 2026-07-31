import vm from "node:vm";
import { readFile, writeFile } from "node:fs/promises";

const GRAMMARS = {
  JSON: {
    sampleId: "1K_json.js",
    scripts: ["json/json_parser.js", "json/1K_json.js"],
    startRule: "json",
  },
  CSS: {
    sampleId: "1K_css.js",
    scripts: ["css/css_parser.js", "css/1K_css.js"],
    startRule: "stylesheet",
    globals: ["https://unpkg.com/xregexp@3.2.0/xregexp-all.js"],
  },
  ECMA5: {
    sampleId: "benchmark@2.1.4/benchmark.js",
    scripts: [
      "ecma5/ecma5_tokens.js",
      "ecma5/ecma5_lexer.js",
      "ecma5/ecma5_parser.js",
    ],
    startRule: "Program",
    globals: ["https://unpkg.com/acorn@8.10.0/dist/acorn.js"],
    sampleUrl: "https://unpkg.com/benchmark@2.1.4/benchmark.js",
    validateEcmaLineTerminators: true,
  },
};

const [baseline, candidate, output, runCount = "2"] = process.argv.slice(2);
if (!baseline || !candidate || !output) {
  throw Error(
    "Usage: node --experimental-vm-modules node_parser_benchmark.mjs <baseline.mjs> <candidate.mjs> <output.json> [runs]",
  );
}
if (vm.SourceTextModule === undefined) {
  throw Error("Node must be run with --experimental-vm-modules");
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw Error(`Unable to load ${url}: ${response.status}`);
  return response.text();
}

const parserDirectory = new URL("./parsers/", import.meta.url);
const sources = new Map();
async function source(path) {
  if (!sources.has(path)) {
    sources.set(
      path,
      path.startsWith("https:")
        ? fetchText(path)
        : readFile(new URL(path, parserDirectory), "utf8"),
    );
  }
  return sources.get(path);
}

async function runModule(context, code, identifier) {
  const module = new vm.SourceTextModule(code, { context, identifier });
  await module.link(() => {
    throw Error(`${identifier} unexpectedly imported another module`);
  });
  await module.evaluate();
  return module;
}

async function setup(bundle, grammarName) {
  const grammar = GRAMMARS[grammarName];
  const context = vm.createContext({
    console,
    performance,
    TextEncoder,
    navigator: { userAgent: `Node.js/${process.version}` },
  });
  context.self = context;
  context.parserConfig = { maxLookahead: 2, outputCst: false };

  const bundleModule = await runModule(
    context,
    await readFile(bundle, "utf8"),
    bundle,
  );
  context.chevrotain = { ...bundleModule.namespace };
  for (const globalScript of grammar.globals ?? []) {
    new vm.Script(await source(globalScript), {
      filename: globalScript,
    }).runInContext(context);
  }
  if (grammar.sampleUrl) context.sample = await source(grammar.sampleUrl);
  for (const script of grammar.scripts) {
    await runModule(context, await source(script), script);
  }
  await runModule(context, await source("api.js"), "api.js");

  const metadata = context.setupParserBench(
    context.sample,
    context.lexerDefinition,
    context.customLexer,
    context.parser,
    grammar.startRule,
    context.parserConfig,
    {
      grammarId: grammarName,
      sampleId: grammar.sampleId,
      importScripts: [bundle, ...grammar.scripts, "api.js"],
      validateEcmaLineTerminators: grammar.validateEcmaLineTerminators,
    },
  );
  return {
    setupParserBenchmark: async () => metadata,
    async runParserBatch(iterations) {
      const result = context.runParserBatch(iterations);
      result.roundTripMs = result.elapsedMs;
      return result;
    },
  };
}

await import("./parser_benchmark.js");

async function warm(frames, iterations) {
  const started = performance.now();
  const throughputs = frames.map(() => []);
  let sample = 0;
  while (performance.now() - started < 10000) {
    for (let offset = 0; offset < frames.length; offset++) {
      const index = (sample + offset) % frames.length;
      const result = await frames[index].runParserBatch(iterations);
      throughputs[index].push(result.completedIterations / result.elapsedMs);
    }
    sample++;
    if (
      performance.now() - started >= 2000 &&
      throughputs.every(ParserBenchmark.isStable)
    ) {
      return { elapsedMs: performance.now() - started, stable: true };
    }
  }
  return {
    elapsedMs: performance.now() - started,
    stable: false,
    throughputs: throughputs.map((values) => values.slice(-5)),
  };
}

async function runGrammar(grammar, reverse) {
  const bundles = reverse ? [candidate, baseline] : [baseline, candidate];
  const frames = [
    await setup(bundles[0], grammar),
    await setup(bundles[1], grammar),
  ];
  if (reverse) frames.reverse();
  const metadata = [];
  for (const frame of frames) metadata.push(await frame.setupParserBenchmark());
  const mismatch = ParserBenchmark.metadataMismatch(metadata[0], metadata[1]);
  if (mismatch !== undefined)
    throw Error(`${grammar} metadata mismatch: ${mismatch}`);

  const calibrations = [];
  for (const frame of frames)
    calibrations.push(await ParserBenchmark.calibrate(frame));
  const iterations = Math.max(
    ...calibrations.map((result) => result.iterations),
  );
  const warmup = await warm(frames, iterations);
  if (!warmup.stable) {
    throw Error(
      `${grammar} parser throughput did not stabilize: ${JSON.stringify(warmup.throughputs)}`,
    );
  }
  const stats = await ParserBenchmark.measure(frames, iterations);
  const overhead = await frames[1].runParserBatch(iterations);
  return {
    baselineMetadata: metadata[0],
    baselineStats: stats[0],
    candidateMetadata: metadata[1],
    candidateStats: stats[1],
    pairedSpeed: ParserBenchmark.pairedSpeed(
      stats[0].samples,
      stats[1].samples,
    ),
    iterations,
    warmup,
    workerOverheadRatio: Math.max(
      0,
      (overhead.roundTripMs - overhead.elapsedMs) / overhead.elapsedMs,
    ),
    measuredAt: new Date().toISOString(),
  };
}

const runs = [];
for (let run = 0; run < Number(runCount); run++) {
  const records = {};
  for (const grammar of Object.keys(GRAMMARS)) {
    records[grammar] = await runGrammar(grammar, run % 2 === 1);
  }
  runs.push(records);
}
await writeFile(output, JSON.stringify(runs));
