import type { Fixture } from "./types.js";
// These fixtures intentionally live in the examples tree so the benchmark
// measures real example grammars rather than local benchmark-only copies.
// @ts-expect-error No local type declarations are needed for these JS helpers.
import { createCssBenchmarkFixture } from "../../../examples/grammars/css/benchmark_fixture.js";
// @ts-expect-error No local type declarations are needed for these JS helpers.
import { createJsonBenchmarkFixture } from "../../../examples/grammars/json/benchmark_fixture.js";

type ChevrotainModule = Record<string, unknown>;

export function createFixtures(
  chevrotain: ChevrotainModule,
  selectedParser: "json" | "css" | "all",
  useCst: boolean,
): Fixture[] {
  const fixtures: Fixture[] = [];

  if (selectedParser === "all" || selectedParser === "json") {
    fixtures.push(createJsonBenchmarkFixture(chevrotain, { useCst }));
  }

  if (selectedParser === "all" || selectedParser === "css") {
    fixtures.push(createCssBenchmarkFixture(chevrotain, { useCst }));
  }

  if (fixtures.length === 0) {
    throw new Error(`Unknown parser selection: ${selectedParser}`);
  }

  return fixtures;
}
