/**
 * Benchmark worker — a long-lived sub-process that communicates via IPC.
 *
 * The orchestrator spawns one worker per variant (grammar × phase × version).
 * The worker loads chevrotain, creates the grammar, warms up V8, then waits
 * for "measure" commands. Each command runs a small batch of samples and
 * sends the timing data back. This keeps V8 warm across all rounds.
 *
 * IPC Protocol:
 *   Parent → Child:
 *     { type: "init", grammar, phase, chevrotainPath, outputCst, warmupIterations }
 *     { type: "measure", batchSize }
 *     { type: "exit" }
 *
 *   Child → Parent:
 *     { type: "ready" }
 *     { type: "samples", samples: number[] }
 *     { type: "error", message: string }
 */
import { GRAMMARS } from "./grammars/index.ts";
import type { WorkerCommand, WorkerResponse, Phase } from "./types.ts";

// Resolve gc() — available when Node is started with --expose-gc
const gc: (() => void) | undefined =
  typeof globalThis.gc === "function" ? globalThis.gc : undefined;

// High-resolution timer: performance.now() returns ms, we convert to ns
const now = performance.now.bind(performance);

let fn: (() => void) | null = null;

function send(msg: WorkerResponse) {
  process.send!(msg);
}

async function handleInit(cmd: Extract<WorkerCommand, { type: "init" }>) {
  try {
    // Load the correct chevrotain version
    const chevrotain = await import(cmd.chevrotainPath);
    console.log(`chevrotain version ${chevrotain.VERSION} loaded in worker`);
    console.error(`chevrotain version ${chevrotain.VERSION} loaded in worker`);

    // Look up grammar factory
    const grammarDef = GRAMMARS[cmd.grammar];
    if (!grammarDef) {
      send({
        type: "error",
        message: `Unknown grammar: "${cmd.grammar}". Available: ${Object.keys(GRAMMARS).join(", ")}`,
      });
      return;
    }

    // Create grammar instance
    const grammar = grammarDef.factory(chevrotain, {
      outputCst: cmd.outputCst,
    });
    const sampleInput = grammarDef.sampleInput;

    // Build the function to measure based on phase
    if (cmd.phase === "lexer") {
      fn = () => {
        do_not_optimize(grammar.lex(sampleInput));
      };
    } else if (cmd.phase === "parser") {
      // Lex once upfront; only the parse step is measured each iteration
      const tokens = grammar.lex(sampleInput);
      fn = () => {
        const x = do_not_optimize(grammar.parse(tokens));
        const y = 5;
      };
    } else {
      // "full" — lex + parse every iteration
      fn = () => {
        do_not_optimize(grammar.fullFlow(sampleInput));
      };
    }

    // Warmup: run fn() many times to let V8 TurboFan reach steady-state
    if (gc) gc();
    for (let i = 0; i < cmd.warmupIterations; i++) {
      fn();
    }
    if (gc) gc();

    send({ type: "ready" });
  } catch (err: any) {
    send({ type: "error", message: err.message ?? String(err) });
  }
}

function handleMeasure(cmd: Extract<WorkerCommand, { type: "measure" }>) {
  if (!fn) {
    send({ type: "error", message: "Worker not initialized" });
    return;
  }

  try {
    // GC once before the batch to start from a clean state
    if (gc) gc();

    const samples = new Array<number>(cmd.batchSize);
    for (let i = 0; i < cmd.batchSize; i++) {
      const t0 = now();
      fn();
      const t1 = now();
      // Convert ms to ns
      samples[i] = (t1 - t0) * 1e6;
    }

    send({ type: "samples", samples });
  } catch (err: any) {
    send({ type: "error", message: err.message ?? String(err) });
  }
}

// ---------- Main: listen for IPC messages ----------
process.on("message", async (msg: WorkerCommand) => {
  switch (msg.type) {
    case "init":
      await handleInit(msg);
      break;
    case "measure":
      handleMeasure(msg);
      break;
    case "exit":
      process.exit(0);
      break;
  }
});

function do_not_optimize(v) {
  $._ = v;
  return v;
}
const $ = {
  _: null,
  __() {
    // @ts-ignore
    return print($._);
  },
};
