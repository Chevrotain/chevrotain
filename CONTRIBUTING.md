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
* An Example **must** include some tests with an **_spec.js** suffix.
* An Example may use ES6/ES2015 syntax (classes/constructor/...) but in that case to support testing on older node.js versions:
  - The name of the test must contain "ES6".
  - The actual spec must still use ES5 syntax and [**conditionally**][cond_import] import(require) the implementation using ES6/ES2015 syntax. 
 

#### Contributing To Chevrotain's Runtime Source code.

This can be more complex as more in-depth knowledge of chevrotain internals may be needed.

Details:
* ~100% code coverage is **required**. 
  - It is possible to disable coverage for specific code, but there must be a very good reason.
* Try to maintain the same code style used in the rest of Chevrotain's source code.
  - The linting can take care of most of this automatically.

## Development Environment

Chevrotain uses grunt for most development tasks.
Examine the [grunt file][grunt_file] for all the available tasks:

#### Initial Setup

* ```npm install```
* ```npm install -g grunt```

#### Building

Chevrotain is written using Typescript, so compilation to javascript is needed.
This will run the full build, including linting/packaging:
* ```grunt build```


Alternatively if just incremental compilation is desired, execute one of these
scripts depending on your OS:
* ```watch.bat```
* ```watch.sh```

#### Testing

To run the build **and** the unit tests:
* ```grunt build_test```
 
To only run the unit tests:
* ```npm run unit_tests```

#### Legal

All Contributors must sign the [CLA][cla].
The process is completely automated using https://cla-assistant.io/
simply follow the instructions in the pull request.

[examples]: https://github.com/SAP/chevrotain/tree/master/examples
[sample_grammars]: https://github.com/SAP/chevrotain/tree/master/examples/grammars
[cond_import]: https://github.com/SAP/chevrotain/blob/ab686d96aedb375515a14adad79b1ae8b91af2df/examples/parser/parametrized_rules/parametrized_spec.js#L8
[cla]: https://cla-assistant.io/SAP/chevrotain
[grunt_file]: https://github.com/SAP/chevrotain/blob/master/gruntfile.js