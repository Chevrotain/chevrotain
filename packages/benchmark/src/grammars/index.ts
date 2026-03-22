/**
 * Grammar registry — maps grammar names to factory functions and sample inputs.
 *
 * To add a new grammar:
 * 1. Create a factory file in this directory (e.g., xml_grammar.ts)
 * 2. Create a sample input file in ../inputs/ (e.g., xml_input.ts)
 * 3. Register it here
 * 4. Add its name to the config's `grammars` array
 */
import type { GrammarDefinition } from "../types.ts";
import { createJsonBenchmark } from "./json_grammar.ts";
import { createCssBenchmark } from "./css_grammar.ts";
import { JSON_SAMPLE } from "../inputs/json_input.ts";
import { CSS_SAMPLE } from "../inputs/css_input.ts";

export const GRAMMARS: Record<string, GrammarDefinition> = {
  json: {
    factory: createJsonBenchmark,
    sampleInput: JSON_SAMPLE,
    name: "JSON",
  },
  css: {
    factory: createCssBenchmark,
    sampleInput: CSS_SAMPLE,
    name: "CSS",
  },
};
