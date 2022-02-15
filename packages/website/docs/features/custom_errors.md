# Customizable Error Messages.

Chevrotain allows users to customize both the parser and lexer error messages.
This can be accomplished by implementing the following interfaces:

- [IParserErrorMessageProvider](https://chevrotain.io/documentation/10_1_1/interfaces/IParserErrorMessageProvider.html)
- [ILexerErrorMessageProvider](https://chevrotain.io/documentation/10_1_1/interfaces/ILexerErrorMessageProvider.html)

See executable examples:

- [Custom Parser Errors](https://github.com/chevrotain/chevrotain/blob/master/examples/parser/custom_errors/custom_errors.js).
- [Custom Lexer Errors](https://github.com/chevrotain/chevrotain/blob/master/examples/lexer/custom_errors/custom_errors.js).

In addition it is also possible to directly provide strings values to be used in errors
for specific parsing DSL methods, for example:

```javascript
$.RULE("myStatement", () => {
  // ...
  $.CONSUME(SemiColon, {
    ERR_MSG: "expecting semiColon at end of myStatement"
  })
})
```

The **ERR_MSG** config property is available for the following DSL methods:

- [CONSUME](https://chevrotain.io/documentation/10_1_1/classes/CstParser.html#CONSUME)
- [OR](https://chevrotain.io/documentation/10_1_1/classes/CstParser.html#OR)
- [AT_LEAST_ONE](https://chevrotain.io/documentation/10_1_1/classes/CstParser.html#AT_LEAST_ONE)
- [AT_LEAST_ONE_SEP](https://chevrotain.io/documentation/10_1_1/classes/CstParser.html#AT_LEAST_ONE_SEP)
