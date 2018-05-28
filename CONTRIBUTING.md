## Contributing Issues

#### Bug Reports

Please provide a (**simple**) way to reproduce the problem.
A bug that can not be reproduced is less likely be solved.

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

-   An Example **must** include some tests with an **\_spec.js** suffix.

#### Contributing To Chevrotain's Runtime Source code.

This can be more complex as more in-depth knowledge of chevrotain internals may be needed.

Details:

-   ~100% code coverage is **required**.
    -   It is possible to disable coverage for specific code, but there must be a very good reason to do so.
-   Try to maintain the same code style used in the rest of Chevrotain's source code.
    -   The linting will take care of most of this automatically.

## Development Environment

Chevrotain uses **yarn** tasks for the development flows.
Examine the [package.json][package] scripts for all the available tasks:

#### Initial Setup

-   `yarn install`

#### Some basic dev flows to get started

Chevrotain is written using Typescript, so compilation to javascript is needed.

-   `yarn run compile`

Alternatively during development one would want to recompile on file changes.

-   `yarn run watch`

The compilation result will appear in the **lib** folder.

#### Code Formatting

Chevrotain uses **prettier** to avoid caring about code formatting...
To format your new code use:
`yarn run format`

#### Testing

Chevrotain uses several different types of tests to promote high quality.

The most basic ones are the **mocha unit tests**, which are also the most relevant ones.

-   `yarn run dev_unit_tests`

Additionally **integration tests** are used to test Chevrotain as an end user with the help of **yarn link**

-   `yarn run dev_integration_tests`

And last but not least **browser tests** run the unit tests on multiple browsers using **karma and sauce labs**
On the central CI and Chrome on a local dev machine.

-   `yarn run dev_browser_tests`

#### Running the central CI flow locally.

This is just another yarn task which performs the whole flow
including linting / doc generation / d.ts API creation / ...

-   `yarn run ci_full_build`
    -   Node > 4 is required to pass the coverage checks.

#### Legal

All Contributors must sign the [CLA][cla].
The process is completely automated using https://cla-assistant.io/
simply follow the instructions in the pull request.

[examples]: https://github.com/SAP/chevrotain/tree/master/examples
[sample_grammars]: https://github.com/SAP/chevrotain/tree/master/examples/grammars
[cond_import]: https://github.com/SAP/chevrotain/blob/ab686d96aedb375515a14adad79b1ae8b91af2df/examples/parser/parametrized_rules/parametrized_spec.js#L8
[cla]: https://cla-assistant.io/SAP/chevrotain
[package]: https://github.com/SAP/chevrotain/blob/master/package.json
