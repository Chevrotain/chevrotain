# Token Grouping

Chevrotain lexers support grouping Token Types **separately** from the main token vector in the lexing result.
This is often useful to **collect** a specific set of Token Types for later processing, for example to collect comment tokens.

To group a Token Type, simply specify the [**group**](https://chevrotain.io/documentation/11_1_1/interfaces/ITokenConfig.html#group) property in its configuration.
For example:

```javascript
const Comment = createToken({
  name: "Comment",
  pattern: /\/\/.+/,
  group: "comments",
});
```

See [executable example](https://github.com/chevrotain/chevrotain/tree/master/examples/lexer/token_groups)
for further details.
