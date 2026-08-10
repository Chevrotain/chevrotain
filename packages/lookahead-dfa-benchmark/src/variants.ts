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
import { alternativesFor, type Scenario } from "./scenarios.ts";

export interface Variant {
  name: string;
  build(scenario: Scenario): BuiltVariant;
}

export interface BuiltVariant {
  fn: Function;
  layout: string;
  cells?: number;
}

export interface ProductionDecision {
  usesDfa: boolean;
  states: number;
  transitions: number;
  maxCandidates: number;
}

function matcherFor(alternatives: LookaheadSequence[]) {
  return areTokenCategoriesNotUsed(alternatives)
    ? tokenStructuredMatcherNoCategories
    : tokenStructuredMatcher;
}

function originalFunction(scenario: Scenario): Function {
  const alternatives = alternativesFor(scenario);
  const matcher = matcherFor(alternatives);
  return scenario.kind === "or"
    ? buildAlternativesLookAheadFunc(alternatives, false, matcher, false)
    : buildSingleAlternativeLookaheadFunction(alternatives[0], matcher, false);
}

function buildOriginal(scenario: Scenario): BuiltVariant {
  return { fn: originalFunction(scenario), layout: "path scan" };
}

const denseCellCounts = new WeakMap<Scenario, number>();

function buildDenseDfa(scenario: Scenario): BuiltVariant {
  const machine = buildDfaLookaheadMachine(alternativesFor(scenario));
  const fn =
    scenario.kind === "or"
      ? buildDenseDfaAlternativesLookAheadFunc(machine)
      : buildDenseDfaSingleAlternativeLookaheadFunction(machine);
  let cells = denseCellCounts.get(scenario);
  if (cells === undefined) {
    cells = denseDfaCellCount(machine);
    denseCellCounts.set(scenario, cells);
  }
  return fn === undefined
    ? {
        fn: originalFunction(scenario),
        layout: `naive fallback (>${MAX_DENSE_DFA_CELLS})`,
        cells,
      }
    : { fn, layout: "dense Int32", cells };
}

export const VARIANTS: Variant[] = [
  { name: "Original", build: buildOriginal },
  { name: "DFA Dense", build: buildDenseDfa },
];

export function productionDecision(scenario: Scenario): ProductionDecision {
  const alternatives = alternativesFor(scenario);
  const machine = buildDfaLookaheadMachine(alternatives);
  const profitable =
    scenario.kind === "or"
      ? isDfaLookaheadProfitable(alternatives)
      : isDfaSingleLookaheadProfitable(alternatives[0]);
  return {
    usesDfa: profitable && denseDfaCellCount(machine) <= MAX_DENSE_DFA_CELLS,
    states: machine.fallbacks.length,
    transitions: machine.transitions.length,
    maxCandidates: machine.maxCandidates,
  };
}
