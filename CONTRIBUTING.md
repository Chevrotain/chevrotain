## Contributing Issues

#### Bug Reports

Please provide a (**simple**) way to reproduce the problem.
A bug that can not be reproduced is less likely to be solved.

#### Feature Requests

Please also include the reasoning for the desired feature and not just its description.
Sometimes it is obvious, but other times a few sample use cases or an explanation
can come in handy.

## Contributing Code

There are two types of code contributions.

#### Contributing Sample Grammars and Examples

This is probably the **easiest** way to contribute as it does not require any knowledge of chevrotain's internals.
And each contribution is self contained and limited in scope.

[Sample Grammars][sample_grammars] contributions are particularly encouraged.

See some [existing examples][examples] to get started.

Details:

- An Example **must** include some tests with a **\_spec.js** suffix.

#### Contributing To Chevrotain's Runtime Source code.

This can be more complex as more in-depth knowledge of chevrotain internals may be needed.

Details:

- ~100% test coverage is **required**.
  - It is possible to disable coverage for specific code, but there must be a very good reason to do so.

## Development Environment

Chevrotain is developed as a mono-repo with a single (temporary state) productive package
and multiple example packages.

Chevrotain uses **yarn** tasks for the development flows.
Examine the interal [packages/chevrotain/package.json][package] scripts for all the available tasks.

#### Initial Setup

In the root of this Repo:

- `yarn`
- `yarn build`

#### Some basic dev flows to get started

Chevrotain is written using Typescript, so compilation to JavaScript is needed.

- `cd packages/chevrotain`
- `yarn compile`

Alternatively during development one would want to recompile on file changes.

- `cd packages/chevrotain`
- `yarn compile:watch`

The compilation result will appear in the **lib** folder.

#### Code Formatting

Chevrotain uses **prettier** to avoid caring about code formatting...
To format your new code use:

`yarn format:fix`

#### Testing

Chevrotain uses several different types of tests to promote high quality.

The most basic ones are the **mocha unit tests**, which are also often the most relevant ones.

- `cd packages/chevrotain`
- `yarn coverage`

You can run the whole test suite by running:

- `cd packages/chevrotain`
- `yarn test`

Additionally **integration tests** are used to test Chevrotain as an end user via the examples packages
tests.

- In this repo's root
- `yarn test`

#### Running the central CI flow locally.

This is just another yarn task which performs the whole flow
including linting / doc generation / d.ts API creation / ...

- `yarn run ci_full_build`
  - Node > 4 is required to pass the coverage checks.

#### Committing Changes

This project enforces consistent commit message format same as in the [Angular project](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#type).

it is recommended to use `git cz` CLI tool to create these conventional commit messages.

- requires [commitizen](https://github.com/commitizen/cz-cli#installing-the-command-line-tool) to be installed.

#### Release Process

The release process **requires push permissions to master**.

- Update the [CHANGELOG](./packages/chevrotain/docs/changes/CHANGELOG.md).
  - The header must be `## X.Y.Z (INSERT_DATE_HERE)` (**literally**).
- Update the [BREAKING_CHANGES.md](./packages/chevrotain/docs/changes/BREAKING_CHANGES.md).
  - Only for major versions...
- Push the changes related updates to master.
- execute `yarn run lerna:version` and follow the instructions.
  - This will update version related files and push a new version **tag** to github.
  - Circle-CI will execute a deployment to npmjs.com due to this new tag.
  - Additionally new website contents will be pushed to the gh-pages branch.
- Check that the release was successful.

  - On [circle-ci](https://circleci.com/gh/SAP/chevrotain)
  - On [npmjs.com](https://www.npmjs.com/package/chevrotain)
  - On [The website](https://sap.github.io/chevrotain/docs/changes/CHANGELOG.html)
  - On [The APIs webpage](https://sap.github.io/chevrotain/documentation/)
    - The URL being redirected to should include the latest version number.

#### Legal

All Contributors must sign the [CLA][cla].
The process is completely automated using https://cla-assistant.io/
simply follow the instructions in the pull request.

[examples]: https://github.com/SAP/chevrotain/tree/master/examples
[sample_grammars]: https://github.com/SAP/chevrotain/tree/master/examples/grammars
[cla]: https://cla-assistant.io/SAP/chevrotain
[package]: https://github.com/SAP/chevrotain/blob/master/packages/chevrotain/package.json
