# Token Grouping

Chevrotain lexers support grouping Tokens Types **separately** from the main token vector in the lexing result.
This is often useful to **collect** a specific set of Token Types for later processing, for example to collect comments tokens.

To group a Token Type simply specify the [**group**](https://sap.github.io/chevrotain/documentation/7_0_2/interfaces/itokenconfig.html#group) property in its configuration.
For example:

```javascript
const Comment = createToken({
  name: "Comment",
  pattern: /\/\/.+/,
  group: "comments"
})
```

See [executable example](https://github.com/SAP/chevrotain/tree/master/examples/lexer/token_groups)
for further details.
