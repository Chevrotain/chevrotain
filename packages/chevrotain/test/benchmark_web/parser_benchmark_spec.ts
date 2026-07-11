import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { performance } from "node:perf_hooks";
import { expect } from "chai";

interface ParserBenchmarkApi {
  calibrate(frame: FakeFrame): Promise<{
    iterations: number;
    result: BatchResult;
  }>;
  isStable(samples: number[]): boolean;
  measure(frame: FakeFrame[], iterations: number): Promise<Summary[]>;
  metadataMismatch(left: Metadata, right: Metadata): string | undefined;
  pairedSpeed(baseline: number[], candidate: number[]): number;
  summarize(samples: number[]): Summary;
  warm(
    frames: FakeFrame[],
    iterations: number,
  ): Promise<{ elapsedMs: number; stable: boolean }>;
}

interface BatchResult {
  elapsedMs: number;
  roundTripMs: number;
  completedIterations: number;
}

interface FakeFrame {
  runParserBatch(iterations: number): Promise<BatchResult>;
}

interface Metadata {
  grammarId: string;
  sampleId: string;
  inputBytes: number;
  inputChecksum: string;
  tokenCount: number;
  tokenChecksum: string;
  parserConfig: Record<string, unknown>;
  sourceScripts: string[];
}

interface Summary {
  hz: number;
  meanMs: number;
  medianMs: number;
  rme: number;
  sampleCount: number;
  samples: number[];
}

function loadScript(relativePath: string, extraContext = {}) {
  const scriptUrl = new URL(
    `../../../benchmark_web/${relativePath}`,
    import.meta.url,
  );
  const context = {
    TextEncoder,
    console,
    navigator: { userAgent: "test" },
    performance,
    ...extraContext,
  } as Record<string, any>;
  context.self = context;
  runInNewContext(readFileSync(scriptUrl, "utf8"), context);
  return context;
}

