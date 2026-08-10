# @chevrotain/lookahead-dfa

Low-level DFA lookahead compiler and runtime used by
[Chevrotain](https://chevrotain.io/docs/).

Most parser users should install and import `chevrotain`. This package exposes
the underlying lookahead machinery for Chevrotain itself and advanced toolkit
integrations.

## Behavior

The package:

- Builds DFA machines from Chevrotain lookahead sequences.
- Preserves source-order priority, token categories, empty paths, and completed
  shorter-path fallbacks.
- Creates dense OR and Single lookahead closures when the transition table fits
  within the configured cell cap.
- Exposes the profitability checks used by Chevrotain's production selector.

## API

| Export                                            | Purpose                                                      |
| ------------------------------------------------- | ------------------------------------------------------------ |
| `buildDfaLookaheadMachine`                        | Compiles lookahead alternatives into a DFA machine.          |
| `isDfaLookaheadProfitable`                        | Checks whether an OR decision should use the DFA runtime.    |
| `isDfaSingleLookaheadProfitable`                  | Checks whether a Single decision should use the DFA runtime. |
| `buildDenseDfaAlternativesLookAheadFunc`          | Builds an OR closure that returns an alternative index.      |
| `buildDenseDfaSingleAlternativeLookaheadFunction` | Builds a Single closure that returns a boolean.              |
| `denseDfaCellCount`                               | Calculates the dense transition-table size.                  |
| `MAX_DENSE_DFA_CELLS`                             | Maximum supported dense table size.                          |
| `DfaLookaheadMachine`                             | Compiled machine type.                                       |
| `DfaTransition`                                   | Compiled transition type.                                    |

The dense closure builders return `undefined` when a machine exceeds the cell
cap, allowing callers to retain another lookahead implementation as fallback.

## Development

Run commands from the repository root:

```sh
bun --cwd packages/lookahead-dfa run ci
bun --cwd packages/lookahead-dfa run compile
bun --cwd packages/lookahead-dfa run test
```

See the [Chevrotain repository](https://github.com/Chevrotain/chevrotain) for
the complete toolkit. Licensed under
[Apache-2.0](../../LICENSE.txt).
