import type { Fixture } from "./types.js";
import { createCssBenchmarkFixture } from "../../../examples/grammars/css/benchmark_fixture.js";
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
