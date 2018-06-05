### Webpacking of Chevrotain Grammars.

Chevrotain relies on **Function.prototype.toString** and **Function.name**
to run. This means that webpacking(minification) of Chevrotain grammars must be done carefully.

Safe minification can be achieved by providing [custom uglifyJs options](https://webpack.js.org/configuration/optimization/#optimization-minimizer) to the webpack config
that will disable the name mangling of the TokenType names.

#### Runnable Example

-   [webpack.confg.js](webpack.config.js)
-   [grammar source](./src/our_grammar.js)
-   [test](./test/webpack_spec.js)

to run this example:

-   npm install
-   npm run bundle
-   npm test
