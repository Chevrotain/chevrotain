# Parséman

[Parséman](https://matthew-dean.github.io/parseman/) 0.18.0 — parse combinator / generator library for JavaScript.

## What is benchmarked

Two separate benchmark entries share the same grammar but different execution paths:

| File | Path |
|------|------|
| `parseman_compiled_parser.js` | **Compiled** — pre-generated parser (no Parséman runtime) |
| `parseman_interpreter_parser.js` | **Interpreted** — full combinator interpreter (`parser.parse()`) |

## Grammar source

The combinator grammar lives in the Parséman repository:

https://github.com/matthew-dean/parseman/blob/main/examples/json/chevrotain-bench.ts

It is **recognition-only** (no string unescape, no JSON object materialization), matching the
[benchmark methodology](../../README.md).

## How the `.js` files are produced

From a Parséman 0.18.0 checkout:

```bash
pnpm build:chevrotain-bench path/to/performance/jsonParsers/parseman
```

That script (`scripts/build-chevrotain-bench.mjs` in parseman) writes both files:

- **Compiled** — calls `compile(jsonRecognize)` at build time and emits standalone JavaScript.
  Same codegen path as Parséman's Vite/Rollup macro plugin, but via an explicit offline build step
  (analogous to Peggy/Jison checking generated parser output into the repo).
- **Interpreted** — esbuild bundle of the grammar plus the Parséman interpreter runtime.

## What is *not* used here

End-to-end JSON value construction (`examples/json/parser.ts`).