describe("benchmark web parser measurements", () => {
  it("summarizes parser time samples", () => {
    const context = loadScript("parser_benchmark.js");
    const benchmark = context.ParserBenchmark as ParserBenchmarkApi;
    const summary = benchmark.summarize([2, 2, 2, 2, 2]);

    expect(summary.hz).to.equal(500);
    expect(summary.meanMs).to.equal(2);
    expect(summary.medianMs).to.equal(2);
    expect(summary.rme).to.equal(0);
    expect(summary.sampleCount).to.equal(5);
  });

  it("rejects incompatible benchmark metadata", () => {
    const context = loadScript("parser_benchmark.js");
    const benchmark = context.ParserBenchmark as ParserBenchmarkApi;
    const metadata: Metadata = {
      grammarId: "JSON",
      sampleId: "sample",
      inputBytes: 10,
      inputChecksum: "input",
      tokenCount: 2,
      tokenChecksum: "tokens",
      parserConfig: { outputCst: false },
      sourceScripts: ["bundle", "grammar", "sample"],
    };

    expect(
      benchmark.metadataMismatch(metadata, {
        ...metadata,
        sourceScripts: ["other-bundle", "grammar", "sample"],
      }),
    ).to.equal(undefined);
    expect(
      benchmark.metadataMismatch(metadata, {
        ...metadata,
        tokenChecksum: "different",
      }),
    ).to.equal("tokenChecksum");
  });

  it("calibrates, warms, and alternates complete batches", async () => {
    var now = 0;
    const context = loadScript("parser_benchmark.js", {
      performance: { now: () => now },
    });
    const benchmark = context.ParserBenchmark as ParserBenchmarkApi;
    const calls: string[] = [];
    function frame(name: string): FakeFrame {
      return {
        async runParserBatch(iterations: number) {
          calls.push(name);
          now += 100;
          return {
            elapsedMs: iterations,
            roundTripMs: iterations + 0.5,
            completedIterations: iterations,
          };
        },
      };
    }
    const baseline = frame("baseline");
    const candidate = frame("candidate");

    const calibration = await benchmark.calibrate(candidate);
    expect(calibration.iterations).to.equal(128);

    const warmup = await benchmark.warm([baseline, candidate], 128);
    expect(warmup.stable).to.equal(true);

    calls.length = 0;
    const summaries = await benchmark.measure([baseline, candidate], 128);
    expect(summaries[0].sampleCount).to.equal(25);
    expect(summaries[1].sampleCount).to.equal(25);
    expect(calls.slice(0, 4)).to.deep.equal([
      "baseline",
      "candidate",
      "candidate",
      "baseline",
    ]);
    expect(benchmark.pairedSpeed([2, 4], [1, 2])).to.equal(2);
  });

  it("sets up and validates an unchanged reusable token vector", () => {
    const tokens = [
      {
        tokenType: { name: "Word" },
        image: "value",
        startOffset: 0,
        endOffset: 4,
      },
    ];
    const customLexer = {
      tokenize: () => ({ tokens, errors: [] }),
    };
    class FakeParser {
      errors: Error[] = [];
      orgText = "";

      SAVE_ERROR(error: Error) {
        this.errors.push(error);
        return error;
      }

      set input(_tokens: unknown[]) {
        this.errors = [];
      }

      root() {}

      isAtEndOfInput() {
        return true;
      }
    }
    const context = loadScript("parsers/api.js", {
      chevrotain: {
        VERSION: "test-version",
        Lexer: class {},
      },
    });

    const metadata = context.setupParserBench(
      "value",
      undefined,
      customLexer,
      FakeParser,
      "root",
      { outputCst: false },
      {
        grammarId: "test",
        sampleId: "sample",
        importScripts: ["bundle", "grammar"],
      },
    );
    const result = context.runParserBatch(3);

    expect(metadata.tokenCount).to.equal(1);
    expect(metadata.chevrotainVersion).to.equal("test-version");
    expect(result.completedIterations).to.equal(3);
    expect(tokens).to.have.length(1);

    tokens[0].image = "changed";
    expect(() => context.runParserBatch(1)).to.throw(
      "Token vector changed before parser batch",
    );
  });

  it("retains errors from earlier batch iterations", () => {
    const tokens = [
      {
        tokenType: { name: "Word" },
        image: "value",
        startOffset: 0,
        endOffset: 4,
      },
    ];
    class IntermittentParser {
      errors: Error[] = [];
      invocations = 0;

      set input(_tokens: unknown[]) {
        this.errors = [];
      }

      SAVE_ERROR(error: Error) {
        this.errors.push(error);
        return error;
      }

      root() {
        this.invocations++;
        if (this.invocations === 2) {
          this.SAVE_ERROR(new Error("intermittent"));
        }
      }

      isAtEndOfInput() {
        return true;
      }
    }
    const context = loadScript("parsers/api.js", {
      chevrotain: { VERSION: "test-version", Lexer: class {} },
    });
    context.setupParserBench(
      "value",
      undefined,
      { tokenize: () => ({ tokens, errors: [] }) },
      IntermittentParser,
      "root",
      {},
      {
        grammarId: "test",
        sampleId: "sample",
        importScripts: ["bundle", "grammar"],
      },
    );

    expect(() => context.runParserBatch(2)).to.throw(
      "Parsing errors detected during one or more batch iterations",
    );
  });

  it("correlates worker requests and propagates structured failures", async () => {
    const requestIds: number[] = [];
    class FakeWorker {
      onmessage?: (event: { data: unknown }) => void;
      onerror?: (event: { message: string }) => void;
      onmessageerror?: () => void;

      postMessage(request: {
        type: string;
        requestId: number;
        iterations?: number;
      }) {
        requestIds.push(request.requestId);
        queueMicrotask(() => {
          if (request.type === "batch" && request.iterations === 2) {
            this.onmessage?.({
              data: {
                type: "response",
                requestId: request.requestId,
                ok: false,
                error: {
                  phase: "batch",
                  name: "BatchError",
                  message: "failed batch",
                },
              },
            });
          } else {
            this.onmessage?.({
              data: {
                type: "response",
                requestId: request.requestId,
                ok: true,
                result:
                  request.type === "init"
                    ? { version: "test" }
                    : {
                        elapsedMs: 1,
                        completedIterations: request.iterations,
                      },
              },
            });
          }
        });
      }

      terminate() {}
    }
    const context = loadScript("parsers/worker_api.js", {
      Worker: FakeWorker,
    });
    context.initWorker({ parserConfig: {} });

    const first = context.runParserBatch(1);
    const second = context.runParserBatch(3);
    const results = await Promise.all([first, second]);
    expect(results.map((result) => result.completedIterations)).to.deep.equal([
      1, 3,
    ]);
    expect(new Set(requestIds).size).to.equal(requestIds.length);

    try {
      await context.runParserBatch(2);
      expect.fail("expected the worker request to fail");
    } catch (error) {
      expect(error).to.have.property("name", "BatchError");
      expect(error).to.have.property("phase", "batch");
      expect(error).to.have.property("message", "failed batch");
    }
  });
});
