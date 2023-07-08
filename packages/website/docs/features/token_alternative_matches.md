# Token Alternative Matches

Chevrotain supports attempting a secondary **longer** match after a token has (already) been matched.
This capability is most often used to disambiguate the keywords vs identifiers ambiguity.

For example:

```javascript
import { createToken } from "chevrotain";

const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z][\w+]/,
});

const ClassKeyword = createToken({
  name: "ClassKeyword",
  pattern: /class/,
  longer_alt: Identifier,
});
```

Note that the `longer_alt` capability **cannot be chained**, only a single longer_alt will be checked for a specific Token. A token may define multiple longer alternatives using an array. As per usual with the lexer, the first matching token in the array will be chosen for lexing.

See [executable example](https://github.com/chevrotain/chevrotain/tree/master/examples/lexer/keywords_vs_identifiers)
for further details.
