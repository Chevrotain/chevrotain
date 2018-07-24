# Token Alternative Matches

Chevrotain supports attempting a secondary **longer** after a token has (already) been matched.
This capability is most often used to disambiguate the keywords vs identifiers ambiguity.

For example:

```javascript
import { createToken } from "chevrotain"

const Identifier = createToken({
    name: "Identifier",
    pattern: /[a-zA-Z][\w+]/
})

const ClassKeyword = createToken({
    name: "ClassKeyword",
    pattern: /class/,
    longer_alt: Identifier
})
```

See [executable example](https://github.com/SAP/chevrotain/tree/master/examples/lexer/keywords_vs_identifiers)
for further details.
