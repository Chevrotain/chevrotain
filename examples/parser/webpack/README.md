### Webpacking of Chevrotain Grammars.

Chevrotain relies on **Function.prototype.toString** and **Function.name**
to run. This means that webpacking (minification) of Chevrotain grammars must be done carefully.

Safe minification can be achieved by providing [custom uglifyJs options](https://webpack.js.org/configuration/optimization/#optimization-minimizer) to the webpack config
that will disable the name mangling of the TokenType names.

Another option is to use [Grammar Serialization](../serialized_grammar) which would side step the problem all together
But add a little complexity to the development flows and parsing initialization.

#### Runnable Example

-   [webpack.config.js](webpack.config.js)
-   [grammar source](./src/our_grammar.js)
-   [test](./test/webpack_spec.js)

to run this example:

-   npm install
-   npm run bundle
-   npm test
