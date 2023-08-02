[![Discussions](https://img.shields.io/github/discussions/chevrotain/chevrotain?style=flat-square)](https://github.com/Chevrotain/chevrotain/discussions)
[![npm](https://img.shields.io/npm/v/chevrotain.svg)](https://www.npmjs.com/package/chevrotain)
![npm](https://img.shields.io/npm/dm/chevrotain)
[![Continuous Integration](https://github.com/Chevrotain/chevrotain/actions/workflows/ci.yml/badge.svg)](https://github.com/Chevrotain/chevrotain/actions/workflows/ci.yml)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

# Chevrotain

## TLDR

- [**Online Playground**](https://chevrotain.io/playground/)
- [**Getting Started Tutorial**](https://chevrotain.io/docs/tutorial/step0_introduction.html)
- [**YouTube Video**: Introduction to Lexers, Parsers and Interpreters with Chevrotain](https://www.youtube.com/watch?v=l-jMsoAY64k)
- [**Performance benchmark**](https://chevrotain.io/performance/)

## Introduction

Chevrotain is a [**blazing fast**](https://chevrotain.io/performance/)
and [**feature rich**](http://chevrotain.io/docs/features/blazing_fast.html)
**Parser Building Toolkit** for **JavaScript** with built-in support for **LL(K)**.
Grammars and [3rd party plugin for **LL(\*)**](https://github.com/langium/chevrotain-allstar) grammars.
It can be used to build parsers/compilers/interpreters for various use cases ranging from simple configuration files,
to full-fledged programing languages.

Grammars are written as [**pure JavaScript sources**](https://chevrotain.io/docs/FAQ.html#VS_GENERATORS) without a code generation phase,

A more in depth review of Chevrotain can be found in this great article on: [Parsing in JavaScript: Tools and Libraries](https://tomassetti.me/parsing-in-javascript/#chevrotain).

## Installation

- **npm**: `npm install chevrotain`
- **Browser** **ESM** bundled versions:
  These can be downloaded directly via [UNPKG](https://unpkg.com/) or other NPM cdn services, e.g.:
  - Latest:
    - `https://unpkg.com/chevrotain/lib/chevrotain.mjs`
    - `https://unpkg.com/chevrotain/lib/chevrotain.min.mjs`
  - Explicit version number:
    - `https://unpkg.com/chevrotain@11.0.2/lib/chevrotain.mjs`
    - `https://unpkg.com/chevrotain@11.0.2/lib/chevrotain.min.mjs`

## Documentation & Resources

- **[Sample Grammars](https://github.com/chevrotain/chevrotain/blob/master/examples/grammars)**.

- **[FAQ](https://chevrotain.io/docs/FAQ.html).**

- **[Other Examples](https://github.com/chevrotain/chevrotain/blob/master/examples)**.

- **[HTML API docs](https://chevrotain.io/documentation).**

  - [The Parsing DSL Docs](https://chevrotain.io/documentation/10_0_0/classes/BaseParser.html#AT_LEAST_ONE).

- [ALL(\*) Lookahead in Langium](https://www.typefox.io/blog/allstar-lookahead)

## Compatibility

Chevrotain will run on any **modern** JavaScript ES2015 runtime.
That includes nodejs maintenance/active/current version, modern major browsers,
but **not** legacy ES5.1 runtimes such as IE11.

## Contributions

Contributions are **greatly** appreciated.
See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## Where used

A small-curated list:

1. [HyperFormula](https://github.com/handsontable/hyperformula)

   - HyperFormula is an open source, spreadsheet-like calculation engine
   - [source](https://github.com/handsontable/hyperformula/blob/5749f9ce57a3006109ccadc4a2e7d064c846ff78/src/parser/FormulaParser.ts)

2. [Langium](https://github.com/langium/langium)

   - Langium is a language engineering tool with built-in support for the Language Server Protocol.

3. [Prettier-Java](https://github.com/jhipster/prettier-java)

   - A Prettier Plugin for Java
   - [source](https://github.com/jhipster/prettier-java/tree/main/packages/java-parser)

4. [JHipster Domain Language](https://www.jhipster.tech/jdl/intro)

   - The JDL is a JHipster-specific domain language where you can describe all your applications, deployments, entities
     and their relationships in a single file (or more than one) with a user-friendly syntax.
   - [source](https://github.com/jhipster/generator-jhipster/tree/main/jdl/parsing)

5. [Argdown](https://github.com/christianvoigt/argdown)
   - Argdown is a simple syntax for analyzing complex argumentation.
   - [source](https://github.com/christianvoigt/argdown/blob/master/packages/argdown-core/src/parser.ts)
