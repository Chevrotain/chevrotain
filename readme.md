[![Join the chat at https://gitter.im/chevrotain-parser/Lobby](https://badges.gitter.im/chevrotain-parser/Lobby.svg)](https://gitter.im/chevrotain-parser/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![npm](https://img.shields.io/npm/v/chevrotain.svg)](https://www.npmjs.com/package/chevrotain)
[![CircleCI](https://circleci.com/gh/chevrotain/chevrotain.svg?style=svg)](https://circleci.com/gh/chevrotain/chevrotain)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![dependentbot](https://api.dependabot.com/badges/status?host=github&repo=chevrotain/chevrotain)](https://dependabot.com/)

# Chevrotain

## Introduction

Chevrotain is a [**blazing fast**][benchmark] and [**feature rich**](http://chevrotain.io/docs/features/blazing_fast.html) **Parser Building Toolkit** for **JavaScript**.
It can be used to build parsers/compilers/interpreters for various use cases ranging from simple configuration files,
to full fledged programing languages.

A more in depth description of Chevrotain can be found in this great article on: [Parsing in JavaScript: Tools and Libraries](https://tomassetti.me/parsing-in-javascript/#chevrotain).

It is important to note that Chevrotain is **NOT** a parser generator. It solves the same kind of problems as a parser generator, just **without any code generation**. Chevrotain Grammars are pure code which can be created/debugged/edited
as any other pure code without requiring any new tools or processes.

## TLDR

- [**Online Playground**](https://chevrotain.io/playground/)
- **[Getting Started Tutorial](https://chevrotain.io/docs/tutorial/step0_introduction.html)**
- [**Performance benchmark**][benchmark]

## Installation

- **npm**: `npm install chevrotain`
- **Browser**:
  The npm package contains Chevrotain as concatenated and minified files ready for use in a browser.
  These can also be accessed directly via [UNPKG](https://unpkg.com/) in a script tag.
  - Latest:
    - `https://unpkg.com/chevrotain/lib/chevrotain.js`
    - `https://unpkg.com/chevrotain/lib/chevrotain.min.js`
  - Explicit version number:
    - `https://unpkg.com/chevrotain@7.1.1/lib/chevrotain.js`
    - `https://unpkg.com/chevrotain@7.1.1/lib/chevrotain.min.js`

## Documentation & Resources

- **[Getting Started Tutorial](https://chevrotain.io/docs/tutorial/step1_lexing.html)**.

- **[Sample Grammars](https://github.com/chevrotain/chevrotain/blob/master/examples/grammars)**.

- **[FAQ](https://chevrotain.io/docs/FAQ.html).**

- **[Other Examples](https://github.com/chevrotain/chevrotain/blob/master/examples)**.

- **[HTML API docs](https://chevrotain.io/documentation).**

  - [The Parsing DSL Docs](https://chevrotain.io/documentation/7_1_1/classes/parser.html#at_least_one).

## Dependencies

There is a single dependency to [regexp-to-ast](https://github.com/bd82/regexp-to-ast) library.
This dependency is included in the bundled artifacts, for ease of consumption in browsers.

## Compatibility

Chevrotain runs on any modern JavaScript ES5.1 runtime.
That includes any modern nodejs version, modern browsers and even IE11.

- Uses [UMD](https://github.com/umdjs/umd) to work with common module loaders (browser global / amd / commonjs).

## Contributions

Contributions are **greatly** appreciated.
See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## Where used

Some interesting samples:

- [Prettier Java Plugin Parser][sample_prettier_java]
- [JHipster Domain Language][sample_jhipster]
- [Metabase BI expression Parser][sample_metabase].
- [Three.js VRML Parser][sample_threejs]
- [Argdown Parser][sample_argdown]
- [Stardog Union Parsers (GraphQL/SPARQL/and more...)][sample_stardog]
- [Bombadil Toml Parser][sample_bombadil]
- [Eve Interactive Programing Language Parser][sample_eve].
- [BioModelAnalyzer's ChatBot Parser][sample_biomodel].

[benchmark]: https://chevrotain.io/performance/
[sample_metabase]: https://github.com/metabase/metabase/blob/136dfb17954f4e4302b3bf2fee99ff7b7b12fd7c/frontend/src/metabase/lib/expressions/parser.js
[sample_jhipster]: https://github.com/jhipster/jhipster-core/blob/master/lib/dsl/jdl_parser.js
[sample_eve]: https://github.com/witheve/Eve/blob/master/src/parser/parser.ts
[sample_biomodel]: https://github.com/Microsoft/BioModelAnalyzer/blob/master/ChatBot/src/NLParser/NLParser.ts
[sample_bombadil]: https://github.com/sgarciac/bombadil/blob/master/src/parser.ts
[sample_argdown]: https://github.com/christianvoigt/argdown/blob/master/packages/argdown-core/src/parser.ts
[sample_threejs]: https://github.com/mrdoob/three.js/blob/dev/examples/js/loaders/VRMLLoader.js
[sample_prettier_java]: https://github.com/jhipster/prettier-java/tree/master/packages/java-parser/src/productions
[sample_stardog]: https://github.com/stardog-union/millan/tree/master/src
[languages]: https://github.com/chevrotain/chevrotain/tree/master/examples/implementation_languages
[backtracking]: https://github.com/chevrotain/chevrotain/blob/master/examples/parser/backtracking/backtracking.js
[custom_apis]: https://chevrotain.io/docs/guide/custom_apis.html
