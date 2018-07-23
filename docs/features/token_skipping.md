# Token Skipping

Chevrotain support ignoring specific Token Types.
This means that these Token Types would be lexed but would not appear in the Token Vector the lexer produces.
This capability is often used to ignore certain types of Tokens most commonly whitespace.

To skip a Token define its group as the special **Lexer.SKIPPED**
For example:

```javascript
import { createToken, Lexer } from "chevrotain"
const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: Lexer.SKIPPED
})
```
