### Webpacking of Chevrotain Grammars.

Chevrotain relies on **Function.prototype.toString** and **Function.name**
to run. This means that build process which perform source code transformation may cause Chevrotain to fail.
Webpack 2 uses a tree shaking algorithm to remove unused code (when using ES6 imports).
and this tree shaking is what may break a chevrotain grammar.
This failure happens in the specific case where the tokens and the grammar are each defined in a separate file
and imported by using ES6 imports.

There are a couple of ways to resolve this problem and both boil down to preventing webpack 2 from tree shaking
The chevrotain grammar.


#### Defining **both** the tokens and the grammar in the **same** file.

This will avoid tree shaking simply because shaking is only performed between **different** modules,
not within the **same** module. This is how most smaller chevrotain grammars will be implemented anyhow.                       
However, in some cases the separation of the tokens from the grammar is desired.


#### Importing the Tokens using commons JS instead of ES6 imports.

This means that instead of:
```javascript
import {SemiColon, Comma} from "./my_tokens";
```

This syntax should be used:
```javascript
const tokens = require("./my_tokens");
const SemiColon = tokens.SemiColon;
const Comma = tokens.Comma;
```

The webpack 2 tree shaking is only applicable to ES6 imports, as commonjs imports may have side effects 
(are we accessing a property or a getter?). Thus by using the "old style" commonjs imports we can disable
tree shaking for our chevrotain grammar.



#### Runnable Example
The source code for the three use cases can be found under the [src](./src) directory
With a [test](./test/webpack_spec.js) running on the bundled webpack output:

 - [Tokens and Grammar defined in the same file](./src/tokens_and_grammar.js)
 - [Tokens Defined separately](./src/tokens_only.js)
 - [Grammar importing tokens using ES6 imports](./src/grammar_only_es6_import.js)
 - [Grammar importing tokens using commonjs imports](./src/grammar_only_commonjs_require.js)
 
to run this example:

 - npm install
 - npm run bundle
 - npm test
