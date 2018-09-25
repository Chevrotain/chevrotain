# Position Tracking

Chevrotain lexers will track the full token position information by default.
This means:
token_skipping

-   start and end offsets.
-   start and end lines.
-   start and end columns.

The level of position information tracking can be reduced by using the [**positionTracking**](https://sap.github.io/chevrotain/documentation/4_0_0/interfaces/ilexerconfig.html#positiontracking) lexer config option.
For example:

```javascript
import { Lexer } from "chevrotain"
const allTokens = []
// createTokens...
const myLexer = new Lexer(allTokens, { positionTracking: "onlyOffset" })
```
