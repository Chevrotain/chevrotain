# Position Tracking

// TODO: we should document the location tracking for both Lexer and Parser in this section...

Chevrotain lexers will track the full token position information by default.
This means:
token_skipping

- start and end offsets.
- start and end lines.
- start and end columns.

The level of position information tracking can be reduced by using the [**positionTracking**](https://chevrotain.io/documentation/7_1_1/interfaces/ilexerconfig.html#positiontracking) lexer config option.
For example:

```javascript
import { Lexer } from "chevrotain"
const allTokens = []
// createTokens...
const myLexer = new Lexer(allTokens, { positionTracking: "onlyOffset" })
```
