### Using Serialized Chevrotain Grammars.

Starting with version 3.6, Chevrotain allows parsers to be instantiated with
a previously serialized grammar. This is useful because it allows for safe
minification and other code transformations (e.g bundling/webpacking) without worrying about name mangling
and may even provide cold start performance benefits. However, you must make sure your code is using
up-to-date serializations of your parsers.

#### Runnable Example

[gen_serialized](./gen_serialized.js) implements serialization of a sample grammar.
Sample grammar: [grammar.js](./grammar.js).
Additionally [unit tests](./serialized_spec.js) are included to validate the grammars actually work.

To run the serialization and the tests (from parent directory):

-   `node ./serialized_grammar/gen_serialized.js`
-   `./node_modules/.bin/mocha serialized_grammar/serialized_spec.js`
