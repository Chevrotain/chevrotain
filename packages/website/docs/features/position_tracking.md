# Position Tracking

Chevrotain lexers track the full token position information by default.
This means:

- start and end offsets.
- start and end lines.
- start and end columns.

The level of position information tracking can be reduced by using the [**positionTracking**](https://chevrotain.io/documentation/11_1_2/interfaces/ILexerConfig.html#positionTracking) lexer config option.
For example:

```javascript
import { Lexer } from "chevrotain";
const allTokens = [];
// createTokens...
const myLexer = new Lexer(allTokens, { positionTracking: "onlyOffset" });
```
