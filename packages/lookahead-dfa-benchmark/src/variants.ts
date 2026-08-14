import type { LookaheadSequence } from "@chevrotain/types";
import {
  buildDenseDfaAlternativesLookAheadFunc,
  buildDenseDfaSingleAlternativeLookaheadFunction,
  buildDfaLookaheadMachine,
  denseDfaCellCount,
  isDfaLookaheadProfitable,
  isDfaSingleLookaheadProfitable,
  MAX_DENSE_DFA_CELLS,
} from "@chevrotain/lookahead-dfa";
import {
  areTokenCategoriesNotUsed,
  buildAlternativesLookAheadFunc,
  buildSingleAlternativeLookaheadFunction,
  tokenStructuredMatcher,
  tokenStructuredMatcherNoCategories,
} from "chevrotain/internal";
import { alternativesFor, scenarioLabel, type Scenario } from "./scenarios.ts";

export interface Variant {
  name: string;
  build(scenario: Scenario): Function;
}

function matcherFor(alternatives: LookaheadSequence[]) {
  return areTokenCategoriesNotUsed(alternatives)
    ? tokenStructuredMatcherNoCategories
    : tokenStructuredMatcher;
}

function pathScanFunction(scenario: Scenario): Function {
  const alternatives = alternativesFor(scenario);
  const matcher = matcherFor(alternatives);
  return scenario.kind === "or"
    ? buildAlternativesLookAheadFunc(alternatives, false, matcher, false)
    : buildSingleAlternativeLookaheadFunction(alternatives[0], matcher, false);
}

function buildPathScan(scenario: Scenario): Function {
  return pathScanFunction(scenario);
}

function buildDenseDfa(scenario: Scenario): Function {
  const machine = buildDfaLookaheadMachine(alternativesFor(scenario));
  const fn =
    scenario.kind === "or"
      ? buildDenseDfaAlternativesLookAheadFunc(machine)
      : buildDenseDfaSingleAlternativeLookaheadFunction(machine);
  if (fn === undefined) {
    throw new Error(`${scenarioLabel(scenario)} cannot use Dense DFA`);
  }
  return fn;
}

export const VARIANTS: Variant[] = [
  { name: "Path Scan", build: buildPathScan },
  { name: "Dense DFA", build: buildDenseDfa },
];

export function productionUsesDfa(scenario: Scenario): boolean {
  const alternatives = alternativesFor(scenario);
  const machine = buildDfaLookaheadMachine(alternatives);
  const profitable =
    scenario.kind === "or"
      ? isDfaLookaheadProfitable(alternatives)
      : isDfaSingleLookaheadProfitable(alternatives[0]);
  return profitable && denseDfaCellCount(machine) <= MAX_DENSE_DFA_CELLS;
}
