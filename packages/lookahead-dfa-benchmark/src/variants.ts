import type { LookaheadSequence } from "@chevrotain/types";
import {
  areTokenCategoriesNotUsed,
  buildAlternativesLookAheadFunc,
  buildDfaAlternativesLookAheadFunc,
  buildDfaLookaheadMachine,
  buildDfaSingleAlternativeLookaheadFunction,
  buildSingleAlternativeLookaheadFunction,
  isDfaLookaheadProfitable,
  isDfaSingleLookaheadProfitable,
  tokenStructuredMatcher,
  tokenStructuredMatcherNoCategories,
} from "chevrotain/internal";
import { alternativesFor, type Scenario } from "./scenarios.ts";

export interface Variant {
  name: "Original" | "DFA";
  build(scenario: Scenario): Function;
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

function buildOriginal(scenario: Scenario): Function {
  const alternatives = alternativesFor(scenario);
  const matcher = matcherFor(alternatives);
  return scenario.kind === "or"
    ? buildAlternativesLookAheadFunc(alternatives, false, matcher, false)
    : buildSingleAlternativeLookaheadFunction(alternatives[0], matcher, false);
}

function buildDfa(scenario: Scenario): Function {
  const alternatives = alternativesFor(scenario);
  return scenario.kind === "or"
    ? buildDfaAlternativesLookAheadFunc(alternatives)
    : buildDfaSingleAlternativeLookaheadFunction(alternatives[0]);
}

export const VARIANTS: Variant[] = [
  { name: "Original", build: buildOriginal },
  { name: "DFA", build: buildDfa },
];

export function productionDecision(scenario: Scenario): ProductionDecision {
  const alternatives = alternativesFor(scenario);
  const machine = buildDfaLookaheadMachine(alternatives);
  return {
    usesDfa:
      scenario.kind === "or"
        ? isDfaLookaheadProfitable(alternatives)
        : isDfaSingleLookaheadProfitable(alternatives[0]),
    states: machine.states.length,
    transitions: machine.transitions,
    maxCandidates: machine.maxCandidates,
  };
}
