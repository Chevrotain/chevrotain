# Agent Guide — Chevrotain

## Project Overview

Chevrotain is a **Parser Building Toolkit for JavaScript/TypeScript**. It supports LL(K) grammars where grammars are written as pure JavaScript/TypeScript source code — there is no code generation phase. The main exports are `CstParser`, `EmbeddedActionsParser`, `Lexer`, and `createToken`.

- **License**: Apache-2.0
- **Website**: https://chevrotain.io

## Monorepo Structure

This is a **pnpm workspace monorepo** using **Lerna** for versioning/publishing only. **pnpm** is the only allowed package manager (enforced via `only-allow` preinstall check).

```
packages/
  chevrotain/          # Main package — lexer, parser, CST, error recovery
  types/               # Public API TypeScript type definitions (@chevrotain/types)
  gast/                # Grammar AST structure (@chevrotain/gast)
  utils/               # Shared utilities (@chevrotain/utils)
  cst-dts-gen/         # CST .d.ts type generation (@chevrotain/cst-dts-gen)
  cst-dts-gen-test/    # Snapshot tests for cst-dts-gen (private)
  regexp-to-ast/       # Regex-to-AST parser (@chevrotain/regexp-to-ast)
  website/             # VuePress documentation site (private)
examples/
  grammars/            # Sample grammars (calculator, CSS, JSON, XML, etc.)
  tutorial/            # Step-by-step tutorial (lexing, parsing, actions, error recovery)
  lexer/               # Lexer usage examples
  parser/              # Parser usage examples
```

### Dependency Graph

```
chevrotain → @chevrotain/cst-dts-gen → @chevrotain/gast → @chevrotain/types
           → @chevrotain/gast
           → @chevrotain/regexp-to-ast
           → @chevrotain/types
           → @chevrotain/utils
           → lodash-es (only runtime dependency)
```

## Build & Development

### Prerequisites

- **Node.js**: 20.x, 22.x, or 24.x
- **pnpm**: 10.23.0 (pinned via `packageManager` field in root `package.json`)

### Key Commands

| Command              | Description                                                 |
| -------------------- | ----------------------------------------------------------- |
| `pnpm install`       | Install all dependencies                                    |
| `pnpm compile`       | Clean all packages, then `tsc --build` (project references) |
| `pnpm compile:watch` | Compile in watch mode                                       |
| `pnpm ci`            | Full CI: format validation + all subpackage CI checks       |
| `pnpm format:fix`    | Run Prettier on all source files                            |

### Per-Package Commands (e.g., `packages/chevrotain`)

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `pnpm run ci`      | build + test                    |
| `pnpm run build`   | clean + compile + bundle        |
| `pnpm run compile` | TypeScript compilation (`tsc`)  |
| `pnpm run test`    | Run Mocha tests (with coverage) |

### TypeScript Configuration

- **TypeScript 5.9.x**, using **project references** (`tsconfig.json` at root)
- Shared base config in `tsconfig.base.json`: target **ES2015**, module **ES2020**, strict mode enabled
- All packages are **ES Modules** (`"type": "module"` in `package.json`)
- Import paths use `.js` extensions (TypeScript ESM convention)
- Compiled output goes to `lib/` in each package

## Testing

- **Mocha** — test runner
- **Chai** — assertions
- **Sinon** + **sinon-chai** — mocking/spying (main chevrotain package)
- **c8** — code coverage (V8 native)

Tests are written in TypeScript, compiled to `lib/test/`, and Mocha runs the compiled JS.

- **Test file suffix**: `_spec.ts` (e.g., `lexer_spec.ts`, `recognizer_spec.ts`)
- **Test directory**: `test/` within each package, mirroring the `src/` structure
- **~100% coverage** is expected

### Running Tests

```bash
pnpm compile                     # Must compile first
pnpm ci                          # Full CI pipeline
# Or per-package [PKGNAME]::
cd packages/[PKGNAME]
pnpm run ci
```

## Code Style & Conventions

### Formatting

- **Prettier** with default settings (only override: `"endOfLine": "lf"`)
- No ESLint — Prettier is the sole formatting/style tool
- Pre-commit hook (Husky + lint-staged) auto-formats staged files

### Commit Messages

- **Conventional Commits** enforced via commitlint (`@commitlint/config-conventional`)
- Format: `type(scope): subject` (e.g., `feat(lexer): add custom error support`)

### Naming Conventions

| Entity              | Convention                | Example                                   |
| ------------------- | ------------------------- | ----------------------------------------- |
| Files               | snake_case                | `lexer_public.ts`, `tokens_public.ts`     |
| Public API files    | `_public` suffix          | `lexer_public.ts`, `errors_public.ts`     |
| Test files          | `_spec.ts` suffix         | `lexer_spec.ts`, `recognizer_spec.ts`     |
| Classes             | PascalCase                | `CstParser`, `EmbeddedActionsParser`      |
| Functions           | camelCase                 | `createToken`, `tokenLabel`               |
| Constants           | UPPER_SNAKE_CASE          | `VERSION`, `EOF`, `DEFAULT_PARSER_CONFIG` |
| Token types (tests) | PascalCase + `Tok` suffix | `PlusTok`, `MinusTok`                     |

### Architecture: Parser Traits/Mixins

The Parser is decomposed into **10 trait classes** mixed together at runtime (see `packages/chevrotain/src/parse/parser/traits/README.md`):

1. `ErrorHandler` — error handling
2. `LexerAdapter` — bridges lexer and parser
3. `LooksAhead` — lookahead computation
4. `RecognizerApi` — public DSL methods (CONSUME, SUBRULE, OR, MANY, etc.)
5. `RecognizerEngine` — internal parsing engine
6. `Recoverable` — fault tolerance/error recovery
7. `TreeBuilder` — CST node construction
8. `ContentAssist` — syntactic content assist
9. `GastRecorder` — grammar recording phase
10. `PerformanceTracer` — performance tracing

The combined type is `MixedInParser`. The `applyMixins()` utility copies prototype methods onto the main parser class.

### Module/Export Pattern

- Each package has a single `src/api.ts` entry point that re-exports the public API
- The `@chevrotain/types` package provides the entire public type surface as `api.d.ts`
- The main `chevrotain` package aggregates relevant exports from all sub-packages

## CI/CD

### GitHub Actions

- **CI** (`.github/workflows/ci.yml`): Runs on push/PR to `master*`, tests against Node 20.x/22.x/24.x on Ubuntu
- **Release** (`.github/workflows/release.yml`): Triggered by `v*` tags, publishes to npm via Lerna with OIDC trusted publishers

### Release Process

AI AGENTS MUST NEVER PUBLISH A RELEASE, this is a HUMAN ONLY PROCESS.
