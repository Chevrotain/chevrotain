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
And each contribution is self-contained and limited in scope.

[Sample Grammars][sample_grammars] contributions are particularly encouraged.

See some [existing examples][examples] to get started.

Details:

- An Example **must** include some tests with a **\_spec.js** suffix.

#### Contributing To Chevrotain's Runtime Source code.

This can be more complex as more in-depth knowledge of Chevrotain internals may be needed.

Details:

- ~100% test coverage is **required**.
  - It is possible to disable coverage for specific code, but there must be a very good reason to do so.

## Development Environment

Chevrotain is developed as a mono-repo with a single (temporary state) productive package
and multiple example packages.

Chevrotain uses **npm** tasks for the development flows.
and pnpm + lerna for the monorepo management.

#### Initial Setup

In the root of this Repo:

- `pnpm`

#### Some basic dev flows to get started

Chevrotain is written using Typescript, so compilation to JavaScript is needed.

- `pnpm compile`

Alternatively during development one would want to recompile on file changes.

- `pnpm compile:watch`

The compilation result will appear in the **lib** folder in each sub-package.

#### Code Formatting

Chevrotain uses **prettier** to avoid caring about code formatting...
To format your new code use:

`pnpm format:fix`

#### Running the central CI flow locally.

This is just another npm task which performs the whole flow
including linting / doc generation / d.ts API creation / ...

- `pnpm ci`

#### Committing Changes

This project enforces consistent commit message format same as in the [Angular project](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#type).

it is recommended to use `git cz` CLI tool to create these conventional commit messages.

- requires [commitizen](https://github.com/commitizen/cz-cli#installing-the-command-line-tool) to be installed.

#### Release Process

The release process **requires push permissions to master**.

- Update the [CHANGELOG](./packages/website/docs/changes/CHANGELOG.md).
  - The header must be `## X.Y.Z (INSERT_DATE_HERE)` (**literally**).
- Update the [BREAKING_CHANGES.md](./packages/website/docs/changes/BREAKING_CHANGES.md).
  - Only for major versions...
- Push the changes related updates to master.
- execute `pnpm release:version` and follow the instructions.
  - This will update version related files and push a new version **tag** to Github.
  - Github Actions will execute a deployment to npmjs.com due to this new tag.
  - Additionally, new website contents will be pushed to the gh-pages branch.
- Check that the release was successful.

  - On [Github Actions release build](https://github.com/Chevrotain/chevrotain/actions/workflows/release.yml)
  - On [npmjs.com](https://www.npmjs.com/package/chevrotain)
  - On [The website](https://chevrotain.io/docs/changes/CHANGELOG.html)
  - On [The APIs webpage](https://chevrotain.io/documentation/)
    - The URL being redirected to should include the latest version number.

#### Legal

All Contributors must sign the [CLA][cla].
The process is completely automated using https://cla-assistant.io/
simply follow the instructions in the pull request.

[examples]: https://github.com/chevrotain/chevrotain/tree/master/examples
[sample_grammars]: https://github.com/chevrotain/chevrotain/tree/master/examples/grammars
[cla]: https://cla-assistant.io/chevrotain/chevrotain
[package]: https://github.com/chevrotain/chevrotain/blob/master/packages/chevrotain/package.json
